import {
  calculateTotals,
  getEffectiveFields,
  getGroupingFieldNames,
  groupItems,
  hasCapturedItemData,
  ItemViewModel,
} from '../components/survey/items/dynamic/dynamicItemLogic';
import { getUnsupportedVisibleFields, toPersistedFieldName } from '../components/survey/items/dynamic/itemFieldMapping';
import { FieldConfiguration, GroupingStrategy } from '../types/dynamicUI';

const field = (
  item_fields: string,
  field_type = 'text',
  display_order = 1
): FieldConfiguration => ({
  riskfieldid: display_order,
  riskTemplateCategoryID: 1,
  item_fields,
  field_label: item_fields,
  display_on_ui: 1,
  field_type,
  display_order,
});

const item = (overrides: Partial<ItemViewModel>): ItemViewModel => ({
  id: '1',
  categoryId: '10',
  type: 'Bars / Access',
  description: '',
  room: 'Balcony',
  quantity: '1',
  price: '0',
  notes: '',
  lifecycle: 'saved_local',
  ...overrides,
});

describe('dynamic item logic', () => {
  it('groups items by nested Location -> ItemPrompt strategy', () => {
    const strategy: GroupingStrategy = {
      grouping_strategy_id: 1,
      RiskTemplateCategoryID: 10,
      strategy_type: 'custom',
      strategy_name: 'Location -> Type',
      strategy_config: { primary_group: 'Location', secondary_group: 'ItemPrompt' },
      is_active: true,
      display_order: 1,
    };

    const grouped = groupItems([
      item({ id: '1', room: 'Balcony', type: 'Bars / Access' }),
      item({ id: '2', room: 'Kitchen', type: 'Bookcase' }),
    ], strategy);

    expect(grouped?.kind).toBe('nested');
    if (grouped?.kind === 'nested') {
      expect(grouped.groups.map(g => g.key)).toEqual(['Balcony', 'Kitchen']);
      expect(grouped.groups[0].secondary[0].key).toBe('Bars / Access');
    }
  });

  it('excludes grouping fields for saved items but not drafts', () => {
    const strategy: GroupingStrategy = {
      grouping_strategy_id: 1,
      RiskTemplateCategoryID: 10,
      strategy_type: 'custom',
      strategy_name: 'Location -> Type',
      strategy_config: { primary_group: 'Location', secondary_group: 'ItemPrompt' },
      is_active: true,
      display_order: 1,
    };

    expect(getGroupingFieldNames(strategy, false)).toEqual(['room', 'type']);
    expect(getGroupingFieldNames(strategy, true)).toEqual([]);
  });

  it('keeps prefilled add-another drafts in their inherited group', () => {
    const strategy: GroupingStrategy = {
      grouping_strategy_id: 1,
      RiskTemplateCategoryID: 10,
      strategy_type: 'by_type',
      strategy_name: 'Type',
      strategy_config: {},
      is_active: true,
      display_order: 1,
    };

    const grouped = groupItems([
      item({ id: 'draft-blank', isDraft: true, lifecycle: 'draft', type: '' }),
      item({ id: 'draft-jacket', isDraft: true, lifecycle: 'draft', type: 'Jackets' }),
    ], strategy);

    expect(grouped?.kind).toBe('flat');
    if (grouped?.kind === 'flat') {
      expect(grouped.groups.map(g => g.key)).toEqual(['Draft Items', 'Jackets']);
    }
  });

  it('keeps prefilled nested add-another drafts under inherited location and type', () => {
    const strategy: GroupingStrategy = {
      grouping_strategy_id: 1,
      RiskTemplateCategoryID: 10,
      strategy_type: 'custom',
      strategy_name: 'Location -> Type',
      strategy_config: { primary_group: 'Location', secondary_group: 'ItemPrompt' },
      is_active: true,
      display_order: 1,
    };

    const grouped = groupItems([
      item({ id: 'draft-blank', isDraft: true, lifecycle: 'draft', room: '', type: '' }),
      item({ id: 'draft-bedroom-jacket', isDraft: true, lifecycle: 'draft', room: 'Bedroom', type: 'Jackets' }),
    ], strategy);

    expect(grouped?.kind).toBe('nested');
    if (grouped?.kind === 'nested') {
      expect(grouped.groups.map(g => g.key)).toEqual(['Bedroom', 'Draft Items']);
      expect(grouped.groups[0].secondary[0].key).toBe('Jackets');
    }
  });

  it('prefers per-item override fields and filters unsupported fields', () => {
    const fields = [field('description'), field('room'), field('custom_backend_only')];
    const override = [field('selectedanswer', 'radio_group'), field('notes')];
    const effective = getEffectiveFields(
      item({ type: 'Walls' }),
      fields,
      { walls: override },
      undefined
    );

    expect(effective.map(f => f.item_fields)).toEqual(['selectedanswer', 'notes']);
    expect(getUnsupportedVisibleFields(fields).map(f => f.item_fields)).toEqual(['custom_backend_only']);
  });

  it('maps supported field aliases to persisted fields', () => {
    expect(toPersistedFieldName('ItemPrompt')).toBe('type');
    expect(toPersistedFieldName('Location')).toBe('room');
    expect(toPersistedFieldName('Qty')).toBe('quantity');
    expect(toPersistedFieldName('UnknownField')).toBeNull();
  });

  it('calculates totals from saved items and edits only', () => {
    const totals = calculateTotals(
      [
        item({ id: '1', qty: 2, quantity: '2', price: '100' }),
        item({ id: 'draft-1', isDraft: true, lifecycle: 'draft', quantity: '9', price: '999' }),
      ],
      { '1': { quantity: '3', price: '150' } }
    );

    expect(totals).toEqual({ itemCount: 1, totalValue: 150 });
  });

  it('does not treat template-only rows as captured records', () => {
    const templateOnly = item({
      id: 'template-1',
      type: 'Belts / Hats / Scarves',
      qty: 0,
      quantity: '1',
      price: '0',
      description: '',
      model: '',
      notes: '',
    });

    expect(hasCapturedItemData(templateOnly)).toBe(false);
    expect(calculateTotals([templateOnly], {})).toEqual({ itemCount: 0, totalValue: 0 });
  });

  it('treats saved values beyond item type as captured records', () => {
    expect(hasCapturedItemData(item({ qty: 1, quantity: '1' }))).toBe(true);
    expect(hasCapturedItemData(item({ qty: 0, price: '100' }))).toBe(true);
    expect(hasCapturedItemData(item({ qty: 0, selectedanswer: 'Yes' }))).toBe(true);
  });

  it('treats price as the full row value, not quantity multiplied by price', () => {
    const totals = calculateTotals(
      [item({ id: 'sunglasses', qty: 3, quantity: '3', price: '8500' })],
      {}
    );

    expect(totals).toEqual({ itemCount: 1, totalValue: 8500 });
  });
});
