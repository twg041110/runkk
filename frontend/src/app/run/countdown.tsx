/**
 * 카운트다운 3 · 2 · 1 (Figma: 러닝 시작 - 카운트다운 3/2/1, "작아짐")
 *
 * 형광 노랑 화면에 숫자가 1초마다 바뀌고, 1초 동안 숫자가 조금씩 작아지며 흐려져요.
 * 1이 끝나면 러닝을 시작(GPS 켜기)하고 러닝 중 화면으로 바꿔요.
 * router.replace: 뒤로 가기로 카운트다운에 다시 오지 않도록 지금 화면을 바꿔 끼워요.
 */
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { Palette } from '@/constants/theme';
import { useRunSession } from '@/hooks/use-run-session';

export default function CountdownScreen() {
  const { start } = useRunSession();
  const [count, setCount] = useState(3);
  // 0 → 1로 1초 동안 움직이는 숫자. 크기와 진하기를 여기에 맞춰 바꿔요
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 900,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      if (count > 1) {
        setCount(count - 1);
      } else {
        start();
        router.replace('/run/active');
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [count, progress, start]);

  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0.55] });
  const opacity = progress.interpolate({ inputRange: [0, 0.6, 1], outputRange: [1, 1, 0.2] });

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
