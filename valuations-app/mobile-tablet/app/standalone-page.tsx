import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { AppLayout, TabConfig } from '../components/layout';

// Optional: Define custom tabs for this page
const customTabs: TabConfig[] = [
  {
    name: 'dashboard',
    title: 'Dashboard',
    icon: 'view-dashboard',
    path: '/(tabs)'
  },
  {
    name: 'back',
    title: 'Back',
    icon: 'view-dashboard',
    path: '/standalone-page'
  }
];

export default function StandalonePage() {
  return (
    <AppLayout
      title="Custom Page"
      showHeader={true}
      showBottomNav={true}
      showLogout={true}
      tabs={customTabs} // Use custom tabs or omit to hide bottom nav
    >
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Standalone Page Example</Text>
          <Text style={styles.description}>
            This page demonstrates how to use the reusable AppLayout component 
            outside of the (tabs) directory structure.
          </Text>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Features:</Text>
            <Text style={styles.bullet}>• Reusable header with logout</Text>
            <Text style={styles.bullet}>• Optional bottom navigation</Text>
            <Text style={styles.bullet}>• Customizable tabs</Text>
            <Text style={styles.bullet}>• Consistent styling</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Usage Options:</Text>
            <Text style={styles.bullet}>• showHeader=false to hide header</Text>
            <Text style={styles.bullet}>• showBottomNav=false to hide navigation</Text>
            <Text style={styles.bullet}>• showLogout=false to hide logout button</Text>
            <Text style={styles.bullet}>• Custom tabs array for different navigation</Text>
          </View>
        </View>
      </ScrollView>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  bullet: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    marginLeft: 10,
  },
}); 