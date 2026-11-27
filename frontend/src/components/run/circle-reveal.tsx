/**
 * 원이 커지면서 화면이 나타나는 효과 (홈 가운데 "러닝 시작" 버튼 → 러닝 시작 화면)
 *
 * 동작 원리
 * 1. 화면 전체(children)를 동그란 상자 안에 넣고, 상자 밖은 잘라서 안 보이게 해요(overflow: hidden).
 * 2. 동그라미는 버튼 자리(origin)에서 버튼 크기(반지름 40)로 시작해서, 화면 네 모서리를 다 덮을 때까지 커져요.
 * 3. 안의 화면은 동그라미가 커지는 동안에도 제자리에 있도록, 동그라미가 움직인 만큼 반대로 옮겨 둬요.
 * 4. 처음에는 버튼처럼 검은색으로 덮여 있다가, 커지는 앞부분 동안 검은색이 서서히 사라져요.
 *
 * origin이 없으면(다른 경로로 들어온 경우) 효과 없이 그냥 보여 줘요.
 * 동그라미 바깥에는 뒤 화면(홈)이 보이도록 이 화면은 투명하게 열어요 (app/_layout.tsx의 run 설정).
 */
import { useEffect, type ReactNode } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Palette } from '@/constants/theme';

const START_RADIUS = 40; // 러닝 시작 버튼 반지름 (지름 80)
const DURATION_MS = 550;
// 처음엔 천천히 → 가운데서 빠르게 → 끝에서 부드럽게 멈추는 움직임
const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);

export function CircleReveal({ origin, children }: { origin: { x: number; y: number } | null; children: ReactNode }) {
  const { width, height } = useWindowDimensions();
  const hasOrigin = origin !== null;
  const progress = useSharedValue(hasOrigin ? 0 : 1); // 0: 버튼 크기, 1: 화면 전체

  // 화면이 처음 열릴 때 한 번만 커져요 (origin 객체가 새로 만들어져도 다시 시작하지 않게 true/false만 봐요)
  useEffect(() => {
    if (hasOrigin) progress.set(withTiming(1, { duration: DURATION_MS, easing: EASE_IN_OUT }));
  }, [hasOrigin, progress]);

  const cx = origin?.x ?? width / 2;
  const cy = origin?.y ?? height / 2;
  // 원의 중심에서 가장 먼 화면 모서리까지 거리 = 다 커졌을 때 반지름
  const endRadius = Math.max(Math.hypot(cx, cy), Math.hypot(width - cx, cy), Math.hypot(cx, height - cy), Math.hypot(width - cx, height - cy));

  // 바깥 동그라미: 중심은 그대로 두고 반지름만 키워요
  const circleStyle = useAnimatedStyle(() => {
    const r = START_RADIUS + (endRadius - START_RADIUS) * progress.get();
    return { left: cx - r, top: cy - r, width: r * 2, height: r * 2, borderRadius: r };
  });
  // 안의 화면: 동그라미가 왼쪽 위로 커지는 만큼 반대로 옮겨서 화면은 제자리에 있게 해요
  const contentStyle = useAnimatedStyle(() => {
    const r = START_RADIUS + (endRadius - START_RADIUS) * progress.get();
    return { left: -(cx - r), top: -(cy - r) };
  });
  // 검은 덮개: 앞쪽 45% 동안 사라져요
  const coverStyle = useAnimatedStyle(() => ({ opacity: interpolate(progress.get(), [0, 0.45], [1, 0], 'clamp') }));

  if (!origin) return <>{children}</>;

  return (
    <View style={styles.fill} pointerEvents="box-none">
      <Animated.View style={[styles.circle, circleStyle]}>
        <Animated.View style={[styles.content, { width, height }, contentStyle]}>{children}</Animated.View>
        <Animated.View style={[styles.cover, coverStyle]} pointerEvents="none" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  circle: {
    position: 'absolute',
    overflow: 'hidden',
  },
  content: {
    position: 'absolute',
  },
  cover: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Palette.ink,
  },
});
