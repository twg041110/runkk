import {
  TabList,
  TabListProps,
  TabSlot,
  TabTrigger,
  TabTriggerSlotProps,
  Tabs,
} from 'expo-router/ui';
import { StatusBar } from 'expo-status-bar';
import type { ComponentType } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CommunityIcon, CourseIcon, FriendsIcon, PlayIcon, ProfileIcon } from '@/components/icons';
import { Palette } from '@/constants/theme';

export default function AppTabs() {
  return (
    <>
      {/* 화면 배경이 항상 밝은색이라 다크 모드에서도 상태바 글자를 어둡게 둔다 */}
      <StatusBar style="dark" />
      <Tabs>
        <TabSlot />
        <TabList asChild>
          <TabBar>
            <TabTrigger name="community" href="/community" asChild>
              <TabButton label="커뮤니티" Icon={CommunityIcon} />
            </TabTrigger>
            <TabTrigger name="course" href="/course" asChild>
              <TabButton label="코스 추천" Icon={CourseIcon} />
            </TabTrigger>
            <TabTrigger name="index" href="/" asChild>
              <RunButton />
            </TabTrigger>
            <TabTrigger name="friends" href="/friends" asChild>
              <TabButton label="친구와 러닝" Icon={FriendsIcon} />
            </TabTrigger>
            <TabTrigger name="profile" href="/profile" asChild>
              <TabButton label="내 정보" Icon={ProfileIcon} />
            </TabTrigger>
          </TabBar>
        </TabList>
      </Tabs>
    </>
  );
}

function TabBar(props: TabListProps) {
  const insets = useSafeAreaInsets();
  return <View {...props} style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 18) }]} />;
}

type TabButtonProps = TabTriggerSlotProps & {
  label: string;
  Icon: ComponentType<{ color: string }>;
};

function TabButton({ label, Icon, isFocused, ...props }: TabButtonProps) {
  const color = isFocused ? Palette.background : Palette.muted;
  return (
    <Pressable {...props} style={styles.cell}>
      <View style={[styles.tab, isFocused && styles.tabFocused]}>
        <Icon color={color} />
        <Text style={[styles.tabLabel, { color }]} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

function RunButton({ isFocused, ...props }: TabTriggerSlotProps) {
  return (
    <View style={styles.cell}>
      <Pressable {...props} style={[styles.runButton, !isFocused && styles.runButtonIdle]}>
        <PlayIcon color={Palette.background} />
        <Text style={styles.runLabel}>러닝 시작</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingTop: 8,
    paddingHorizontal: 6,
    backgroundColor: Palette.surface,
    borderTopWidth: 1,
    borderTopColor: '#E2E5EA',
  },
  cell: {
    flex: 1,
    alignItems: 'center',
  },
  tab: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 14,
  },
  tabFocused: {
    backgroundColor: Palette.ink,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  runButton: {
    width: 80,
    height: 80,
    marginTop: -25,
    borderRadius: 40,
    borderWidth: 5,
    borderColor: Palette.surface,
    backgroundColor: Palette.ink,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    boxShadow: '0px 10px 22px -8px rgba(28, 30, 34, 0.55)',
  },
  runButtonIdle: {
    backgroundColor: Palette.muted,
  },
  runLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.background,
  },
});