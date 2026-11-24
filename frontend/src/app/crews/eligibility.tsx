import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button, CardHeading, LoadingBlock, SubScreen, TopBar } from '@/components/common/ui';
import { CrewCard } from '@/components/crew/crew-parts';
import { Palette } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useMyRuns } from '@/lib/courses';
import { REQUIRED_RUNS, useEligibility } from '@/lib/crews';
import { dateLabel } from '@/lib/format';

// 크루 가입 조건(1km 이상 러닝 5회) 확인. 횟수는 서버가 세고, 아래 목록은 내 최근 기록이다
export default function EligibilityScreen() {
  const { me } = useAuth();
  const eligibilityQuery = useEligibility(!!me);
  const runsQuery = useMyRuns(!!me);
  const runs = (runsQuery.data ?? []).slice(0, 8);
  const counted = eligibilityQuery.data?.runCount ?? 0;
  const ok = eligibilityQuery.data?.eligible ?? false;
  const need = Math.max(REQUIRED_RUNS - counted, 0);
  const hasShort = runs.some((run) => Number(run.distanceKm) < 1);

  return (
    <SubScreen
      header={<TopBar variant="plain" title="가입 자격 확인" />}
      bottom={
        ok ? (
          <Button label="크루 둘러보기" tone="darkLime" height={56} radius={28} fontSize={16} flex onPress={() => router.back()} />
        ) : (
          <>
            <Button label="닫기" tone="outline" height={56} radius={28} fontSize={16} onPress={() => router.back()} />
            <Button
              label="러닝 시작하기"
              tone="darkLime"
              height={56}
              radius={28}
              fontSize={16}
              flex
              onPress={() => router.push('/run')}
            />
          </>
        )
      }>
      {eligibilityQuery.data === undefined ? (
        <LoadingBlock height={140} count={2} />
      ) : (
        <>
          <View style={[styles.result, ok ? styles.resultOk : styles.resultNo]}>
            <View style={[styles.badge, { backgroundColor: ok ? Palette.ink : Palette.white }]}>
              <Text style={[styles.badgeText, { color: ok ? Palette.accent : Palette.ink }]}>{ok ? '조건 충족' : '조건 미충족'}</Text>
            </View>
            <Text style={styles.resultTitle}>{ok ? '가입 조건을 충족했어요' : '아직 가입 조건을 충족하지 못했어요'}</Text>
            <Text style={styles.resultText}>
              {ok
                ? '러닝 기록이 조건을 채워 크루에 가입 신청할 수 있어요.'
                : `1km 이상 러닝을 ${need}회 더 하면 가입 신청할 수 있어요.`}
            </Text>
          </View>

          <CrewCard style={styles.block}>
            <CardHeading>가입 조건</CardHeading>
            <Text style={styles.rule}>1km 이상 러닝 최소 {REQUIRED_RUNS}회</Text>
            <View style={styles.countRow}>
              <Text style={styles.count}>{Math.min(counted, REQUIRED_RUNS)}</Text>
              <Text style={styles.countTotal}>/ {REQUIRED_RUNS}회</Text>
            </View>
            <View style={styles.dots}>
              {Array.from({ length: REQUIRED_RUNS }, (_, i) => (
                <View key={i} style={[styles.dot, i < counted && styles.dotOn]} />
              ))}
            </View>
            <Text style={styles.status}>{ok ? '조건을 모두 채웠어요' : `${need}회 더 필요해요`}</Text>
          </CrewCard>

          <CrewCard style={styles.block}>
            <CardHeading>내 최근 러닝 기록</CardHeading>
            {runs.length === 0 ? <Text style={styles.rule}>아직 러닝 기록이 없어요. 첫 러닝을 시작해 보세요.</Text> : null}
            {runs.map((run, index) => {
              const km = Number(run.distanceKm);
              const counts = km >= 1;
              return (
                <View key={run.recordId} style={[styles.runRow, index > 0 && styles.border]}>
                  <Text style={styles.runDate}>{dateLabel(run.startedAt)}</Text>
                  <Text style={[styles.runKm, !counts && { color: Palette.hint }]}>{km.toFixed(1)} km</Text>
                  <View style={[styles.runBadge, { backgroundColor: counts ? Palette.accent : Palette.chip }]}>
                    <Text style={[styles.runBadgeText, !counts && { color: Palette.muted }]}>{counts ? '인정' : '제외'}</Text>
                  </View>
                </View>
              );
            })}
          </CrewCard>
          {hasShort ? <Text style={styles.note}>1km 미만 러닝은 가입 조건 횟수에 포함되지 않아요.</Text> : null}
        </>
      )}
    </SubScreen>
  );
}

const styles = StyleSheet.create({
  result: { borderRadius: 24, padding: 18, gap: 8 },
  resultOk: { backgroundColor: Palette.accent },
  resultNo: { backgroundColor: Palette.chip },
  badge: { alignSelf: 'flex-start', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  resultTitle: { fontSize: 20, fontWeight: '900', color: Palette.ink },
  resultText: { fontSize: 13, color: Palette.inkSoft },
  block: { paddingTop: 12, paddingBottom: 14, gap: 6 },
  rule: { fontSize: 13, color: Palette.muted },
  countRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  count: { fontSize: 32, fontWeight: '900', color: Palette.ink },
  countTotal: { fontSize: 14, fontWeight: '500', color: Palette.muted },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { flex: 1, height: 8, borderRadius: 4, backgroundColor: Palette.divider },
  dotOn: { backgroundColor: Palette.ink },
  status: { fontSize: 12, fontWeight: '700', color: Palette.ink, marginTop: 4 },
  runRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  border: { borderTopWidth: 1, borderTopColor: Palette.divider },
  runDate: { flex: 1, fontSize: 13, color: Palette.ink },
  runKm: { fontSize: 14, fontWeight: '700', color: Palette.ink },
  runBadge: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 },
  runBadgeText: { fontSize: 11, fontWeight: '700', color: Palette.ink },
  note: { fontSize: 12, color: Palette.muted },
});
