import { Stack } from 'expo-router';
import React from 'react';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="goal/edit" options={{ presentation: 'modal' }} />
      <Stack.Screen name="goal/detail" options={{ presentation: 'card' }} />
      <Stack.Screen name="goal/kr" options={{ presentation: 'card' }} />
      <Stack.Screen name="task/edit" options={{ presentation: 'modal' }} />
      <Stack.Screen name="calendar" options={{ presentation: 'card' }} />
    </Stack>
  );
}
