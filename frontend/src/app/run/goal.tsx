/**
 * 목표 정하기 (Figma: 목표 정하고 달리기 - 선택 없음 / 거리 / 시간 / 거리+시간)
 *
 * - 거리 · 시간 카드를 눌러 체크하면 휠이 열려요. 하나만 골라도, 둘 다 골라도 돼요.
 *   거리: km 휠 + m 휠(100m 단위), 자주 쓰는 거리(3 · 5 · 10km), 마라톤(하프 · 풀)
 *   시간: 분 휠 + 초 휠(10초 단위), 자주 쓰는 시간(20 · 30 · 45분, 1시간)
 * - 둘 다 고르면 "목표 페이스"가 자동으로 계산돼요. (시간 ÷ 거리)
 * - "이 목표로 시작하기": 위치를 확인하고(use-location-check) 목표를 넣은 뒤 카운트다운으로 가요.
 *   아무것도 안 고르면 버튼이 회색이고 눌리지 않아요.
 *
 * 목표 거리는 설정의 거리 단위와 상관없이 km로 정해요. (Figma 기준)
 *
 * 부드러운 움직임 (react-native-reanimated)
 * - 카드를 체크하면 카드 높이가 0.4초 동안 늘어나고(처음엔 빠르게, 끝에서 천천히 멈추게), 안의 휠 · 칩은 서서히 나타나요. (LinearTransition, FadeIn)
 * - 아래 카드 · 페이스 카드도 갑자기 튀지 않고 미끄러지듯 자리를 옮겨요.
 * - 목표 페이스 카드와 안내 문구는 갑자기 사라지지 않고 높이 · 진하기가 함께 줄어들며 접혀요. (Collapse)
 *   (체크 해제, 시간 0분, 거리 0km 모두 같은 방식)
 *
 * 시작 버튼 뒤 가림막 (BottomFade)
 * - 버튼 조금 위부터 화면 아래까지: 위쪽은 흐리게(블러, expo-blur), 버튼 근처로 갈수록 배경색으로 완전히 덮어서
 *   스크롤되는 내용이 버튼 뒤로 비쳐 보이지 않게 해요.
 * - 블러는 얇은 층 여러 장을 계단처럼 겹쳐서, 맨 위는 아주 약하고 아래로 갈수록 세져요 (경계선이 안 보이게)
 * - 안드로이드는 블러할 내용(ScrollView)을 BlurTargetView로 감싸야 진짜 블러가 돼요.
 */
import { router } from 'expo-router';
import { BlurTargetView, BlurView } from 'expo-blur';
import { useEffect, useRef, useState, type ComponentRef, type ReactNode, type RefObject } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { CheckIcon, ChevronLeftIcon, CloseIcon, PlayIcon } from '@/components/common/icons';
import { WheelPicker } from '@/components/common/wheel-picker';
import { Palette } from '@/constants/theme';
import { useLocationCheck } from '@/hooks/use-location-check';
import { useRunSession } from '@/hooks/use-run-session';
import { formatGoalKm, formatKoreanDuration, formatPaceSec } from '@/utils/run-format';

// 휠에 들어갈 값들
const KM_ITEMS = Array.from({ length: 43 }, (_, i) => String(i)); // 0 ~ 42km
const M_ITEMS = Array.from({ length: 10 }, (_, i) => String(i * 100).padStart(3, '0')); // 000 ~ 900m
const MIN_ITEMS = Array.from({ length: 300 }, (_, i) => String(i)); // 0 ~ 299분
const SEC_ITEMS = Array.from({ length: 6 }, (_, i) => String(i * 10).padStart(2, '0')); // 00 ~ 50초

const DISTANCE_CHIPS = [3000, 5000, 10000];
const MARATHON_CHIPS = [
  { label: '하프', meters: 21097.5 },
  { label: '풀', meters: 42195 },
];
// 시작 버튼 높이(대략)와, 버튼 위로 서서히 가려지는 구간의 높이
const START_BUTTON_HEIGHT = 80;
const FADE_ABOVE_BUTTON = 56;
// 블러 층 수와, 맨 아래(가장 흐린 곳)의 블러 세기
const BLUR_LAYERS = 6;
const BLUR_MAX = 18;

// 카드가 늘어나고 줄어드는 속도 (0.4초)
// 처음엔 빠르게 열리다가 끝에 다다를수록 천천히 멈추는 움직임 (ease-out cubic 곡선)
// Easing.bezier로 써야 폰과 웹(브라우저) 모두 같은 곡선으로 움직여요
const EASE_OUT = Easing.bezier(0.33, 1, 0.68, 1);
const LAYOUT = LinearTransition.duration(400).easing(EASE_OUT);
const SHOW = FadeIn.duration(350).easing(EASE_OUT); // 안의 내용이 나타날 때

const TIME_CHIPS = [
  { label: '20분', sec: 20 * 60 },
  { label: '30분', sec: 30 * 60 },
  { label: '45분', sec: 45 * 60 },
  { label: '1시간', sec: 60 * 60 },
];

export default function RunGoalScreen() {
  const insets = useSafeAreaInsets();
  const { setGoal } = useRunSession();
  const blurTarget = useRef<ComponentRef<typeof View>>(null); // 안드로이드 블러가 흐리게 할 대상(스크롤 내용)
  // 가림막 높이 = 버튼 아래 여백 + 버튼 + 버튼 위 서서히 가려지는 구간
  const fadeHeight = insets.bottom + 16 + START_BUTTON_HEIGHT + FADE_ABOVE_BUTTON;

  const [distanceOn, setDistanceOn] = useState(false);
  const [timeOn, setTimeOn] = useState(false);
  const [distanceM, setDistanceM] = useState(5000); // 처음 값 5km
  const [timeSec, setTimeSec] = useState(30 * 60); // 처음 값 30분

  // 휠에 보여 줄 값 (하프 21097.5m는 21km · 100m 칸에 맞춰 보여요)
  const km = Math.floor(distanceM / 1000);
  const m = Math.round((distanceM % 1000) / 100) * 100;
  const min = Math.floor(timeSec / 60);
  const sec = timeSec % 60;

  // 둘 다 골랐을 때만 페이스를 계산해요 (1km를 몇 초에 달려야 하는지)
  const paceSecPerKm = distanceOn && timeOn && distanceM > 0 ? timeSec / (distanceM / 1000) : null;
  // 페이스 카드가 접히며 사라지는 동안에도 숫자가 비지 않게, 마지막으로 보인 페이스를 기억해요
  const [shownPace, setShownPace] = useState(paceSecPerKm);
  if (paceSecPerKm && paceSecPerKm !== shownPace) setShownPace(paceSecPerKm);

  // 0km나 0분을 고르면 목표로 쓸 수 없어요
  const distanceOk = distanceOn && distanceM > 0;
  const timeOk = timeOn && timeSec > 0;
  const canStart = (distanceOn || timeOn) && (!distanceOn || distanceOk) && (!timeOn || timeOk);

  const summary = [
    distanceOn && formatGoalKm(distanceM),
    timeOn && formatKoreanDuration(timeSec),
    paceSecPerKm && `페이스 ${formatPaceSec(paceSecPerKm)}/km`,
  ]
    .filter(Boolean)
    .join(' · ');

  const { check, dialogs } = useLocationCheck(() => {
    setGoal({ distanceM: distanceOn ? distanceM : null, timeSec: timeOn ? timeSec : null });
    router.push('/run/countdown');
  });

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <View style={styles.topBar}>
        <Pressable style={styles.iconButton} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="뒤로 가기">
          <ChevronLeftIcon color={Palette.ink} size={24} />
        </Pressable>
        <Pressable style={styles.iconButton} onPress={() => router.dismissTo('/')} accessibilityRole="button" accessibilityLabel="닫기">
          <CloseIcon color={Palette.ink} size={22} />
        </Pressable>
      </View>

      <BlurTargetView ref={blurTarget} style={styles.fill}>
        {/* 맨 아래 내용도 가림막 위로 올라와 보이도록 가림막 높이만큼 아래 여백을 둬요 */}
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: fadeHeight + 8 }]}>
          <View style={styles.titleBox}>
            <Text style={styles.title}>목표 정하기</Text>
            <Text style={styles.subtitle}>거리와 시간 중 하나만 골라도, 둘 다 골라도 돼요</Text>
          </View>

          {/* 거리 카드 */}
          <GoalCard
            title="거리"
            description="얼마나 멀리 달릴까요"
            checked={distanceOn}
            onToggle={() => setDistanceOn(!distanceOn)}
            value={(distanceM / 1000).toFixed(1)}
            unit="km">
            <WheelPicker
              columns={[
                // 다른 칸 값은 "지금 값"(d)에서 꺼내요. 화면을 그릴 때의 값(km, m)을 쓰면 그사이 칩으로 바뀐 값을 덮어써요
                { items: KM_ITEMS, selected: String(km), onSelect: (v) => setDistanceM((d) => Number(v) * 1000 + Math.round((d % 1000) / 100) * 100), unit: 'km' },
                { items: M_ITEMS, selected: String(m).padStart(3, '0'), onSelect: (v) => setDistanceM((d) => Math.floor(d / 1000) * 1000 + Number(v)), unit: 'm' },
              ]}
            />
            <Text style={styles.chipTitle}>자주 쓰는 거리</Text>
            <View style={styles.chips}>
              {DISTANCE_CHIPS.map((meters) => (
                <Chip key={meters} label={`${meters / 1000}km`} selected={distanceM === meters} onPress={() => setDistanceM(meters)} />
              ))}
            </View>
            <Text style={styles.chipTitle}>마라톤</Text>
            <View style={styles.chips}>
              {MARATHON_CHIPS.map((chip) => (
                <Chip
                  key={chip.label}
                  label={chip.label}
                  sub={`${chip.meters / 1000}km`}
                  selected={distanceM === chip.meters}
                  onPress={() => setDistanceM(chip.meters)}
                />
              ))}
            </View>
          </GoalCard>

          {/* 시간 카드 */}
          <GoalCard
            title="시간"
            description="얼마나 오래 달릴까요"
            checked={timeOn}
            onToggle={() => setTimeOn(!timeOn)}
            value={String(min)}
            unit={sec > 0 ? `분 ${sec}초` : '분'}>
            <WheelPicker
              columns={[
                { items: MIN_ITEMS, selected: String(min), onSelect: (v) => setTimeSec((t) => Number(v) * 60 + (t % 60)), unit: '분' },
                { items: SEC_ITEMS, selected: String(sec).padStart(2, '0'), onSelect: (v) => setTimeSec((t) => Math.floor(t / 60) * 60 + Number(v)), unit: '초' },
              ]}
            />
            <Text style={styles.chipTitle}>자주 쓰는 시간</Text>
            <View style={styles.chips}>
              {TIME_CHIPS.map((chip) => (
                <Chip key={chip.label} label={chip.label} selected={timeSec === chip.sec} onPress={() => setTimeSec(chip.sec)} />
              ))}
            </View>
          </GoalCard>

          {/* 페이스 카드 ↔ 안내 문구: 하나가 접히는 동안 다른 하나가 펼쳐져요 */}
          <Animated.View layout={LAYOUT}>
            <Collapse open={!!paceSecPerKm}>
              <View style={styles.paceCard}>
                <Text style={styles.paceLabel}>목표 페이스</Text>
                <View style={styles.paceRight}>
                  <Text style={styles.paceValue}>
                    {shownPace ? formatPaceSec(shownPace) : ''}
                    <Text style={styles.paceUnit}> /km</Text>
                  </Text>
                  <Text style={styles.paceAuto}>자동 계산</Text>
                </View>
              </View>
            </Collapse>
            <Collapse open={!paceSecPerKm}>
              <Text style={styles.footnote}>거리와 시간을 모두 고르면 페이스가 자동으로 계산돼요</Text>
            </Collapse>
          </Animated.View>
        </ScrollView>
      </BlurTargetView>

      <BottomFade height={fadeHeight} blurTarget={blurTarget} />

      {/* 아래 고정 시작 버튼 */}
      <Pressable
        style={[styles.startButton, { bottom: insets.bottom + 16 }, !canStart && styles.startButtonOff]}
        onPress={check}
        disabled={!canStart}
        accessibilityRole="button"
        accessibilityState={{ disabled: !canStart }}
        accessibilityLabel="이 목표로 시작하기">
        <View style={styles.startTexts}>
          <Text style={[styles.startTitle, !canStart && styles.startTextOff]}>이 목표로 시작하기</Text>
          <Text style={[styles.startSummary, !canStart && styles.startTextOff]}>
            {canStart ? summary : '거리나 시간을 하나 이상 골라주세요'}
          </Text>
        </View>
        <View style={[styles.startIcon, !canStart && styles.startIconOff]}>
          <PlayIcon color={canStart ? Palette.accent : Palette.surface} size={18} />
        </View>
      </Pressable>

      {dialogs}
    </View>
  );
}

/**
 * 시작 버튼 뒤 가림막: 블러 위에 배경색을 "투명 → 불투명"으로 덮어요.
 * 버튼 윗선 조금 위에서 완전히 불투명해져서, 버튼 근처에서는 뒤 내용이 전혀 안 보여요.
 */
function BottomFade({ height, blurTarget }: { height: number; blurTarget: RefObject<ComponentRef<typeof View> | null> }) {
  // 0(맨 위)에서 opaqueAt(버튼 윗선보다 살짝 위)까지 서서히 진해지고, 그 아래는 완전히 덮어요
  const opaqueAt = (FADE_ABOVE_BUTTON * 0.85) / height;
  const blurZone = opaqueAt * height; // 블러가 보이는 구간 (그 아래는 배경색으로 덮여요)
  return (
    <View style={[styles.fade, { height }]} pointerEvents="none">
      {/* 층 i는 위에서 (i / 층 수)만큼 내려온 곳부터 시작해요. 아래로 갈수록 겹친 층이 많아서 더 흐려져요 */}
      {Array.from({ length: BLUR_LAYERS }, (_, i) => (
        <BlurView
          key={i}
          style={[StyleSheet.absoluteFill, { top: (blurZone * i) / BLUR_LAYERS }]}
          // 아이폰 · 웹은 겹친 블러가 쌓여서 같은 세기로 충분하고,
          // 안드로이드는 위 층이 아래 층을 덮어 버려서(쌓이지 않음) 층마다 세기를 올려요
          intensity={Platform.OS === 'android' ? (BLUR_MAX * (i + 1)) / BLUR_LAYERS : BLUR_MAX / BLUR_LAYERS}
          tint="light"
          blurTarget={blurTarget}
          blurMethod="dimezisBlurViewSdk31Plus" // 안드로이드 12 이상에서 진짜 블러 (그 아래 버전은 반투명)
        />
      ))}
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <LinearGradient id="bottomFade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={Palette.background} stopOpacity={0} />
            <Stop offset={opaqueAt} stopColor={Palette.background} stopOpacity={1} />
            <Stop offset="1" stopColor={Palette.background} stopOpacity={1} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#bottomFade)" />
      </Svg>
    </View>
  );
}

/**
 * 열고 닫을 때 높이 · 진하기가 함께 부드럽게 바뀌는 상자 (카드 열림과 같은 0.4초 ease-out)
 * 안의 내용 높이를 재 두고(onLayout), 바깥 상자 높이를 0 ↔ 그 높이로 움직여요. 닫힌 동안에도 내용은 남아 있어서
 * 사라지는 도중에 글자가 먼저 없어지지 않아요.
 */
function Collapse({ open, children }: { open: boolean; children: ReactNode }) {
  const contentHeight = useSharedValue(0); // 안의 내용 높이
  const progress = useSharedValue(open ? 1 : 0); // 0: 닫힘, 1: 열림

  useEffect(() => {
    progress.set(withTiming(open ? 1 : 0, { duration: 400, easing: EASE_OUT }));
  }, [open, progress]);

  const style = useAnimatedStyle(() => ({
    height: contentHeight.get() * progress.get(),
    opacity: progress.get(),
  }));

  return (
    <Animated.View style={[styles.collapse, style]} pointerEvents={open ? 'auto' : 'none'}>
      {/* 바깥 높이와 상관없이 원래 높이를 재려고, 안쪽은 위에 붙여 놓아요 */}
      <View style={styles.collapseInner} onLayout={(e) => contentHeight.set(e.nativeEvent.layout.height)}>
        {children}
      </View>
    </Animated.View>
  );
}

/** 거리 · 시간 카드. 위쪽 줄을 누르면 체크되고, 체크되면 아래 내용(휠 · 칩)이 열려요 */
function GoalCard({
  title,
  description,
  checked,
  onToggle,
  value,
  unit,
  children,
}: {
  title: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
  value: string;
  unit: string;
  children: ReactNode;
}) {
  return (
    <Animated.View style={styles.card} layout={LAYOUT}>
      <Pressable
        style={styles.cardHeader}
        onPress={onToggle}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        accessibilityLabel={`${title} 목표`}>
        <View style={[styles.checkbox, checked && styles.checkboxOn]}>{checked && <CheckIcon color={Palette.ink} size={16} />}</View>
        <View style={styles.cardTexts}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardDescription}>{description}</Text>
        </View>
        <Text style={[styles.cardValue, !checked && styles.cardValueOff]}>
          {value}
          <Text style={styles.cardUnit}> {unit}</Text>
        </Text>
      </Pressable>
      {checked && (
        <Animated.View style={styles.cardBody} entering={SHOW} exiting={FadeOut.duration(150)}>
          {children}
        </Animated.View>
      )}
    </Animated.View>
  );
}

/** 자주 쓰는 값 칩. 고른 칩은 노랗게 보여요 */
function Chip({ label, sub, selected, onPress }: { label: string; sub?: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      style={[styles.chip, selected && styles.chipOn]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}>
      <Text style={[styles.chipLabel, selected && styles.chipLabelOn]}>{label}</Text>
      {sub && <Text style={styles.chipSub}>{sub}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    gap: 12,
    paddingHorizontal: 24,
  },
  titleBox: {
    gap: 6,
    marginTop: 12,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.6,
    color: Palette.ink,
  },
  subtitle: {
    fontSize: 14,
    color: Palette.muted,
  },
  card: {
    overflow: 'hidden', // 카드가 늘어나는 동안 안의 내용이 카드 밖으로 삐져나오지 않게
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 18,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Palette.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: {
    borderColor: Palette.accent,
    backgroundColor: Palette.accent,
  },
  cardTexts: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Palette.ink,
  },
  cardDescription: {
    fontSize: 12,
    color: Palette.muted,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: '800',
    color: Palette.ink,
  },
  cardValueOff: {
    color: Palette.hint,
  },
  cardUnit: {
    fontSize: 13,
    fontWeight: '500',
    color: Palette.muted,
  },
  cardBody: {
    gap: 10,
    paddingHorizontal: 18,
    paddingBottom: 18,
  },
  chipTitle: {
    marginTop: 6,
    fontSize: 12,
    color: Palette.muted,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#E9EBF0',
  },
  chipOn: {
    backgroundColor: Palette.accent,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Palette.muted,
  },
  chipLabelOn: {
    fontWeight: '800',
    color: Palette.ink,
  },
  chipSub: {
    fontSize: 12,
    color: Palette.hint,
  },
  paceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderRadius: 20,
    backgroundColor: Palette.ink,
  },
  paceLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Palette.surface,
  },
  paceRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  paceValue: {
    fontSize: 24,
    fontWeight: '800',
    color: Palette.accent,
  },
  paceUnit: {
    fontSize: 13,
    fontWeight: '500',
    color: '#C9CBD1',
  },
  paceAuto: {
    fontSize: 11,
    color: '#9AA0AA',
  },
  collapse: {
    overflow: 'hidden',
  },
  collapseInner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  footnote: {
    marginTop: 4,
    fontSize: 12,
    color: Palette.hint,
  },
  fill: {
    flex: 1,
  },
  fade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  startButton: {
    position: 'absolute',
    left: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingLeft: 22,
    paddingRight: 14,
    borderRadius: 24,
    backgroundColor: Palette.accent,
  },
  startButtonOff: {
    backgroundColor: '#E4E6EB',
  },
  startTexts: {
    flex: 1,
    gap: 4,
  },
  startTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Palette.ink,
  },
  startSummary: {
    fontSize: 13,
    color: Palette.ink,
  },
  startTextOff: {
    color: Palette.muted,
  },
  startIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.ink,
  },
  startIconOff: {
    backgroundColor: '#C9CBD1',
  },
});
