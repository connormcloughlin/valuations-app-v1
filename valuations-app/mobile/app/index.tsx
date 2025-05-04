import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../utils/i18n';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState<string | null>(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialize i18n with error handling
        try {
          await i18n.initI18n();
          console.log('i18n initialized successfully');
        } catch (i18nError) {
          console.error('Error initializing i18n:', i18nError);
          // Continue with app initialization even if i18n fails
        }
        
        // Check for ongoing survey
        const activeSurvey = await AsyncStorage.getItem('@active_survey');
        
        // Determine initial route
        if (activeSurvey) {
          try {
            // Parse the active survey to get its ID
            const surveyData = JSON.parse(activeSurvey);
            const surveyId = surveyData?.id || 'new';
            console.log('Active survey ID:', surveyId);
            setInitialRoute(`/survey/${surveyId}`);
          } catch (parseError) {
            console.error('Error parsing active survey:', parseError);
            setInitialRoute('/survey/categories');
          }
        } else {
          setInitialRoute('/survey/categories');
        }
      } catch (error) {
        console.error('Initialization error:', error);
        setInitialRoute('/survey/categories');
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4a90e2" />
      </View>
    );
  }

  return <Redirect href={(initialRoute || '/survey/categories') as any} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
}); 