import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { StarIcon } from '@/components/common/icons';
import { Button, Card, Chip, EmptyState, QueryView, SubScreen, TopBar, useToast } from '@/components/common/ui';
import { ReviewRow } from '@/components/course/review-row';
import { Palette } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { errorMessage } from '@/lib/api';
import { addReview, deleteReview, useReviews } from '@/lib/courses';

const SORTS = ['최신순', '별점 높은순', '별점 낮은순'] as const;

export default function CourseReviewsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { me, requireLogin } = useAuth();
  const reviewsQuery = useReviews(id);
  const toast = useToast();
  const [sort, setSort] = useState<(typeof SORTS)[number]>('최신순');
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!requireLogin() || busy) return;
    if (rating === 0) {
      toast.show('별점을 골라 주세요');
      return;
    }
    setBusy(true);
    try {
      await addReview(id, rating, text.trim());
      setRating(0);
      setText('');
      toast.show('후기를 남겼어요');
    } catch (e) {
      toast.show(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (reviewId: number) => {
    try {
      await deleteReview(reviewId);
      toast.show('후기를 지웠어요');
    } catch (e) {
      toast.show(errorMessage(e));
    }
  };

  return (
    <SubScreen header={<TopBar title="코스 후기" />} overlay={toast.node}>
      <Card style={styles.write}>
        <Text style={styles.writeTitle}>{me ? '이 코스 어땠나요?' : '로그인하면 후기를 남길 수 있어요'}</Text>
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable
              key={n}
              onPress={() => setRating(n)}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={`별점 ${n}점`}
              accessibilityState={{ selected: rating === n }}
              style={[styles.star, n > rating && styles.starOff]}>
              <StarIcon size={26} />
            </Pressable>
          ))}
        </View>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="길 상태, 화장실, 붐비는 시간 같은 정보를 남겨 주세요"
          placeholderTextColor={Palette.hint}
          multiline
          maxLength={1000}
        />
        <Button label={busy ? '올리는 중…' : '후기 올리기'} tone="dark" height={46} radius={12} disabled={busy} onPress={submit} />
      </Card>

      <QueryView query={reviewsQuery}>
        {({ reviews, total }) => {
          if (reviews.length === 0) {
            return <EmptyState title="아직 후기가 없어요" message="달려 본 느낌을 처음으로 남겨 주세요" />;
          }
          // 별점 분포 (5점 → 1점)
          const counts = [5, 4, 3, 2, 1].map((n) => reviews.filter((r) => r.rating === n).length);
          const max = Math.max(...counts, 1);
          const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
          const sorted = [...reviews];
          if (sort === '별점 높은순') sorted.sort((a, b) => b.rating - a.rating);
          if (sort === '별점 낮은순') sorted.sort((a, b) => a.rating - b.rating);
          return (
            <>
              <Card style={styles.summary}>
                <View style={styles.score}>
                  <Text style={styles.scoreValue}>{avg.toFixed(1)}</Text>
                  <Text style={styles.scoreCount}>후기 {total}개</Text>
                </View>
                <View style={styles.bars}>
                  {counts.map((count, index) => (
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
                {sorted.map((review, index) => (
                  <View key={review.id}>
                    <ReviewRow review={review} last={index === sorted.length - 1} />
                    {review.mine ? (
                      <Pressable onPress={() => remove(review.id)} hitSlop={8} style={styles.delete} accessibilityRole="button">
                        <Text style={styles.deleteText}>내 후기 지우기</Text>
                      </Pressable>
                    ) : null}
                  </View>
                ))}
              </Card>
            </>
          );
        }}
      </QueryView>
    </SubScreen>
  );
}

const styles = StyleSheet.create({
  write: { gap: 12 },
  writeTitle: { fontSize: 16, fontWeight: '700', color: Palette.ink },
  stars: { flexDirection: 'row', gap: 6 },
  star: { padding: 2 },
  starOff: { opacity: 0.25 },
  input: {
    minHeight: 84,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.white,
    padding: 12,
    fontSize: 14,
    lineHeight: 20,
    color: Palette.ink,
    textAlignVertical: 'top',
  },
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
  delete: { alignSelf: 'flex-end', paddingBottom: 8 },
  deleteText: { fontSize: 12, fontWeight: '600', color: Palette.alert },
});
