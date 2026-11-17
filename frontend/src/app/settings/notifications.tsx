/**
 * 알림 설정 (Figma: 알림 설정, 알림 설정 - 방해 금지 시간)
 * 들어오는 곳: 설정 → 알림 설정
 *
 * - "푸시 알림 받기"를 끄면 아래 알림 스위치가 모두 흐려지고 누를 수 없어요.
 *   (세부 값은 지우지 않고 남겨 둬서, 다시 켜면 예전 값 그대로 돌아와요)
 * - 방해 금지 시간을 누르면 아래에서 시트가 올라와 시작·종료 시각을 골라요.
 */
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomSheet } from '@/components/common/bottom-sheet';
import { ScreenHeader } from '@/components/common/screen-header';
import { WheelPicker } from '@/components/common/wheel-picker';
import { SettingRow, SettingSection } from '@/components/settings/setting-list';
import { Palette } from '@/constants/theme';
import { formatTime, useSettings, type NotifyKey, type Time } from '@/hooks/use-settings';

export default function NotificationSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { settings, update } = useSettings();
  const [sheetOpen, setSheetOpen] = useState(false); // 방해 금지 시트가 열려 있는지

  const off = !settings.pushEnabled; // 전체 알림이 꺼져 있으면 true

  // 알림 하나를 켜고 끄는 함수. 다른 알림 값은 그대로 두고 key 하나만 바꿔요.
  const toggle = (key: NotifyKey, next: boolean) =>
    update({ notify: { ...settings.notify, [key]: next } });

  // 같은 모양의 스위치 줄을 짧게 쓰려고 만든 도우미 함수
  const row = (key: NotifyKey, title: string, description?: string) => (
    <SettingRow
      title={title}
      description={description}
      switchValue={settings.notify[key]}
      onSwitch={(next) => toggle(key, next)}
      disabled={off}
    />
  );

  return (
    <View style={styles.screen}>
      <ScreenHeader title="알림 설정" />

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <SettingSection>
          <SettingRow
            title="푸시 알림 받기"
            description="끄면 모든 알림을 받지 않아요"
            switchValue={settings.pushEnabled}
            onSwitch={(next) => update({ pushEnabled: next })}
          />
        </SettingSection>

        <SettingSection title="친구">
          {row('friendRequest', '친구 요청')}
          {row('runInvite', '같이 달리기 초대')}
        </SettingSection>

        <SettingSection title="크루">
          {row('crewSchedule', '모임 일정')}
          {row('crewNotice', '공지')}
          {row('crewMember', '가입 승인 · 새 멤버')}
        </SettingSection>

        <SettingSection title="커뮤니티">
          {row('comment', '댓글 · 답글')}
          {row('like', '좋아요')}
          {row('hotPost', 'HOT 게시글 선정')}
        </SettingSection>

        <SettingSection title="러닝">
          {row('bestRecord', '최고기록 갱신')}
          {row('weeklyGoal', '주간 목표 알림', '목표까지 남은 거리를 알려줘요')}
        </SettingSection>

        <SettingSection title="방해 금지">
          <SettingRow
            title="방해 금지 시간"
            value={`${formatTime(settings.quietStart)} ~ ${formatTime(settings.quietEnd)}`}
            onPress={() => setSheetOpen(true)}
            disabled={off}
          />
        </SettingSection>
      </ScrollView>

      <BottomSheet visible={sheetOpen} onClose={() => setSheetOpen(false)}>
        {/* key: 시트를 열 때마다 새로 만들어서, 저장 안 하고 닫았던 값이 남지 않게 해요 */}
        <QuietHoursPicker
          key={String(sheetOpen)}
          start={settings.quietStart}
          end={settings.quietEnd}
          onSave={(start, end) => {
            update({ quietStart: start, quietEnd: end });
            setSheetOpen(false);
          }}
        />
      </BottomSheet>
    </View>
  );
}

// ───────────────────────── 방해 금지 시간 고르기 (시트 안 내용) ─────────────────────────

const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const MINUTES = [0, 10, 20, 30, 40, 50];

// 24시간 ↔ 오전/오후 12시간 바꾸기. 예: 22시 → 오후 10시, 0시 → 오전 12시
const isPm = (t: Time) => t.hour >= 12;
const hour12 = (t: Time) => (t.hour % 12 === 0 ? 12 : t.hour % 12);
const toHour24 = (pm: boolean, h12: number) => (h12 % 12) + (pm ? 12 : 0);
const label = (t: Time) =>
  `${isPm(t) ? '오후' : '오전'} ${hour12(t)}:${String(t.minute).padStart(2, '0')}`;

function QuietHoursPicker({
  start,
  end,
  onSave,
}: {
  start: Time;
  end: Time;
  onSave: (start: Time, end: Time) => void;
}) {
  // 시트 안에서 고르는 중인 값. "저장"을 눌러야 진짜 설정에 들어가요.
  const [draft, setDraft] = useState({ start, end });
  const [editing, setEditing] = useState<'start' | 'end'>('start'); // 지금 고르는 쪽
  const time = draft[editing];

  // 고르는 쪽(시작/종료)의 시각만 바꿔요
  const setTime = (next: Time) => setDraft({ ...draft, [editing]: next });

  return (
    <View style={pickerStyles.wrap}>
      <Text style={pickerStyles.title}>방해 금지 시간</Text>
      <Text style={pickerStyles.subtitle}>이 시간에는 알림이 소리 없이 와요</Text>

      {/* 시작 / 종료 칸. 누른 쪽이 검정 테두리로 바뀌고, 아래 칸에서 그 시각을 골라요 */}
      <View style={pickerStyles.tabs}>
        {(['start', 'end'] as const).map((which) => (
          <Pressable
            key={which}
            style={[pickerStyles.tab, editing === which && pickerStyles.tabActive]}
            onPress={() => setEditing(which)}
            accessibilityRole="button">
            <Text style={pickerStyles.tabLabel}>{which === 'start' ? '시작' : '종료'}</Text>
            <Text style={[pickerStyles.tabValue, editing !== which && pickerStyles.tabValueIdle]}>
              {label(draft[which])}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* 오전/오후 · 시 · 분 세 칸짜리 휠. 위아래로 굴려서 가운데 띠에 맞춰 골라요.
          (휠 부품: components/common/wheel-picker.tsx) */}
      <WheelPicker
        columns={[
          {
            items: ['오전', '오후'],
            selected: isPm(time) ? '오후' : '오전',
            onSelect: (v) => setTime({ ...time, hour: toHour24(v === '오후', hour12(time)) }),
          },
          {
            items: HOURS.map(String),
            selected: String(hour12(time)),
            onSelect: (v) => setTime({ ...time, hour: toHour24(isPm(time), Number(v)) }),
          },
          {
            items: MINUTES.map((m) => String(m).padStart(2, '0')),
            selected: String(time.minute).padStart(2, '0'),
            onSelect: (v) => setTime({ ...time, minute: Number(v) }),
          },
        ]}
      />

      <Pressable
        style={pickerStyles.save}
        onPress={() => onSave(draft.start, draft.end)}
        accessibilityRole="button">
        <Text style={pickerStyles.saveLabel}>저장</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  content: {
    gap: 20,
    paddingTop: 8,
    paddingHorizontal: 20,
  },
});

const pickerStyles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Palette.ink,
  },
  subtitle: {
    fontSize: 13,
    color: Palette.muted,
  },
  tabs: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  tab: {
    flex: 1,
    gap: 2,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: '#E9EBF0',
  },
  tabActive: {
    borderColor: Palette.ink,
    backgroundColor: Palette.surface,
  },
  tabLabel: {
    fontSize: 11,
    color: Palette.hint,
  },
  tabValue: {
    fontSize: 17,
    fontWeight: '700',
    color: Palette.ink,
  },
  tabValueIdle: {
    color: Palette.muted,
  },
  save: {
    height: 56,
    marginTop: 8,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.ink,
  },
  saveLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.background,
  },
});
