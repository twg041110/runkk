/**
 * 러닝 숫자 묶음 (러닝 중 · 결과 화면이 같이 써요)
 *
 *   2.12 km          [aside]   ← 큰 숫자 (오른쪽에 aside: 결과 화면의 "100% 달성" 등)
 *   [children]                 ← 큰 숫자 아래 (러닝 중 목표 진행 막대 등)
 *   ──────────
 *   [시간] [평균 페이스] [칼로리]   ← 작은 카드 3개
 *
 * primary: 큰 숫자를 무엇으로 할지
 * - 'distance'(기본): 큰 숫자 = 거리, 카드 = 시간 · 평균 페이스 · 칼로리
 * - 'time': 큰 숫자 = 시간, 카드 = 거리 · 평균 페이스 · 칼로리 (시간 목표 러닝, 목표 결과 "기록")
 * remainingM: 있으면 칼로리 카드 대신 "남은 거리" 카드를 보여 줘요 (코스 러닝 중)
 */
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/theme';
import { useSettings } from '@/hooks/use-settings';
import { estimateCalories, formatDistance, formatDuration, formatPace } from '@/utils/run-format';

type Props = {
  distanceM: number;
  elapsedSec: number;
  label?: string; // 큰 숫자 위 작은 제목 (결과 화면: "달린 거리", "기록")
  primary?: 'distance' | 'time';
  bigTimeSec?: number; // primary가 'time'일 때 큰 숫자로 보여 줄 시간 (기본은 elapsedSec)
  aside?: ReactNode;
  children?: ReactNode;
  remainingM?: number;
};

export function RunStats({ distanceM, elapsedSec, label, primary = 'distance', bigTimeSec, aside, children, remainingM }: Props) {
  const { settings } = useSettings();
  const unit = settings.distanceUnit; // 설정 → 거리 단위 (km / mi)
  const isTime = primary === 'time';

  return (
    <View style={styles.wrap}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.bigRow}>
        <View style={styles.bigValue}>
          <Text style={styles.big} accessibilityLabel={isTime ? '달린 시간' : '달린 거리'}>
            {isTime ? formatDuration(bigTimeSec ?? elapsedSec) : formatDistance(distanceM, unit)}
          </Text>
          {!isTime && <Text style={styles.bigUnit}>{unit}</Text>}
        </View>
        {aside}
      </View>
      {children}

      <View style={styles.divider} />

      <View style={styles.cards}>
        {isTime ? (
          <StatCard title="거리" value={formatDistance(distanceM, unit)} unit={unit} />
        ) : (
          <StatCard title="시간" value={formatDuration(elapsedSec)} />
        )}
        <StatCard title="평균 페이스" value={formatPace(distanceM, elapsedSec, unit)} />
        {remainingM === undefined ? (
          <StatCard title="칼로리" value={String(estimateCalories(distanceM))} unit="kcal" />
        ) : (
          <StatCard title="남은 거리" value={formatDistance(remainingM, unit)} unit={unit} />
        )}
      </View>
    </View>
  );
}

function StatCard({ title, value, unit }: { title: string; value: string; unit?: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={styles.cardValueRow}>
        <Text style={styles.cardValue} accessibilityLabel={title}>
          {value}
        </Text>
        {unit && <Text style={styles.cardUnit}>{unit}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
  },
  label: {
    fontSize: 13,
    color: Palette.hint,
  },
  bigRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
  },
  bigValue: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  big: {
    fontSize: 72,
    lineHeight: 80,
    fontWeight: '800',
    letterSpacing: -2,
    color: Palette.ink,
  },
  bigUnit: {
    marginBottom: 14,
    fontSize: 20,
    fontWeight: '600',
    color: Palette.muted,
  },
  divider: {
    height: 1,
    backgroundColor: Palette.border,
  },
  cards: {
    flexDirection: 'row',
    gap: 8,
  },
  card: {
    flex: 1,
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
  },
  cardTitle: {
    fontSize: 12,
    color: Palette.muted,
  },
  cardValueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
  },
  cardValue: {
    fontSize: 22,
    fontWeight: '700',
    color: Palette.ink,
  },
  cardUnit: {
    marginBottom: 3,
    fontSize: 12,
    color: Palette.muted,
  },
});
