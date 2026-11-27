import {
  TabList,
  TabListProps,
  TabSlot,
  TabTrigger,
  TabTriggerSlotProps,
  Tabs,
} from 'expo-router/ui';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, type ComponentRef, type ComponentType, type Ref } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CommunityIcon, CourseIcon, FlagIcon, FriendsIcon, PlayIcon } from '@/components/common/icons';
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
            <TabTrigger name="crew" href="/crew" asChild>
              <TabButton label="크루" Icon={FlagIcon} />
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

// 가운데 버튼: 다른 탭에서 누르면 홈으로 오고, 홈에서 누르면 러닝 시작 화면을 열어요
// 러닝 시작 화면은 이 버튼의 검은 원 자리에서부터 원이 커지면서 나타나요 (components/run/circle-reveal.tsx)
function RunButton({ isFocused, onPress, ...props }: TriggerProps) {
  const cellRef = useRef<ComponentRef<typeof View>>(null);

  const openRun = () => {
    // 버튼 칸의 화면 위치를 재서 검은 원의 가운데를 구해요 (원은 칸 위쪽으로 25 튀어나와 있고 지름 80)
    cellRef.current?.measureInWindow((x, y, width) => {
      router.push({ pathname: '/run', params: { rx: String(x + width / 2), ry: String(y - 25 + 40) } });
    });
  };

  return (
    <View ref={cellRef} style={styles.cell}>
      <Pressable
        {...props}
        onPress={
          isFocused
            ? (e) => {
                e.preventDefault(); // 웹에서 버튼이 홈 링크라서, 링크로 이동하지 않게 막아요
                openRun();
              }
            : onPress
        }
        style={[styles.runButton, !isFocused && styles.runButtonIdle]}>
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