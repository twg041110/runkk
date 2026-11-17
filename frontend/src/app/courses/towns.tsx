import { StyleSheet, Text, View } from 'react-native';

import { Card, SubScreen, Tag, TopBar } from '@/components/common/ui';
import { CourseMap } from '@/components/course/course-map';
import { Palette } from '@/constants/theme';
import { TOWNS } from '@/data/courses';

const MONTH = new Date().getMonth() + 1;

export default function TownRecordScreen() {
  const runs = TOWNS.reduce((sum, town) => sum + town.runs, 0);
  const km = TOWNS.reduce((sum, town) => sum + town.km, 0);
  return (
    <SubScreen header={<TopBar title="동네 기록" />}>
      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>
          {MONTH}월에 {TOWNS.length}개 동네에서 달렸어요
        </Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryValue}>{runs}번</Text>
          <Text style={styles.summaryValue}>{km.toFixed(1)}km</Text>
        </View>
      </View>
      {TOWNS.map((town, index) => (
        <Card key={town.name} style={styles.card}>
          <CourseMap shape={town.shape} />
          <View style={styles.text}>
            <Tag label={`${index + 1}위`} bg={index === 0 ? Palette.accent : Palette.chip} color={Palette.ink} bold />
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
