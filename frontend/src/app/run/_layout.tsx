import { Stack } from 'expo-router';

// 달리기 화면 (측정 → 결과). 측정 중에는 뒤로 가기 제스처로 실수로 나가지 않게 막는다
export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ gestureEnabled: false }} />
    </Stack>
  );
}
