import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BookmarkIcon, StarIcon } from '@/components/common/icons';
import { Tag } from '@/components/common/ui';
import { CourseMap } from '@/components/course/course-map';
import { LevelColors, Palette } from '@/constants/theme';
import type { Course } from '@/data/courses';
import { actions, useAppStore } from '@/hooks/use-app-store';

/** 목록용 코스 카드 (지도 썸네일 · 배지 · 이름 · 거리 · 별점 · 저장) */
export function CourseCard({ course, onSaved }: { course: Course; onSaved?: (course: Course, saved: boolean) => void }) {
  const saved = useAppStore((s) => s.savedCourses).includes(course.id);
  const level = LevelColors[course.level];
  // 카드 누르기(상세로)와 저장 버튼을 나란히 둔다. 버튼 안에 버튼이 들어가지 않게 하기 위해서다.
  return (
    <View style={styles.card}>
      <Pressable
        onPress={() => router.push(`/courses/${course.id}`)}
        style={({ pressed }) => [styles.main, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`${course.name}, ${course.distanceKm}킬로미터`}>
        <CourseMap shape={course.shape} />
      <View style={styles.body}>
        <View style={styles.tags}>
          <Tag label={course.level} bg={level.bg} color={level.text} bold />
          <Tag label={course.tag} />
        </View>
        <Text style={styles.name} numberOfLines={1}>
          {course.name}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {course.distanceKm}km · 약 {course.minutes}분 · 고도 +{course.elevation}m
        </Text>
        <View style={styles.ratingRow}>
          <StarIcon />
          <Text style={styles.rating} numberOfLines={1}>
            {course.rating} · 이번 주 {course.weeklyRunners}명이 달렸어요
          </Text>
        </View>
      </View>
      </Pressable>
      <Pressable
        onPress={() => {
          actions.toggleSavedCourse(course.id);
          onSaved?.(course, !saved);
        }}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={saved ? '저장 취소' : '코스 저장'}>
        <BookmarkIcon color={saved ? Palette.ink : Palette.hint} filled={saved} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
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
  main: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14 },
  pressed: { opacity: 0.8 },
  body: { flex: 1, gap: 5 },
  tags: { flexDirection: 'row', gap: 6 },
  name: { fontSize: 16, fontWeight: '700', color: Palette.ink },
  meta: { fontSize: 13, color: Palette.muted },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rating: { fontSize: 12, fontWeight: '500', color: Palette.inkSoft, flexShrink: 1 },
});
