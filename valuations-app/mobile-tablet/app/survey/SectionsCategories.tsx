import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Modal, Button, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Collapsible } from '../../components/Collapsible';
import api from '../../api';
import { ItemsTable, Item as ItemType } from './components/ItemComponents';

interface Section {
  id: string;
  title: string;
}
interface Category {
  id: string;
  title: string;
}

const SectionsCategoriesScreen = () => {
  const params = useLocalSearchParams();
  const riskassessmentid = params.riskassessmentid as string;

  console.log('[SectionsCategoriesScreen] Params:', params);
  console.log('[SectionsCategoriesScreen] riskassessmentid:', riskassessmentid);
  console.log('[SectionsCategoriesScreen] Imported api keys:', Object.keys(api));

  const [sections, setSections] = useState<Section[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(false);
  const [sectionsError, setSectionsError] = useState<string|null>(null);
  const [expandedSection, setExpandedSection] = useState<string|null>(null);
  const [categories, setCategories] = useState<Record<string, Category[]>>({});
  const [categoriesLoading, setCategoriesLoading] = useState<Record<string, boolean>>({});
  const [categoriesError, setCategoriesError] = useState<Record<string, string|null>>({});
  const [expandedCategory, setExpandedCategory] = useState<string|null>(null);
  const [items, setItems] = useState<Record<string, ItemType[]>>({});
  const [itemsLoading, setItemsLoading] = useState<Record<string, boolean>>({});
  const [itemsError, setItemsError] = useState<Record<string, string|null>>({});
  // For add item modal
  const [addItemCategoryId, setAddItemCategoryId] = useState<string|null>(null);
  const [showAddItemModal, setShowAddItemModal] = useState(false);

  // Fetch sections on mount
  useEffect(() => {
    if (!riskassessmentid) {
      console.error('[SectionsCategoriesScreen] No riskassessmentid provided in params');
      setSectionsError('No risk assessment ID provided.');
      return;
    }
    setSectionsLoading(true);
    setSectionsError(null);
    api.getRiskAssessmentSections(riskassessmentid)
      .then((res: any) => {
        console.log('[SectionsCategoriesScreen] getRiskAssessmentSections response:', res);
        if (res.success && res.data) {
          setSections(res.data.map((s: any) => ({
            id: s.id || s.sectionid || s.riskassessmentsectionid,
            title: s.sectionname || s.name || 'Unnamed Section',
          })));
        } else {
          setSectionsError(res.message || 'Failed to load sections');
        }
      })
      .catch(e => {
        console.error('[SectionsCategoriesScreen] Error loading sections:', e);
        setSectionsError(e.message || 'Error loading sections');
      })
      .finally(() => setSectionsLoading(false));
  }, [riskassessmentid]);

  // Fetch categories for a section
  const fetchCategories = (sectionId: string) => {
    console.log('[SectionsCategoriesScreen] Fetching categories for section:', sectionId);
    setCategoriesLoading(prev => ({ ...prev, [sectionId]: true }));
    setCategoriesError(prev => ({ ...prev, [sectionId]: null }));
    console.log('api object at call time:', api);
    console.log('typeof api.getRiskAssessmentCategories:', typeof api.getRiskAssessmentCategories);
    api.getRiskAssessmentCategories(sectionId)
      .then((res: any) => {
        console.log('[SectionsCategoriesScreen] getRiskAssessmentCategories response:', res);
        if (res.success && res.data) {
          setCategories(prev => ({ ...prev, [sectionId]: res.data.map((c: any) => ({
            id: c.id || c.categoryid || c.riskassessmentcategoryid,
            title: c.name || c.categoryname || 'Unnamed Category',
          })) }));
        } else {
          setCategoriesError(prev => ({ ...prev, [sectionId]: res.message || 'Failed to load categories' }));
        }
      })
      .catch(e => {
        console.error('[SectionsCategoriesScreen] Error loading categories:', e);
        setCategoriesError(prev => ({ ...prev, [sectionId]: e.message || 'Error loading categories' }));
      })
      .finally(() => setCategoriesLoading(prev => ({ ...prev, [sectionId]: false })));
  };

  // Fetch items for a category
  const fetchItems = (categoryId: string) => {
    console.log('[SectionsCategoriesScreen] Fetching items for category:', categoryId);
    setItemsLoading(prev => ({ ...prev, [categoryId]: true }));
    setItemsError(prev => ({ ...prev, [categoryId]: null }));
    api.getRiskAssessmentItems(categoryId)
      .then((res: any) => {
        console.log('[SectionsCategoriesScreen] getRiskAssessmentItems response:', res);
        if (res.success && res.data) {
          setItems(prev => ({ ...prev, [categoryId]: res.data.map((item: any) => ({
            id: item.id || item.itemid || item.riskassessmentitemid || '',
            type: item.type || item.itemtype || '',
            description: item.description || '',
            quantity: String(item.quantity || '1'),
            price: String(item.price || '0'),
            room: item.room || '',
            notes: item.notes || '',
            categoryId: categoryId,
            make: item.make || '',
            model: item.model || '',
            selection: item.selection || '',
            serialNumber: item.serialNumber || '',
            photo: item.photo || undefined,
          })) }));
        } else {
          setItemsError(prev => ({ ...prev, [categoryId]: res.message || 'Failed to load items' }));
        }
      })
      .catch(e => {
        console.error('[SectionsCategoriesScreen] Error loading items:', e);
        setItemsError(prev => ({ ...prev, [categoryId]: e.message || 'Error loading items' }));
      })
      .finally(() => setItemsLoading(prev => ({ ...prev, [categoryId]: false })));
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff', marginTop: 24, marginBottom: 32 }}>
      {sectionsLoading && <Text>Loading sections...</Text>}
      {sectionsError && <Text style={{ color: 'red' }}>{sectionsError}</Text>}
      {sections.map(section => {
        console.log('[SectionsCategoriesScreen] Rendering section:', section);
        return (
          <Collapsible
            key={section.id}
            title={section.title}
          >
            <Button title="Load Categories" onPress={() => fetchCategories(section.id)} />
            {categoriesLoading[section.id] && <Text>Loading categories...</Text>}
            {categoriesError[section.id] && <Text style={{ color: 'red' }}>{categoriesError[section.id]}</Text>}
            {categories[section.id]?.map(category => {
              console.log('[SectionsCategoriesScreen] Rendering category:', category);
              return (
                <View key={category.id} style={{ marginLeft: 16, marginBottom: 8 }}>
                  <Text style={{ fontWeight: 'bold' }}>{category.title}</Text>
                  <Button title="Load Items" onPress={() => fetchItems(category.id)} />
                  {itemsLoading[category.id] && <Text>Loading items...</Text>}
                  {itemsError[category.id] && <Text style={{ color: 'red' }}>{itemsError[category.id]}</Text>}
                  {items[category.id] && (
                    <ItemsTable items={items[category.id]} onDeleteItem={() => {}} />
                  )}
                  <Button title="Add Item" onPress={() => { setAddItemCategoryId(category.id); setShowAddItemModal(true); }} />
                </View>
              );
            })}
          </Collapsible>
        );
      })}
      {/* Add Item Modal (placeholder) */}
      <Modal visible={showAddItemModal} onRequestClose={() => setShowAddItemModal(false)}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Add Item for Category: {addItemCategoryId}</Text>
          <Button title="Close" onPress={() => setShowAddItemModal(false)} />
        </View>
      </Modal>
    </ScrollView>
  );
};

export default SectionsCategoriesScreen;

// Add styles as needed 