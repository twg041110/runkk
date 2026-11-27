/**
 * 코스 상세 (Figma: 러닝 시작 - 코스 정하기 - 여의도 한바퀴)
 *
 * - 위쪽 지도: 코스 경로(회색)와 "출발" 표시, 왼쪽 위에 순환 · 왕복 배지
 * - 이름(+ 추천), 출발하는 곳 · 내 위치에서 거리, 거리 · 예상 시간 · 지형 카드
 * - 그냥 완주하기: 위치를 확인하고(use-location-check) 바로 카운트다운으로 가요. 목표 = 코스 길이
 * - 목표 시간 정하기: 목표 시간 화면(/run/course-time)으로 가요.
 */
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChevronLeftIcon, ChevronRightIcon, CloseIcon, PlayIcon } from '@/components/common/icons';
import { RunMap } from '@/components/run/run-map';
import { findCourse } from '@/constants/courses';
import { Palette } from '@/constants/theme';
import { useLocationCheck } from '@/hooks/use-location-check';
import { formatFromMe, useMyPosition } from '@/hooks/use-my-position';
import { useRunSession } from '@/hooks/use-run-session';

export default function CourseDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const course = findCourse(id);
  const me = useMyPosition();
  const { setGoal, setCourse } = useRunSession();

  // 그냥 완주하기: 목표는 "코스 길이만큼 달리기" (시간 목표 없음)
  const { check, dialogs } = useLocationCheck(() => {
    if (!course) return;
    setCourse(course);
    setGoal({ distanceM: course.distanceM, timeSec: null });
    router.push('/run/countdown');
  });

  if (!course) return null; // 잘못된 주소로 들어온 경우

  const fromMe = formatFromMe(me, course.route[0]);

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

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <View>
          <RunMap points={[]} live={false} course={{ route: course.route, doneM: 0 }} />
          <Text style={styles.shapeBadge}>{course.shape} 코스</Text>
        </View>

        <View style={styles.titleBox}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{course.name}</Text>
            {course.recommended && <Text style={styles.badge}>추천</Text>}
          </View>
          <Text style={styles.place}>{[course.place, fromMe].filter(Boolean).join(' · ')}</Text>
        </View>

        <View style={styles.stats}>
          <Stat title="거리" value={(course.distanceM / 1000).toFixed(1)} unit="km" />
          <Stat title="예상 시간" before="약" value={String(course.minutes)} unit="분" />
          <Stat title="지형" value={course.terrain} />
        </View>

        <View style={styles.buttons}>
          <Pressable style={[styles.option, styles.optionMain]} onPress={check} accessibilityRole="button" accessibilityLabel="그냥 완주하기">
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>그냥 완주하기</Text>
              <Text style={styles.optionDesc}>시간 신경 쓰지 않고 코스만 따라가요</Text>
            </View>
            <View style={[styles.optionIcon, styles.optionIconDark]}>
              <PlayIcon color={Palette.accent} size={18} />
            </View>
          </Pressable>
          <Pressable
            style={styles.option}
            onPress={() => router.push({ pathname: '/run/course-time', params: { id: course.id } })}
            accessibilityRole="button"
            accessibilityLabel="목표 시간 정하기">
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>목표 시간 정하기</Text>
              <Text style={styles.optionDesc}>목표 페이스를 자동으로 계산해요</Text>
            </View>
            <View style={styles.optionIcon}>
              <ChevronRightIcon color={Palette.ink} size={20} />
            </View>
          </Pressable>
        </View>
      </ScrollView>

      {dialogs}
    </View>
  );
}

/** 거리 · 예상 시간 · 지형 작은 카드 */
function Stat({ title, value, unit, before }: { title: string; value: string; unit?: string; before?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statTitle}>{title}</Text>
      <View style={styles.statRow}>
        {before && <Text style={styles.statUnit}>{before}</Text>}
        <Text style={styles.statValue}>{value}</Text>
        {unit && <Text style={styles.statUnit}>{unit}</Text>}
      </View>
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
    flexGrow: 1,
    gap: 20,
    paddingTop: 8,
    paddingHorizontal: 24,
  },
  shapeBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    overflow: 'hidden',
    fontSize: 12,
    fontWeight: '700',
    color: Palette.surface,
    backgroundColor: 'rgba(28, 30, 34, 0.9)',
  },
  titleBox: {
    gap: 6,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    flexShrink: 1,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.6,
    color: Palette.ink,
  },
  badge: {
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 999,
    overflow: 'hidden',
    fontSize: 12,
    fontWeight: '700',
    color: Palette.ink,
    backgroundColor: Palette.accent,
  },
  place: {
    fontSize: 14,
    color: Palette.muted,
  },
  stats: {
    flexDirection: 'row',
    gap: 8,
  },
  stat: {
    flex: 1,
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
  },
  statTitle: {
    fontSize: 12,
    color: Palette.muted,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: Palette.ink,
  },
  statUnit: {
    marginBottom: 3,
    fontSize: 12,
    color: Palette.muted,
  },
  // 두 버튼은 화면 아래쪽에 붙여요 (내용이 짧을 때)
  buttons: {
    marginTop: 'auto',
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 18,
    paddingLeft: 22,
    paddingRight: 14,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
  },
  optionMain: {
    borderColor: Palette.accent,
    backgroundColor: Palette.accent,
  },
  optionText: {
    flex: 1,
    gap: 4,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Palette.ink,
  },
  optionDesc: {
    fontSize: 13,
    color: Palette.ink,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECEEF1',
  },
  optionIconDark: {
    backgroundColor: Palette.ink,
  },
});
