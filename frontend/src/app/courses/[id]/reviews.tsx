import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card, Chip, SubScreen, TopBar } from '@/components/common/ui';
import { ReviewRow } from '@/components/course/review-row';
import { Palette } from '@/constants/theme';
import { RATING_COUNTS, REVIEWS, getCourse } from '@/data/courses';

const SORTS = ['최신순', '별점 높은순', '별점 낮은순'] as const;

export default function CourseReviewsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const course = getCourse(id);
  const [sort, setSort] = useState<(typeof SORTS)[number]>('최신순');
  const max = Math.max(...RATING_COUNTS);

  const reviews = [...REVIEWS];
  if (sort === '별점 높은순') reviews.sort((a, b) => b.rating - a.rating);
  if (sort === '별점 낮은순') reviews.sort((a, b) => a.rating - b.rating);

  return (
    <SubScreen header={<TopBar title="코스 후기" />}>
      <Card style={styles.summary}>
        <View style={styles.score}>
          <Text style={styles.scoreValue}>{course.rating}</Text>
          <Text style={styles.scoreCount}>후기 {course.reviewCount}개</Text>
        </View>
        <View style={styles.bars}>
          {RATING_COUNTS.map((count, index) => (
            <View key={index} style={styles.barRow}>
              <Text style={styles.barLabel}>{5 - index}</Text>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${(count / max) * 100}%` }]} />
              </View>
              <Text style={styles.barCount}>{count}</Text>
            </View>
          ))}
        </View>
      </Card>

      <View style={styles.sorts}>
        {SORTS.map((item) => (
          <Chip key={item} label={item} size="sm" selected={sort === item} onPress={() => setSort(item)} />
        ))}
      </View>

      <Card style={styles.list}>
        {reviews.map((review, index) => (
          <ReviewRow key={review.name} review={review} last={index === reviews.length - 1} />
        ))}
      </Card>
    </SubScreen>
  );
}

const styles = StyleSheet.create({
  summary: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  score: { alignItems: 'center', gap: 4, width: 76 },
  scoreValue: { fontSize: 40, fontWeight: '900', color: Palette.ink },
  scoreCount: { fontSize: 12, color: Palette.muted },
  bars: { flex: 1, gap: 6 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barLabel: { width: 10, fontSize: 12, fontWeight: '700', color: Palette.ink },
  track: { flex: 1, height: 6, borderRadius: 3, backgroundColor: Palette.border, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3, backgroundColor: Palette.ink },
  barCount: { width: 28, fontSize: 11, color: Palette.muted, textAlign: 'right' },
  sorts: { flexDirection: 'row', gap: 8 },
  list: { paddingVertical: 4 },
});
