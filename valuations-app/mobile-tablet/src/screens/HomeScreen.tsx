import React, { useState } from 'react';
import { View, Text, StyleSheet, Button, ActivityIndicator, Alert } from 'react-native';
import * as Updates from 'expo-updates';
import { homeScreenStyles } from '../../app/GlobalStyles';

const HomeScreen = () => {
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleCheckUpdate = async () => {
    setChecking(true);
    setResult(null);
    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        await Updates.fetchUpdateAsync();
        Alert.alert('Update Available', 'A new update was found and will be applied now. The app will reload.');
        Updates.reloadAsync();
      } else {
        setResult('No update available.');
      }
    } catch (e: any) {
      setResult('Error checking for update: ' + (e?.message || e));
    } finally {
      setChecking(false);
    }
  };

  return (
    <View style={homeScreenStyles.container}>
      <Text style={homeScreenStyles.title}>Welcome to Valuations App</Text>
      <Text style={homeScreenStyles.subtitle}>Your property valuation companion</Text>
      <View style={{ marginTop: 32 }}>
        <Button title="Check for Updates" onPress={handleCheckUpdate} disabled={checking} />
        {checking && <ActivityIndicator style={{ marginTop: 8 }} />}
        {result && <Text style={{ marginTop: 8 }}>{result}</Text>}
      </View>
    </View>
  );
};

export default HomeScreen; 