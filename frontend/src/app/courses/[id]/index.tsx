import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BookmarkIcon, PeopleIcon, PlaySmallIcon, StarIcon } from '@/components/common/icons';
import {
  AvatarStack,
  Button,
  Card,
  IconButton,
  MoreLink,
  SubScreen,
  Tag,
  TopBar,
  useToast,
} from '@/components/common/ui';
import { CourseMap } from '@/components/course/course-map';
import { ReviewRow } from '@/components/course/review-row';
import { InviteSheet } from '@/components/friend/invite-sheet';
import { LevelColors, Palette } from '@/constants/theme';
import { FRIEND_RECORDS, REVIEWS, getCourse } from '@/data/courses';
import { actions, useAppStore } from '@/hooks/use-app-store';

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const course = getCourse(id);
  const saved = useAppStore((s) => s.savedCourses).includes(course.id);
  const [inviteOpen, setInviteOpen] = useState(false);
  const toast = useToast();
  const level = LevelColors[course.level];
  const friendNames = Object.keys(FRIEND_RECORDS);

  return (
    <SubScreen
      header={
        <TopBar
          title="코스 상세"
          right={
            <IconButton
              label={saved ? '저장 취소' : '코스 저장'}
              style={styles.whiteButton}
              onPress={() => {
                actions.toggleSavedCourse(course.id);
                toast.show(saved ? '저장을 취소했어요' : '저장한 코스에 추가했어요', saved ? undefined : {
                  label: '보기',
                  onPress: () => router.push('/courses/saved'),
                });
              }}>
              <BookmarkIcon color={Palette.ink} filled={saved} />
            </IconButton>
          }
        />
      }
      bottom={
        <>
          <Button
            label="친구와 함께"
            tone="dark"
            icon={(color) => <PeopleIcon color={color} />}
            onPress={() => setInviteOpen(true)}
          />
          <Button
            label="이 코스로 달리기"
            tone="lime"
            flex
            icon={(color) => <PlaySmallIcon color={color} />}
            onPress={() => router.dismissTo('/')}
          />
        </>
      }
      overlay={
        <>
          <InviteSheet
            visible={inviteOpen}
            course={course}
            onClose={() => setInviteOpen(false)}
            onSent={(name, when) => toast.show(`${name}님에게 초대를 보냈어요 · ${when}`)}
          />
          {toast.node}
        </>
      }>
      <CourseMap
        shape={course.shape}
        width="100%"
        height={210}
        checkpoints={course.shape === 'loop'}
        label={course.loop ? '출발 · 도착 같은 순환 코스' : '편도 코스'}
      />

      <View style={styles.title}>
        <View style={styles.tags}>
          <Tag label={course.level} bg={level.bg} color={level.text} bold size={12} style={styles.tagPad} />
          <View style={styles.ratingTag}>
            <StarIcon size={12} />
            <Text style={styles.ratingText}>
              {course.rating} ({course.reviewCount})
            </Text>
          </View>
        </View>
        <Text style={styles.name}>{course.name}</Text>
        <Text style={styles.start}>{course.start}</Text>
      </View>

      <View style={styles.stats}>
        <Stat label="거리" value={String(course.distanceKm)} unit="km" />
        <Stat label="예상 시간" value={String(course.minutes)} unit="분" />
        <Stat label="고도" value={`+${course.elevation}`} unit="m" />
      </View>

      <Card style={styles.gap12}>
        <Text style={styles.cardTitle}>코스 특징</Text>
        <View style={styles.features}>
          {course.features.map((feature) => (
            <View key={feature} style={styles.feature}>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
        <View style={styles.tip}>
          <Text style={styles.tipText}>{course.tip}</Text>
        </View>
      </Card>

      <Card style={styles.gap12}>
        <Text style={styles.cardTitle}>이 코스를 달린 친구</Text>
        <View style={styles.friendsRow}>
          <AvatarStack names={friendNames.slice(0, 3)} extra={`+${friendNames.length - 3}`} />
          <View style={styles.friendsText}>
            <Text style={styles.friendsTitle} numberOfLines={2}>
              {friendNames[0]} 님 외 {friendNames.length - 1}명이 달렸어요
            </Text>
            <Text style={styles.friendsSub}>
              친구 최고 기록 · {friendNames[0]} {FRIEND_RECORDS[friendNames[0]].total}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push(`/courses/${course.id}/compare`)}
            style={styles.compareButton}
            accessibilityRole="button">
            <Text style={styles.compareText}>기록 비교</Text>
          </Pressable>
        </View>
      </Card>

      <Card style={styles.reviews}>
        <View style={styles.reviewHead}>
          <Text style={styles.cardTitle}>코스 후기 {course.reviewCount}</Text>
          <MoreLink label="후기 더보기" onPress={() => router.push(`/courses/${course.id}/reviews`)} />
        </View>
        {REVIEWS.slice(0, 2).map((review, index) => (
          <ReviewRow key={review.name} review={review} last={index === 1} />
        ))}
      </Card>
    </SubScreen>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={styles.statValueRow}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statUnit}>{unit}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  whiteButton: { backgroundColor: Palette.white },
  title: { gap: 6 },
  tags: { flexDirection: 'row', gap: 6 },
  tagPad: { paddingHorizontal: 8 },
  ratingTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Palette.chip,
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  ratingText: { fontSize: 12, fontWeight: '500', color: Palette.inkSoft },
  name: { fontSize: 24, fontWeight: '900', color: Palette.ink },
  start: { fontSize: 13, color: Palette.muted },
  stats: { flexDirection: 'row', gap: 8 },
  stat: {
    flex: 1,
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.white,
  },
  statLabel: { fontSize: 12, color: Palette.muted },
  statValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  statValue: { fontSize: 22, fontWeight: '900', color: Palette.ink },
  statUnit: { fontSize: 12, fontWeight: '500', color: Palette.muted },
  gap12: { gap: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Palette.ink },
  features: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  feature: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.white,
  },
  featureText: { fontSize: 13, fontWeight: '500', color: Palette.inkSoft },
  tip: { backgroundColor: Palette.accentSoft, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  tipText: { fontSize: 12, fontWeight: '500', color: Palette.ink },
  friendsRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  friendsText: { flex: 1, gap: 2 },
  friendsTitle: { fontSize: 14, fontWeight: '700', color: Palette.ink },
  friendsSub: { fontSize: 12, color: Palette.muted },
  compareButton: { backgroundColor: Palette.ink, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7 },
  compareText: { fontSize: 12, fontWeight: '700', color: Palette.white },
  reviews: { paddingBottom: 8, gap: 4 },
  reviewHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
