import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';

export default function CombinedScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Combined View', headerShown: true }} />
      
      <View style={styles.container}>
        <Text style={styles.title}>Combined View Works!</Text>
        <Text style={styles.subtitle}>This is the combined categories and items view</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'green',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 30,
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 20,
    color: 'yellow',
    textAlign: 'center',
  },
}); 