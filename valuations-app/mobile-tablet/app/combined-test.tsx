import React, { useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView } from 'react-native';
import { Button } from 'react-native-paper';
import { Stack } from 'expo-router';

export default function CombinedTest() {
  console.log('NAVIGATION: combined-test screen loaded');
  
  const [count, setCount] = useState(0);
  
  return (
    <>
      <Stack.Screen options={{ title: 'New Combined Test', headerShown: true }} />
      
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>New Combined Test Screen</Text>
          <Text style={styles.subtitle}>Count: {count}</Text>
          
          <Button 
            mode="contained" 
            onPress={() => setCount(count + 1)}
            style={styles.button}
          >
            Increment Counter
          </Button>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'pink', // Distinctive color to make sure it's the new file
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 30,
  },
  button: {
    backgroundColor: 'purple',
    paddingHorizontal: 20,
  }
}); 