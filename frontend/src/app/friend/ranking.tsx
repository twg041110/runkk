import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Avatar, Card, QueryView, SubScreen, TopBar } from '@/components/common/ui';
import { Palette } from '@/constants/theme';
import { useRanking } from '@/lib/friends';

type Period = 'WEEK' | 'MONTH';

export default function RankingScreen() {
  const [period, setPeriod] = useState<Period>('WEEK');
  const rankingQuery = useRanking(period);

  return (
    <SubScreen header={<TopBar title="친구 랭킹" />}>
      <View style={styles.segment}>
        {(['WEEK', 'MONTH'] as const).map((p) => (
          <Text
            key={p}
            onPress={() => setPeriod(p)}
            style={[styles.segmentItem, period === p && styles.segmentOn]}
            accessibilityRole="button"
            accessibilityState={{ selected: period === p }}>
            {p === 'WEEK' ? '이번 주' : '이번 달'}
          </Text>
        ))}
      </View>

      <QueryView query={rankingQuery}>
        {(rows) => {
          const ranked = rows.filter((r) => Number(r.distanceKm) > 0);
          const zero = rows.filter((r) => Number(r.distanceKm) === 0);
          const myIndex = ranked.findIndex((r) => r.me);
          const mine = myIndex >= 0 ? ranked[myIndex] : null;
          const above = myIndex > 0 ? ranked[myIndex - 1] : null;
          return (
            <>
              <View style={styles.mine}>
                <Text style={styles.mineRank}>{mine ? `${myIndex + 1}위` : '–'}</Text>
                <View style={styles.flex}>
                  <Text style={styles.mineTitle}>
                    {mine ? `나 (${mine.member.nickname}) · ${Number(mine.distanceKm).toFixed(1)}km` : '아직 기록이 없어요'}
                  </Text>
                  <Text style={styles.mineSub}>
                    {!mine
                      ? `${period === 'WEEK' ? '이번 주' : '이번 달'} 첫 러닝을 기록하면 랭킹에 올라가요`
                      : above
                        ? `${above.member.nickname} 님까지 ${(Number(above.distanceKm) - Number(mine.distanceKm)).toFixed(1)}km 남았어요`
                        : '지금 1등이에요!'}
                  </Text>
                </View>
              </View>

              <Card style={styles.list}>
                {ranked.map((row, index) => (
                  <View key={row.member.memberId} style={[styles.row, row.me && styles.rowMe]}>
                    <Text style={[styles.no, index === 0 && { color: Palette.ink }]}>{index + 1}</Text>
                    <Avatar name={row.member.nickname} size={32} />
                    <Text style={styles.name}>{row.me ? `나 (${row.member.nickname})` : row.member.nickname}</Text>
                    <Text style={styles.km}>{Number(row.distanceKm).toFixed(1)} km</Text>
                  </View>
                ))}
                {zero.length > 0 ? <Text style={styles.zeroLabel}>기록 없음</Text> : null}
                {zero.map((row) => (
                  <View key={row.member.memberId} style={[styles.row, row.me && styles.rowMe]}>
                    <Text style={styles.no}>–</Text>
                    <Avatar name={row.member.nickname} size={32} />
                    <Text style={[styles.name, { color: Palette.muted }]}>
                      {row.me ? `나 (${row.member.nickname})` : row.member.nickname}
                    </Text>
                    <Text style={[styles.km, { color: Palette.muted }]}>0 km</Text>
                  </View>
                ))}
              </Card>
            </>
          );
        }}
      </QueryView>
      <Text style={styles.note}>
        {period === 'WEEK' ? '매주 월요일 0시에 새로 시작해요.' : '매달 1일 0시에 새로 시작해요.'} 함께 달린 거리도 각자 기록에 들어가요.
      </Text>
    </SubScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 4 },
  segment: { flexDirection: 'row', backgroundColor: Palette.chip, borderRadius: 14, padding: 4 },
  segmentItem: {
    flex: 1,
    textAlign: 'center',
    paddingVertical: 10,
    borderRadius: 11,
    fontSize: 14,
    fontWeight: '500',
    color: Palette.muted,
    overflow: 'hidden',
  },
  segmentOn: { backgroundColor: Palette.white, color: Palette.ink, fontWeight: '700' },
  mine: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: Palette.darkCard, borderRadius: 20, padding: 18 },
  mineRank: { fontSize: 24, fontWeight: '900', color: Palette.accent },
  mineTitle: { fontSize: 15, fontWeight: '700', color: Palette.white },
  mineSub: { fontSize: 12, color: Palette.darkText },
  list: { paddingVertical: 10, gap: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9, paddingHorizontal: 8, borderRadius: 12 },
  rowMe: { backgroundColor: Palette.accentSoft },
  no: { width: 16, fontSize: 15, fontWeight: '900', color: Palette.muted, textAlign: 'center' },
  name: { flex: 1, fontSize: 14, fontWeight: '700', color: Palette.ink },
  km: { fontSize: 14, fontWeight: '700', color: Palette.ink },
  zeroLabel: { fontSize: 12, color: Palette.muted, paddingHorizontal: 8, paddingTop: 10 },
  note: { fontSize: 12, color: Palette.muted },
});
