/**
 * 코스 목표 시간 정하기 (Figma: 러닝 시작 - 코스 정하기 - 여의도 한바퀴 - 목표 시간 정하기)
 *
 * - 시간 · 분 · 초 휠로 목표 시간을 골라요. 처음 값은 코스 예상 시간이에요.
 * - 목표 페이스 = 목표 시간 ÷ 코스 거리 (자동 계산)
 * - 이 목표로 시작하기: 위치를 확인하고 카운트다운으로 가요. 목표 = 코스 길이 + 목표 시간
 *   (러닝 중에는 목표 러닝처럼 "목표보다 6초 앞서는 중"을 보여 줘요)
 */
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChevronLeftIcon, CloseIcon, PlayIcon } from '@/components/common/icons';
import { WheelPicker } from '@/components/common/wheel-picker';
import { findCourse } from '@/constants/courses';
import { Palette } from '@/constants/theme';
import { useLocationCheck } from '@/hooks/use-location-check';
import { useRunSession } from '@/hooks/use-run-session';
import { formatKoreanDuration, formatPaceSec } from '@/utils/run-format';

const HOUR_ITEMS = Array.from({ length: 6 }, (_, i) => String(i)); // 0 ~ 5시간
const MIN_ITEMS = Array.from({ length: 60 }, (_, i) => String(i)); // 0 ~ 59분
const SEC_ITEMS = Array.from({ length: 6 }, (_, i) => String(i * 10).padStart(2, '0')); // 00 ~ 50초

export default function CourseTimeScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const course = findCourse(id);
  const { setGoal, setCourse } = useRunSession();
  const [timeSec, setTimeSec] = useState((course?.minutes ?? 30) * 60);

  const { check, dialogs } = useLocationCheck(() => {
    if (!course) return;
    setCourse(course);
    setGoal({ distanceM: course.distanceM, timeSec });
    router.push('/run/countdown');
  });

  if (!course) return null; // 잘못된 주소로 들어온 경우

  const h = Math.floor(timeSec / 3600);
  const m = Math.floor((timeSec % 3600) / 60);
  const s = timeSec % 60;
  const paceSec = timeSec > 0 ? timeSec / (course.distanceM / 1000) : null;
  const pace = paceSec ? formatPaceSec(paceSec) : `-'--"`;
  const paceKorean = paceSec ? `${Math.floor(Math.round(paceSec) / 60)}분 ${Math.round(paceSec) % 60}초` : '';

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <View style={styles.topBar}>
        <Pressable style={styles.iconButton} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="뒤로 가기">
          <ChevronLeftIcon color={Palette.ink} size={24} />
        </Pressable>
        <Pressable style={styles.iconButton} onPress={() => router.dismissTo('/')} accessibilityRole="button" accessibilityLabel="닫기">
          <CloseIcon color={Palette.ink} size={22} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}>
        <View style={styles.titleBox}>
          <Text style={styles.title}>목표 시간 정하기</Text>
          <Text style={styles.subtitle}>
            {course.name} · {(course.distanceM / 1000).toFixed(1)}km
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>목표 시간</Text>
          <WheelPicker
            columns={[
              // 다른 칸 값은 "지금 값"(t)에서 꺼내요 (휠이 멈추기 전에 다른 휠이 바꾼 값을 덮어쓰지 않게)
              { items: HOUR_ITEMS, selected: String(h), onSelect: (v) => setTimeSec((t) => Number(v) * 3600 + (t % 3600)), unit: '시간' },
              { items: MIN_ITEMS, selected: String(m), onSelect: (v) => setTimeSec((t) => Math.floor(t / 3600) * 3600 + Number(v) * 60 + (t % 60)), unit: '분' },
              { items: SEC_ITEMS, selected: String(s).padStart(2, '0'), onSelect: (v) => setTimeSec((t) => t - (t % 60) + Number(v)), unit: '초' },
            ]}
          />
        </View>

        <View style={styles.paceCard}>
          <View style={styles.paceLeft}>
            <Text style={styles.paceLabel}>목표 페이스</Text>
            <Text style={styles.paceValue}>
              {pace}
              <Text style={styles.paceUnit}> /km</Text>
            </Text>
          </View>
          <Text style={styles.autoChip}>자동 계산</Text>
        </View>

        <Text style={styles.footnote}>
          {paceSec
            ? `1km를 ${paceKorean} 페이스로 달리면 약 ${formatKoreanDuration(timeSec)}에 완주해요`
            : '목표 시간을 골라 주세요'}
        </Text>
      </ScrollView>

      <Pressable
        style={[styles.startButton, { bottom: insets.bottom + 16 }, !paceSec && styles.startButtonOff]}
        onPress={check}
        disabled={!paceSec}
        accessibilityRole="button"
        accessibilityState={{ disabled: !paceSec }}
        accessibilityLabel="이 목표로 시작하기">
        <View style={styles.startTexts}>
          <Text style={styles.startTitle}>이 목표로 시작하기</Text>
          <Text style={styles.startSummary}>{paceSec ? `${formatKoreanDuration(timeSec)} · 페이스 ${pace}/km` : '목표 시간을 골라 주세요'}</Text>
        </View>
        <View style={styles.startIcon}>
          <PlayIcon color={Palette.accent} size={18} />
        </View>
      </Pressable>

      {dialogs}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    gap: 16,
    paddingHorizontal: 24,
  },
  titleBox: {
    gap: 6,
    marginTop: 12,
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.6,
    color: Palette.ink,
  },
  subtitle: {
    fontSize: 14,
    color: Palette.muted,
  },
  card: {
    gap: 8,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
  },
  cardLabel: {
    alignSelf: 'center',
    fontSize: 12,
    color: Palette.muted,
  },
  paceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
  },
  paceLeft: {
    gap: 4,
  },
  paceLabel: {
    fontSize: 12,
    color: Palette.muted,
  },
  paceValue: {
    fontSize: 30,
    fontWeight: '800',
    color: Palette.ink,
  },
  paceUnit: {
    fontSize: 14,
    fontWeight: '500',
    color: Palette.muted,
  },
  autoChip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    overflow: 'hidden',
    fontSize: 12,
    color: Palette.muted,
    backgroundColor: '#ECEEF1',
  },
  footnote: {
    fontSize: 12,
    color: Palette.hint,
  },
  startButton: {
    position: 'absolute',
    left: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingLeft: 22,
    paddingRight: 14,
    borderRadius: 24,
    backgroundColor: Palette.accent,
  },
  startButtonOff: {
    backgroundColor: '#E4E7EC',
  },
  startTexts: {
    flex: 1,
    gap: 2,
  },
  startTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Palette.ink,
  },
  startSummary: {
    fontSize: 13,
    color: Palette.ink,
  },
  startIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.ink,
  },
});
