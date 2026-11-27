/**
 * 러닝 화면 묶음 (주소: /run/...)
 *
 *   run/index.tsx     → /run            러닝 시작 ("어떻게 달릴까요?")
 *   run/goal.tsx      → /run/goal       목표 정하기 (거리 · 시간)
 *   run/course.tsx    → /run/course     코스 정하기 (코스 목록)
 *   run/course-detail.tsx → /run/course-detail?id=  코스 상세 (그냥 완주하기 · 목표 시간 정하기)
 *   run/course-time.tsx   → /run/course-time?id=    코스 목표 시간 정하기
 *   run/countdown.tsx → /run/countdown  3 · 2 · 1
 *   run/active.tsx    → /run/active     러닝 중 (일시정지 · 잠금 · 종료)
 *   run/result.tsx    → /run/result     러닝 결과
 *
 * RunSessionProvider로 감싸서 러닝 중 화면과 결과 화면이 같은 기록을 봐요.
 * 카운트다운 · 러닝 중 · 결과는 옆으로 밀어서 뒤로 가기를 막았어요 (실수로 러닝이 끊기지 않게).
 */
import { Stack } from 'expo-router';
import { Platform } from 'react-native';

import { RunSessionProvider } from '@/hooks/use-run-session';

export default function RunLayout() {
  return (
    <RunSessionProvider>
      <Stack screenOptions={{ headerShown: false }}>
        {/* 러닝 시작 화면은 원이 커지는 동안 원 바깥으로 홈이 보이게 바탕을 투명하게 둬요.
            웹은 화면 바탕색이 따로 칠해져서, 웹에서만 투명 화면(transparentModal)으로 표시해요 */}
        <Stack.Screen
          name="index"
          options={{
            contentStyle: { backgroundColor: 'transparent' },
            presentation: Platform.OS === 'web' ? 'transparentModal' : undefined,
          }}
        />
        <Stack.Screen name="goal" />
        <Stack.Screen name="course" />
        <Stack.Screen name="course-detail" />
        <Stack.Screen name="course-time" />
        <Stack.Screen name="countdown" options={{ gestureEnabled: false, animation: 'fade' }} />
        <Stack.Screen name="active" options={{ gestureEnabled: false, animation: 'fade' }} />
        <Stack.Screen name="result" options={{ gestureEnabled: false, animation: 'fade' }} />
      </Stack>
    </RunSessionProvider>
  );
}
