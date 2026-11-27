/**
 * 원이 커지면서 화면이 나타나는 효과 (홈 가운데 "러닝 시작" 버튼 → 러닝 시작 화면)
 *
 * 순서
 * 1. 원 커지기 (0.45초): 버튼 자리(origin)에서 버튼 크기(반지름 40)로 시작해서 화면 네 모서리를 다 덮을 때까지 커져요.
 *    처음엔 버튼처럼 검은색이다가, 커지면서 화면 바탕색(연한 회색)으로 바뀌어요. 원 안에는 아직 아무것도 없어요.
 * 2. 내용 나오기: 원이 거의 다 커질 즈음부터 내용이 위에서부터 차례로, 살짝 아래에서 올라오며 나타나요 (RevealItem).
 *
 * 쓰는 법: 화면 전체를 <CircleReveal origin={...}>로 감싸고, 화면 바탕은 투명하게 둬요(원이 바탕이 돼요).
 *          나타날 덩어리마다 <RevealItem index={0} active={origin !== null}>로 감싸요.
 * origin이 없으면(다른 경로로 들어온 경우) 효과 없이 그냥 보여 줘요.
 * 원 바깥에는 뒤 화면(홈)이 보이도록 이 화면은 투명하게 열어요 (app/_layout.tsx의 run 설정).
 */
import { useEffect, type ReactNode } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, interpolateColor, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { Palette } from '@/constants/theme';

const START_RADIUS = 40; // 러닝 시작 버튼 반지름 (지름 80)
const CIRCLE_MS = 450; // 원이 다 커지는 시간
// 처음엔 천천히 → 가운데서 빠르게 → 끝에서 부드럽게 멈추는 움직임
const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);

const ITEM_START_MS = 300; // 원이 거의 다 커졌을 때 첫 내용이 나오기 시작
const ITEM_GAP_MS = 40; // 다음 덩어리는 이만큼 늦게
const ITEM_MS = 300; // 덩어리 하나가 나타나는 시간
const ITEM_RISE = 16; // 이만큼 아래에서 올라오며 나타나요
const EASE_OUT = Easing.bezier(0.33, 1, 0.68, 1); // 빠르게 시작해서 부드럽게 멈춤

/** 원이 커지는 바탕. origin이 있으면 바탕이 원이 되고, 없으면 화면 바탕색 그대로예요 */
export function CircleReveal({ origin, children }: { origin: { x: number; y: number } | null; children: ReactNode }) {
  const { width, height } = useWindowDimensions();
  const hasOrigin = origin !== null;
  const progress = useSharedValue(hasOrigin ? 0 : 1); // 0: 버튼 크기, 1: 화면 전체

  // 화면이 처음 열릴 때 한 번만 커져요 (origin 객체가 새로 만들어져도 다시 시작하지 않게 true/false만 봐요)
  useEffect(() => {
    if (hasOrigin) progress.set(withTiming(1, { duration: CIRCLE_MS, easing: EASE_IN_OUT }));
  }, [hasOrigin, progress]);

  const cx = origin?.x ?? width / 2;
  const cy = origin?.y ?? height / 2;
  // 원의 중심에서 가장 먼 화면 모서리까지 거리 = 다 커졌을 때 반지름
  const endRadius = Math.max(Math.hypot(cx, cy), Math.hypot(width - cx, cy), Math.hypot(cx, height - cy), Math.hypot(width - cx, height - cy));

  // 중심은 그대로 두고 반지름만 키워요. 색은 앞쪽 60% 동안 검정 → 바탕색
  const circleStyle = useAnimatedStyle(() => {
    const r = START_RADIUS + (endRadius - START_RADIUS) * progress.get();
    return {
      left: cx - r,
      top: cy - r,
      width: r * 2,
      height: r * 2,
      borderRadius: r,
      backgroundColor: interpolateColor(progress.get(), [0, 0.6], [Palette.ink, Palette.background]),
    };
  });

  return (
    <View style={[styles.fill, !hasOrigin && styles.plain]}>
      {hasOrigin && <Animated.View style={[styles.circle, circleStyle]} pointerEvents="none" />}
      {children}
    </View>
  );
}

/**
 * 원이 다 커질 즈음 나타나는 내용 덩어리. index가 클수록 늦게 나와요 (위에서부터 0, 1, 2 …)
 * 첫 화면부터 투명한 상태로 시작해야 해서(그래야 한 순간 번쩍 보이지 않아요) 진하기를 직접 움직여요.
 */
export function RevealItem({ index, active, children }: { index: number; active: boolean; children: ReactNode }) {
  const shown = useSharedValue(active ? 0 : 1); // 0: 안 보임(조금 아래), 1: 제자리에 보임

  useEffect(() => {
    if (active) shown.set(withDelay(ITEM_START_MS + index * ITEM_GAP_MS, withTiming(1, { duration: ITEM_MS, easing: EASE_OUT })));
  }, [active, index, shown]);

  const style = useAnimatedStyle(() => ({
    opacity: shown.get(),
    transform: [{ translateY: (1 - shown.get()) * ITEM_RISE }],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  plain: {
    backgroundColor: Palette.background,
  },
  circle: {
    position: 'absolute',
  },
});
