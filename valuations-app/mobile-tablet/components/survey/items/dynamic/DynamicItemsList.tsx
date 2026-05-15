import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { FieldConfiguration } from '../../../../types/dynamicUI';
import DynamicItemForm from './DynamicItemForm';
import { GroupedItems, hasCapturedItemData, ItemViewModel } from './dynamicItemLogic';
import { formatCurrencyZA, PersistedItemField, parseIntegerValue, parseNumberValue } from './itemFieldMapping';

interface DynamicItemsListProps {
  groupedItems: GroupedItems;
  flatItems: ItemViewModel[];
  expandedItemId: string | null;
  expandedGroups: Record<string, boolean>;
  fieldsByItemId: Record<string, FieldConfiguration[]>;
  valuesByItemId: Record<string, Record<string, any>>;
  editsByItemId: Record<string, Record<string, any>>;
  locallyPendingItemIds: Set<string>;
  itemPhotos: { [key: string]: any[] };
  isPhone?: boolean;
  onToggleItem: (itemId: string) => void;
  onToggleGroup: (key: string) => void;
  onChange: (itemId: string, fieldName: PersistedItemField, value: any) => void;
  onSave: (item: ItemViewModel, values: Record<string, any>) => Promise<void>;
  onDelete: (item: ItemViewModel) => Promise<void>;
  onDuplicate: (item: ItemViewModel) => void;
  onTakePhoto: (itemId: string) => void;
}

const groupKey = (parts: string[]) => parts.join('::');

export default function DynamicItemsList({
  groupedItems,
  flatItems,
  expandedItemId,
  expandedGroups,
  fieldsByItemId,
  valuesByItemId,
  editsByItemId,
  locallyPendingItemIds,
  itemPhotos,
  isPhone = false,
  onToggleItem,
  onToggleGroup,
  onChange,
  onSave,
  onDelete,
  onDuplicate,
  onTakePhoto,
}: DynamicItemsListProps) {
  if (!groupedItems) {
    return (
      <View style={styles.list}>
        {flatItems.map((item, index) => renderItem(item, index))}
      </View>
    );
  }

  if (groupedItems.kind === 'nested') {
    return (
      <View style={styles.list}>
        {groupedItems.groups.map(primary => {
          const primaryKey = groupKey(['primary', primary.key]);
          const isPrimaryOpen = expandedGroups[primaryKey] ?? false;
          const primaryCount = primary.secondary.reduce((n, g) => n + countCaptured(g.items), 0);
          return (
            <View key={primaryKey} style={styles.primaryGroup}>
              {renderHeader(primary.key, primaryCount, isPrimaryOpen, () => onToggleGroup(primaryKey), 'primary')}
              {isPrimaryOpen ? (
                <View style={styles.primaryBody}>
                  {primary.secondary.map(secondary => {
                    const secondaryKey = groupKey(['secondary', primary.key, secondary.key]);
                    const isSecondaryOpen = expandedGroups[secondaryKey] ?? false;
                    const secondaryCount = countCaptured(secondary.items);
                    return (
                      <View key={secondaryKey} style={styles.secondaryGroup}>
                        {renderHeader(secondary.key, secondaryCount, isSecondaryOpen, () => onToggleGroup(secondaryKey), 'secondary')}
                        {isSecondaryOpen ? secondary.items.map((item, index) => renderItem(item, index)) : null}
                      </View>
                    );
                  })}
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {groupedItems.groups.map(group => {
        const key = groupKey(['flat', group.key]);
        const isOpen = expandedGroups[key] ?? false;
        const count = countCaptured(group.items);
        return (
          <View key={key} style={styles.primaryGroup}>
            {renderHeader(group.key, count, isOpen, () => onToggleGroup(key), 'primary')}
            {isOpen ? group.items.map((item, index) => renderItem(item, index)) : null}
          </View>
        );
      })}
    </View>
  );

  function countCaptured(itemsToCount: ItemViewModel[]): number {
    return itemsToCount.filter(item =>
      hasCapturedItemData(item, editsByItemId[item.id] || {}, itemPhotos[item.id] || [])
    ).length;
  }

  function renderHeader(
    title: string,
    count: number,
    open: boolean,
    onPress: () => void,
    level: 'primary' | 'secondary'
  ) {
    return (
      <TouchableOpacity
        style={[
          styles.groupHeader,
          level === 'secondary' && styles.secondaryHeader,
          isPhone && (level === 'secondary' ? styles.secondaryHeaderPhone : styles.groupHeaderPhone),
        ]}
        onPress={onPress}
        activeOpacity={0.75}
      >
        <Text style={[styles.groupTitle, level === 'secondary' && styles.secondaryTitle]} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.headerMeta}>
          {count > 0 ? (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{count}</Text>
            </View>
          ) : null}
          <MaterialCommunityIcons name={open ? 'chevron-down' : 'chevron-right'} size={20} color="#52677a" />
        </View>
      </TouchableOpacity>
    );
  }

  function renderItem(item: ItemViewModel, index = 0) {
    const isExpanded = expandedItemId === item.id;
    const values = valuesByItemId[item.id] || {};
    const hasCapturedData = hasCapturedItemData(item, editsByItemId[item.id] || {}, itemPhotos[item.id] || []);
    const hasPendingSync =
      (locallyPendingItemIds.has(item.id) || Number((item as any).pending_sync || 0) === 1);
    const qty = parseIntegerValue(values.quantity ?? item.quantity);
    const price = parseNumberValue(values.price ?? item.price);
    const title =
      values.description ||
      item.description ||
      values.model ||
      item.model ||
      (item.isDraft ? values.type || item.type || 'New item' : `Item #${index + 1}`);
    const capturedSubtitle =
      price > 0
        ? `${qty > 0 ? `${qty} @ ` : ''}R${formatCurrencyZA(price)}`
        : qty > 0
          ? `Qty: ${qty}`
          : 'No captured value yet';
    const subtitle = item.isDraft
      ? 'Draft'
      : hasCapturedData
        ? capturedSubtitle
        : 'No captured value yet';
    return (
      <View key={item.id} style={[styles.itemWrap, item.isDraft && styles.draftWrap]}>
        <TouchableOpacity
          style={[styles.itemRow, isPhone && styles.itemRowPhone]}
          onPress={() => onToggleItem(item.id)}
          activeOpacity={0.75}
        >
          <View style={styles.itemText}>
            <Text style={styles.itemTitle} numberOfLines={1}>{title}</Text>
            <Text style={styles.itemSubtitle} numberOfLines={1}>{subtitle}</Text>
          </View>
          <View style={styles.itemMeta}>
            {item.isDraft ? (
              <MaterialCommunityIcons name="pencil-outline" size={16} color="#f39c12" />
            ) : hasCapturedData ? (
              <MaterialCommunityIcons name="database-check" size={16} color="#3498db" />
            ) : null}
            {hasPendingSync ? (
              <MaterialCommunityIcons name="check-circle" size={16} color="#4CAF50" />
            ) : null}
            {item.excludefromreport ? (
              <MaterialCommunityIcons name="file-cancel-outline" size={16} color="#c0392b" />
            ) : null}
            <MaterialCommunityIcons name={isExpanded ? 'chevron-down' : 'chevron-right'} size={20} color="#52677a" />
          </View>
        </TouchableOpacity>
        {isExpanded ? (
          <DynamicItemForm
            item={item}
            fields={fieldsByItemId[item.id] || []}
            values={values}
            itemPhotos={itemPhotos}
            isPhone={isPhone}
            onChange={onChange}
            onSave={onSave}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onTakePhoto={onTakePhoto}
          />
        ) : null}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  list: {
    width: '100%',
  },
  primaryGroup: {
    marginBottom: 4,
    overflow: 'hidden',
  },
  primaryBody: {
    backgroundColor: '#f8f9fa',
  },
  secondaryGroup: {
    marginBottom: 2,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#e8f4f8',
    borderBottomWidth: 1,
    borderBottomColor: '#d0e8f0',
  },
  groupHeaderPhone: {
    paddingVertical: 9,
    paddingHorizontal: 10,
  },
  secondaryHeader: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: '#f0f4f7',
    borderBottomColor: '#e0e8f0',
    marginLeft: 8,
  },
  secondaryHeaderPhone: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginLeft: 4,
  },
  groupTitle: {
    flex: 1,
    color: '#2c3e50',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryTitle: {
    fontWeight: '500',
    fontSize: 14,
    color: '#34495e',
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countBadge: {
    backgroundColor: '#4a90e2',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 8,
    minWidth: 24,
    alignItems: 'center',
  },
  countBadgeText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  itemWrap: {
    marginBottom: 2,
  },
  draftWrap: {
    backgroundColor: '#f0f8f0',
  },
  itemRow: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fafafa',
  },
  itemRowPhone: {
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  itemText: {
    flex: 1,
    minWidth: 0,
  },
  itemTitle: {
    color: '#2c3e50',
    fontWeight: '500',
    fontSize: 14,
    marginBottom: 2,
  },
  itemSubtitle: {
    color: '#7f8c8d',
    fontSize: 12,
    fontWeight: '400',
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
