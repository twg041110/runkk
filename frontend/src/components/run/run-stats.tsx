/**
 * 러닝 숫자 묶음 (러닝 중 · 결과 화면이 같이 써요)
 *
 *   2.12 km            ← 큰 거리
 *   ──────────
 *   [시간] [평균 페이스] [칼로리]   ← 작은 카드 3개
 */
import { StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/theme';
import { useSettings } from '@/hooks/use-settings';
import { estimateCalories, formatDistance, formatDuration, formatPace } from '@/utils/run-format';

type Props = {
  distanceM: number;
  elapsedSec: number;
  label?: string; // 큰 거리 위 작은 제목 (결과 화면: "달린 거리")
};

export function RunStats({ distanceM, elapsedSec, label }: Props) {
  const { settings } = useSettings();
  const unit = settings.distanceUnit; // 설정 → 거리 단위 (km / mi)

  return (
    <View style={styles.wrap}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.distanceRow}>
        <Text style={styles.distance} accessibilityLabel="달린 거리">
          {formatDistance(distanceM, unit)}
        </Text>
        <Text style={styles.distanceUnit}>{unit}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.cards}>
        <StatCard title="시간" value={formatDuration(elapsedSec)} />
        <StatCard title="평균 페이스" value={formatPace(distanceM, elapsedSec, unit)} />
        <StatCard title="칼로리" value={String(estimateCalories(distanceM))} unit="kcal" />
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
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  distance: {
    fontSize: 72,
    lineHeight: 80,
    fontWeight: '800',
    letterSpacing: -2,
    color: Palette.ink,
  },
  distanceUnit: {
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
