import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { API_URL } from '@/constants/api';
import { AuthContext } from '@/hooks/use-auth';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  // 서버 로그인 API가 생기기 전까지는 로그인 버튼을 누르면 로그인된 것으로 친다
  const [signedIn, setSignedIn] = useState(false);

  // 앱을 켤 때 서버 연결을 한 번 확인한다 (결과는 expo start 터미널에 표시)
  useEffect(() => {
    if (!API_URL) {
      console.warn('EXPO_PUBLIC_API_URL이 없어요. frontend/.env.local 파일을 확인하세요.');
      return;
    }
    fetch(`${API_URL}/api/ping`)
      .then((res) => res.text())
      .then((text) => console.log('서버 연결:', text))
      .catch((error) => console.warn('서버 연결 실패:', error.message));
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <AuthContext value={{ signIn: () => setSignedIn(true) }}>
        {/* 로그인 전에는 로그인 화면만, 로그인 후에는 탭 화면만 열린다 */}
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Protected guard={signedIn}>
            <Stack.Screen name="(tabs)" />
          </Stack.Protected>
          <Stack.Protected guard={!signedIn}>
            <Stack.Screen name="login" />
          </Stack.Protected>
        </Stack>
      </AuthContext>
    </ThemeProvider>
  );
}
