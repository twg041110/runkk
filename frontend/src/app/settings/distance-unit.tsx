/**
 * 거리 단위 (Figma: 거리 단위)
 * 들어오는 곳: 설정 → 거리 단위
 *
 * 킬로미터/마일 중 하나를 고르면 바로 저장되고, 아래 미리보기 숫자가 그 단위로 바뀌어요.
 * 러닝 기록은 서버에 항상 km로 저장하고, 화면에 보여줄 때만 이 설정에 맞춰 바꿔요.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ScreenHeader } from '@/components/common/screen-header';
import { Palette } from '@/constants/theme';
import { useSettings } from '@/hooks/use-settings';

const KM_PER_MILE = 1.609344; // 1마일 = 1.609344km

// 미리보기에 쓰는 예시 기록 (Figma 값): 5km를 1km당 6분 15초 페이스로 달림
const SAMPLE_KM = 5;
const SAMPLE_PACE_SEC_PER_KM = 6 * 60 + 15;

// 초 → 6'15" 모양 글자로 바꾸기
function formatPace(totalSeconds: number) {
  const rounded = Math.round(totalSeconds);
  const min = Math.floor(rounded / 60);
  const sec = rounded % 60;
  return `${min}'${String(sec).padStart(2, '0')}"`;
}

const OPTIONS = [
  { unit: 'km', title: '킬로미터', description: 'km · 페이스는 분/km' },
  { unit: 'mi', title: '마일', description: 'mi · 페이스는 분/mi' },
] as const;

export default function DistanceUnitScreen() {
  const { settings, update } = useSettings();
  const isMile = settings.distanceUnit === 'mi';

  // 마일이면: 거리는 1.609로 나누고, 페이스(1단위 가는 데 걸린 시간)는 1.609를 곱해요
  const distance = isMile ? SAMPLE_KM / KM_PER_MILE : SAMPLE_KM;
  const pace = isMile ? SAMPLE_PACE_SEC_PER_KM * KM_PER_MILE : SAMPLE_PACE_SEC_PER_KM;

  return (
    <View style={styles.screen}>
      <ScreenHeader title="거리 단위" />

      <View style={styles.content}>
        <Text style={styles.guide}>러닝 기록, 페이스, 목표에 모두 적용돼요</Text>

        {/* 선택지 두 개. 고른 쪽은 오른쪽 동그라미가 채워져요 */}
        <View style={styles.card}>
          {OPTIONS.map((option, index) => {
            const selected = settings.distanceUnit === option.unit;
            return (
              <Pressable
                key={option.unit}
                style={[styles.option, index > 0 && styles.optionDivider]}
                onPress={() => update({ distanceUnit: option.unit })}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}>
                <View style={styles.optionTexts}>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                </View>
                <View style={[styles.radio, selected && styles.radioSelected]}>
                  {selected && <View style={styles.radioDot} />}
                </View>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.previewLabel}>미리보기</Text>
        <View style={styles.preview}>
          <View style={styles.previewItem}>
            <Text style={styles.previewName}>거리</Text>
            <Text style={styles.previewValue}>
              {distance.toFixed(2)} <Text style={styles.previewUnit}>{settings.distanceUnit}</Text>
            </Text>
          </View>
          <View style={styles.previewItem}>
            <Text style={styles.previewName}>평균 페이스</Text>
            <Text style={styles.previewValue}>
              {formatPace(pace)} <Text style={styles.previewUnit}>/{settings.distanceUnit}</Text>
            </Text>
          </View>
        </View>

        <Text style={styles.footnote}>단위를 바꾸면 지난 기록도 새 단위로 보여요</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  content: {
    gap: 12,
    paddingTop: 8,
    paddingHorizontal: 20,
  },
  guide: {
    fontSize: 14,
    color: Palette.muted,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
    overflow: 'hidden',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingLeft: 18,
    paddingRight: 16,
  },
  optionDivider: {
    borderTopWidth: 1,
    borderTopColor: Palette.border,
  },
  optionTexts: {
    flex: 1,
    gap: 2,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Palette.ink,
  },
  optionDescription: {
    fontSize: 12,
    color: Palette.hint,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#C9CBD1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderWidth: 0,
    backgroundColor: Palette.ink,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Palette.accent,
  },
  previewLabel: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '500',
    color: Palette.hint,
  },
  preview: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 16,
    backgroundColor: Palette.ink,
  },
  previewItem: {
    flex: 1,
    gap: 4,
  },
  previewName: {
    fontSize: 12,
    color: '#B8BDC6',
  },
  previewValue: {
    fontSize: 28,
    fontWeight: '700',
    color: Palette.background,
  },
  previewUnit: {
    fontSize: 13,
    fontWeight: '500',
    color: '#B8BDC6',
  },
  footnote: {
    fontSize: 13,
    color: Palette.hint,
  },
});
