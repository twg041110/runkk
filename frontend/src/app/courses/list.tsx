import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Chip, EmptyState, QueryView, SubScreen, TopBar, useToast } from '@/components/common/ui';
import { CourseCard } from '@/components/course/course-card';
import { Palette } from '@/constants/theme';
import { describeFilter, filterCourses, filterFromParams } from '@/data/course-filter';
import { useAuth } from '@/hooks/use-auth';
import { PURPOSES, useCourses, useSavedCourses, type Course, type Purpose } from '@/lib/courses';
import { josa } from '@/utils/josa';

// 코스 목록 한 화면으로 4가지를 보여준다:
// kind=purpose 목적별 추천 / hot 핫플 코스 / filter 필터 결과 / saved 저장한 코스
export default function CourseListScreen() {
  const params = useLocalSearchParams<{ kind?: string; purpose?: string }>();
  const kind = params.kind ?? 'purpose';
  const [purpose, setPurpose] = useState<Purpose>((params.purpose as Purpose) || '초보 추천');
  const toast = useToast();
  const { me } = useAuth();
  const all = useCourses();
  const savedQuery = useSavedCourses(kind === 'saved' && !!me);
  const query = kind === 'saved' ? savedQuery : all;

  const titles: Record<string, string> = { hot: '핫플 코스', filter: '필터 결과', saved: '저장한 코스' };
  const title = titles[kind] ?? '목적별 추천';

  const pickList = (courses: Course[]): { courses: Course[]; caption: string } => {
    if (kind === 'hot') {
      return {
        courses: [...courses].sort((a, b) => b.weeklyRunners - a.weeklyRunners || b.reviewCount - a.reviewCount),
        caption: '이번 주 러너가 많이 달린 순서예요',
      };
    }
    if (kind === 'filter') {
      const filter = filterFromParams(params);
      return { courses: filterCourses(courses, filter), caption: describeFilter(filter).join(' · ') || '조건 없음' };
    }
    if (kind === 'saved') return { courses, caption: '' };
    return { courses: courses.filter((course) => course.purposes.includes(purpose)), caption: '' };
  };

  return (
    <SubScreen header={<TopBar title={title} />} overlay={toast.node}>
      {kind === 'purpose' ? (
        <View style={styles.tabs}>
          {PURPOSES.map((item) => (
            <Chip key={item} label={item} size="lg" selected={item === purpose} onPress={() => setPurpose(item)} />
          ))}
        </View>
      ) : null}

      {kind === 'saved' && !me ? (
        <EmptyState
          title="로그인하면 코스를 저장할 수 있어요"
          message="마음에 드는 코스를 모아 두고 나중에 바로 달려 보세요"
        />
      ) : (
        <QueryView query={query}>
          {(data) => {
            const { courses, caption } = pickList(data);
            if (courses.length === 0) {
              return kind === 'saved' ? (
                <EmptyState
                  title="저장한 코스가 없어요"
                  message={'마음에 드는 코스의 책갈피를 누르면\n여기에 모아 둘 수 있어요'}
                  action={{ label: '코스 둘러보기', onPress: () => router.dismissTo('/course') }}
                />
              ) : (
                <EmptyState
                  title="맞는 코스가 없어요"
                  message={kind === 'filter' ? '필터 조건을 줄여서 다시 찾아보세요' : '다른 목적을 골라 보세요'}
                />
              );
            }
            return (
              <>
                <Text style={styles.count}>
                  코스 {courses.length}개{caption ? ` · ${caption}` : ''}
                </Text>
                {courses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    onError={toast.show}
                    onSaved={(c, on) => toast.show(on ? `${josa(c.name, '을', '를')} 저장했어요` : '저장을 취소했어요')}
                  />
                ))}
              </>
            );
          }}
        </QueryView>
      )}
    </SubScreen>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: 8 },
  count: { fontSize: 13, color: Palette.muted },
});
