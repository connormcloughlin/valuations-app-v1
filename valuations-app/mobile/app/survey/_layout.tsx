import { Stack } from 'expo-router';

export default function SurveyLayout() {
  return (
    <Stack>
      <Stack.Screen name="selector" options={{ headerShown: true, title: 'Select Assessment Type' }} />
      <Stack.Screen name="categories" options={{ headerShown: true, title: 'Assessment Categories' }} />
      <Stack.Screen name="items" options={{ headerShown: true, title: 'Assessment Items' }} />
      <Stack.Screen name="summary" options={{ headerShown: true, title: 'Survey Summary' }} />
      <Stack.Screen name="new" options={{ headerShown: true, title: 'New Survey' }} />
      <Stack.Screen name="index" options={{ headerShown: true, title: 'Survey' }} />
      <Stack.Screen name="[id]" options={{ headerShown: true, title: 'Survey Details' }} />
    </Stack>
  );
} 