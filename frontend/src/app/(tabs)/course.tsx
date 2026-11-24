import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FilterIcon, PlaySmallIcon, RefreshIcon, SearchIcon } from '@/components/common/icons';
import {
  Button,
  Card,
  Chip,
  EmptyState,
  IconButton,
  LoadingBlock,
  QueryView,
  SectionTitle,
  Sheet,
  TabHeader,
  Tag,
  shared,
  useToast,
} from '@/components/common/ui';
import { CourseCard } from '@/components/course/course-card';
import { CourseMap } from '@/components/course/course-map';
import { LevelColors, Palette } from '@/constants/theme';
import { josa } from '@/utils/josa';
import { useAuth } from '@/hooks/use-auth';
import {
  PURPOSES,
  levelFromRuns,
  townsFromRuns,
  useCourses,
  useMyRuns,
  type Course,
  type Purpose,
} from '@/lib/courses';
import { emptyFilter, filterCourses, filterToParams, type CourseFilter } from '@/data/course-filter';

const MONTH = new Date().getMonth() + 1;

/** 이달의 추천: 내 레벨에 맞는 코스 중 이번 주 러너가 많고 별점이 높은 코스 */
function pickCourse(courses: Course[], level: '초급' | '중급' | '숙련자') {
  const target = level === '숙련자' ? '상급' : level;
  const ranked = [...courses].sort(
    (a, b) => b.weeklyRunners - a.weeklyRunners || b.rating - a.rating || b.reviewCount - a.reviewCount,
  );
  return ranked.find((c) => c.level === target) ?? ranked[0];
}

export default function CourseScreen() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { me } = useAuth();
  const [purpose, setPurpose] = useState<Purpose>('초보 추천');
  const [filterOpen, setFilterOpen] = useState(false);
  const [levelOpen, setLevelOpen] = useState(false);

  const coursesQuery = useCourses();
  const runsQuery = useMyRuns(!!me);
  const courses = coursesQuery.data ?? [];
  const myLevel = levelFromRuns(runsQuery.data);
  const pick = courses.length ? pickCourse(courses, myLevel.level) : undefined;
  const purposeCourses = courses.filter((course) => course.purposes.includes(purpose)).slice(0, 2);
  const hotCourses = [...courses]
    .sort((a, b) => b.weeklyRunners - a.weeklyRunners || b.reviewCount - a.reviewCount)
    .slice(0, 2);
  const town = townsFromRuns(runsQuery.data)[0];

  const onSaved = (course: Course, saved: boolean) => {
    if (saved) {
      toast.show(`${josa(course.name, '을', '를')} 저장했어요`, { label: '보기', onPress: () => router.push('/courses/saved') });
    } else {
      toast.show('저장을 취소했어요');
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[shared.tabContent, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}>
        <TabHeader
          title="코스 추천"
          caption="내 기록에 맞춘 코스를 골라보세요"
          right={
            <>
              <IconButton label="필터" onPress={() => setFilterOpen(true)}>
                <FilterIcon color={Palette.ink} />
              </IconButton>
              <IconButton label="코스 검색" onPress={() => router.push('/courses/search')}>
                <SearchIcon color={Palette.ink} />
              </IconButton>
            </>
          }
        />

        {/* 이달의 추천 코스 */}
        <QueryView query={coursesQuery} loading={<LoadingBlock height={220} count={1} />}>
          {() =>
            pick ? (
        <View style={styles.pick}>
          <View style={shared.rowBetween}>
            <Text style={styles.pickLabel}>{MONTH}월의 추천 코스</Text>
            <Pressable
              onPress={() => setLevelOpen(true)}
              style={styles.levelChip}
              accessibilityRole="button"
              accessibilityLabel="내 레벨 안내 보기">
              <Text style={styles.levelChipText}>내 레벨 · {myLevel.level}</Text>
            </Pressable>
          </View>
          <Pressable
            onPress={() => router.push(`/courses/${pick.id}`)}
            style={styles.pickRow}
            accessibilityRole="button">
            <View style={styles.pickText}>
              <Text style={styles.pickName}>{pick.name}</Text>
              <Text style={styles.pickSummary}>{pick.summary}</Text>
              <View style={styles.pickTags}>
                {[`${pick.distanceKm}km`, `약 ${pick.minutes}분`, pick.tag].map((label) => (
                  <View key={label} style={styles.darkTag}>
                    <Text style={styles.darkTagText}>{label}</Text>
                  </View>
                ))}
              </View>
            </View>
            <CourseMap shape={pick.shape} />
          </Pressable>
          <Button
            label="이 코스로 달리기"
            tone="lime"
            height={48}
            radius={14}
            icon={(color) => <PlaySmallIcon color={color} />}
            onPress={() => router.push({ pathname: '/run', params: { courseId: pick.id } })}
          />
        </View>
            ) : (
              <EmptyState title="아직 등록된 코스가 없어요" message="코스가 준비되면 여기에서 추천해 드릴게요" compact />
            )
          }
        </QueryView>

        {/* 목적별 추천 */}
        <View style={styles.section}>
          <SectionTitle
            title="목적별 추천"
            caption="목적에 맞게 골라보세요"
            onMore={() => router.push({ pathname: '/courses/list', params: { kind: 'purpose', purpose } })}
          />
          <View style={styles.tabs}>
            {PURPOSES.map((item) => (
              <Chip key={item} label={item} size="lg" selected={item === purpose} onPress={() => setPurpose(item)} />
            ))}
          </View>
          {purposeCourses.map((course) => (
            <CourseCard key={course.id} course={course} onSaved={onSaved} onError={toast.show} />
          ))}
          {coursesQuery.data && purposeCourses.length === 0 ? (
            <EmptyState title={`${purpose} 코스가 아직 없어요`} message="다른 목적을 골라 보세요" compact />
          ) : null}
        </View>

        {/* 핫플 코스 */}
        <View style={styles.section}>
          <SectionTitle
            title="핫플 코스"
            caption="이번 주 러너가 몰린 곳"
            onMore={() => router.push({ pathname: '/courses/list', params: { kind: 'hot' } })}
          />
          {hotCourses.map((course) => (
            <CourseCard key={course.id} course={course} onSaved={onSaved} onError={toast.show} />
          ))}
        </View>

        {/* 동네 기록 */}
        <View style={styles.section}>
          <SectionTitle
            title="동네 기록"
            caption="이번 달 내가 달린 동네"
            onMore={town ? () => router.push('/courses/towns') : undefined}
          />
          {town ? (
            <Card onPress={() => router.push('/courses/towns')} style={styles.townCard}>
              <CourseMap shape={town.shape} />
              <View style={styles.townText}>
                <Tag label="가장 많이 달린 동네" />
                <Text style={styles.townName}>{town.name}</Text>
                <Text style={styles.townMeta}>
                  {town.runs}번 · {town.km}km 달렸어요
                </Text>
                <Text style={styles.townCourse}>자주 달린 코스 · {town.course}</Text>
              </View>
            </Card>
          ) : (
            <Card style={styles.townEmpty}>
              <Text style={styles.townName}>{me ? '아직 동네 기록이 없어요' : '로그인하면 동네 기록이 쌓여요'}</Text>
              <Text style={styles.townMeta}>
                {me ? '코스를 골라 달리면 그 동네에 기록이 쌓여요' : '코스를 골라 달린 기록을 동네별로 모아 보여 드려요'}
              </Text>
            </Card>
          )}
        </View>
      </ScrollView>

      <FilterSheet
        courses={courses}
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        onApply={(filter) => {
          setFilterOpen(false);
          router.push({ pathname: '/courses/list', params: { kind: 'filter', ...filterToParams(filter) } });
        }}
      />
      <LevelSheet visible={levelOpen} onClose={() => setLevelOpen(false)} myLevel={myLevel} signedIn={!!me} />
      {toast.node}
    </View>
  );
}

const DISTANCE = ['전체', '3km 이하', '3~5km', '5~10km', '10km 이상'] as const;
const TIME = ['30분 이하', '30분~1시간', '1시간 이상'] as const;
const TERRAIN = ['평지 위주', '완만한 언덕', '업힐 포함'] as const;
const AMENITY = ['화장실', '급수대', '가로등 많음', '주차장'] as const;

function FilterSheet({
  courses,
  visible,
  onClose,
  onApply,
}: {
  courses: Course[];
  visible: boolean;
  onClose: () => void;
  onApply: (filter: CourseFilter) => void;
}) {
  const [filter, setFilter] = useState<CourseFilter>(emptyFilter);
  const count = useMemo(() => filterCourses(courses, filter).length, [courses, filter]);
  const toggleOne = <K extends 'time' | 'terrain'>(key: K, value: CourseFilter[K]) =>
    setFilter((f) => ({ ...f, [key]: f[key] === value ? null : value }));

  return (
    <Sheet visible={visible} onClose={onClose}>
      <Text style={shared.sheetTitle}>필터</Text>
      <FilterGroup label="거리">
        {DISTANCE.map((item) => (
          <Chip
            key={item}
            label={item}
            size="sm"
            selected={filter.distance === item}
            onPress={() => setFilter((f) => ({ ...f, distance: item }))}
          />
        ))}
      </FilterGroup>
      <FilterGroup label="소요 시간">
        {TIME.map((item) => (
          <Chip key={item} label={item} size="sm" selected={filter.time === item} onPress={() => toggleOne('time', item)} />
        ))}
      </FilterGroup>
      <FilterGroup label="지형">
        {TERRAIN.map((item) => (
          <Chip
            key={item}
            label={item}
            size="sm"
            selected={filter.terrain === item}
            onPress={() => toggleOne('terrain', item)}
          />
        ))}
      </FilterGroup>
      <FilterGroup label="편의시설">
        {AMENITY.map((item) => (
          <Chip
            key={item}
            label={item}
            size="sm"
            selected={filter.amenities.includes(item)}
            onPress={() =>
              setFilter((f) => ({
                ...f,
                amenities: f.amenities.includes(item)
                  ? f.amenities.filter((a) => a !== item)
                  : [...f.amenities, item],
              }))
            }
          />
        ))}
      </FilterGroup>
      <View style={styles.sheetButtons}>
        <Button
          label="초기화"
          tone="outline"
          height={52}
          icon={(color) => <RefreshIcon color={color} size={18} />}
          onPress={() => setFilter(emptyFilter)}
        />
        <Button
          label={count > 0 ? `코스 ${count}개 보기` : '맞는 코스가 없어요'}
          tone="dark"
          height={52}
          flex
          disabled={count === 0}
          onPress={() => onApply(filter)}
        />
      </View>
    </Sheet>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.filterGroup}>
      <Text style={shared.fieldLabel}>{label}</Text>
      <View style={styles.chipWrap}>{children}</View>
    </View>
  );
}

const LEVELS = [
  { level: '초급' as const, rule: '1회 평균 5km 미만' },
  { level: '중급' as const, rule: '1회 평균 5~10km' },
  { level: '숙련자' as const, rule: '1회 평균 10km 이상' },
];

function LevelSheet({
  visible,
  onClose,
  myLevel,
  signedIn,
}: {
  visible: boolean;
  onClose: () => void;
  myLevel: ReturnType<typeof levelFromRuns>;
  signedIn: boolean;
}) {
  const MY_LEVEL = myLevel;
  const next =
    MY_LEVEL.level === '초급'
      ? `평균 ${(5 - MY_LEVEL.averageKm).toFixed(1)}km만 더 길게 달리면 중급이 돼요`
      : MY_LEVEL.level === '중급'
        ? `평균 ${(10 - MY_LEVEL.averageKm).toFixed(1)}km만 더 길게 달리면 숙련자가 돼요`
        : '가장 높은 레벨이에요';
  return (
    <Sheet visible={visible} onClose={onClose}>
      <View>
        <Text style={shared.sheetTitle}>내 레벨은 기록으로 정해져요</Text>
        <Text style={shared.sheetCaption}>최근 4주 동안 한 번에 달린 평균 거리로 정해요</Text>
      </View>
      <View style={styles.levelCard}>
        <View style={styles.levelHead}>
          <Text style={styles.levelBig}>{MY_LEVEL.level}</Text>
          <Text style={styles.levelAvg}>
            {MY_LEVEL.runCount > 0 ? `1회 평균 ${MY_LEVEL.averageKm}km` : '최근 4주 기록 없음'}
          </Text>
        </View>
        <Text style={styles.levelNext}>
          {!signedIn
            ? '로그인하고 달리면 내 기록으로 레벨을 정해 드려요'
            : MY_LEVEL.runCount > 0
              ? next
              : '달리기를 기록하면 평균 거리로 레벨이 정해져요'}
        </Text>
      </View>
      <View style={styles.levelList}>
        {LEVELS.map((row) => {
          const colors = row.level === '숙련자' ? LevelColors.상급 : LevelColors[row.level];
          const mine = row.level === MY_LEVEL.level;
          return (
            <View key={row.level} style={[styles.levelRow, mine && styles.levelRowMine]}>
              <Tag label={row.level} bg={colors.bg} color={colors.text} bold />
              <Text style={styles.levelRule}>{row.rule}</Text>
              {mine ? <Text style={styles.levelNow}>지금</Text> : null}
            </View>
          );
        })}
      </View>
      <Text style={shared.label12}>매주 월요일, 최근 4주 기록으로 다시 계산해요</Text>
      <Button label="확인" tone="dark" height={52} onPress={onClose} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Palette.background },
  pick: { backgroundColor: Palette.darkCard, borderRadius: 22, padding: 20, gap: 14 },
  pickLabel: { fontSize: 13, fontWeight: '500', color: Palette.darkText },
  levelChip: { backgroundColor: Palette.accent, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  levelChipText: { fontSize: 12, fontWeight: '700', color: Palette.ink },
  pickRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  pickText: { flex: 1, gap: 6 },
  pickName: { fontSize: 22, fontWeight: '900', color: Palette.white },
  pickSummary: { fontSize: 12, color: Palette.darkText },
  pickTags: { flexDirection: 'row', gap: 6 },
  darkTag: { backgroundColor: Palette.darkLine, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  darkTagText: { fontSize: 12, fontWeight: '500', color: Palette.white },
  section: { gap: 10 },
  tabs: { flexDirection: 'row', gap: 8 },
  townCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  townText: { flex: 1, gap: 5 },
  townName: { fontSize: 16, fontWeight: '700', color: Palette.ink },
  townMeta: { fontSize: 13, color: Palette.muted },
  townCourse: { fontSize: 12, fontWeight: '500', color: Palette.inkSoft },
  townEmpty: { gap: 6, padding: 16 },
  filterGroup: { gap: 10 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sheetButtons: { flexDirection: 'row', gap: 10, marginTop: 4 },
  levelCard: { backgroundColor: Palette.background, borderRadius: 18, padding: 18, gap: 8 },
  levelHead: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  levelBig: { fontSize: 26, fontWeight: '900', color: Palette.ink },
  levelAvg: { fontSize: 13, fontWeight: '500', color: Palette.muted },
  levelNext: { fontSize: 13, fontWeight: '500', color: Palette.ink },
  levelList: { gap: 8 },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12 },
  levelRowMine: { backgroundColor: Palette.accentSoft },
  levelRule: { flex: 1, fontSize: 13, fontWeight: '500', color: Palette.ink },
  levelNow: { fontSize: 12, fontWeight: '700', color: Palette.ink },
});
