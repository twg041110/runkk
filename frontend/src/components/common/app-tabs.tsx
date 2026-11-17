import {
  TabList,
  TabListProps,
  TabSlot,
  TabTrigger,
  TabTriggerSlotProps,
  Tabs,
} from 'expo-router/ui';
import { StatusBar } from 'expo-status-bar';
import type { ComponentRef, ComponentType, Ref } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CommunityIcon, CourseIcon, CrewIcon, FriendsIcon, HomeIcon, PlayIcon } from '@/components/common/icons';
import { Palette } from '@/constants/theme';

export default function AppTabs() {
  return (
    <>
      {/* 화면 배경이 항상 밝은색이라 다크 모드에서도 상태바 글자를 어둡게 둔다 */}
      <StatusBar style="dark" />
      <Tabs style={styles.fill}>
        <TabSlot style={styles.fill} />
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
            <TabTrigger name="crew" href="/crew" asChild>
              <TabButton label="크루" Icon={CrewIcon} />
            </TabTrigger>
            {/* 피그마에서 '내 정보'는 탭이 아니라 홈 상단 버튼으로 들어간다. 주소만 살려 두고 탭 바에는 안 보이게 한다 */}
            <TabTrigger name="profile" href="/profile" style={styles.hidden} />
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

// RN 0.88의 엄격한 타입에서는 expo-router가 주는 ref 타입이 Pressable과 달라서 Pressable 기준으로 맞춘다
type TriggerProps = Omit<TabTriggerSlotProps, 'ref'> & { ref?: Ref<ComponentRef<typeof Pressable>> };

type TabButtonProps = TriggerProps & {
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

// 홈에 있을 때는 '러닝 시작', 다른 탭에 있을 때는 '홈' 버튼이 된다 (피그마 기준)
function RunButton({ isFocused, ...props }: TriggerProps) {
  return (
    <View style={styles.cell}>
      <Pressable {...props} style={[styles.runButton, !isFocused && styles.runButtonIdle]}>
        {isFocused ? <PlayIcon color={Palette.background} /> : <HomeIcon color={Palette.white} />}
        <Text style={styles.runLabel}>{isFocused ? '러닝 시작' : '홈'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  // 웹에서 탭 화면이 내용 길이만큼 늘어나지 않고 화면 높이에 맞도록 고정한다
  fill: {
    flex: 1,
  },
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
    width: 68,
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
  hidden: {
    display: 'none',
  },
  runLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.background,
  },
});