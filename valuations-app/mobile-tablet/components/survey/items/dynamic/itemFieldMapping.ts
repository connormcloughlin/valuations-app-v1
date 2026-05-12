import { FieldConfiguration } from '../../../../types/dynamicUI';
import { Item } from '../../../../app/survey/items/components/types';
import { RiskAssessmentItem } from '../../../../utils/db';

export type PersistedItemField =
  | 'type'
  | 'selectedanswer'
  | 'quantity'
  | 'price'
  | 'description'
  | 'model'
  | 'room'
  | 'notes'
  | 'photos'
  | 'excludefromreport';

export const PERSISTED_DYNAMIC_FIELDS = new Set<string>([
  'type',
  'itemprompt',
  'selectedanswer',
  'quantity',
  'qty',
  'price',
  'description',
  'model',
  'room',
  'location',
  'notes',
  'photos',
  'hasphoto',
  'excludefromreport',
]);

export const normalizeItemFieldName = (name: string | undefined | null): string =>
  String(name || '').trim().toLowerCase();

export const toPersistedFieldName = (fieldName: string): PersistedItemField | null => {
  const n = normalizeItemFieldName(fieldName);
  switch (n) {
    case 'type':
    case 'itemprompt':
      return 'type';
    case 'selectedanswer':
      return 'selectedanswer';
    case 'quantity':
    case 'qty':
      return 'quantity';
    case 'price':
      return 'price';
    case 'description':
      return 'description';
    case 'model':
      return 'model';
    case 'room':
    case 'location':
      return 'room';
    case 'notes':
      return 'notes';
    case 'photos':
    case 'hasphoto':
      return 'photos';
    case 'excludefromreport':
      return 'excludefromreport';
    default:
      return null;
  }
};

export const isPersistableField = (field: Pick<FieldConfiguration, 'item_fields'>): boolean =>
  toPersistedFieldName(field.item_fields) !== null;

export const getUnsupportedVisibleFields = (fields: FieldConfiguration[]): FieldConfiguration[] =>
  fields.filter(field => field.display_on_ui === 1 && !isPersistableField(field));

export const formatCurrencyZA = (value: number): string =>
  new Intl.NumberFormat('en-ZA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);

export const parseNumberValue = (value: unknown): number => {
  if (value === null || value === undefined || value === '') return 0;
  const n = Number(String(value).replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : 0;
};

export const parseIntegerValue = (value: unknown): number => {
  const n = parseNumberValue(value);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
};

/** Declared currency for one line; do not multiply by qty (price is the line total). */
export const declaredLineValue = (price: unknown): number => parseNumberValue(price);

/**
 * Persisted quantity for SQLite: blank UI -> null (not 0), so sync/API can distinguish from default qty.
 * Non-empty strings parse to integer (including 0 for explicit "0").
 */
export const persistedQtyFromQuantity = (quantity: unknown): number | null => {
  if (quantity === null || quantity === undefined) return null;
  const s = String(quantity).trim();
  if (s === '') return null;
  return parseIntegerValue(quantity);
};

/** Map API/sync scalar qty to SQLite: missing -> null; numeric string -> int. */
export const qtyFromApiScalar = (raw: unknown): number | null => {
  if (raw === null || raw === undefined || raw === '') return null;
  const n = Number(String(raw).trim());
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
};

export const booleanToDb = (value: unknown): number => {
  const s = String(value ?? '').trim().toLowerCase();
  return value === true || value === 1 || s === 'true' || s === '1' || s === 'yes' ? 1 : 0;
};

export const itemToDraftValues = (item: Item): Record<PersistedItemField, any> => ({
  type: item.type || '',
  selectedanswer: item.selectedanswer || '',
  quantity:
    (item as any).qty !== undefined && (item as any).qty !== null
      ? ((item as any).qty > 0 ? String((item as any).qty) : '')
      : item.quantity || '',
  price: item.price || '',
  description: item.description || '',
  model: item.model || '',
  room: item.room || '',
  notes: item.notes || '',
  photos: item.photo || '',
  excludefromreport: item.excludefromreport ?? 0,
});

export const mergeItemWithChanges = (
  item: Item,
  changes: Record<string, any>
): Item => ({
  ...item,
  type: changes.type ?? item.type ?? '',
  selectedanswer: changes.selectedanswer ?? item.selectedanswer ?? '',
  quantity: changes.quantity ?? item.quantity ?? '',
  price: changes.price ?? item.price ?? '',
  description: changes.description ?? item.description ?? '',
  model: changes.model ?? item.model ?? '',
  room: changes.room ?? item.room ?? '',
  notes: changes.notes ?? item.notes ?? '',
  excludefromreport:
    changes.excludefromreport !== undefined
      ? booleanToDb(changes.excludefromreport)
      : item.excludefromreport ?? 0,
});

export const toRiskAssessmentItem = (
  item: Item,
  changes: Record<string, any>,
  categoryId: string | number,
  existing?: Partial<RiskAssessmentItem>
): RiskAssessmentItem => {
  const merged = mergeItemWithChanges(item, changes);
  const now = new Date().toISOString();
  const id = Number(merged.id);
  const riskassessmentitemid = Number.isFinite(id) && id > 0 ? id : Date.now();

  return {
    riskassessmentitemid,
    riskassessmentcategoryid: Number(categoryId),
    itemprompt: merged.type || '',
    itemtype: existing?.itemtype ?? merged.itemtype ?? 0,
    rank: existing?.rank ?? merged.rank ?? 0,
    commaseparatedlist: existing?.commaseparatedlist ?? merged.commaseparatedlist ?? '',
    selectedanswer: merged.selectedanswer || '',
    qty: persistedQtyFromQuantity(merged.quantity),
    price: parseNumberValue(merged.price),
    description: merged.description || '',
    model: merged.model || '',
    location: merged.room || '',
    assessmentregisterid: existing?.assessmentregisterid ?? 0,
    assessmentregistertypeid: existing?.assessmentregistertypeid ?? 0,
    datecreated: existing?.datecreated || now,
    createdbyid: existing?.createdbyid || '',
    dateupdated: now,
    updatedbyid: existing?.updatedbyid || '',
    issynced: 0,
    syncversion: existing?.syncversion ?? 0,
    deviceid: existing?.deviceid || '',
    syncstatus: existing?.syncstatus || '',
    synctimestamp: now,
    hasphoto:
      changes.photos !== undefined
        ? booleanToDb(changes.photos)
        : existing?.hasphoto ?? (merged.photo ? 1 : 0),
    latitude: existing?.latitude ?? 0,
    longitude: existing?.longitude ?? 0,
    notes: merged.notes || '',
    pending_sync: 1,
    appointmentid: existing?.appointmentid,
    isDeleted: existing?.isDeleted ?? 0,
    excludefromreport: booleanToDb(merged.excludefromreport),
  };
};
