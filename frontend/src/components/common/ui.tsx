// 코스 추천 · 친구와 러닝 · 크루 화면에서 같이 쓰는 기본 부품 (피그마 공통 규칙)
import { router } from 'expo-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  BackIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  MinusIcon,
  PlusIcon,
} from '@/components/common/icons';
import { AvatarColors, Palette } from '@/constants/theme';

// ---------- 화면 틀 ----------

/** 탭 화면이 아닌 하위 화면: 위 여백 + 스크롤 + (있으면) 아래 고정 버튼 바 */
export function SubScreen({
  header,
  children,
  bottom,
  scroll = true,
  contentStyle,
  overlay,
}: {
  header?: ReactNode;
  children: ReactNode;
  bottom?: ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  overlay?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const body = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.subContent, contentStyle]}
      showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, styles.subContent, contentStyle]}>{children}</View>
  );
  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
      {header ? <View style={styles.subHeader}>{header}</View> : null}
      {body}
      {bottom ? <BottomBar>{bottom}</BottomBar> : null}
      {overlay}
    </View>
  );
}

/** 탭 메인 화면: 큰 제목 + 설명 + 오른쪽 버튼 */
export function TabHeader({
  title,
  caption,
  right,
}: {
  title: string;
  caption: string;
  right?: ReactNode;
}) {
  return (
    <View style={styles.tabHeader}>
      <View style={styles.gap4}>
        <Text style={styles.tabTitle}>{title}</Text>
        <Text style={styles.tabCaption}>{caption}</Text>
      </View>
      {right ? <View style={styles.row8}>{right}</View> : null}
    </View>
  );
}

/** 상단 바. boxed = 테두리 있는 44px 버튼(코스·친구), plain = 화살표만(크루) */
export function TopBar({
  title,
  variant = 'boxed',
  onBack,
  right,
  close,
}: {
  title?: string;
  variant?: 'boxed' | 'plain';
  onBack?: () => void;
  right?: ReactNode;
  close?: boolean;
}) {
  const back = onBack ?? (() => router.back());
  return (
    <View style={styles.topBar}>
      {variant === 'boxed' ? (
        <IconButton label="뒤로" onPress={back}>
          <ChevronLeftIcon color={Palette.ink} />
        </IconButton>
      ) : (
        <Pressable
          onPress={back}
          style={styles.plainBack}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={close ? '닫기' : '뒤로'}>
          {close ? <CloseIcon color={Palette.ink} size={22} /> : <BackIcon color={Palette.ink} />}
        </Pressable>
      )}
      {title ? (
        <Text style={variant === 'boxed' ? styles.topTitle : styles.topTitlePlain} numberOfLines={1}>
          {title}
        </Text>
      ) : null}
      <View style={variant === 'boxed' ? styles.topRight : styles.plainBack}>{right}</View>
    </View>
  );
}

/** 44px 둥근 네모 버튼 (필터·검색·친구 추가 등) */
export function IconButton({
  children,
  onPress,
  label,
  badge,
  style,
}: {
  children: ReactNode;
  onPress?: () => void;
  label: string;
  badge?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.iconButton, pressed && styles.pressed, style]}
      accessibilityRole="button"
      accessibilityLabel={label}>
      {children}
      {badge ? (
        <View style={styles.iconBadge}>
          <Text style={styles.iconBadgeText}>{badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

/** 섹션 제목 + 설명 + 더보기 */
export function SectionTitle({
  title,
  caption,
  more,
  onMore,
  size = 18,
}: {
  title: string;
  caption?: string;
  more?: string;
  onMore?: () => void;
  size?: number;
}) {
  return (
    <View style={styles.sectionTitle}>
      <Text style={[styles.sectionTitleText, { fontSize: size }]}>{title}</Text>
      <Text style={styles.sectionCaption} numberOfLines={1}>
        {caption ?? ''}
      </Text>
      {onMore ? <MoreLink label={more ?? '더보기'} onPress={onMore} /> : null}
    </View>
  );
}

export function MoreLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.moreLink} hitSlop={8} accessibilityRole="button">
      <Text style={styles.moreText}>{label}</Text>
      <ChevronRightIcon color={Palette.muted} />
    </Pressable>
  );
}

// ---------- 카드 ----------

export function Card({
  children,
  style,
  onPress,
  tone = 'surface',
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  tone?: 'surface' | 'white' | 'dark';
}) {
  const toneStyle = tone === 'dark' ? styles.cardDark : tone === 'white' ? styles.cardWhite : null;
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.card, toneStyle, style, pressed && styles.pressed]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, toneStyle, style]}>{children}</View>;
}

/** 카드 안 제목 (크루 화면 굵은 15px) */
export function CardHeading({ children }: { children: string }) {
  return <Text style={styles.cardHeading}>{children}</Text>;
}

/** 왼쪽 이름 · 오른쪽 값 한 줄 (모임 정보 등) */
export function InfoRows({ rows }: { rows: { label: string; value: ReactNode }[] }) {
  return (
    <View>
      {rows.map((row, index) => (
        <View key={row.label}>
          {index > 0 ? <View style={styles.divider} /> : null}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{row.label}</Text>
            {typeof row.value === 'string' ? (
              <Text style={styles.infoValue}>{row.value}</Text>
            ) : (
              row.value
            )}
          </View>
        </View>
      ))}
    </View>
  );
}

// ---------- 작은 표시 ----------

/** 이름 첫 글자 동그라미 */
export function Avatar({
  name,
  size = 44,
  color,
  status,
  ring,
}: {
  name: string;
  size?: number;
  color?: string;
  status?: 'running' | 'online' | 'offline';
  ring?: string;
}) {
  const letter = name.startsWith('+') ? name : name.slice(0, 1);
  const bg = color ?? AvatarColors[letter] ?? Palette.chip;
  return (
    <View style={{ width: size, height: size }}>
      <View
        style={[
          styles.avatar,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: bg },
          ring ? { borderWidth: 2, borderColor: ring } : null,
        ]}>
        <Text
          style={[
            styles.avatarText,
            { fontSize: letter.length > 1 ? size * 0.34 : size * 0.41 },
          ]}>
          {letter}
        </Text>
      </View>
      {status ? (
        <View
          style={[
            styles.status,
            {
              backgroundColor:
                status === 'running' ? Palette.accent : status === 'online' ? '#22C55E' : '#C9CBD1',
            },
          ]}
        />
      ) : null}
    </View>
  );
}

/** 겹쳐 놓은 아바타 묶음 */
export function AvatarStack({
  names,
  size = 34,
  overlap = 10,
  extra,
  ring = Palette.surface,
}: {
  names: string[];
  size?: number;
  overlap?: number;
  extra?: string;
  ring?: string;
}) {
  return (
    <View style={styles.row}>
      {names.map((name, index) => (
        <View key={`${name}-${index}`} style={{ marginRight: -overlap }}>
          <Avatar name={name} size={size} ring={ring} />
        </View>
      ))}
      {extra ? <Avatar name={extra} size={size} color={Palette.divider} ring={ring} /> : null}
    </View>
  );
}

/** 작은 배지 (초급, 평지 등) */
export function Tag({
  label,
  bg = Palette.chip,
  color = Palette.inkSoft,
  bold,
  size = 11,
  style,
}: {
  label: string;
  bg?: string;
  color?: string;
  bold?: boolean;
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.tag, { backgroundColor: bg }, style]}>
      <Text style={[styles.tagText, { color, fontSize: size, fontWeight: bold ? '700' : '500' }]}>
        {label}
      </Text>
    </View>
  );
}

/** 검은 바탕 노란 글씨 알약 (D-3, 모집 중) */
export function DarkPill({ label, size = 11 }: { label: string; size?: number }) {
  return (
    <View style={styles.darkPill}>
      <Text style={[styles.darkPillText, { fontSize: size }]}>{label}</Text>
    </View>
  );
}

/** 고를 수 있는 칩. 선택되면 검정 */
export function Chip({
  label,
  selected,
  onPress,
  size = 'md',
  selectedTextColor = Palette.white,
  style,
  textStyle,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  size?: 'sm' | 'md' | 'lg';
  selectedTextColor?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}) {
  const pad = size === 'lg' ? styles.chipLg : size === 'sm' ? styles.chipSm : styles.chipMd;
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, pad, selected ? styles.chipOn : styles.chipOff, style]}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}>
      <Text
        style={[
          styles.chipText,
          { fontSize: size === 'lg' ? 14 : size === 'sm' ? 12 : 13 },
          selected ? { color: selectedTextColor, fontWeight: '700' } : null,
          textStyle,
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

// ---------- 버튼 ----------

type ButtonTone = 'dark' | 'lime' | 'outline' | 'gray' | 'darkLime' | 'danger';

export function Button({
  label,
  onPress,
  tone = 'dark',
  icon,
  height = 54,
  radius = 16,
  flex,
  disabled,
  style,
  fontSize = 15,
}: {
  label: string;
  onPress?: () => void;
  tone?: ButtonTone;
  icon?: (color: string) => ReactNode;
  height?: number;
  radius?: number;
  flex?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  fontSize?: number;
}) {
  const tones: Record<ButtonTone, { bg: string; text: string; border?: string }> = {
    dark: { bg: Palette.ink, text: Palette.white },
    darkLime: { bg: Palette.ink, text: Palette.accent },
    lime: { bg: Palette.accent, text: Palette.ink },
    outline: { bg: Palette.white, text: Palette.ink, border: Palette.border },
    gray: { bg: Palette.chip, text: Palette.inkSoft },
    danger: { bg: Palette.white, text: Palette.alert, border: Palette.border },
  };
  const t = tones[tone];
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        styles.button,
        {
          height,
          borderRadius: radius,
          backgroundColor: disabled ? Palette.divider : t.bg,
          borderWidth: t.border ? 1 : 0,
          borderColor: t.border,
        },
        flex && styles.flex,
        pressed && !disabled && styles.pressed,
        style,
      ]}>
      {icon ? icon(disabled ? Palette.hint : t.text) : null}
      <Text style={[styles.buttonText, { color: disabled ? Palette.hint : t.text, fontSize }]}>
        {label}
      </Text>
    </Pressable>
  );
}

/** 화면 맨 아래 고정 바 */
export function BottomBar({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 14) + 8 }]}>
      {children}
    </View>
  );
}

/** − 값 + 조절기 */
export function Stepper({
  value,
  onMinus,
  onPlus,
  tone = 'light',
}: {
  value: string;
  onMinus: () => void;
  onPlus: () => void;
  tone?: 'light' | 'gray';
}) {
  const bg = tone === 'gray' ? Palette.chip : Palette.background;
  return (
    <View style={styles.stepper}>
      <Pressable
        onPress={onMinus}
        style={[styles.stepperButton, { backgroundColor: bg }]}
        accessibilityRole="button"
        accessibilityLabel="줄이기">
        <MinusIcon color={Palette.ink} size={16} />
      </Pressable>
      <Text style={styles.stepperValue}>{value}</Text>
      <Pressable
        onPress={onPlus}
        style={[styles.stepperButton, { backgroundColor: bg }]}
        accessibilityRole="button"
        accessibilityLabel="늘리기">
        <PlusIcon color={Palette.ink} size={16} />
      </Pressable>
    </View>
  );
}

/** 켜고 끄는 스위치 (피그마: 검정 바탕 + 노란 동그라미) */
export function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <Pressable
      onPress={() => onChange(!value)}
      style={[styles.toggle, { backgroundColor: value ? Palette.ink : Palette.border }]}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}>
      <View
        style={[
          styles.toggleKnob,
          value ? { alignSelf: 'flex-end', backgroundColor: Palette.accent } : { backgroundColor: Palette.white },
        ]}
      />
    </Pressable>
  );
}

// ---------- 시트 · 팝업 · 토스트 ----------

/** 아래에서 올라오는 시트 */
export function Sheet({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.sheetRoot}>
        <Pressable style={styles.dim} onPress={onClose} accessibilityLabel="닫기" />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.sheetBody, { paddingBottom: Math.max(insets.bottom, 14) + 20 }]}>
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/** 가운데 확인 팝업 */
export function ConfirmDialog({
  visible,
  title,
  message,
  cancelLabel = '취소',
  confirmLabel,
  danger,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  title: string;
  message: string;
  cancelLabel?: string;
  confirmLabel: string;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <View style={styles.dialogRoot}>
        <Pressable style={styles.dim} onPress={onCancel} accessibilityLabel="닫기" />
        <View style={styles.dialog}>
          <Text style={styles.dialogTitle}>{title}</Text>
          <Text style={styles.dialogMessage}>{message}</Text>
          <View style={styles.row8}>
            <Button label={cancelLabel} tone="gray" height={48} radius={14} flex onPress={onCancel} />
            <Button
              label={confirmLabel}
              tone={danger ? 'dark' : 'dark'}
              height={48}
              radius={14}
              flex
              onPress={onConfirm}
              style={danger ? { backgroundColor: Palette.alert } : undefined}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

/** 잠깐 떴다 사라지는 검은 안내 줄. show(문구) 로 띄운다 */
export function useToast() {
  const [toast, setToast] = useState<{ text: string; action?: { label: string; onPress: () => void } } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  const show = (text: string, action?: { label: string; onPress: () => void }) => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ text, action });
    timer.current = setTimeout(() => setToast(null), 2600);
  };
  const node = toast ? <ToastView text={toast.text} action={toast.action} /> : null;
  return { show, node };
}

function ToastView({ text, action }: { text: string; action?: { label: string; onPress: () => void } }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }).start();
  }, [opacity]);
  return (
    <Animated.View
      pointerEvents="box-none"
      style={[styles.toast, { opacity, bottom: Math.max(insets.bottom, 14) + 96 }]}>
      <Text style={styles.toastText} numberOfLines={1}>
        {text}
      </Text>
      {action ? (
        <Pressable onPress={action.onPress} hitSlop={8} accessibilityRole="button">
          <Text style={styles.toastAction}>{action.label}</Text>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

/** 완료 · 안내 화면 (가운데 큰 동그라미 + 제목 + 설명) */
export function ResultScreen({
  icon,
  iconBg = Palette.accent,
  title,
  message,
  children,
  bottom,
}: {
  icon: ReactNode;
  iconBg?: string;
  title: string;
  message: string;
  children?: ReactNode;
  bottom: ReactNode;
}) {
  return (
    <SubScreen scroll={false} bottom={bottom} contentStyle={styles.resultContent}>
      <View style={[styles.resultIcon, { backgroundColor: iconBg }]}>{icon}</View>
      <Text style={styles.resultTitle}>{title}</Text>
      <Text style={styles.resultMessage}>{message}</Text>
      {children}
    </SubScreen>
  );
}

/** 비어 있을 때 안내 */
export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
    </View>
  );
}

// ---------- 스타일 ----------

export const shared = StyleSheet.create({
  // 탭 화면 공통 (아래 탭 바만큼 여백)
  tabContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 140, gap: 16 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  row: { flexDirection: 'row', alignItems: 'center' },
  label12: { fontSize: 12, color: Palette.muted },
  sheetTitle: { fontSize: 22, fontWeight: '900', color: Palette.ink },
  sheetCaption: { fontSize: 14, color: Palette.muted, marginTop: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: Palette.ink },
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pressed: { opacity: 0.75 },
  row: { flexDirection: 'row', alignItems: 'center' },
  row8: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  gap4: { gap: 4 },
  screen: { flex: 1, backgroundColor: Palette.background },
  subHeader: { paddingHorizontal: 20, paddingBottom: 8 },
  subContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 140, gap: 16 },
  tabHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tabTitle: { fontSize: 28, fontWeight: '900', color: Palette.ink },
  tabCaption: { fontSize: 13, color: Palette.muted },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  topTitle: { fontSize: 16, fontWeight: '700', color: Palette.ink, flexShrink: 1 },
  topTitlePlain: { fontSize: 18, fontWeight: '700', color: Palette.ink, flexShrink: 1 },
  topRight: { minWidth: 44, height: 44, alignItems: 'flex-end', justifyContent: 'center' },
  plainBack: { width: 64, height: 44, justifyContent: 'center' },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadge: {
    position: 'absolute',
    left: 24,
    top: 6,
    minWidth: 18,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 9,
    backgroundColor: Palette.alert,
    alignItems: 'center',
  },
  iconBadgeText: { fontSize: 10, fontWeight: '700', color: Palette.white },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitleText: { fontWeight: '700', color: Palette.ink },
  sectionCaption: { flex: 1, fontSize: 12, color: Palette.muted },
  moreLink: { flexDirection: 'row', alignItems: 'center' },
  moreText: { fontSize: 13, fontWeight: '500', color: Palette.muted },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
    padding: 18,
  },
  cardWhite: { backgroundColor: Palette.white },
  cardDark: { backgroundColor: Palette.darkCard, borderWidth: 0 },
  cardHeading: { fontSize: 15, fontWeight: '900', color: Palette.ink, paddingTop: 4, paddingBottom: 4 },
  divider: { height: 1, backgroundColor: Palette.divider },
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 11, gap: 12 },
  infoLabel: { fontSize: 13, color: Palette.muted },
  infoValue: { fontSize: 13, fontWeight: '500', color: Palette.ink, flexShrink: 1, textAlign: 'right' },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '700', color: Palette.ink },
  status: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Palette.white,
  },
  tag: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 7, alignSelf: 'flex-start' },
  tagText: {},
  darkPill: { backgroundColor: Palette.ink, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  darkPillText: { fontWeight: '700', color: Palette.accent },
  chip: { borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  chipSm: { paddingHorizontal: 12, paddingVertical: 6 },
  chipMd: { paddingHorizontal: 16, paddingVertical: 8 },
  chipLg: { paddingHorizontal: 18, paddingVertical: 9 },
  chipOn: { backgroundColor: Palette.ink, borderWidth: 1, borderColor: Palette.ink },
  chipOff: { backgroundColor: Palette.white, borderWidth: 1, borderColor: Palette.border },
  chipText: { fontWeight: '500', color: Palette.ink },
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 18 },
  buttonText: { fontWeight: '700' },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: 10,
    paddingTop: 12,
    paddingHorizontal: 20,
    backgroundColor: Palette.surface,
    borderTopWidth: 1,
    borderTopColor: Palette.border,
  },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepperButton: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  stepperValue: { fontSize: 15, fontWeight: '900', color: Palette.ink, minWidth: 36, textAlign: 'center' },
  toggle: { width: 44, height: 26, borderRadius: 13, padding: 3, justifyContent: 'center' },
  toggleKnob: { width: 20, height: 20, borderRadius: 10 },
  sheetRoot: { flex: 1, justifyContent: 'flex-end' },
  dim: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(30,31,34,0.45)' },
  sheet: {
    maxHeight: '90%',
    backgroundColor: Palette.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 28,
  },
  sheetBody: { paddingHorizontal: 20, gap: 16 },
  sheetHandle: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#C9CBD1',
  },
  dialogRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  dialog: { width: '100%', maxWidth: 340, backgroundColor: Palette.surface, borderRadius: 24, padding: 22, gap: 12 },
  dialogTitle: { fontSize: 18, fontWeight: '900', color: Palette.ink },
  dialogMessage: { fontSize: 14, lineHeight: 21, color: Palette.muted, marginBottom: 8 },
  toast: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: Palette.ink,
  },
  toastText: { flex: 1, fontSize: 14, fontWeight: '500', color: Palette.white },
  toastAction: { fontSize: 14, fontWeight: '700', color: Palette.accent },
  resultContent: { alignItems: 'center', justifyContent: 'center', gap: 14, paddingBottom: 100 },
  resultIcon: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center' },
  resultTitle: { fontSize: 22, fontWeight: '900', color: Palette.ink, textAlign: 'center' },
  resultMessage: { fontSize: 14, lineHeight: 21, color: Palette.muted, textAlign: 'center' },
  empty: { alignItems: 'center', paddingVertical: 56, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Palette.ink },
  emptyMessage: { fontSize: 14, lineHeight: 21, color: Palette.muted, textAlign: 'center' },
});
