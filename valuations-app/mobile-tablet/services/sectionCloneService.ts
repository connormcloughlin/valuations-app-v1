/**
 * Clone risk assessment section (structure-only): online POST or offline queue.
 * @see BACKEND_SECTION_CLONE_API_SPEC.md
 */
import NetInfo from '@react-native-community/netinfo';
import * as Crypto from 'expo-crypto';
import * as hierarchyApi from '../api/hierarchy';
import {
  batchInsertRiskAssessmentItems,
  deletePendingSectionClone,
  getAllPendingSectionClones,
  incrementPendingSectionCloneAttempt,
  insertPendingSectionClone,
  type RiskAssessmentItem
} from '../utils/db';
import {
  getPendingOfflineMaterializedCount,
  materializeOfflineSectionClone,
  mergeOfflineSectionsIntoMap,
  processOfflineMaterializedSectionClones
} from './offlineSectionMaterialization';

const MAX_QUEUE_ATTEMPTS = 8;

/** RFC 4122 UUID v4 — required by API for idempotency (non-UUID returns 422). */
function newClientMutationId(): string {
  return Crypto.randomUUID();
}

function extractCategoriesFromCloneResponse(raw: any): any[] {
  if (!raw) return [];
  const d = raw.data !== undefined && raw.success !== undefined ? raw.data : raw;
  if (!d || typeof d !== 'object') return [];
  if (Array.isArray(d.categories)) return d.categories;
  if (d.section && Array.isArray(d.section.categories)) return d.section.categories;
  return [];
}

function mapApiItemToSqlRow(item: any, categoryId: number, appointmentId: string): RiskAssessmentItem {
  const hasPhotoRaw = item.hasPhoto ?? item.hasphoto;
  return {
    riskassessmentitemid: Number(item.riskAssessmentItemId ?? item.riskassessmentitemid),
    riskassessmentcategoryid: categoryId,
    itemprompt: item.itemPrompt ?? item.itemprompt ?? '',
    itemtype: Number(item.itemType ?? item.itemtype) || 0,
    rank: Number(item.rank) || 0,
    commaseparatedlist: item.commaSeparatedList ?? item.commaseparatedlist ?? '',
    selectedanswer: item.selectedAnswer ?? item.selectedanswer ?? '',
    qty: Number(item.qty) || 0,
    price: Number(item.price) || 0,
    description: item.description ?? '',
    model: item.model ?? '',
    location: item.location ?? '',
    assessmentregisterid: Number(item.assessmentRegisterId ?? item.assessmentregisterid) || 0,
    assessmentregistertypeid: Number(item.assessmentRegisterTypeId ?? item.assessmentregistertypeid) || 0,
    datecreated: item.dateCreated ?? item.datecreated ?? new Date().toISOString(),
    createdbyid: item.createdById ?? item.createdbyid ?? '',
    dateupdated: item.dateUpdated ?? item.dateupdated ?? new Date().toISOString(),
    updatedbyid: item.updatedById ?? item.updatedbyid ?? '',
    issynced: 1,
    syncversion: (() => {
      const v = Number(item.syncVersion ?? item.syncversion);
      return Number.isFinite(v) ? v : 1;
    })(),
    deviceid: item.deviceId ?? item.deviceid ?? '',
    syncstatus: item.syncStatus ?? item.syncstatus ?? 'SYNCED',
    synctimestamp: item.syncTimestamp ?? item.synctimestamp ?? new Date().toISOString(),
    hasphoto: hasPhotoRaw === true || hasPhotoRaw === 1 ? 1 : 0,
    latitude: Number(item.latitude) || 0,
    longitude: Number(item.longitude) || 0,
    notes: item.notes ?? '',
    pending_sync: 0,
    appointmentid: appointmentId,
    excludefromreport:
      item.excludeFromReport === true || item.excludeFromReport === 1 || item.excludefromreport === 1 ? 1 : 0
  };
}

/** Persist cloned item shells from API response into SQLite. */
export async function applyCloneResponseToSqlite(apiResponse: any, appointmentId: string): Promise<number> {
  const cats = extractCategoriesFromCloneResponse(apiResponse);
  const rows: RiskAssessmentItem[] = [];
  for (const cat of cats) {
    const catId = Number(cat.riskAssessmentCategoryId ?? cat.riskassessmentcategoryid);
    if (!Number.isFinite(catId) || catId <= 0) continue;
    const items = Array.isArray(cat.items) ? cat.items : [];
    for (const it of items) {
      rows.push(mapApiItemToSqlRow(it, catId, appointmentId));
    }
  }
  if (rows.length > 0) {
    await batchInsertRiskAssessmentItems(rows);
  }
  return rows.length;
}

export type CloneSectionOptions = {
  riskAssessmentId: string;
  sourceSectionId: string;
  targetSectionName?: string;
  orderNumber: string;
  appointmentId: string;
};

export type CloneSectionResult = {
  success: boolean;
  error?: string;
  /** Legacy: queued without local materialization (deprecated path) */
  queued?: boolean;
  /** Offline copy created locally; sync reconciles with server clone API */
  materializedOffline?: boolean;
  localSectionId?: string;
  itemsInserted?: number;
};

/**
 * Online: POST clone, insert items, invalidate hierarchy cache.
 * Offline: enqueue pending row for sync.
 */
export async function cloneSectionFromTemplate(opts: CloneSectionOptions): Promise<CloneSectionResult> {
  const clientMutationId = newClientMutationId();
  try {
    const net = await NetInfo.fetch();
    const online = net.isConnected === true && net.isInternetReachable === true;

    if (!online) {
      const mat = await materializeOfflineSectionClone({
        clientMutationId,
        riskAssessmentId: opts.riskAssessmentId,
        sourceSectionId: opts.sourceSectionId,
        targetSectionName: opts.targetSectionName,
        orderNumber: String(opts.orderNumber),
        appointmentId: String(opts.appointmentId)
      });
      if (!mat.ok) {
        return { success: false, error: mat.error };
      }
      return {
        success: true,
        materializedOffline: true,
        localSectionId: mat.localSectionId
      };
    }

    const res = await hierarchyApi.cloneRiskAssessmentSection(opts.riskAssessmentId, {
      sourceRiskAssessmentSectionId: Number(opts.sourceSectionId),
      targetSectionName: opts.targetSectionName,
      clientMutationId
    });

    if (!res.success) {
      return { success: false, error: res.message || 'Section clone failed' };
    }

    const inserted = await applyCloneResponseToSqlite(res.data ?? res, String(opts.appointmentId));
    await hierarchyApi.invalidateRiskAssessmentHierarchyCache(String(opts.orderNumber));
    return { success: true, itemsInserted: inserted };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { success: false, error: msg };
  }
}

/** Drain offline-materialized clones first (remap IDs), then legacy pending_section_clones queue. */
export async function processPendingSectionClones(): Promise<{ processed: number; failed: number }> {
  const net = await NetInfo.fetch();
  if (!(net.isConnected === true && net.isInternetReachable === true)) {
    return { processed: 0, failed: 0 };
  }

  const offlineMat = await processOfflineMaterializedSectionClones();

  const pending = await getAllPendingSectionClones();
  if (pending.length === 0) {
    return { processed: offlineMat.processed, failed: offlineMat.failed };
  }

  let processed = 0;
  let failed = 0;

  for (const row of pending) {
    if (row.attempts >= MAX_QUEUE_ATTEMPTS) {
      failed++;
      continue;
    }

    const res = await hierarchyApi.cloneRiskAssessmentSection(row.risk_assessment_id, {
      sourceRiskAssessmentSectionId: Number(row.source_section_id),
      targetSectionName: row.target_section_name || undefined,
      clientMutationId: row.client_mutation_id
    });

    if (res.success) {
      await applyCloneResponseToSqlite(res.data ?? res, String(row.appointment_id));
      await hierarchyApi.invalidateRiskAssessmentHierarchyCache(String(row.order_number));
      await deletePendingSectionClone(row.id);
      processed++;
    } else {
      await incrementPendingSectionCloneAttempt(row.id, res.message || 'Clone failed');
      failed++;
    }
  }

  return { processed: processed + offlineMat.processed, failed: failed + offlineMat.failed };
}

export async function getPendingSectionClonesCount(): Promise<number> {
  const rows = await getAllPendingSectionClones();
  return rows.filter((r) => r.attempts < MAX_QUEUE_ATTEMPTS).length;
}

const sectionCloneService = {
  cloneSectionFromTemplate,
  processPendingSectionClones,
  applyCloneResponseToSqlite,
  getPendingSectionClonesCount,
  getPendingOfflineMaterializedCount,
  mergeOfflineSectionsIntoMap
};

export default sectionCloneService;
