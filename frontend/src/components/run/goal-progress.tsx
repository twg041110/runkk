/**
 * 러닝 중 목표 진행 막대 (Figma: 목표 정하고 달리기 - 러닝 중)
 *
 *   ████████░░░░░░░░░░░░   ← 노란 막대: 목표까지 온 만큼
 *   2.88km 남았어요     42%
 *   [목표보다 12초 앞서는 중]  ← 거리 + 시간 목표일 때만 (앞서면 검정, 뒤처지면 빨강)
 *
 * caption: 막대 아래 왼쪽 글자를 바꿀 때 (코스 러닝: "코스 3.2km")
 */
import { StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/theme';
import type { RunGoal } from '@/hooks/use-run-session';
import { getGoalProgress } from '@/utils/run-goal';

type Props = { goal: RunGoal; distanceM: number; elapsedSec: number; goalReachedSec: number | null; caption?: string };

export function GoalProgress({ goal, distanceM, elapsedSec, goalReachedSec, caption: captionOverride }: Props) {
  const { ratio, pct, caption, pace } = getGoalProgress(goal, { distanceM, elapsedSec, goalReachedSec });

  return (
    <View style={styles.wrap}>
      <View style={styles.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: pct }}>
        <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
      </View>
      <View style={styles.row}>
        <Text style={styles.caption}>{captionOverride ?? caption}</Text>
        <Text style={styles.pct}>{pct}%</Text>
      </View>
      {pace && (
        <View style={[styles.pill, !pace.ahead && styles.pillBehind]}>
          <Text style={styles.pillText}>{pace.text}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  track: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#E4E7EC',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: Palette.accent,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  caption: {
    flexShrink: 1,
    fontSize: 12,
    color: Palette.muted,
  },
  pct: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.ink,
  },
  pill: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: Palette.ink,
  },
  pillBehind: {
    backgroundColor: Palette.alert,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.surface,
  },
});
