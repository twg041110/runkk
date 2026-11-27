/**
 * 코스 정하기 — 코스 목록 (Figma: 러닝 시작 - 코스 정하기)
 *
 * - 거리 칩(전체 · 5km 이하 · 5~10km · 10km 이상)으로 코스를 걸러요.
 * - 카드: 작은 경로 그림, 이름(+ 추천), 거리 · 예상 시간, 지형 · 내 위치에서 출발점까지 거리
 * - 카드를 누르면 코스 상세(/run/course-detail)로 가요.
 *
 * TODO(API): 코스는 지금 constants/courses.ts의 예시 3개예요. GET /api/courses 로 바꿔요.
 */
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from '@/components/common/icons';
import { RouteThumb } from '@/components/run/route-thumb';
import { COURSES, type Course } from '@/constants/courses';
import { Palette } from '@/constants/theme';
import { formatFromMe, useMyPosition } from '@/hooks/use-my-position';

const FILTERS = [
  { label: '전체', test: () => true },
  { label: '5km 이하', test: (km: number) => km <= 5 },
  { label: '5~10km', test: (km: number) => km > 5 && km <= 10 },
  { label: '10km 이상', test: (km: number) => km > 10 },
];

export default function CourseListScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState(0);
  const me = useMyPosition();
  const shown = COURSES.filter((c) => FILTERS[filter].test(c.distanceM / 1000));

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
        <View style={styles.titleBox}>
          <Text style={styles.title}>코스 정하기</Text>
          <Text style={styles.subtitle}>추천 코스 {COURSES.length}개</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {FILTERS.map((f, i) => (
            <Pressable
              key={f.label}
              style={[styles.chip, i === filter && styles.chipOn]}
              onPress={() => setFilter(i)}
              accessibilityRole="button"
              accessibilityState={{ selected: i === filter }}>
              <Text style={[styles.chipText, i === filter && styles.chipTextOn]}>{f.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {shown.map((c) => (
          <CourseCard key={c.id} course={c} fromMe={formatFromMe(me, c.route[0])} />
        ))}
        {shown.length === 0 && <Text style={styles.empty}>이 거리의 코스는 아직 없어요</Text>}
      </ScrollView>
    </View>
  );
}

function CourseCard({ course, fromMe }: { course: Course; fromMe: string | null }) {
  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push({ pathname: '/run/course-detail', params: { id: course.id } })}
      accessibilityRole="button"
      accessibilityLabel={course.name}>
      <RouteThumb route={course.route} />
      <View style={styles.cardText}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {course.name}
          </Text>
          {course.recommended && <Text style={styles.badge}>추천</Text>}
        </View>
        <Text style={styles.meta}>
          {(course.distanceM / 1000).toFixed(1)}km · 약 {course.minutes}분
        </Text>
        <Text style={styles.metaSub}>{[course.terrain, fromMe].filter(Boolean).join(' · ')}</Text>
      </View>
      <ChevronRightIcon color={Palette.hint} size={20} />
    </Pressable>
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
    gap: 12,
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
  chips: {
    gap: 8,
    paddingBottom: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
  },
  chipOn: {
    borderColor: Palette.accent,
    backgroundColor: Palette.accent,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.muted,
  },
  chipTextOn: {
    fontWeight: '800',
    color: Palette.ink,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
  },
  cardText: {
    flex: 1,
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    flexShrink: 1,
    fontSize: 16,
    fontWeight: '800',
    color: Palette.ink,
  },
  badge: {
    flexShrink: 0, // 이름이 길어도 배지는 줄어들지 않게 (이름이 대신 … 으로 줄어요)
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 999,
    overflow: 'hidden',
    fontSize: 11,
    fontWeight: '700',
    color: Palette.ink,
    backgroundColor: Palette.accent,
  },
  meta: {
    fontSize: 13,
    color: Palette.muted,
  },
  metaSub: {
    fontSize: 12,
    color: Palette.muted,
  },
  empty: {
    paddingVertical: 40,
    textAlign: 'center',
    fontSize: 14,
    color: Palette.hint,
  },
});
