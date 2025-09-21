import React from 'react';
import { StyleSheet, ActivityIndicator, View, Text } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Button } from 'react-native-paper';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { DashboardHeader } from '../../components/dashboard/DashboardHeader';
import { StatsCards } from '../../components/dashboard/StatsCards';
import { TodaysAppointments } from '../../components/dashboard/TodaysAppointments';
import { SurveysInProgress } from '../../components/dashboard/SurveysInProgress';
import { DevelopmentTools } from '../../components/dashboard/DevelopmentTools';
import { dashboardStyles } from '../GlobalStyles';
import { useAuth } from '../../context/AuthContext';
import { useDashboard } from '../../context/DashboardContext';
import { getGlobalRefreshFunction } from '../../utils/dashboardRefresh';
import { prefetchService } from '../../services/prefetchService';
import { PrefetchProgressIndicator } from '../../components/PrefetchProgressIndicator';

export default function Dashboard() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const dashboardContext = useDashboard();
  
  // Get the global refresh function
  const globalRefreshFunction = getGlobalRefreshFunction();
  
  // Debug: Log the refresh function status
  console.log('📊 Dashboard: Global refresh function type:', typeof globalRefreshFunction, 'value:', globalRefreshFunction);

  // Add a state to track if we should wait for refresh function
  const [waitingForRefreshFunction, setWaitingForRefreshFunction] = React.useState(false);
  const [prefetchTriggered, setPrefetchTriggered] = React.useState(false);

  // Background prefetch function
  const startBackgroundPrefetch = React.useCallback(async () => {
    if (prefetchTriggered || !isAuthenticated || !user) {
      return;
    }

    try {
      console.log('🚀 Starting background prefetch for dashboard...');
      setPrefetchTriggered(true);

      // Load all category configurations on app startup (SQLite-based)
      console.log('🔄 Loading all category configurations on app startup...');
      const prefetchService = await import('../../services/prefetchService');
      setTimeout(async () => {
        await prefetchService.default.loadAllCategoryConfigurationsOnStartup();
      }, 1000); // Start after 1 second

      // Removed startup prefetch - now using appointment-based prefetch only
      console.log('📦 Skipping startup prefetch - using appointment-based prefetch instead');
    } catch (error) {
      console.error('❌ Error starting background prefetch:', error);
    }
  }, [isAuthenticated, user, prefetchTriggered]);

  // Refresh dashboard stats when the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 Dashboard screen focused, refreshing stats...');
      
      // Start background prefetch after a delay
      setTimeout(() => {
        startBackgroundPrefetch();
      }, 3000); // Start prefetch 3 seconds after dashboard loads
      
      // Add a small delay to allow context updates to propagate
      setTimeout(() => {
              // Get the current refresh function from global
      const currentRefreshStats = getGlobalRefreshFunction();
      
      // If refresh function is not available, set waiting state and retry
      if (!currentRefreshStats || typeof currentRefreshStats !== 'function') {
        console.log('⏳ Refresh function not available after delay, setting up retry mechanism...');
        setWaitingForRefreshFunction(true);
        
        // Retry every 200ms for up to 2 seconds
        let retryCount = 0;
        const maxRetries = 10;
        const retryInterval = setInterval(() => {
          retryCount++;
          console.log(`🔄 Retry ${retryCount}/${maxRetries} for refresh function...`);
          
          const retryRefreshStats = getGlobalRefreshFunction();
          if (retryRefreshStats && typeof retryRefreshStats === 'function') {
            console.log('✅ Refresh function now available, executing refresh');
            clearInterval(retryInterval);
            setWaitingForRefreshFunction(false);
            retryRefreshStats();
          } else if (retryCount >= maxRetries) {
            console.log('⚠️ Refresh function still not available after all retries');
            clearInterval(retryInterval);
            setWaitingForRefreshFunction(false);
          }
        }, 200);
      } else {
        console.log('✅ Refresh function available after delay, executing refresh');
        currentRefreshStats();
      }
      }, 100); // Small delay to allow context updates
    }, [startBackgroundPrefetch])
  );

  const navigateToAppointment = (id: string, status: 'scheduled' | 'inProgress' | 'completed') => {
    // Route to different screens based on appointment status
    if (status === 'scheduled') {
      router.push({
        pathname: '/survey/[id]',
        params: { id }
      });
    } else if (status === 'inProgress') {
      router.push({
        pathname: '/survey/[id]',
        params: { id }
      });
    } else {
      router.push({
        pathname: '/survey/summary/[id]',
        params: { id }
      });
    }
  };

  const navigateToAppointmentDetails = (id: string) => {
    // Navigate to survey view for appointment details
    router.push({
      pathname: '/survey/[id]',
      params: { id }
    });
  };

  const handleCardPress = (cardType: 'scheduled' | 'inProgress' | 'completed' | 'finalise' | 'sync') => {
    switch (cardType) {
      case 'scheduled':
        router.push('/(tabs)/appointments/scheduled');
        break;
      case 'inProgress':
        router.push('/(tabs)/appointments/in-progress');
        break;
      case 'completed':
        router.push('/(tabs)/appointments/completed');
        break;
      case 'finalise':
        router.push('/(tabs)/appointments/finalise');
        break;
      case 'sync':
        router.push('/sync');
        break;
    }
  };

  // Show loading while auth is checking
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={{ marginTop: 16, fontSize: 16, color: '#666' }}>
          Checking authentication...
        </Text>
      </View>
    );
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated || !user) {
    console.log('🔐 Dashboard: User not authenticated, showing login prompt');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <DashboardHeader />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 18, marginBottom: 20, textAlign: 'center', color: '#666' }}>
            Please sign in to access the dashboard
          </Text>
          <Button mode="contained" onPress={() => router.push('/login')}>
            Sign In
          </Button>
        </View>
      </View>
    );
  }

  console.log('🔐 Dashboard: User authenticated, rendering dashboard components');

  console.log('📊 Dashboard: About to render StatsCards component');
  console.log('🔧 Dashboard: __DEV__ =', __DEV__);
  
     return (
     <>
       <ScrollView style={dashboardStyles.container}>
         <DashboardHeader />
         <StatsCards onCardPress={handleCardPress} />
         <TodaysAppointments onAppointmentPress={navigateToAppointmentDetails} shouldFetchData={true} />
         <SurveysInProgress onSurveyPress={(id) => navigateToAppointment(id, 'inProgress')} shouldFetchData={true} />
         
         {/* Debug info */}
         {__DEV__ && (
           <View style={{ padding: 20, backgroundColor: '#f0f0f0', margin: 10, borderRadius: 8 }}>
             <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#333' }}>
               🔧 Debug Info
             </Text>
             <Text style={{ fontSize: 14, color: '#666' }}>
               __DEV__: {String(__DEV__)}
             </Text>
             <Text style={{ fontSize: 14, color: '#666' }}>
               NODE_ENV: {process.env.NODE_ENV || 'undefined'}
             </Text>
           </View>
         )}
         
         <DevelopmentTools />
         
         {/* Manual refresh button for testing */}
         {__DEV__ && (
           <View style={{ padding: 20, alignItems: 'center' }}>
             <Button 
               mode="outlined" 
               onPress={() => {
                 console.log('🔄 Manual refresh triggered');
                 const refreshFn = getGlobalRefreshFunction();
                 if (refreshFn && typeof refreshFn === 'function') {
                   console.log('✅ Manual refresh function available, executing');
                   refreshFn();
                 } else {
                   console.log('⚠️ Manual refresh function not available, will retry...');
                   // Use the same retry mechanism as useFocusEffect
                   let retryCount = 0;
                   const maxRetries = 5;
                   const retryInterval = setInterval(() => {
                     retryCount++;
                     const currentRefreshFn = getGlobalRefreshFunction();
                     if (currentRefreshFn && typeof currentRefreshFn === 'function') {
                       console.log('✅ Manual refresh function now available, executing');
                       clearInterval(retryInterval);
                       currentRefreshFn();
                     } else if (retryCount >= maxRetries) {
                       console.log('⚠️ Manual refresh function still not available after retries');
                       clearInterval(retryInterval);
                     }
                   }, 200);
                 }
               }}
               style={{ marginTop: 10 }}
             >
               Refresh Dashboard Stats
             </Button>
           </View>
         )}
       </ScrollView>
       
       {/* Background Prefetch Progress Indicator */}
       <PrefetchProgressIndicator 
         visible={true} 
         style={{ 
           position: 'absolute', 
           bottom: 20, 
           left: 20, 
           right: 20,
           zIndex: 1000 
         }} 
       />
     </>
   );
}
