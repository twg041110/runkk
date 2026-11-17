import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Chip, EmptyState, SubScreen, TopBar, useToast } from '@/components/common/ui';
import { CourseCard } from '@/components/course/course-card';
import { Palette } from '@/constants/theme';
import { josa } from '@/utils/josa';
import { describeFilter, filterCourses, filterFromParams } from '@/data/course-filter';
import { COURSES, PURPOSES, type Course, type Purpose } from '@/data/courses';
import { useAppStore } from '@/hooks/use-app-store';

// 코스 목록 한 화면으로 4가지를 보여준다:
// kind=purpose 목적별 추천 / hot 핫플 코스 / filter 필터 결과 / saved 저장한 코스
export default function CourseListScreen() {
  const params = useLocalSearchParams<{ kind?: string; purpose?: string }>();
  const kind = params.kind ?? 'purpose';
  const [purpose, setPurpose] = useState<Purpose>((params.purpose as Purpose) || '초보 추천');
  const saved = useAppStore((s) => s.savedCourses);
  const toast = useToast();

  let title = '목적별 추천';
  let courses: Course[] = [];
  let caption = '';
  if (kind === 'hot') {
    title = '핫플 코스';
    courses = [...COURSES].sort((a, b) => b.weeklyRunners - a.weeklyRunners);
    caption = '이번 주 러너가 많이 달린 순서예요';
  } else if (kind === 'filter') {
    title = '필터 결과';
    const filter = filterFromParams(params);
    courses = filterCourses(filter);
    caption = describeFilter(filter).join(' · ') || '조건 없음';
  } else if (kind === 'saved') {
    title = '저장한 코스';
    courses = COURSES.filter((course) => saved.includes(course.id));
  } else {
    courses = COURSES.filter((course) => course.purposes.includes(purpose));
  }

  return (
    <SubScreen header={<TopBar title={title} />} overlay={toast.node}>
      {kind === 'purpose' ? (
        <View style={styles.tabs}>
          {PURPOSES.map((item) => (
            <Chip key={item} label={item} size="lg" selected={item === purpose} onPress={() => setPurpose(item)} />
          ))}
        </View>
      ) : null}
      {courses.length > 0 ? (
        <Text style={styles.count}>
          코스 {courses.length}개{caption ? ` · ${caption}` : ''}
        </Text>
      ) : null}
      {courses.map((course) => (
        <CourseCard
          key={course.id}
          course={course}
          onSaved={(c, on) => toast.show(on ? `${josa(c.name, '을', '를')} 저장했어요` : '저장을 취소했어요')}
        />
      ))}
      {courses.length === 0 ? (
        kind === 'saved' ? (
          <EmptyState title="저장한 코스가 없어요" message={'마음에 드는 코스의 책갈피를 누르면\n여기에 모아 둘 수 있어요'} />
        ) : (
          <EmptyState title="맞는 코스가 없어요" message="필터 조건을 줄여서 다시 찾아보세요" />
        )
      ) : null}
      {kind === 'saved' && courses.length === 0 ? (
        <Chip label="코스 둘러보기" selected onPress={() => router.dismissTo('/course')} style={styles.center} />
      ) : null}
    </SubScreen>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: 8 },
  count: { fontSize: 13, color: Palette.muted },
  center: { alignSelf: 'center' },
});
