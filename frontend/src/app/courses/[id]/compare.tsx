import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PlaySmallIcon } from '@/components/common/icons';
import { Avatar, Button, Card, EmptyState, LoadingBlock, SubScreen, TopBar } from '@/components/common/ui';
import { Palette } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import type { CourseRecordDto } from '@/lib/api';
import { useCourse, useCourseRecords } from '@/lib/courses';
import { duration, pace } from '@/lib/format';

// 이 코스에서 나와 친구의 가장 빠른 기록을 비교한다 (기록은 서버의 러닝 기록에서 온다)
export default function CompareScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { me } = useAuth();
  const courseQuery = useCourse(id);
  const recordsQuery = useCourseRecords(id, !!me);
  const records = recordsQuery.data ?? [];
  const mine = records.find((r) => r.me) ?? null;
  const friends = records.filter((r) => !r.me);
  const [pickedId, setPickedId] = useState<number | null>(null);
  const other = friends.find((r) => r.member.memberId === pickedId) ?? friends[0];
  const course = courseQuery.data;

  if (!course || recordsQuery.loading) {
    return (
      <SubScreen header={<TopBar title="기록 비교" />}>
        <LoadingBlock height={160} count={2} />
      </SubScreen>
    );
  }

  if (!other) {
    return (
      <SubScreen header={<TopBar title="기록 비교" />}>
        <EmptyState
          title="비교할 친구 기록이 없어요"
          message={'친구가 이 코스를 달리면\n여기에서 기록을 나란히 볼 수 있어요'}
          action={{ label: '코스로 돌아가기', onPress: () => router.back() }}
        />
      </SubScreen>
    );
  }

  const friendName = other.member.nickname;
  let summary = `이 코스를 달리면 ${friendName}님과 비교할 수 있어요`;
  if (mine) {
    const diff = mine.durationSec - other.durationSec;
    const paceDiff = (mine.avgPaceSec ?? 0) - (other.avgPaceSec ?? 0);
    const abs = Math.abs(diff);
    const gap = abs >= 60 ? `${Math.floor(abs / 60)}분 ${abs % 60}초` : `${abs}초`;
    summary =
      diff === 0
        ? `${friendName}님과 기록이 같아요`
        : `${friendName}님보다 ${gap} ${diff > 0 ? '늦어요' : '빨라요'} · 1km당 ${Math.abs(paceDiff)}초 차이`;
  }

  return (
    <SubScreen
      header={<TopBar title="기록 비교" />}
      bottom={
        <Button
          label={`${friendName}님 기록에 도전하기`}
          tone="lime"
          flex
          icon={(color) => <PlaySmallIcon color={color} />}
          onPress={() => router.push({ pathname: '/run', params: { courseId: course.id } })}
        />
      }>
      <View style={styles.courseRow}>
        <Text style={styles.courseName}>{course.name}</Text>
        <Text style={styles.courseKm}>{course.distanceKm}km</Text>
      </View>

      <View style={styles.pickRow}>
        {friends.map((record) => {
          const selected = record === other;
          return (
            <Pressable
              key={record.member.memberId}
              onPress={() => setPickedId(record.member.memberId)}
              style={styles.pick}
              accessibilityRole="button"
              accessibilityState={{ selected }}>
              <Avatar name={record.member.nickname} size={44} ring={selected ? Palette.ink : undefined} />
              <Text style={[styles.pickName, selected && styles.pickNameOn]}>{record.member.nickname}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.versus}>
        <View style={styles.vsRow}>
          <Side
            label="나"
            total={mine ? duration(mine.durationSec) : '--:--'}
            pace={mine ? `${pace(mine.avgPaceSec)} /km` : '기록 없음'}
          />
          <Text style={styles.vs}>VS</Text>
          <Side label={friendName} total={duration(other.durationSec)} pace={`${pace(other.avgPaceSec)} /km`} highlight />
        </View>
        <View style={styles.summary}>
          <Text style={styles.summaryText}>{summary}</Text>
        </View>
      </View>

      <Card style={styles.splits}>
        <View style={styles.splitHead}>
          <Text style={styles.splitTitle}>항목별 비교</Text>
          <View style={styles.legend}>
            <View style={[styles.dot, { backgroundColor: Palette.ink }]} />
            <Text style={styles.legendText}>나</Text>
            <View style={[styles.dot, { backgroundColor: Palette.accent, borderWidth: 1, borderColor: Palette.ink }]} />
            <Text style={styles.legendText}>{friendName}</Text>
          </View>
        </View>
        {mine ? (
          <>
            <CompareRow label="기록" mine={mine} other={other} value={(r) => r.durationSec} text={(r) => duration(r.durationSec)} />
            <CompareRow
              label="페이스"
              mine={mine}
              other={other}
              value={(r) => r.avgPaceSec ?? 0}
              text={(r) => pace(r.avgPaceSec)}
            />
            <CompareRow
              label="거리"
              mine={mine}
              other={other}
              value={(r) => Number(r.distanceKm)}
              text={(r) => `${Number(r.distanceKm).toFixed(2)}km`}
            />
          </>
        ) : (
          <Text style={styles.emptyText}>아직 이 코스 기록이 없어요. 한 번 달리면 친구 기록과 나란히 비교해 드려요.</Text>
        )}
      </Card>
    </SubScreen>
  );
}

function CompareRow({
  label,
  mine,
  other,
  value,
  text,
}: {
  label: string;
  mine: CourseRecordDto;
  other: CourseRecordDto;
  value: (r: CourseRecordDto) => number;
  text: (r: CourseRecordDto) => string;
}) {
  const max = Math.max(value(mine), value(other), 1);
  return (
    <View style={styles.splitRow}>
      <Text style={styles.splitLabel}>{label}</Text>
      <View style={styles.splitBars}>
        <View style={[styles.barMine, { width: `${(value(mine) / max) * 100}%` }]} />
        <View style={[styles.barOther, { width: `${(value(other) / max) * 100}%` }]} />
      </View>
      <View style={styles.splitValues}>
        <Text style={styles.splitMine}>{text(mine)}</Text>
        <Text style={styles.splitOther}>{text(other)}</Text>
      </View>
    </View>
  );
}

function Side({ label, total, pace, highlight }: { label: string; total: string; pace: string; highlight?: boolean }) {
  return (
    <View style={styles.side}>
      <Text style={styles.sideLabel}>{label}</Text>
      <Text style={[styles.sideTotal, highlight && { color: Palette.accent }]}>{total}</Text>
      <Text style={styles.sidePace}>{pace}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  courseRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  courseName: { fontSize: 18, fontWeight: '700', color: Palette.ink },
  courseKm: { fontSize: 14, color: Palette.muted },
  pickRow: { flexDirection: 'row', gap: 18, flexWrap: 'wrap' },
  pick: { alignItems: 'center', gap: 6 },
  pickName: { fontSize: 11, color: Palette.muted },
  pickNameOn: { fontWeight: '700', color: Palette.ink },
  versus: { backgroundColor: Palette.darkCard, borderRadius: 22, padding: 16, gap: 14 },
  vsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  vs: { fontSize: 14, fontWeight: '700', color: Palette.hint },
  side: { alignItems: 'center', gap: 2 },
  sideLabel: { fontSize: 13, fontWeight: '500', color: Palette.white },
  sideTotal: { fontSize: 28, fontWeight: '900', color: Palette.white },
  sidePace: { fontSize: 12, color: Palette.darkText },
  summary: { backgroundColor: Palette.darkLine, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12 },
  summaryText: { fontSize: 13, fontWeight: '700', color: Palette.white, textAlign: 'center' },
  splits: { gap: 14 },
  splitHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  splitTitle: { fontSize: 16, fontWeight: '700', color: Palette.ink },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, color: Palette.muted, marginRight: 6 },
  splitRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  splitLabel: { width: 44, fontSize: 13, fontWeight: '700', color: Palette.ink },
  splitBars: { flex: 1, gap: 4 },
  barMine: { height: 6, borderRadius: 3, backgroundColor: Palette.ink },
  barOther: { height: 6, borderRadius: 3, backgroundColor: Palette.accent, borderWidth: 1, borderColor: Palette.ink },
  splitValues: { width: 64, alignItems: 'flex-end' },
  splitMine: { fontSize: 12, fontWeight: '700', color: Palette.ink },
  splitOther: { fontSize: 11, color: Palette.muted },
  emptyText: { fontSize: 13, lineHeight: 19, color: Palette.muted },
});
