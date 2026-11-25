/**
 * 카운트다운 3 · 2 · 1 (Figma: 러닝 시작 - 카운트다운 3/2/1, "작아짐")
 *
 * 형광 노랑 화면에 숫자가 1초마다 바뀌어요. 숫자 하나가 1초 동안
 *   나타나기(흐림 → 진함, 살짝 큰 크기에서 제자리로) → 작아지기 → 사라지기(완전히 투명)
 * 순서로 움직이고, 다음 숫자도 투명에서 시작해서 숫자가 갑자기 튀어나오지 않고 부드럽게 이어져요.
 * 1이 끝나면 러닝을 시작(GPS 켜기)하고 러닝 중 화면으로 바꿔요.
 * router.replace: 뒤로 가기로 카운트다운에 다시 오지 않도록 지금 화면을 바꿔 끼워요.
 */
import { router } from 'expo-router';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { Palette } from '@/constants/theme';
import { useRunSession } from '@/hooks/use-run-session';

export default function CountdownScreen() {
  const { start } = useRunSession();
  const [count, setCount] = useState(3);
  // 0 → 1로 1초 동안 움직이는 값. 숫자의 크기와 진하기를 여기에 맞춰 바꿔요
  const progress = useRef(new Animated.Value(0)).current;

  // 숫자 하나의 애니메이션이 끝났을 때: 다음 숫자로, 1이 끝났으면 러닝 시작
  // (useEffectEvent: 아래 useEffect가 start가 바뀔 때마다 다시 시작되지 않게 해요)
  const onNumberDone = useEffectEvent(() => {
    if (count > 1) {
      setCount(count - 1);
    } else {
      start();
      router.replace('/run/active');
    }
  });

  useEffect(() => {
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 1000,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    // 따로 타이머를 두지 않고 애니메이션이 끝나는 순간 다음 숫자로 넘겨서 시간이 어긋나지 않아요
    animation.start(({ finished }) => {
      if (finished) onNumberDone();
    });
    return () => animation.stop();
  }, [count, progress]);

  // 0~0.15: 나타나기, 0.15~0.7: 진한 채로 작아지기, 0.7~1: 작아지며 사라지기
  const opacity = progress.interpolate({ inputRange: [0, 0.15, 0.7, 1], outputRange: [0, 1, 1, 0] });
  const scale = progress.interpolate({ inputRange: [0, 0.15, 1], outputRange: [1.25, 1, 0.6] });

  return (
    <View style={styles.screen}>
      <Animated.Text style={[styles.number, { opacity, transform: [{ scale }] }]} accessibilityLiveRegion="assertive">
        {count}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.accent,
  },
  number: {
    fontSize: 200,
    fontWeight: '900',
    color: Palette.ink,
  },
});
