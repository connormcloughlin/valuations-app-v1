import { Link, Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { logNavigation } from '../utils/logger';
import { notFoundStyles } from './GlobalStyles';

export default function NotFoundScreen() {
  logNavigation('Not Found Screen');
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <ThemedView style={notFoundStyles.container}>
        <ThemedText type="title">This screen doesn't exist.</ThemedText>
        <Link href="/" style={notFoundStyles.link}>
          <ThemedText type="link">Go to home screen!</ThemedText>
        </Link>
      </ThemedView>
    </>
  );
}
