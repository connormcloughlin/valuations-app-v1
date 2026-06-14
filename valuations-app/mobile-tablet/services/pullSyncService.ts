import NetInfo from '@react-native-community/netinfo';
import api from '../api';
import { getSyncChanges } from '../api/sync';
import { getMediaForEntity } from '../api/media';
import transportClient from '../core/transport/transportClient';
import { qtyFromApiScalar } from '../components/survey/items/dynamic/itemFieldMapping';
import sessionService from '../core/auth/sessionService';
import { getDeviceId } from '../utils/deviceId';
import { resolveLastSyncTimestamp, updateLastSyncTimestamp } from '../utils/offlineStorage';
import {
  Appointment,
  MediaFile,
  RiskAssessmentItem,
  RiskAssessmentMaster,
  ServerUpsertResult,
  countConflictRows,
  getMediaFileByBackendMediaId,
  getRiskAssessmentItemById,
  hardDeleteRiskAssessmentItem,
  upsertAppointmentFromServer,
  upsertMediaFileFromServer,
  upsertRiskAssessmentItemFromServer,
  upsertRiskAssessmentMasterFromServer,
} from '../utils/db';

const PULL_ENTITIES = ['Appointment', 'RiskAssessmentMaster', 'RiskAssessmentItem', 'MediaFile'];
const MAX_TRUNCATED_PAGES = 5;
const SYNC_CHANGES_LIMIT = 200;

export interface PullSyncResult {
  success: boolean;
  changesProcessed: number;
  conflicts: number;
  lastSync?: string;
  error?: string;
  offline?: boolean;
  skipped?: boolean;
}

export interface PullSyncState {
  isRefreshing: boolean;
  lastPullAt: string | null;
  lastPullError: string | null;
  conflictCount: number;
}

type SyncChangeRecord = {
  entityName: string;
  entityId: string;
  lastModified: string;
  isDeleted: boolean;
};

type SyncChangesPayload = {
  success?: boolean;
  sessionId?: number;
  syncTimestamp?: string;
  changes?: unknown[];
  truncated?: boolean;
  data?: Record<string, unknown>;
};

type PullSyncListener = (state: PullSyncState) => void;

let pullInProgress = false;
let lastPullAt: string | null = null;
let lastPullError: string | null = null;
const listeners = new Set<PullSyncListener>();

function notifyListeners(extra?: Partial<PullSyncState>): void {
  countConflictRows()
    .then((conflictCount) => {
      const state: PullSyncState = {
        isRefreshing: pullInProgress,
        lastPullAt,
        lastPullError,
        conflictCount,
        ...extra,
      };
      listeners.forEach((listener) => listener(state));
    })
    .catch(() => {
      listeners.forEach((listener) =>
        listener({
          isRefreshing: pullInProgress,
          lastPullAt,
          lastPullError,
          conflictCount: 0,
          ...extra,
        })
      );
    });
}

/** Primary feed: lean metadata rows from payload.changes only. */
function normalizeChanges(payload: unknown): SyncChangeRecord[] {
  if (!payload || typeof payload !== 'object') {
    return [];
  }

  const rawList = (payload as SyncChangesPayload).changes;
  if (!Array.isArray(rawList)) {
    return [];
  }

  return rawList
    .map((row: any) => ({
      entityName: String(row.entityName ?? row.EntityName ?? ''),
      entityId: String(row.entityId ?? row.EntityId ?? ''),
      lastModified: String(
        row.lastModified ?? row.LastModified ?? row.modifiedAt ?? new Date().toISOString()
      ),
      isDeleted: Boolean(row.isDeleted ?? row.IsDeleted ?? false),
    }))
    .filter((row) => row.entityName && row.entityId);
}

function maxLastModifiedInBatch(changes: SyncChangeRecord[], fallback: string): string {
  let max = fallback;
  for (const change of changes) {
    if (change.lastModified > max) {
      max = change.lastModified;
    }
  }
  return max;
}

function mapApiAppointmentToSqlite(data: any): Appointment | null {
  const appointmentID = Number(data.appointmentID ?? data.appointmentId ?? data.id);
  if (!Number.isFinite(appointmentID)) {
    return null;
  }

  return {
    appointmentID,
    orderID: Number(data.orderID ?? data.orderId ?? data.orderNumber ?? 0) || 0,
    startTime: data.startTime ?? '',
    endTime: data.endTime ?? '',
    followUpDate: data.followUpDate ?? '',
    arrivalTime: data.arrivalTime ?? '',
    departureTime: data.departureTime ?? '',
    inviteStatus: data.inviteStatus ?? data.Invite_Status ?? '',
    meetingStatus: data.meetingStatus ?? '',
    location: data.location ?? data.address ?? '',
    comments: data.comments ?? '',
    category: data.category ?? '',
    outoftown: data.outoftown ?? '',
    surveyorComments: data.surveyorComments ?? '',
    eventId: data.eventId ?? '',
    surveyorEmail: data.surveyorEmail ?? '',
    dateModified: data.dateModified ?? data.lastModified ?? data.lastEdited ?? '',
    pending_sync: 0,
  };
}

function mapApiMasterToSqlite(data: any, fallbackId: string): RiskAssessmentMaster | null {
  const riskassessmentid = Number(
    data.riskAssessmentId ??
      data.riskAssessmentID ??
      data.riskassessmentid ??
      data.RiskAssessmentID ??
      fallbackId
  );
  if (!Number.isFinite(riskassessmentid)) {
    return null;
  }

  return {
    riskassessmentid,
    assessmenttypename: data.assessmentTypeName ?? data.assessmenttypename ?? '',
    surveydate: data.surveyDate ?? data.surveydate ?? '',
    clientnumber: data.clientNumber ?? data.clientnumber ?? '',
    comments: data.comments ?? '',
    totalvalue: Number(data.totalValue ?? data.totalvalue ?? 0) || 0,
    iscomplete: (data.isComplete ?? data.iscomplete) ? 1 : 0,
    pending_sync: 0,
  };
}

function mapApiItemToSqlite(item: any, appointmentIdHint?: string): RiskAssessmentItem | null {
  const id = Number(
    item?.riskAssessmentItemId ?? item?.riskassessmentitemid ?? item?.RiskAssessmentItemId
  );
  const categoryId = Number(
    item?.riskAssessmentCategoryId ?? item?.riskassessmentcategoryid ?? item?.categoryId
  );
  if (!Number.isFinite(id) || id <= 0 || !Number.isFinite(categoryId)) {
    return null;
  }

  const itemTypeRaw = item.itemType ?? item.ItemType ?? 0;
  const itemType =
    typeof itemTypeRaw === 'string' && Number.isNaN(Number(itemTypeRaw))
      ? 0
      : Number(itemTypeRaw) || 0;

  return {
    riskassessmentitemid: id,
    riskassessmentcategoryid: categoryId,
    itemprompt: item.itemPrompt ?? item.itemprompt ?? item.ItemPrompt ?? '',
    itemtype: itemType,
    rank: Number(item.rank ?? item.Rank ?? 0) || 0,
    commaseparatedlist:
      item.commaSeparatedList ?? item.CommaseparatedList ?? item.comma_separated_list ?? '',
    selectedanswer: item.selectedAnswer ?? item.SelectedAnswer ?? '',
    qty: qtyFromApiScalar(item.qty ?? item.Qty),
    price: Number(item.price ?? item.Price ?? 0) || 0,
    description: item.description ?? item.Description ?? '',
    model: item.model ?? item.Model ?? '',
    location: item.location ?? item.Location ?? '',
    assessmentregisterid: Number(item.assessmentRegisterId ?? item.AssessmentRegisterId ?? 0) || 0,
    assessmentregistertypeid:
      Number(item.assessmentRegisterTypeId ?? item.AssessmentRegisterTypeId ?? 0) || 0,
    datecreated: item.dateCreated ?? item.DateCreated ?? new Date().toISOString(),
    createdbyid: String(item.createdById ?? item.CreatedById ?? ''),
    dateupdated: item.dateUpdated ?? item.DateUpdated ?? new Date().toISOString(),
    updatedbyid: String(item.updatedById ?? item.UpdatedById ?? ''),
    issynced: 1,
    syncversion: Number(item.syncVersion ?? item.SyncVersion ?? 0) || 0,
    deviceid: String(item.deviceId ?? item.DeviceId ?? ''),
    syncstatus: String(item.syncStatus ?? item.SyncStatus ?? ''),
    synctimestamp: item.syncTimestamp ?? item.SyncTimestamp ?? new Date().toISOString(),
    hasphoto: Number(item.hasPhoto ?? item.HasPhoto ?? 0) || 0,
    latitude: Number(item.latitude ?? item.Latitude ?? 0) || 0,
    longitude: Number(item.longitude ?? item.Longitude ?? 0) || 0,
    notes: item.notes ?? item.Notes ?? '',
    appointmentid: appointmentIdHint ?? String(item.appointmentId ?? item.appointmentid ?? ''),
    excludefromreport: (item.excludeFromReport ?? item.ExcludeFromReport) ? 1 : 0,
    pending_sync: 0,
  };
}

function mapApiMediaToSqlite(media: any, entityName: string, entityID: number): MediaFile | null {
  const backendMediaID = Number(media.mediaId ?? media.MediaId ?? media.mediaID ?? media.id);
  const fileName = media.fileName ?? media.FileName ?? '';
  if (!Number.isFinite(backendMediaID) || !fileName) {
    return null;
  }

  return {
    BackendMediaID: backendMediaID,
    FileName: fileName,
    FileType: media.fileType ?? media.FileType ?? 'photo',
    BlobURL: media.blobUrl ?? media.BlobURL ?? media.url ?? '',
    EntityName: entityName,
    EntityID: entityID,
    UploadedAt: media.uploadedAt ?? media.UploadedAt ?? new Date().toISOString(),
    UploadedBy: media.uploadedBy ?? media.UploadedBy,
    IsDeleted: (media.isDeleted ?? media.IsDeleted) ? 1 : 0,
    Metadata: media.metadata ?? media.Metadata,
    pending_sync: 0,
  };
}

async function fetchRiskAssessmentItemFromApi(itemId: string): Promise<any | null> {
  try {
    const response = await transportClient.get(
      'risk-assessments.item',
      `/risk-assessment-items/${itemId}`
    );
    if (response && typeof response === 'object' && response.data) {
      return response.data;
    }
    return response ?? null;
  } catch (error) {
    console.warn(`pullSync: failed to fetch risk assessment item ${itemId}`, error);
    return null;
  }
}

async function applyAppointmentChange(change: SyncChangeRecord): Promise<ServerUpsertResult> {
  if (change.isDeleted) {
    return { applied: false, conflict: false, skipped: true };
  }

  const response = await api.getAppointmentById(change.entityId);
  if (!response.success || !response.data) {
    return { applied: false, conflict: false, skipped: true };
  }

  const appointment = mapApiAppointmentToSqlite(response.data);
  if (!appointment) {
    return { applied: false, conflict: false, skipped: true };
  }

  return upsertAppointmentFromServer(appointment, change.lastModified);
}

async function applyMasterChange(change: SyncChangeRecord): Promise<ServerUpsertResult> {
  if (change.isDeleted) {
    return { applied: false, conflict: false, skipped: true };
  }

  const response = await api.getRiskAssessmentMasterById(change.entityId);
  const payload = response.data?.data ?? response.data;
  const master = mapApiMasterToSqlite(payload ?? {}, change.entityId);
  if (!master) {
    return { applied: false, conflict: false, skipped: true };
  }

  return upsertRiskAssessmentMasterFromServer(master, change.lastModified);
}

async function applyItemChange(
  change: SyncChangeRecord,
  appointmentIdHint?: string
): Promise<ServerUpsertResult> {
  const itemId = Number(change.entityId);
  if (!Number.isFinite(itemId)) {
    return { applied: false, conflict: false, skipped: true };
  }

  if (change.isDeleted) {
    const local = await getRiskAssessmentItemById(itemId);
    if (local?.pending_sync === 1) {
      return upsertRiskAssessmentItemFromServer(
        { ...local, isDeleted: 1 } as RiskAssessmentItem,
        change.lastModified
      );
    }
    await hardDeleteRiskAssessmentItem(itemId);
    return { applied: true, conflict: false, skipped: false };
  }

  let apiItem = await fetchRiskAssessmentItemFromApi(change.entityId);
  if (!apiItem) {
    const local = await getRiskAssessmentItemById(itemId);
    if (local?.riskassessmentcategoryid) {
      const categoryResponse = await api.getRiskAssessmentItems(
        String(local.riskassessmentcategoryid)
      );
      const list = Array.isArray(categoryResponse.data)
        ? categoryResponse.data
        : categoryResponse.data?.data ?? [];
      apiItem = list.find(
        (row: any) =>
          String(row.riskAssessmentItemId ?? row.riskassessmentitemid ?? row.id) ===
          change.entityId
      );
    }
  }

  const sqliteItem = mapApiItemToSqlite(
    apiItem,
    appointmentIdHint ?? (await getRiskAssessmentItemById(itemId))?.appointmentid
  );
  if (!sqliteItem) {
    return { applied: false, conflict: false, skipped: true };
  }

  return upsertRiskAssessmentItemFromServer(sqliteItem, change.lastModified);
}

async function applyMediaChange(change: SyncChangeRecord): Promise<ServerUpsertResult> {
  const backendMediaId = Number(change.entityId);
  if (!Number.isFinite(backendMediaId)) {
    return { applied: false, conflict: false, skipped: true };
  }

  const local = await getMediaFileByBackendMediaId(backendMediaId);
  if (change.isDeleted) {
    if (local?.pending_sync === 1) {
      return upsertMediaFileFromServer({ ...local, IsDeleted: 1 }, change.lastModified);
    }
    if (local?.MediaID != null) {
      await upsertMediaFileFromServer({ ...local, IsDeleted: 1 }, change.lastModified);
    }
    return { applied: true, conflict: false, skipped: false };
  }

  if (!local) {
    return { applied: false, conflict: false, skipped: true };
  }

  const entityResponse = await getMediaForEntity(local.EntityName, local.EntityID);
  const mediaList = Array.isArray(entityResponse.data)
    ? entityResponse.data
    : entityResponse.data?.mediaFiles ?? entityResponse.data?.data ?? [];
  const remote = mediaList.find(
    (row: any) => Number(row.mediaId ?? row.MediaId ?? row.id) === backendMediaId
  );
  if (!remote) {
    return { applied: false, conflict: false, skipped: true };
  }

  const mapped = mapApiMediaToSqlite(remote, local.EntityName, local.EntityID);
  if (!mapped) {
    return { applied: false, conflict: false, skipped: true };
  }

  return upsertMediaFileFromServer(mapped, change.lastModified);
}

async function applyChange(
  change: SyncChangeRecord,
  appointmentIdHint?: string
): Promise<ServerUpsertResult> {
  const name = change.entityName.toLowerCase();
  if (name.includes('appointment')) {
    return applyAppointmentChange(change);
  }
  if (name.includes('riskassessmentmaster') || name.includes('risk_assessment_master')) {
    return applyMasterChange(change);
  }
  if (name.includes('riskassessmentitem') || name.includes('risk_assessment_item')) {
    return applyItemChange(change, appointmentIdHint);
  }
  if (name.includes('mediafile') || name.includes('media_file') || name === 'media') {
    return applyMediaChange(change);
  }
  return { applied: false, conflict: false, skipped: true };
}

async function applyChangeBatch(
  changes: SyncChangeRecord[],
  appointmentIdHint?: string
): Promise<{ processed: number; conflicts: number }> {
  let processed = 0;
  let conflicts = 0;

  for (const change of changes) {
    const result = await applyChange(change, appointmentIdHint);
    if (result.conflict) {
      conflicts += 1;
    }
    processed += 1;
  }

  return { processed, conflicts };
}

function nextQueryTimestamp(payload: SyncChangesPayload, changes: SyncChangeRecord[], current: string): string {
  const batchMax = maxLastModifiedInBatch(changes, current);
  if (payload.syncTimestamp && payload.syncTimestamp > batchMax) {
    return payload.syncTimestamp;
  }
  return batchMax;
}

const pullSyncService = {
  subscribe(listener: PullSyncListener): () => void {
    listeners.add(listener);
    notifyListeners();
    return () => listeners.delete(listener);
  },

  getState(): PullSyncState {
    return {
      isRefreshing: pullInProgress,
      lastPullAt,
      lastPullError,
      conflictCount: 0,
    };
  },

  isPullInProgress(): boolean {
    return pullInProgress;
  },

  async pullServerChanges(options?: {
    appointmentId?: string;
  }): Promise<PullSyncResult> {
    if (pullInProgress) {
      return {
        success: false,
        skipped: true,
        changesProcessed: 0,
        conflicts: 0,
        error: 'Pull already in progress',
      };
    }

    const netInfo = await NetInfo.fetch();
    if (netInfo.isConnected !== true || netInfo.isInternetReachable !== true) {
      return {
        success: false,
        offline: true,
        changesProcessed: 0,
        conflicts: 0,
        error: 'No internet connection',
      };
    }

    pullInProgress = true;
    lastPullError = null;
    notifyListeners({ isRefreshing: true });

    try {
      const session = await sessionService.getCurrentSession();
      if (!session?.userId) {
        return {
          success: false,
          changesProcessed: 0,
          conflicts: 0,
          error: 'Not authenticated',
        };
      }

      const deviceId = await getDeviceId();
      let queryTimestamp = await resolveLastSyncTimestamp(deviceId);
      let totalProcessed = 0;
      let totalConflicts = 0;
      let finalSyncTimestamp = queryTimestamp;
      let lastPayload: SyncChangesPayload | undefined;

      for (let page = 0; page < MAX_TRUNCATED_PAGES; page += 1) {
        const response = await getSyncChanges({
          lastSyncTimestamp: queryTimestamp,
          deviceId,
          userId: session.userId,
          entities: PULL_ENTITIES,
          excludeDeviceId: deviceId,
          limit: SYNC_CHANGES_LIMIT,
        });

        if (!response.success) {
          throw new Error(response.message || 'Failed to fetch sync changes');
        }

        const payload = (response.data ?? {}) as SyncChangesPayload;
        lastPayload = payload;
        const changes = normalizeChanges(payload);
        const batchResult = await applyChangeBatch(changes, options?.appointmentId);

        totalProcessed += batchResult.processed;
        totalConflicts += batchResult.conflicts;
        finalSyncTimestamp = nextQueryTimestamp(payload, changes, queryTimestamp);

        if (!payload.truncated) {
          break;
        }

        queryTimestamp = finalSyncTimestamp;
      }

      const highWater =
        lastPayload?.syncTimestamp ?? finalSyncTimestamp ?? new Date().toISOString();

      await updateLastSyncTimestamp(highWater, deviceId);
      lastPullAt = new Date().toISOString();

      return {
        success: true,
        changesProcessed: totalProcessed,
        conflicts: totalConflicts,
        lastSync: highWater,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Pull sync failed';
      lastPullError = message;
      console.error('pullSyncService.pullServerChanges failed:', error);
      return {
        success: false,
        changesProcessed: 0,
        conflicts: 0,
        error: message,
      };
    } finally {
      pullInProgress = false;
      notifyListeners({ isRefreshing: false });
    }
  },
};

export default pullSyncService;
