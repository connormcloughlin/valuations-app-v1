/**
 * Offline copy-section: materialize local structure from cached hierarchy, reconcile via clone API on sync.
 * @see BACKEND_OFFLINE_SECTION_CLONE_SYNC.md
 */
import { getData } from '../api/cache';
import { riskAssessmentHierarchyCacheKey } from '../api/hierarchy';
import * as hierarchyApi from '../api/hierarchy';
import { getAssessmentMastersFromHierarchyPayload } from '../utils/completeHierarchyPayload';
import { declaredLineValue } from '../components/survey/items/dynamic/itemFieldMapping';
import {
  batchInsertRiskAssessmentItems,
  deleteOfflineMaterializedSectionClone,
  getOfflineMaterializedSectionCloneByLocalSectionId,
  getOfflineMaterializedSectionClonesByAppointment,
  getPendingOfflineMaterializedSectionClones,
  getRiskAssessmentItemById,
  incrementOfflineMaterializedSectionCloneAttempt,
  insertOfflineMaterializedSectionClone,
  OFFLINE_PROVISIONAL_CATEGORY_MIN,
  runSql,
  waitForDatabase,
  type OfflineMaterializedSectionCloneRow,
  type RiskAssessmentItem
} from '../utils/db';

const MAX_RECONCILE_ATTEMPTS = 8;

/** Stored in offline_materialized_section_clones.structure_json */
export type OfflineSectionStructure = {
  version: 1;
  sectionDisplayName: string;
  sourceSectionId: string;
  riskAssessmentId: string;
  categories: Array<{
    provisionalCategoryId: number;
    riskTemplateCategoryId?: number;
    categoryName: string;
    categoryOrder: number;
    items: Array<{
      provisionalItemId: number;
      itemPrompt: string;
      itemType: number;
      rank: number;
      commaSeparatedList: string;
    }>;
  }>;
};

export function isLocalOfflineSectionId(sectionId: string): boolean {
  return typeof sectionId === 'string' && sectionId.startsWith('L-');
}

function categoryIdForMaterializationRow(rowId: number, catIndex: number): number {
  return OFFLINE_PROVISIONAL_CATEGORY_MIN + rowId * 10_000 + catIndex;
}

function nextProvisionalItemId(rowId: number, index: number): number {
  return 1_800_000_000_000 + rowId * 100_000 + index;
}

function findSectionInHierarchy(
  hierarchyData: any,
  riskAssessmentId: string,
  sourceSectionId: string
): { section: any; template: any } | null {
  const fromPeel = getAssessmentMastersFromHierarchyPayload(hierarchyData);
  const masters =
    fromPeel.length > 0
      ? fromPeel
      : hierarchyData?.assessmentMasters || hierarchyData?.data?.assessmentMasters || [];
  for (const master of masters) {
    const tid = String(master.riskAssessmentId ?? master.riskassessmentid ?? master.assessmentid ?? '');
    if (tid !== String(riskAssessmentId)) continue;
    const secs = master.sections || [];
    for (const section of secs) {
      const sid = String(section.riskAssessmentSectionId ?? section.riskassessmentsectionid ?? '');
      if (sid === String(sourceSectionId)) {
        return { section, template: master };
      }
    }
  }
  return null;
}

export async function loadHierarchySnapshotForOrder(orderNumber: string): Promise<any | null> {
  const key = riskAssessmentHierarchyCacheKey(orderNumber);
  const cached = await getData(key);
  return cached?.data ?? null;
}

export function buildOfflineStructureFromHierarchySection(
  matRowId: number,
  riskAssessmentId: string,
  sourceSectionId: string,
  section: any,
  targetSectionName?: string
): { structure: OfflineSectionStructure; rows: RiskAssessmentItem[]; appointmentId: string } {
  const sectionDisplayName =
    (targetSectionName && targetSectionName.trim()) ||
    `${section.sectionName || section.sectionname || 'Section'} (offline)`;

  const categoriesRaw = Array.isArray(section.categories) ? section.categories : [];
  const sortedCats = [...categoriesRaw].sort(
    (a: any, b: any) =>
      (Number(a.categoryOrder ?? a.categoryorder) || 0) - (Number(b.categoryOrder ?? b.categoryorder) || 0)
  );

  const structure: OfflineSectionStructure = {
    version: 1,
    sectionDisplayName,
    sourceSectionId: String(sourceSectionId),
    riskAssessmentId: String(riskAssessmentId),
    categories: []
  };

  const rows: RiskAssessmentItem[] = [];
  let itemCounter = 0;

  sortedCats.forEach((cat: any, catIndex: number) => {
    const provisionalCategoryId = categoryIdForMaterializationRow(matRowId, catIndex);
    const categoryName = cat.categoryName || cat.categoryname || 'Category';
    const categoryOrder = Number(cat.categoryOrder ?? cat.categoryorder) || catIndex + 1;
    const riskTemplateCategoryId =
      cat.riskTemplateCategoryId ?? cat.risktemplatecategoryid ?? cat.RiskTemplateCategoryID;

    const itemsRaw = Array.isArray(cat.items) ? cat.items : [];
    const sortedItems = [...itemsRaw].sort(
      (a: any, b: any) => (Number(a.rank) || 0) - (Number(b.rank) || 0)
    );

    const itemEntries: OfflineSectionStructure['categories'][0]['items'] = [];

    sortedItems.forEach((it: any) => {
      const provisionalItemId = nextProvisionalItemId(matRowId, itemCounter++);
      itemEntries.push({
        provisionalItemId,
        itemPrompt: it.itemPrompt ?? it.itemprompt ?? '',
        itemType: Number(it.itemType ?? it.itemtype) || 0,
        rank: Number(it.rank) || 0,
        commaSeparatedList: it.commaSeparatedList ?? it.commaseparatedlist ?? ''
      });

      rows.push({
        riskassessmentitemid: provisionalItemId,
        riskassessmentcategoryid: provisionalCategoryId,
        itemprompt: it.itemPrompt ?? it.itemprompt ?? '',
        itemtype: Number(it.itemType ?? it.itemtype) || 0,
        rank: Number(it.rank) || 0,
        commaseparatedlist: it.commaSeparatedList ?? it.commaseparatedlist ?? '',
        selectedanswer: '',
        qty: null,
        price: 0,
        description: '',
        model: '',
        location: it.location ?? '',
        assessmentregisterid: Number(it.assessmentRegisterId ?? it.assessmentregisterid) || 0,
        assessmentregistertypeid: Number(it.assessmentRegisterTypeId ?? it.assessmentregistertypeid) || 0,
        datecreated: new Date().toISOString(),
        createdbyid: '',
        dateupdated: new Date().toISOString(),
        updatedbyid: '',
        issynced: 0,
        syncversion: 0,
        deviceid: '',
        syncstatus: 'PENDING_OFFLINE_SECTION',
        synctimestamp: new Date().toISOString(),
        hasphoto: 0,
        latitude: 0,
        longitude: 0,
        notes: '',
        pending_sync: 1,
        appointmentid: '', // set by caller
        excludefromreport: 0
      });
    });

    structure.categories.push({
      provisionalCategoryId,
      riskTemplateCategoryId: riskTemplateCategoryId != null ? Number(riskTemplateCategoryId) : undefined,
      categoryName,
      categoryOrder,
      items: itemEntries
    });
  });

  return { structure, rows, appointmentId: '' };
}

export type MaterializeOfflineCloneInput = {
  clientMutationId: string;
  riskAssessmentId: string;
  sourceSectionId: string;
  targetSectionName?: string;
  orderNumber: string;
  appointmentId: string;
};

export async function materializeOfflineSectionClone(
  input: MaterializeOfflineCloneInput
): Promise<{ ok: true; localSectionId: string } | { ok: false; error: string }> {
  const hierarchy = await loadHierarchySnapshotForOrder(input.orderNumber);
  if (!hierarchy) {
    return {
      ok: false,
      error:
        'No cached risk assessment data for this order. Connect once while online to load templates, then try again offline.'
    };
  }

  const found = findSectionInHierarchy(hierarchy, input.riskAssessmentId, input.sourceSectionId);
  if (!found) {
    return {
      ok: false,
      error: 'Could not find the source section in cached data. Refresh while online and try again.'
    };
  }

  const localSectionId = `L-${input.clientMutationId}`;

  const matId = await insertOfflineMaterializedSectionClone({
    client_mutation_id: input.clientMutationId,
    risk_assessment_id: input.riskAssessmentId,
    source_section_id: input.sourceSectionId,
    target_section_name: input.targetSectionName?.trim() || null,
    order_number: input.orderNumber,
    appointment_id: input.appointmentId,
    local_section_id: localSectionId,
    structure_json: '{}' // placeholder; updated below
  });

  const { structure, rows } = buildOfflineStructureFromHierarchySection(
    matId,
    input.riskAssessmentId,
    input.sourceSectionId,
    found.section,
    input.targetSectionName
  );

  await runSql(
    `UPDATE offline_materialized_section_clones SET structure_json = ?, updated_at = ? WHERE id = ?`,
    [JSON.stringify(structure), new Date().toISOString(), matId]
  );

  const rowsWithAppt = rows.map((r) => ({ ...r, appointmentid: String(input.appointmentId) }));
  if (rowsWithAppt.length > 0) {
    await batchInsertRiskAssessmentItems(rowsWithAppt);
  }

  return { ok: true, localSectionId };
}

function flattenServerCloneItems(apiResponse: any): { categoryId: number; item: any }[] {
  const cats = (() => {
    const d = apiResponse?.data ?? apiResponse;
    if (!d || typeof d !== 'object') return [];
    if (Array.isArray(d.categories)) return d.categories;
    if (d.section && Array.isArray(d.section.categories)) return d.section.categories;
    return [];
  })();

  const out: { categoryId: number; item: any }[] = [];
  const sortedCats = [...cats].sort(
    (a: any, b: any) =>
      (Number(a.categoryOrder ?? a.categoryorder) || 0) - (Number(b.categoryOrder ?? b.categoryorder) || 0)
  );
  for (const cat of sortedCats) {
    const catId = Number(cat.riskAssessmentCategoryId ?? cat.riskassessmentcategoryid);
    const items = Array.isArray(cat.items) ? cat.items : [];
    const sortedItems = [...items].sort(
      (a: any, b: any) => (Number(a.rank) || 0) - (Number(b.rank) || 0)
    );
    for (const it of sortedItems) {
      out.push({ categoryId: catId, item: it });
    }
  }
  return out;
}

function flattenLocalStructureOrder(structure: OfflineSectionStructure): number[] {
  const ids: number[] = [];
  const sortedCats = [...structure.categories].sort((a, b) => a.categoryOrder - b.categoryOrder);
  for (const c of sortedCats) {
    const sortedItems = [...c.items].sort((a, b) => a.rank - b.rank);
    for (const it of sortedItems) {
      ids.push(it.provisionalItemId);
    }
  }
  return ids;
}

/**
 * Call server clone API, remap provisional SQLite rows to server IDs (preserve user edits).
 */
export async function reconcileOfflineMaterializedSection(
  row: OfflineMaterializedSectionCloneRow
): Promise<{ ok: true } | { ok: false; error: string }> {
  const structure = JSON.parse(row.structure_json) as OfflineSectionStructure;
  if (!structure?.categories) {
    return { ok: false, error: 'Invalid offline structure_json' };
  }

  const localOrder = flattenLocalStructureOrder(structure);

  const res = await hierarchyApi.cloneRiskAssessmentSection(row.risk_assessment_id, {
    sourceRiskAssessmentSectionId: Number(row.source_section_id),
    targetSectionName: row.target_section_name || undefined,
    clientMutationId: row.client_mutation_id
  });

  if (!res.success) {
    return { ok: false, error: res.message || 'Section clone failed during reconcile' };
  }

  const serverFlat = flattenServerCloneItems(res.data ?? res);
  if (serverFlat.length !== localOrder.length) {
    return {
      ok: false,
      error: `Server returned ${serverFlat.length} items but local has ${localOrder.length}; refusing unsafe remap.`
    };
  }

  const mergedPairs: Array<{ localId: number; merged: RiskAssessmentItem }> = [];
  for (let i = 0; i < localOrder.length; i++) {
    const localId = localOrder[i];
    const localRow = await getRiskAssessmentItemById(localId);
    if (!localRow) {
      return {
        ok: false,
        error: `Local item ${localId} missing before remap; aborting to avoid partial state.`
      };
    }
    const { item: srv, categoryId: serverCatId } = serverFlat[i];
    const serverItemId = Number(srv.riskAssessmentItemId ?? srv.riskassessmentitemid);
    if (!Number.isFinite(serverItemId) || serverItemId <= 0 || !Number.isFinite(serverCatId) || serverCatId <= 0) {
      return { ok: false, error: 'Invalid server item/category id in clone response' };
    }

    mergedPairs.push({
      localId,
      merged: {
        ...localRow,
        riskassessmentitemid: serverItemId,
        riskassessmentcategoryid: serverCatId,
        pending_sync: 1,
        issynced: 0,
        syncstatus: 'PENDING',
        dateupdated: new Date().toISOString()
      }
    });
  }

  const database = await waitForDatabase();
  try {
    await database.withTransactionAsync(async () => {
      for (const { localId, merged } of mergedPairs) {
        await database.runAsync('DELETE FROM risk_assessment_items WHERE riskassessmentitemid = ?', [localId]);
        const pendingSync = merged.issynced ? 0 : (merged.pending_sync ?? 1);
        await database.runAsync(
          `INSERT OR REPLACE INTO risk_assessment_items (
            riskassessmentitemid, riskassessmentcategoryid, itemprompt, itemtype, rank,
            commaseparatedlist, selectedanswer, qty, price, description, model, location,
            assessmentregisterid, assessmentregistertypeid, datecreated, createdbyid,
            dateupdated, updatedbyid, issynced, syncversion, deviceid, syncstatus,
            synctimestamp, hasphoto, latitude, longitude, notes, pending_sync, appointmentid,
            excludefromreport
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            merged.riskassessmentitemid,
            merged.riskassessmentcategoryid,
            merged.itemprompt || '',
            merged.itemtype || 0,
            merged.rank || 0,
            merged.commaseparatedlist || '',
            merged.selectedanswer || '',
            merged.qty ?? null,
            merged.price || 0,
            merged.description || '',
            merged.model || '',
            merged.location || '',
            merged.assessmentregisterid || 0,
            merged.assessmentregistertypeid || 0,
            merged.datecreated || new Date().toISOString(),
            merged.createdbyid || '',
            merged.dateupdated || new Date().toISOString(),
            merged.updatedbyid || '',
            merged.issynced ? 1 : 0,
            merged.syncversion || 0,
            merged.deviceid || '',
            merged.syncstatus || '',
            merged.synctimestamp || new Date().toISOString(),
            merged.hasphoto ? 1 : 0,
            merged.latitude || 0,
            merged.longitude || 0,
            merged.notes || '',
            pendingSync,
            merged.appointmentid || null,
            merged.excludefromreport ? 1 : 0
          ]
        );
      }
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: `Remap transaction failed: ${msg}` };
  }

  await deleteOfflineMaterializedSectionClone(row.id);
  await hierarchyApi.invalidateRiskAssessmentHierarchyCache(String(row.order_number));
  return { ok: true };
}

export async function processOfflineMaterializedSectionClones(): Promise<{
  processed: number;
  failed: number;
}> {
  const NetInfo = await import('@react-native-community/netinfo');
  const net = await NetInfo.default.fetch();
  if (!(net.isConnected === true && net.isInternetReachable === true)) {
    return { processed: 0, failed: 0 };
  }

  const pending = await getPendingOfflineMaterializedSectionClones();
  let processed = 0;
  let failed = 0;

  for (const row of pending) {
    if (row.attempts >= MAX_RECONCILE_ATTEMPTS) {
      failed++;
      continue;
    }

    const result = await reconcileOfflineMaterializedSection(row);
    if (result.ok) {
      processed++;
    } else {
      await incrementOfflineMaterializedSectionCloneAttempt(row.id, result.error);
      failed++;
    }
  }

  return { processed, failed };
}

export async function getPendingOfflineMaterializedCount(): Promise<number> {
  const rows = await getPendingOfflineMaterializedSectionClones();
  return rows.filter((r) => r.attempts < MAX_RECONCILE_ATTEMPTS).length;
}

/** Merge pending offline sections into hierarchy-derived section map (per template id). */
export async function mergeOfflineSectionsIntoMap(
  base: Record<string, Array<{ id: string; title: string; offlinePending?: boolean }>>,
  appointmentId: string
): Promise<Record<string, Array<{ id: string; title: string; offlinePending?: boolean }>>> {
  const rows = await getOfflineMaterializedSectionClonesByAppointment(appointmentId);
  const pending = rows.filter((r) => r.sync_state === 'pending' || r.sync_state === 'failed');
  const out: Record<string, Array<{ id: string; title: string; offlinePending?: boolean }>> = { ...base };
  for (const row of pending) {
    const tid = String(row.risk_assessment_id);
    if (!out[tid]) out[tid] = [];
    if (out[tid].some((s) => s.id === row.local_section_id)) continue;
    let title = row.target_section_name || 'New section (offline)';
    try {
      const st = JSON.parse(row.structure_json) as OfflineSectionStructure;
      if (st?.sectionDisplayName) title = st.sectionDisplayName;
    } catch {
      /* keep title */
    }
    out[tid] = [...out[tid], { id: row.local_section_id, title, offlinePending: true }];
  }
  return out;
}

export async function categoriesForLocalOfflineSection(
  localSectionId: string
): Promise<
  Array<{
    id: string;
    name: string;
    items: number;
    value: number;
    risktemplatecategoryid?: number;
  }>
> {
  const row = await getOfflineMaterializedSectionCloneByLocalSectionId(localSectionId);
  if (!row || row.sync_state === 'completed') return [];

  let structure: OfflineSectionStructure;
  try {
    structure = JSON.parse(row.structure_json) as OfflineSectionStructure;
  } catch {
    return [];
  }

  const { getAllRiskAssessmentItems } = await import('../utils/db');
  const all = await getAllRiskAssessmentItems();
  const appt = String(row.appointment_id);

  const out: Array<{
    id: string;
    name: string;
    items: number;
    value: number;
    risktemplatecategoryid?: number;
  }> = [];

  for (const cat of structure.categories) {
    const catItems = all.filter(
      (i) =>
        String(i.appointmentid) === appt &&
        i.riskassessmentcategoryid === cat.provisionalCategoryId &&
        !i.isDeleted
    );
    const totalValue = catItems.reduce((s, i) => s + declaredLineValue(i.price), 0);
    out.push({
      id: String(cat.provisionalCategoryId),
      name: cat.categoryName,
      items: catItems.length,
      value: totalValue,
      risktemplatecategoryid: cat.riskTemplateCategoryId
    });
  }

  return out.sort((a, b) => {
    const ca = structure.categories.find((c) => String(c.provisionalCategoryId) === a.id);
    const cb = structure.categories.find((c) => String(c.provisionalCategoryId) === b.id);
    return (ca?.categoryOrder ?? 0) - (cb?.categoryOrder ?? 0);
  });
}
