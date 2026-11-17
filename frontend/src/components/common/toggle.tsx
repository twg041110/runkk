/**
 * 켜고 끄는 스위치 (Figma 토글 모양: 46×28, 켜짐 = 검정 바탕 + 형광 노랑 동그라미)
 *
 * 왜 직접 만들었나요?
 * - React Native 기본 Switch는 폰(안드로이드/아이폰)마다 모양이 다르고, 색을 바꾸면
 *   동그라미 색이 순간적으로 확 바뀌어서 움직임이 어색해 보여요.
 * - 그래서 Animated로 동그라미 위치와 색을 0.2초 동안 부드럽게 바꾸는 스위치를 만들었어요.
 *
 * 사용 예: <Toggle value={켜짐여부} onChange={(next) => ...} />
 */
import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet } from 'react-native';

import { Palette } from '@/constants/theme';

const WIDTH = 46;
const HEIGHT = 28;
const KNOB = 22; // 동그라미 지름
const GAP = (HEIGHT - KNOB) / 2; // 동그라미와 테두리 사이 여백 (3)
const TRAVEL = WIDTH - KNOB - GAP * 2; // 꺼짐 → 켜짐일 때 동그라미가 움직이는 거리

type Props = {
  value: boolean;
  onChange?: (next: boolean) => void;
  disabled?: boolean;
};

export function Toggle({ value, onChange, disabled }: Props) {
  // Animated.Value: 0(꺼짐) ~ 1(켜짐) 사이를 부드럽게 오가는 숫자예요.
  // useRef로 만들어야 화면이 다시 그려져도 같은 숫자를 계속 써요.
  const progress = useRef(new Animated.Value(value ? 1 : 0)).current;

  // value가 바뀔 때마다 숫자를 0.2초 동안 0→1(또는 1→0)로 천천히 바꿔요.
  useEffect(() => {
    Animated.timing(progress, {
      toValue: value ? 1 : 0,
      duration: 200,
      easing: Easing.out(Easing.cubic), // 처음엔 빠르고 끝에서 천천히 멈춰서 자연스러워요
      useNativeDriver: false, // 색은 이 방식(false)으로만 바꿀 수 있어요
    }).start();
  }, [value, progress]);

  // interpolate: 0~1 숫자를 위치·색으로 바꿔요. (0이면 왼쪽 회색, 1이면 오른쪽 검정)
  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [0, TRAVEL] });
  const trackColor = progress.interpolate({ inputRange: [0, 1], outputRange: ['#C9CBD1', Palette.ink] });
  const knobColor = progress.interpolate({ inputRange: [0, 1], outputRange: ['#FFFFFF', Palette.accent] });

  return (
    <Pressable
      onPress={() => onChange?.(!value)}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}>
      <Animated.View style={[styles.track, { backgroundColor: trackColor }]}>
        <Animated.View
          style={[styles.knob, { backgroundColor: knobColor, transform: [{ translateX }] }]}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: WIDTH,
    height: HEIGHT,
    borderRadius: HEIGHT / 2,
    padding: GAP,
  },
  knob: {
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
  },
});
