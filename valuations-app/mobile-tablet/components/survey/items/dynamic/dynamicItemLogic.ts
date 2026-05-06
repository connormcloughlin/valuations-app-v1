import { FieldConfiguration, GroupingStrategy } from '../../../../types/dynamicUI';
import { ValidationService } from '../../../../services/validationService';
import { FieldValidationError } from '../../../../types/dynamicUI';
import { Item } from '../../../../app/survey/items/components/types';
import {
  isPersistableField,
  parseIntegerValue,
  parseNumberValue,
  toPersistedFieldName,
} from './itemFieldMapping';

export type ItemLifecycle = 'saved_local' | 'pending_sync' | 'synced' | 'sync_error' | 'draft';

export interface ItemViewModel extends Item {
  lifecycle: ItemLifecycle;
  isDraft?: boolean;
}

export interface FlatGroups {
  kind: 'flat';
  groups: Array<{ key: string; items: ItemViewModel[] }>;
}

export interface NestedGroups {
  kind: 'nested';
  groups: Array<{
    key: string;
    secondary: Array<{ key: string; items: ItemViewModel[] }>;
  }>;
}

export type GroupedItems = FlatGroups | NestedGroups | null;

const parseStrategyConfig = (groupingStrategy?: GroupingStrategy): any => {
  const raw = groupingStrategy?.strategy_config;
  if (!raw) return undefined;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return undefined;
    }
  }
  return raw;
};

export const fieldNameFromStrategyName = (name: string): string | null => {
  switch (name) {
    case 'ItemPrompt':
      return 'type';
    case 'Location':
      return 'room';
    case 'Description':
      return 'description';
    case 'Model':
      return 'model';
    case 'Qty':
      return 'quantity';
    case 'Price':
      return 'price';
    case 'Notes':
      return 'notes';
    default:
      return name ? name.charAt(0).toLowerCase() + name.slice(1) : null;
  }
};

export const getItemFieldValue = (item: Item, fieldName: string): string => {
  const mapped = fieldNameFromStrategyName(fieldName) || fieldName;
  switch (mapped) {
    case 'type':
      return item.type || (item as any).itemprompt || 'Unknown Type';
    case 'room':
      return item.room || 'No Location';
    case 'description':
      return item.description || 'No Description';
    case 'model':
      return item.model || 'No Brand';
    case 'quantity':
      return item.quantity || String((item as any).qty ?? '') || '0';
    case 'price':
      return item.price || '0';
    case 'notes':
      return item.notes || 'No Notes';
    default:
      return String((item as any)[mapped] || `Unknown ${fieldName}`);
  }
};

const hasItemFieldValue = (item: Item, fieldName: string): boolean => {
  const mapped = fieldNameFromStrategyName(fieldName) || fieldName;
  switch (mapped) {
    case 'type':
      return Boolean(item.type || (item as any).itemprompt);
    case 'room':
      return Boolean(item.room);
    case 'description':
      return Boolean(item.description);
    case 'model':
      return Boolean(item.model);
    case 'quantity':
      return Boolean(item.quantity || (item as any).qty);
    case 'price':
      return Boolean(item.price);
    case 'notes':
      return Boolean(item.notes);
    default:
      return Boolean((item as any)[mapped]);
  }
};

const groupingValueForItem = (
  item: ItemViewModel,
  fieldName: string,
  draftFallback: string
): string => {
  if (item.isDraft && !hasItemFieldValue(item, fieldName)) {
    return draftFallback;
  }
  return getItemFieldValue(item, fieldName);
};

const naturalGroupSort = (a: string, b: string): number => a.localeCompare(b);

export const groupItems = (
  items: ItemViewModel[],
  groupingStrategy?: GroupingStrategy
): GroupedItems => {
  if (!groupingStrategy?.strategy_type) return null;

  const config = parseStrategyConfig(groupingStrategy);
  if (config?.primary_group && config?.secondary_group) {
    const grouped = new Map<string, Map<string, ItemViewModel[]>>();
    for (const item of items) {
      const primary = groupingValueForItem(item, config.primary_group, 'Draft Items');
      const secondary = groupingValueForItem(item, config.secondary_group, 'New Item');
      if (!grouped.has(primary)) grouped.set(primary, new Map());
      const secondaryMap = grouped.get(primary)!;
      if (!secondaryMap.has(secondary)) secondaryMap.set(secondary, []);
      secondaryMap.get(secondary)!.push(item);
    }
    return {
      kind: 'nested',
      groups: Array.from(grouped.entries())
        .sort(([a], [b]) => naturalGroupSort(a, b))
        .map(([key, secondary]) => ({
          key,
          secondary: Array.from(secondary.entries())
            .sort(([a], [b]) => naturalGroupSort(a, b))
            .map(([sKey, sItems]) => ({
              key: sKey,
              items: sortItems(sItems),
            })),
        })),
    };
  }

  const grouped = new Map<string, ItemViewModel[]>();
  for (const item of items) {
    let key: string;
    switch (groupingStrategy.strategy_type) {
      case 'by_location':
        key = item.isDraft && !item.room ? 'Draft Items' : item.room || 'No Location';
        break;
      case 'by_brand':
        key = item.isDraft && !item.model ? 'Draft Items' : item.model || 'No Brand';
        break;
      case 'by_value_range': {
        const price = parseNumberValue(item.price);
        if (!price) key = 'No Value';
        else if (price < 1000) key = 'Under R1,000';
        else if (price < 5000) key = 'R1,000 - R5,000';
        else if (price < 10000) key = 'R5,000 - R10,000';
        else key = 'Over R10,000';
        break;
      }
      case 'custom':
        key = item.isDraft
          ? (config?.customField && (item as any)[config.customField] ? String((item as any)[config.customField]) : 'Draft Items')
          : config?.customField
            ? String((item as any)[config.customField] || 'Other')
            : item.type || 'Unknown Items';
        break;
      case 'by_type':
      default:
        key = item.isDraft && !item.type ? 'Draft Items' : item.type || 'Unknown Items';
        break;
    }
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(item);
  }

  return {
    kind: 'flat',
    groups: Array.from(grouped.entries())
      .sort(([a], [b]) => naturalGroupSort(a, b))
      .map(([key, group]) => ({ key, items: sortItems(group) })),
  };
};

export const sortItems = (items: ItemViewModel[]): ItemViewModel[] =>
  [...items].sort((a, b) => {
    if (a.isDraft && !b.isDraft) return -1;
    if (!a.isDraft && b.isDraft) return 1;
    const rank = (a.rank || 0) - (b.rank || 0);
    if (rank !== 0) return rank;
    return String(a.type || a.description || a.id).localeCompare(String(b.type || b.description || b.id));
  });

export const getGroupingFieldNames = (
  groupingStrategy: GroupingStrategy | undefined,
  isDraft: boolean
): string[] => {
  if (!groupingStrategy || isDraft) return [];
  const config = parseStrategyConfig(groupingStrategy);
  if (config?.primary_group && config?.secondary_group) {
    return [config.primary_group, config.secondary_group]
      .map(fieldNameFromStrategyName)
      .filter((x): x is string => !!x);
  }
  switch (groupingStrategy.strategy_type) {
    case 'by_location':
      return ['room'];
    case 'by_brand':
      return ['model'];
    case 'by_value_range':
      return ['price'];
    case 'by_type':
      return ['type'];
    default:
      return [];
  }
};

export const getEffectiveFields = (
  item: ItemViewModel,
  categoryFields: FieldConfiguration[],
  itemFieldConfigs: Record<string, FieldConfiguration[]> | undefined,
  groupingStrategy?: GroupingStrategy
): FieldConfiguration[] => {
  const promptKey = String(item.type || '').toLowerCase().trim();
  const source = promptKey && itemFieldConfigs?.[promptKey]
    ? itemFieldConfigs[promptKey]
    : categoryFields;
  const groupingFields = getGroupingFieldNames(groupingStrategy, !!item.isDraft);
  return source
    .filter(field => field.display_on_ui === 1)
    .filter(isPersistableField)
    .filter(field => {
      const persisted = toPersistedFieldName(field.item_fields);
      return persisted ? !groupingFields.includes(persisted) : false;
    })
    .sort(compareFields);
};

const tieRank = (fieldName: string): number => {
  switch (toPersistedFieldName(fieldName)) {
    case 'quantity':
      return 0;
    case 'selectedanswer':
      return 1;
    case 'notes':
      return 2;
    default:
      return 10;
  }
};

export const compareFields = (a: FieldConfiguration, b: FieldConfiguration): number => {
  const order = (a.display_order || 0) - (b.display_order || 0);
  if (order !== 0) return order;
  const rank = tieRank(a.item_fields) - tieRank(b.item_fields);
  if (rank !== 0) return rank;
  return String(a.item_fields || '').localeCompare(String(b.item_fields || ''));
};

export const applySelectedAnswerEnhancements = (
  field: FieldConfiguration,
  item: Item
): FieldConfiguration => {
  if (toPersistedFieldName(field.item_fields) !== 'selectedanswer' || !item.commaseparatedlist) {
    return field;
  }
  const options = item.commaseparatedlist
    .split(',')
    .map(option => option.trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))
    .map(option => ({
      option_value: option,
      option_label: option,
      display_order: 0,
      is_active: true,
    }));
  if (options.length === 0) return field;
  const type = String(field.field_type || '').toLowerCase().replace(/-/g, '_');
  const wantsMulti =
    field.allows_multiple_selection === true ||
    (item as any).multiSelectAnswer === true ||
    String((item as any).multiSelectSelectedAnswer || '').toLowerCase() === 'true';
  return {
    ...field,
    dropdownOptions: options,
    field_type:
      type === 'radio_group'
        ? 'radio_group'
        : type === 'switch' || type === 'checkbox'
          ? field.field_type
          : wantsMulti
            ? 'multiselect'
            : 'dropdown',
    ...(wantsMulti ? { allows_multiple_selection: true } : {}),
  };
};

export type LayoutCell =
  | { kind: 'field'; field: FieldConfiguration }
  | { kind: 'answerWithNotes'; answerField: FieldConfiguration; notesField: FieldConfiguration };

export const buildLayoutCells = (fields: FieldConfiguration[]): LayoutCell[] => {
  const cells: LayoutCell[] = [];
  let i = 0;
  while (i < fields.length) {
    const current = fields[i];
    const next = fields[i + 1];
    if (
      toPersistedFieldName(current.item_fields) === 'selectedanswer' &&
      next &&
      toPersistedFieldName(next.item_fields) === 'notes'
    ) {
      cells.push({ kind: 'answerWithNotes', answerField: current, notesField: next });
      i += 2;
    } else {
      cells.push({ kind: 'field', field: current });
      i += 1;
    }
  }
  return cells;
};

export const buildPairedRows = (cells: LayoutCell[]): LayoutCell[][] => {
  const rows: LayoutCell[][] = [];
  let i = 0;
  while (i < cells.length) {
    const first = cells[i];
    const second = cells[i + 1];
    if (!second || first.kind === 'answerWithNotes' || second.kind === 'answerWithNotes') {
      rows.push([first]);
      i += 1;
    } else {
      rows.push([first, second]);
      i += 2;
    }
  }
  return rows;
};

const hasTextValue = (value: unknown): boolean =>
  String(value ?? '').trim().length > 0;

const quantityForCapturedCheck = (item: ItemViewModel, changes: Record<string, any>): number => {
  if (changes.quantity !== undefined) {
    return parseIntegerValue(changes.quantity);
  }
  const rawQty = (item as any).qty;
  if (rawQty !== undefined && rawQty !== null) {
    return parseIntegerValue(rawQty);
  }
  return parseIntegerValue(item.quantity);
};

export const hasCapturedItemData = (
  item: ItemViewModel,
  changes: Record<string, any> = {},
  photos: any[] = []
): boolean => {
  if (item.isDraft) return false;

  const quantity = quantityForCapturedCheck(item, changes);
  const price = parseNumberValue(changes.price ?? item.price);
  const description = changes.description ?? item.description;
  const model = changes.model ?? item.model;
  const notes = changes.notes ?? item.notes;
  const selectedAnswer = changes.selectedanswer ?? item.selectedanswer;
  const hasPhoto = changes.photos ?? item.photo ?? (item as any).hasphoto;
  const excluded = changes.excludefromreport ?? item.excludefromreport;

  return (
    quantity > 0 ||
    price > 0 ||
    hasTextValue(description) ||
    hasTextValue(model) ||
    hasTextValue(notes) ||
    hasTextValue(selectedAnswer) ||
    photos.length > 0 ||
    Number(hasPhoto) > 0 ||
    Number(excluded) > 0
  );
};

export const calculateTotals = (
  items: ItemViewModel[],
  edits: Record<string, Record<string, any>>
): { itemCount: number; totalValue: number } => {
  let itemCount = 0;
  let totalValue = 0;
  for (const item of items) {
    if (item.isDraft) continue;
    const changes = edits[item.id] || {};
    const quantity = parseIntegerValue(
      changes.quantity ?? (item as any).qty ?? item.quantity
    );
    const price = parseNumberValue(changes.price ?? item.price);
    if (hasCapturedItemData(item, changes)) {
      itemCount += 1;
      totalValue += price;
    }
  }
  return { itemCount, totalValue };
};

export const validateItemFields = (
  fields: FieldConfiguration[],
  data: Record<string, any>
): FieldValidationError[] => ValidationService.validateAllFields(fields, data);
