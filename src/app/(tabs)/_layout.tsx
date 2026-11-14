import { Ionicons } from '@expo/vector-icons';
import { router, Tabs, usePathname } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme';

type IconName = keyof typeof Ionicons.glyphMap;

/**
 * 固定的 Tab 配置：name 对应 (tabs) 下的文件名，href 是 expo-router 的文件路由地址
 * （分组目录 (tabs) 不出现在 URL 中）。
 */
const TABS: { name: string; label: string; href: string; icon: IconName; iconActive: IconName }[] = [
  { name: 'summary', label: '摘要', href: '/summary', icon: 'stats-chart-outline', iconActive: 'stats-chart' },
  { name: 'goals', label: '目标库', href: '/goals', icon: 'locate-outline', iconActive: 'locate' },
  { name: 'tasks', label: '习惯', href: '/tasks', icon: 'list-outline', iconActive: 'list' },
  { name: 'profile', label: '我的', href: '/profile', icon: 'person-outline', iconActive: 'person' },
];

export const unstable_settings = {
  initialRouteName: 'goals',
};

function CustomTabBar() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 8) + 6 }]}>
      {pathname === '/tasks' && (
        <TouchableOpacity style={styles.fab} activeOpacity={0.85} onPress={() => router.push('/task/edit')}>
          <Ionicons name="add" size={30} color="#fff" />
        </TouchableOpacity>
      )}
      <View style={styles.bar}>
        {TABS.map((tab) => {
          const focused = pathname === tab.href;
          const onPress = () => {
            if (focused) return;
            router.push(tab.href);
          };
          return (
            <TouchableOpacity
              key={tab.name}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              onPress={onPress}
              style={styles.tab}
              activeOpacity={0.8}
            >
              <View style={[styles.tabInner, focused && styles.tabInnerActive]}>
                <Ionicons
                  name={focused ? tab.iconActive : tab.icon}
                  size={22}
                  color={focused ? colors.primary : colors.textTertiary}
                />
                <Text style={[styles.label, focused && styles.labelActive]}>{tab.label}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} backBehavior="initialRoute" tabBar={() => <CustomTabBar />}>
      <Tabs.Screen name="summary" options={{ title: '摘要' }} />
      <Tabs.Screen name="goals" options={{ title: '目标库' }} />
      <Tabs.Screen name="tasks" options={{ title: '习惯' }} />
      <Tabs.Screen name="profile" options={{ title: '我的' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
  },
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 28,
    padding: 6,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  tab: { flex: 1 },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 20,
    gap: 2,
  },
  tabInnerActive: { backgroundColor: colors.primaryLight },
  label: { fontSize: 11, color: colors.textTertiary, fontWeight: '500' },
  labelActive: { color: colors.primary, fontWeight: '600' },
  fab: {
    alignSelf: 'flex-end',
    marginBottom: 12,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
});
