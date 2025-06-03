import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Modal, Button, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
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

// Orientation hook
function useOrientation() {
  const [dimensions, setDimensions] = React.useState({ window: Dimensions.get('window') });
  React.useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({ window });
    });
    return () => subscription.remove();
  }, []);
  const { width, height } = dimensions.window;
  const isLandscape = width > height;
  return { isLandscape, width, height };
}

const SectionsCategoriesScreen = () => {
  const params = useLocalSearchParams();
  const riskassessmentid = params.riskassessmentid as string;
  const appointmentStatus = (params.status || params.appointmentStatus || '').toString().toLowerCase();

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

  const { isLandscape, height } = useOrientation();

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
          setItems(prev => ({
            ...prev,
            [categoryId]: res.data.map((item: any) => ({
              riskassessmentitemid: item.riskassessmentitemid ?? '',
              riskassessmentcategoryid: item.riskassessmentcategoryid ?? '',
              itemprompt: item.itemprompt ?? '',
              itemtype: item.itemtype ?? '',
              rank: item.rank ?? '',
              commaseparatedlist: item.commaseparatedlist ?? '',
              selectedanswer: item.selectedanswer ?? '',
              qty: item.qty != null ? String(item.qty) : '',
              price: item.price != null ? String(item.price) : '',
              description: item.description ?? '',
              model: item.model ?? '',
              location: item.location ?? '',
              assessmentregisterid: item.assessmentregisterid ?? '',
              assessmentregistertypeid: item.assessmentregistertypeid ?? '',
              isactive: item.isactive ?? '',
              createdby: item.createdby ?? '',
              createddate: item.createddate ?? '',
              modifiedby: item.modifiedby ?? '',
              modifieddate: item.modifieddate ?? '',
              id: item.riskassessmentitemid ?? item.id ?? '', // for UI key
            }))
          }));
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
    <View style={{ flex: 1, backgroundColor: 'linear-gradient(180deg, #f0f4fa 0%, #e9eef6 100%)', paddingTop: 24, paddingBottom: 32 }}>
      <Text style={{ fontSize: 26, fontWeight: 'bold', marginLeft: 24, marginBottom: 12, color: '#1976d2', letterSpacing: 0.5 }}>Sections & Categories</Text>
      {/* Sections as horizontal tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, marginBottom: 20, paddingHorizontal: 16 }}>
        {sections.map(section => (
          <TouchableOpacity
            key={section.id}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 22,
              marginRight: 8,
              borderRadius: 12,
              backgroundColor: expandedSection === section.id ? '#1976d2' : '#fff',
              shadowColor: '#1976d2',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: expandedSection === section.id ? 0.18 : 0.08,
              shadowRadius: 6,
              elevation: expandedSection === section.id ? 4 : 1,
              borderBottomWidth: expandedSection === section.id ? 0 : 2,
              borderBottomColor: expandedSection === section.id ? 'transparent' : '#e0e0e0',
              transform: [{ scale: expandedSection === section.id ? 1.04 : 1 }],
            }}
            activeOpacity={0.85}
            onPress={() => {
              if (expandedSection !== section.id) {
                setExpandedSection(section.id);
                setExpandedCategory(null);
                setItems({});
                if (!categories[section.id] && !categoriesLoading[section.id]) {
                  fetchCategories(section.id);
                }
              }
            }}
          >
            <Text style={{ fontWeight: 'bold', fontSize: 12, color: expandedSection === section.id ? '#fff' : '#1976d2', letterSpacing: 0.2 }}>{section.title}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {/* Categories and items for the selected section */}
      {expandedSection && (
        <View style={{ flex: 1, flexDirection: 'row', marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 18, shadowColor: '#1976d2', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 8, elevation: 2, padding: 12 }}>
          {/* Categories vertical list */}
          <View style={{ minWidth: 150, maxWidth: 220, marginRight: 12, paddingVertical: 4, borderRightWidth: 1, borderRightColor: '#e3e8f0', justifyContent: 'flex-start', flexShrink: 0 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 12, marginBottom: 6, color: '#1976d2', marginLeft: 6 }}>Categories</Text>
            {categoriesLoading[expandedSection] && <Text style={{ marginLeft: 8, color: '#888' }}>Loading categories...</Text>}
            {categoriesError[expandedSection] && <Text style={{ color: 'red', marginLeft: 8 }}>{categoriesError[expandedSection]}</Text>}
            <ScrollView
              style={{ flexGrow: 1, maxHeight: isLandscape ? height * 0.75 : height * 0.6, minHeight: 80 }}
              showsVerticalScrollIndicator={true}
            >
              {categories[expandedSection]?.map(category => (
                <TouchableOpacity
                  key={category.id}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 10,
                    borderRadius: 7,
                    marginVertical: 2,
                    marginHorizontal: 2,
                    backgroundColor: expandedCategory === category.id ? '#e3f0fc' : 'transparent',
                    borderWidth: expandedCategory === category.id ? 1.5 : 0,
                    borderColor: expandedCategory === category.id ? '#1976d2' : 'transparent',
                    shadowColor: '#1976d2',
                    shadowOpacity: expandedCategory === category.id ? 0.10 : 0,
                    shadowRadius: 4,
                    elevation: expandedCategory === category.id ? 2 : 0,
                  }}
                  activeOpacity={0.85}
                  onPress={() => {
                    setExpandedCategory(category.id);
                    if (!items[category.id] && !itemsLoading[category.id]) {
                      fetchItems(category.id);
                    }
                  }}
                >
                  <Text style={{ fontWeight: expandedCategory === category.id ? 'bold' : '500', color: expandedCategory === category.id ? '#1976d2' : '#333', fontSize: 11 }}>{category.title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          {/* Items grid view for the selected category */}
          <View style={{ flex: 1, padding: 8, minHeight: 320 }}>
            {expandedCategory && itemsLoading[expandedCategory] && <Text style={{ color: '#888', marginTop: 16 }}>Loading items...</Text>}
            {expandedCategory && itemsError[expandedCategory] && <Text style={{ color: 'red', marginTop: 16 }}>{itemsError[expandedCategory]}</Text>}
            {expandedCategory && items[expandedCategory] && (
              <View style={{ backgroundColor: '#f7fafd', borderRadius: 12, padding: 12, shadowColor: '#1976d2', shadowOpacity: 0.08, shadowRadius: 4, elevation: 1 }}>
                <ItemsTable
                  categoryId={expandedCategory}
                  editable={appointmentStatus !== 'completed'}
                  onRefresh={() => fetchItems(expandedCategory)}
                  showRoom={true}
                  showMakeModel={true}
                />
              </View>
            )}
            {!expandedCategory && <Text style={{ color: '#bbb', fontSize: 16, marginTop: 32, textAlign: 'center' }}>Select a category to view items</Text>}
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