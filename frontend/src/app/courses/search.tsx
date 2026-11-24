import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ChevronLeftIcon, CloseIcon, SearchIcon } from '@/components/common/icons';
import { Chip, EmptyState, IconButton, LoadingBlock, SubScreen, useToast } from '@/components/common/ui';
import { CourseCard } from '@/components/course/course-card';
import { Palette } from '@/constants/theme';
import { useCourses } from '@/lib/courses';

// 최근 검색어는 앱을 켜 둔 동안만 기억한다
let recentMemory: string[] = [];

export default function CourseSearchScreen() {
  const [query, setQuery] = useState('');
  const [recent, setRecentState] = useState(recentMemory);
  const setRecent = (update: (list: string[]) => string[]) =>
    setRecentState((list) => (recentMemory = update(list)));
  const toast = useToast();
  const coursesQuery = useCourses();
  const courses = coursesQuery.data ?? [];
  const q = query.trim();
  const results = q
    ? courses.filter((course) =>
        `${course.name} ${course.town} ${course.start} ${course.tag} ${course.features.join(' ')}`.includes(q),
      )
    : [];
  const popular = [...courses]
    .sort((a, b) => b.weeklyRunners - a.weeklyRunners || b.reviewCount - a.reviewCount)
    .slice(0, 5);

  const search = (text: string) => {
    setQuery(text);
    if (text.trim()) setRecent((list) => [text.trim(), ...list.filter((item) => item !== text.trim())].slice(0, 5));
  };

  return (
    <SubScreen
      overlay={toast.node}
      header={
        <View style={styles.bar}>
          <IconButton label="뒤로" onPress={() => router.back()} style={styles.back}>
            <ChevronLeftIcon color={Palette.ink} />
          </IconButton>
          <View style={styles.input}>
            <SearchIcon color={Palette.hint} size={20} />
            <TextInput
              style={styles.inputText}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={() => search(query)}
              placeholder="코스나 동네 이름으로 검색"
              placeholderTextColor={Palette.hint}
              returnKeyType="search"
              autoFocus
            />
            {query ? (
              <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel="검색어 지우기">
                <CloseIcon color={Palette.hint} size={18} />
              </Pressable>
            ) : null}
          </View>
        </View>
      }>
      {q ? (
        results.length > 0 ? (
          <>
            <Text style={styles.count}>코스 {results.length}개</Text>
            {results.map((course) => (
              <CourseCard key={course.id} course={course} onError={toast.show} />
            ))}
          </>
        ) : (
          <EmptyState title="검색 결과가 없어요" message={'다른 동네 이름이나\n코스 이름으로 찾아보세요'} />
        )
      ) : (
        <>
          {recent.length > 0 ? (
            <View style={styles.block}>
              <View style={styles.rowBetween}>
                <Text style={styles.heading}>최근 검색어</Text>
                <Pressable onPress={() => setRecent(() => [])} hitSlop={8}>
                  <Text style={styles.clear}>전체 삭제</Text>
                </Pressable>
              </View>
              <View style={styles.chips}>
                {recent.map((item) => (
                  <Chip key={item} label={item} onPress={() => search(item)} />
                ))}
              </View>
            </View>
          ) : null}
          <View style={styles.block}>
            <Text style={styles.heading}>이번 주 인기 코스</Text>
            {popular.length > 0 ? (
              <View style={styles.rankCard}>
                {popular.map((course, index) => (
                  <Pressable
                    key={course.id}
                    onPress={() => router.push(`/courses/${course.id}`)}
                    style={[styles.rankRow, index > 0 && styles.rankBorder]}
                    accessibilityRole="button">
                    <Text style={styles.rankNo}>{index + 1}</Text>
                    <Text style={styles.rankName} numberOfLines={1}>
                      {course.name}
                    </Text>
                    <Text style={styles.rankTown}>{course.town}</Text>
                  </Pressable>
                ))}
              </View>
            ) : coursesQuery.loading ? (
              <LoadingBlock height={220} count={1} />
            ) : (
              <Text style={styles.count}>{coursesQuery.error ?? '아직 등록된 코스가 없어요'}</Text>
            )}
          </View>
        </>
      )}
    </SubScreen>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  back: { backgroundColor: Palette.white },
  input: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.white,
  },
  inputText: { flex: 1, fontSize: 15, color: Palette.ink },
  count: { fontSize: 13, color: Palette.muted },
  block: { gap: 12 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heading: { fontSize: 15, fontWeight: '700', color: Palette.ink },
  clear: { fontSize: 12, color: Palette.muted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  rankCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
    paddingHorizontal: 17,
  },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
  rankBorder: { borderTopWidth: 1, borderTopColor: Palette.divider },
  rankNo: { width: 14, fontSize: 15, fontWeight: '900', color: Palette.ink },
  rankName: { flex: 1, fontSize: 15, fontWeight: '500', color: Palette.ink },
  rankTown: { fontSize: 12, color: Palette.muted },
});
