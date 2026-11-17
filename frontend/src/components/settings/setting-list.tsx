/**
 * 설정 화면들의 "목록 카드" 부품
 *
 * Figma 설정 화면은 모두 이런 모양이에요:
 *   [회색 작은 제목]          ← SettingSection의 title
 *   ┌──────────────────────┐
 *   │ 줄 이름        값  >  │  ← SettingRow
 *   │──────────────────────│  ← 줄 사이 구분선 (자동으로 들어가요)
 *   │ 줄 이름      [스위치] │
 *   └──────────────────────┘
 *
 * 사용 예:
 *   <SettingSection title="러닝">
 *     <SettingRow title="거리 단위" value="km" onPress={...} />
 *     <SettingRow title="음성 안내" switchValue={true} onSwitch={...} />
 *   </SettingSection>
 */
import { Children, Fragment, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ChevronRightIcon } from '@/components/common/icons';
import { Toggle } from '@/components/common/toggle';
import { Palette } from '@/constants/theme';

export function SettingSection({ title, children }: { title?: string; children: ReactNode }) {
  // Children.toArray: 안에 넣은 줄들을 배열로 바꿔서, 줄과 줄 사이에만 구분선을 넣어요.
  const rows = Children.toArray(children);
  return (
    <View style={styles.section}>
      {title && <Text style={styles.sectionTitle}>{title}</Text>}
      <View style={styles.card}>
        {rows.map((row, index) => (
          <Fragment key={index}>
            {index > 0 && <View style={styles.divider} />}
            {row}
          </Fragment>
        ))}
      </View>
    </View>
  );
}

type RowProps = {
  title: string;
  description?: string; // 이름 아래 작은 설명 (예: "멈추면 기록도 잠시 멈춰요")
  value?: string; // 오른쪽 회색 값 (예: "km", "1.0.0")
  danger?: boolean; // 빨간 글씨 (회원 탈퇴)
  onPress?: () => void; // 있으면 오른쪽에 > 화살표가 생기고 누를 수 있어요
  switchValue?: boolean; // 있으면 오른쪽에 스위치가 생겨요
  onSwitch?: (next: boolean) => void;
  disabled?: boolean; // 흐리게 보이고 누를 수 없음 (푸시 알림 전체가 꺼졌을 때)
};

export function SettingRow({
  title,
  description,
  value,
  danger,
  onPress,
  switchValue,
  onSwitch,
  disabled,
}: RowProps) {
  const hasSwitch = switchValue !== undefined;

  return (
    <Pressable
      style={[styles.row, description ? styles.rowTall : null, disabled && styles.disabled]}
      // 스위치 줄은 줄 전체를 눌러도 스위치가 바뀌게 했어요 (손가락으로 누르기 편하게)
      onPress={hasSwitch ? () => onSwitch?.(!switchValue) : onPress}
      disabled={disabled || (!onPress && !hasSwitch)}
      accessibilityRole={hasSwitch ? 'switch' : onPress ? 'button' : undefined}
      accessibilityState={hasSwitch ? { checked: switchValue, disabled } : { disabled }}>
      <View style={styles.texts}>
        <Text style={[styles.title, danger && styles.danger]}>{title}</Text>
        {description && <Text style={styles.description}>{description}</Text>}
      </View>

      {value && <Text style={styles.value}>{value}</Text>}

      {/* 직접 만든 스위치 (components/common/toggle.tsx). 켜고 끌 때 부드럽게 움직여요 */}
      {hasSwitch && <Toggle value={switchValue} onChange={onSwitch} disabled={disabled} />}

      {onPress && !hasSwitch && <ChevronRightIcon color={Palette.hint} size={18} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: Palette.hint,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    backgroundColor: Palette.border,
  },
  // 줄 높이: 이름만 있는 줄 44, 설명이 있는 줄 52 (위아래 여백 10)
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 44,
    paddingVertical: 10,
    paddingLeft: 18,
    paddingRight: 14,
  },
  rowTall: {
    minHeight: 52,
  },
  disabled: {
    opacity: 0.4,
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: Palette.ink,
  },
  danger: {
    color: Palette.alert,
  },
  description: {
    fontSize: 12,
    color: Palette.hint,
  },
  value: {
    fontSize: 13,
    fontWeight: '500',
    color: Palette.hint,
  },
});
