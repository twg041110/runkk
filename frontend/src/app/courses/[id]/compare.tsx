import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PlaySmallIcon } from '@/components/common/icons';
import { Avatar, Button, Card, SubScreen, TopBar } from '@/components/common/ui';
import { Palette } from '@/constants/theme';
import { FRIEND_RECORDS, MY_RECORD, SPLIT_LABELS, getCourse } from '@/data/courses';

const toSec = (t: string) => {
  // 28:41 또는 5'59" 형식을 초로 바꾼다
  const m = t.match(/(\d+)[:'](\d+)/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : 0;
};

export default function CompareScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const course = getCourse(id);
  const names = Object.keys(FRIEND_RECORDS);
  const [friend, setFriend] = useState(names[0]);
  const other = FRIEND_RECORDS[friend];
  const mine = MY_RECORD;

  let summary = `이 코스를 달리면 ${friend}님과 비교할 수 있어요`;
  if (mine) {
    const diff = toSec(mine.total) - toSec(other.total);
    const paceDiff = toSec(mine.pace) - toSec(other.pace);
    const abs = Math.abs(diff);
    const gap = `${Math.floor(abs / 60)}분 ${abs % 60}초`;
    summary =
      diff === 0
        ? `${friend}님과 기록이 같아요`
        : `${friend}님보다 ${gap} ${diff > 0 ? '늦어요' : '빨라요'} · 1km당 ${Math.abs(paceDiff)}초 차이`;
  }
  const maxSplit = Math.max(...other.splits.map(toSec), ...(mine?.splits.map(toSec) ?? [0]));

  return (
    <SubScreen
      header={<TopBar title="기록 비교" />}
      bottom={
        <Button
          label={`${friend}님 기록에 도전하기`}
          tone="lime"
          flex
          icon={(color) => <PlaySmallIcon color={color} />}
          onPress={() => router.dismissTo('/')}
        />
      }>
      <View style={styles.courseRow}>
        <Text style={styles.courseName}>{course.name}</Text>
        <Text style={styles.courseKm}>{course.distanceKm}km</Text>
      </View>

      <View style={styles.pickRow}>
        {names.map((name) => (
          <Pressable
            key={name}
            onPress={() => setFriend(name)}
            style={styles.pick}
            accessibilityRole="button"
            accessibilityState={{ selected: name === friend }}>
            <Avatar name={name} size={44} ring={name === friend ? Palette.ink : undefined} />
            <Text style={[styles.pickName, name === friend && styles.pickNameOn]}>{name}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.versus}>
        <View style={styles.vsRow}>
          <Side label="나" total={mine?.total ?? '--:--'} pace={mine ? `${mine.pace} /km` : '기록 없음'} />
          <Text style={styles.vs}>VS</Text>
          <Side label={friend} total={other.total} pace={`${other.pace} /km`} highlight />
        </View>
        <View style={styles.summary}>
          <Text style={styles.summaryText}>{summary}</Text>
        </View>
      </View>

      <Card style={styles.splits}>
        <View style={styles.splitHead}>
          <Text style={styles.splitTitle}>구간 비교</Text>
          <View style={styles.legend}>
            <View style={[styles.dot, { backgroundColor: Palette.ink }]} />
            <Text style={styles.legendText}>나</Text>
            <View style={[styles.dot, { backgroundColor: Palette.accent, borderWidth: 1, borderColor: Palette.ink }]} />
            <Text style={styles.legendText}>{friend}</Text>
          </View>
        </View>
        {mine ? (
          SPLIT_LABELS.map((label, index) => (
            <View key={label} style={styles.splitRow}>
              <Text style={styles.splitLabel}>{label}</Text>
              <View style={styles.splitBars}>
                <View style={[styles.barMine, { width: `${(toSec(mine.splits[index]) / maxSplit) * 100}%` }]} />
                <View style={[styles.barOther, { width: `${(toSec(other.splits[index]) / maxSplit) * 100}%` }]} />
              </View>
              <View style={styles.splitValues}>
                <Text style={styles.splitMine}>{mine.splits[index]}</Text>
                <Text style={styles.splitOther}>{other.splits[index]}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>아직 이 코스 기록이 없어요. 한 번 달리면 구간별로 비교해 드려요.</Text>
        )}
      </Card>
    </SubScreen>
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
  pickRow: { flexDirection: 'row', gap: 18 },
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
  splitValues: { width: 40, alignItems: 'flex-end' },
  splitMine: { fontSize: 12, fontWeight: '700', color: Palette.ink },
  splitOther: { fontSize: 11, color: Palette.muted },
  emptyText: { fontSize: 13, lineHeight: 19, color: Palette.muted },
});
