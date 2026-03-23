/**
 * Some mobile endpoints return a double (or deeper) envelope:
 * { success, data: { success, data: { orderNumber, assessmentMasters } } }
 * Consumers expect a single object with `assessmentMasters` on `data`.
 */

const MAX_DEPTH = 10;

/**
 * Walk nested `.data` chains until we find an object with `assessmentMasters` array.
 */
export function peelCompleteHierarchyInner(payload: unknown): Record<string, unknown> | null {
  if (!payload || typeof payload !== 'object') return null;
  let cur: any = payload;
  for (let d = 0; d < MAX_DEPTH; d++) {
    if (Array.isArray(cur.assessmentMasters)) {
      return cur as Record<string, unknown>;
    }
    const next = cur?.data;
    if (next != null && typeof next === 'object') {
      cur = next;
      continue;
    }
    break;
  }
  return null;
}

export function getAssessmentMastersFromHierarchyPayload(payload: unknown): any[] {
  const inner = peelCompleteHierarchyInner(payload);
  return Array.isArray(inner?.assessmentMasters) ? inner.assessmentMasters : [];
}

/**
 * Normalize raw transport / cache body to { success, data } where `data` contains `assessmentMasters`.
 */
export function normalizeCompleteHierarchyEnvelope(raw: unknown): {
  success: boolean;
  data: Record<string, unknown> | null;
} {
  if (!raw || typeof raw !== 'object') {
    return { success: false, data: null };
  }
  const r = raw as Record<string, unknown>;
  const inner = peelCompleteHierarchyInner(raw);
  if (inner && Array.isArray(inner.assessmentMasters)) {
    return { success: r.success !== false, data: inner };
  }
  return { success: false, data: null };
}
