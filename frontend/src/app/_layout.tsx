import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { API_URL } from '@/constants/api';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();

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
      <AppTabs />
    </ThemeProvider>
  );
}
