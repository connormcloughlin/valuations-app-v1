import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Modal, Button, StyleSheet, TouchableOpacity } from 'react-native';
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

  // After setExpandedSection or section change, clear expandedCategory and items
  useEffect(() => {
    setExpandedCategory(null);
    setItems({});
  }, [expandedSection]);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff', marginTop: 24, marginBottom: 32 }}>
      {/* Sections as horizontal tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, marginBottom: 16 }}>
        {sections.map(section => (
          <TouchableOpacity
            key={section.id}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 24,
              borderBottomWidth: 3,
              borderBottomColor: expandedSection === section.id ? '#1976d2' : 'transparent',
              backgroundColor: expandedSection === section.id ? '#e3f0fc' : '#f7f7fa',
              marginRight: 8,
              borderTopLeftRadius: 8,
              borderTopRightRadius: 8,
            }}
            onPress={() => {
              if (expandedSection !== section.id) {
                setExpandedSection(section.id);
                setExpandedCategory(null);
                setItems({});
                // Auto-fetch categories if not loaded
                if (!categories[section.id] && !categoriesLoading[section.id]) {
                  fetchCategories(section.id);
                }
              }
            }}
          >
            <Text style={{ fontWeight: 'bold', color: expandedSection === section.id ? '#1976d2' : '#333' }}>{section.title}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {/* Categories and items for the selected section */}
      {expandedSection && (
        <View style={{ flex: 1, flexDirection: 'row' }}>
          {/* Categories vertical list */}
          <View style={{ minWidth: 180, marginRight: 16 }}>
            {categoriesLoading[expandedSection] && <Text>Loading categories...</Text>}
            {categoriesError[expandedSection] && <Text style={{ color: 'red' }}>{categoriesError[expandedSection]}</Text>}
            {categories[expandedSection]?.map(category => (
              <View key={category.id} style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee', flexDirection: 'row', alignItems: 'center' }}>
                <Text
                  style={{ fontWeight: 'bold', flex: 1, color: expandedCategory === category.id ? '#1976d2' : undefined }}
                  onPress={() => {
                    setExpandedCategory(category.id);
                    if (!items[category.id] && !itemsLoading[category.id]) {
                      fetchItems(category.id);
                    }
                  }}
                >
                  {category.title}
                </Text>
              </View>
            ))}
          </View>
          {/* Items grid view for the selected category */}
          <View style={{ flex: 1 }}>
            {expandedCategory && itemsLoading[expandedCategory] && <Text>Loading items...</Text>}
            {expandedCategory && itemsError[expandedCategory] && <Text style={{ color: 'red' }}>{itemsError[expandedCategory]}</Text>}
            {expandedCategory && items[expandedCategory] && (
              <ItemsTable items={items[expandedCategory]} onDeleteItem={() => {}} />
            )}
          </View>
        </View>
      )}
      {/* Add Item Modal (placeholder) */}
      <Modal visible={showAddItemModal} onRequestClose={() => setShowAddItemModal(false)}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Add Item for Category: {addItemCategoryId}</Text>
          <Button title="Close" onPress={() => setShowAddItemModal(false)} />
        </View>
      </Modal>
    </View>
  );
};

function FetchCategoriesOnExpand({ fetch }: { fetch: () => void }) {
  useEffect(() => { fetch(); }, []);
  return null;
}

export default SectionsCategoriesScreen;

// Add styles as needed 