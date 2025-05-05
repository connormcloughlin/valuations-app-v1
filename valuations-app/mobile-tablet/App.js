import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import api from './api';
import ConnectionStatus from './components/ConnectionStatus';
import connectionUtils from './utils/connectionUtils';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [isOffline, setIsOffline] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  
  // Update offline status
  useEffect(() => {
    const checkIsOffline = async () => {
      const online = await connectionUtils.updateConnectionStatus();
      setIsOffline(!online);
    };
    
    checkIsOffline();
    
    // Check again if it's offline every 30 seconds
    const intervalId = setInterval(checkIsOffline, 30000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Fetch templates to demonstrate offline capability
  useEffect(() => {
    async function fetchTemplates() {
      try {
        setLoading(true);
        setError(null);
        setFromCache(false);
        
        console.log('Fetching risk templates...');
        const response = await api.getRiskTemplates();
        
        // Check if the data is from cache
        if (response.fromCache) {
          setFromCache(true);
          console.log('Using cached template data');
        } else {
          console.log('Using fresh template data from server');
        }
        
        if (response.success && response.data) {
          setTemplates(response.data);
        } else {
          setError('Failed to load templates: ' + response.message);
        }
      } catch (err) {
        console.error('Error fetching templates:', err);
        setError('An error occurred while fetching data');
      } finally {
        setLoading(false);
      }
    }
    
    fetchTemplates();
  }, []);
  
  // Function to clear cached data
  const clearCache = async () => {
    try {
      setLoading(true);
      await api.clearAllCachedData();
      setTemplates([]);
      setFromCache(false);
      alert('Cache cleared successfully');
    } catch (e) {
      console.error('Error clearing cache:', e);
      alert('Failed to clear cache');
    } finally {
      setLoading(false);
    }
  };
  
  // Function to refresh data
  const refreshData = async () => {
    try {
      setLoading(true);
      setError(null);
      setFromCache(false);
      
      console.log('Refreshing risk templates...');
      const response = await api.getRiskTemplates();
      
      // Check if the data is from cache
      if (response.fromCache) {
        setFromCache(true);
        console.log('Using cached template data');
      } else {
        console.log('Using fresh template data from server');
      }
      
      if (response.success && response.data) {
        setTemplates(response.data);
      } else {
        setError('Failed to load templates: ' + response.message);
      }
    } catch (err) {
      console.error('Error refreshing templates:', err);
      setError('An error occurred while refreshing data');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <PaperProvider>
      <SafeAreaView style={styles.container}>
        <ConnectionStatus showOffline={true} showOnline={true} />
        
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Risk Templates</Text>
          {(isOffline || fromCache) && (
            <View style={styles.offlineIndicator}>
              <MaterialCommunityIcons 
                name="cloud-off-outline" 
                size={16} 
                color="#e74c3c" 
              />
              <Text style={styles.offlineText}>
                {isOffline ? 'Offline Mode' : 'Using Cached Data'}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.refreshButton]}
            onPress={refreshData}
            disabled={loading}
          >
            <MaterialCommunityIcons name="refresh" size={16} color="#fff" />
            <Text style={styles.buttonText}>Refresh Data</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.clearButton]}
            onPress={clearCache}
            disabled={loading}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={16} color="#fff" />
            <Text style={styles.buttonText}>Clear Cache</Text>
          </TouchableOpacity>
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#27ae60" />
            <Text style={styles.loadingText}>Loading templates...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#e74c3c" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={[styles.button, styles.retryButton]}
              onPress={refreshData}
            >
              <Text style={styles.buttonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView style={styles.scrollView}>
            {templates.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="file-document-outline" size={48} color="#bdc3c7" />
                <Text style={styles.emptyText}>No templates available</Text>
                <Text style={styles.emptySubtext}>Pull to refresh or check your connection</Text>
              </View>
            ) : (
              templates.map((template, index) => (
                <View key={index} style={styles.templateCard}>
                  <MaterialCommunityIcons name="file-document-outline" size={24} color="#27ae60" />
                  <View style={styles.templateInfo}>
                    <Text style={styles.templateName}>
                      {template.templatename || template.name || 'Unnamed Template'}
                    </Text>
                    <Text style={styles.templateId}>
                      ID: {template.risktemplateid || template.templateid || template.id || 'Unknown'}
                    </Text>
                    {template.description && (
                      <Text style={styles.templateDescription} numberOfLines={2}>
                        {template.description}
                      </Text>
                    )}
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        )}
        
        <StatusBar style="auto" />
      </SafeAreaView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffeded',
    padding: 6,
    borderRadius: 4,
  },
  offlineText: {
    fontSize: 12,
    color: '#e74c3c',
    marginLeft: 4,
  },
  buttonsContainer: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-between',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    minWidth: 150,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 6,
  },
  refreshButton: {
    backgroundColor: '#3498db',
  },
  clearButton: {
    backgroundColor: '#e74c3c',
  },
  retryButton: {
    backgroundColor: '#3498db',
    marginTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7f8c8d',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    marginTop: 16,
    marginBottom: 16,
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  templateCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  templateInfo: {
    marginLeft: 12,
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  templateId: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
  },
  templateDescription: {
    fontSize: 14,
    color: '#34495e',
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
  },
}); 