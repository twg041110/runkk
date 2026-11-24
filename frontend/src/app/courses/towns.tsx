import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Card, EmptyState, QueryView, SubScreen, Tag, TopBar } from '@/components/common/ui';
import { CourseMap } from '@/components/course/course-map';
import { Palette } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { townsFromRuns, useMyRuns } from '@/lib/courses';

const MONTH = new Date().getMonth() + 1;

// 이번 달 내가 달린 동네. 코스를 골라 달린 기록을 그 코스의 지역으로 묶어 센다
export default function TownRecordScreen() {
  const { me } = useAuth();
  const runsQuery = useMyRuns(!!me);

  return (
    <SubScreen header={<TopBar title="동네 기록" />}>
      {!me ? (
        <EmptyState title="로그인하면 동네 기록이 쌓여요" message="코스를 골라 달린 기록을 동네별로 모아 보여 드려요" />
      ) : (
        <QueryView query={runsQuery}>
          {(runs) => {
            const towns = townsFromRuns(runs);
            if (towns.length === 0) {
              return (
                <EmptyState
                  title={`${MONTH}월에 달린 동네가 아직 없어요`}
                  message={'코스를 골라 달리면\n그 코스가 있는 동네에 기록이 쌓여요'}
                  action={{ label: '코스 고르러 가기', onPress: () => router.dismissTo('/course') }}
                />
              );
            }
            const total = towns.reduce((sum, town) => sum + town.runs, 0);
            const km = towns.reduce((sum, town) => sum + town.km, 0);
            return (
              <>
                <View style={styles.summary}>
                  <Text style={styles.summaryLabel}>
                    {MONTH}월에 {towns.length}개 동네에서 달렸어요
                  </Text>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryValue}>{total}번</Text>
                    <Text style={styles.summaryValue}>{km.toFixed(1)}km</Text>
                  </View>
                </View>
                {towns.map((town, index) => (
                  <Card key={town.name} style={styles.card}>
                    <CourseMap shape={town.shape} />
                    <View style={styles.text}>
                      <Tag
                        label={`${index + 1}위`}
                        bg={index === 0 ? Palette.accent : Palette.chip}
                        color={Palette.ink}
                        bold
                      />
                      <Text style={styles.name}>{town.name}</Text>
                      <Text style={styles.meta}>
                        {town.runs}번 · {town.km.toFixed(1)}km 달렸어요
                      </Text>
                      <Text style={styles.course} numberOfLines={1}>
                        자주 달린 코스 · {town.course}
                      </Text>
                    </View>
                  </Card>
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
  summary: { backgroundColor: Palette.darkCard, borderRadius: 22, padding: 20, gap: 8 },
  summaryLabel: { fontSize: 13, color: Palette.darkText },
  summaryRow: { flexDirection: 'row', gap: 12, alignItems: 'baseline' },
  summaryValue: { fontSize: 28, fontWeight: '900', color: Palette.accent },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  text: { flex: 1, gap: 5 },
  name: { fontSize: 16, fontWeight: '700', color: Palette.ink },
  meta: { fontSize: 13, color: Palette.muted },
  course: { fontSize: 12, fontWeight: '500', color: Palette.inkSoft },
});
