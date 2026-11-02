import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { colors } from '../../theme';

const TAB_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  summary: 'stats-chart',
  goals: 'disc',
  tasks: 'calendar',
  profile: 'person',
};

// 默认进入「任务」Tab
export const unstable_settings = {
  initialRouteName: 'tasks',
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
        tabBarIcon: ({ color, size }) => (
          <Ionicons
            name={TAB_ICONS[route.name] ?? 'ellipse'}
            size={size}
            color={color as string}
          />
        ),
      })}
    >
      <Tabs.Screen name="summary" options={{ title: '摘要' }} />
      <Tabs.Screen name="goals" options={{ title: '目标库' }} />
      <Tabs.Screen name="tasks" options={{ title: '任务' }} />
      <Tabs.Screen name="profile" options={{ title: '我的' }} />
    </Tabs>
  );
}
