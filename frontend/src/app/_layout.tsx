import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/common/animated-icon';
import { API_URL } from '@/constants/api';
import { AuthContext, type AuthValue } from '@/hooks/use-auth';
import { SettingsProvider } from '@/hooks/use-settings';
import { api, setUnauthorizedHandler, type Me, type TokenResponse } from '@/lib/api';
import { loadToken, saveToken } from '@/lib/session';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  // ready: 저장된 토큰 확인이 끝났는지 / signedIn: 탭 화면을 열지 (로그인 또는 둘러보기)
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [me, setMe] = useState<Me | null>(null);

  const signOut = useCallback(() => {
    saveToken(null);
    setMe(null);
    setSignedIn(false);
  }, []);

  // 앱을 켤 때: 저장된 토큰이 있으면 내 정보를 불러와 바로 로그인 상태로 시작한다
  useEffect(() => {
    if (!API_URL) {
      console.warn('EXPO_PUBLIC_API_URL이 없어요. frontend/.env.local 파일을 확인하세요.');
    }
    (async () => {
      const token = await loadToken();
      if (token) {
        try {
          setMe(await api.get<Me>('/api/members/me'));
          setSignedIn(true);
        } catch {
          // 토큰이 만료됐거나 서버에 닿지 않으면 로그인 화면부터
          await saveToken(null);
        }
      }
      setReady(true);
    })();
  }, []);

  // 사용 중에 로그인이 풀리면(401) 로그인 화면으로
  useEffect(() => {
    setUnauthorizedHandler(signOut);
    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  const auth = useMemo<AuthValue>(
    () => ({
      me,
      signOut,
      signIn: (result?: TokenResponse) => {
        if (result) {
          saveToken(result.accessToken);
          setMe(result.member);
        }
        setSignedIn(true);
      },
      refreshMe: async () => {
        setMe(await api.get<Me>('/api/members/me'));
      },
      requireLogin: () => {
        if (me) return true;
        // 둘러보기 중에 로그인이 필요한 버튼을 누르면 로그인 화면으로 보낸다
        setSignedIn(false);
        return false;
      },
    }),
    [me, signOut],
  );

  if (!ready) return null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <AuthContext value={auth}>
        {/* 설정 값(거리 단위, 알림 등)을 모든 화면이 같이 쓰도록 감싼다 */}
        <SettingsProvider>
          {/* 로그인 전에는 로그인·회원가입 화면만, 로그인 후에는 탭 화면만 열린다 */}
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Protected guard={signedIn}>
              <Stack.Screen name="(tabs)" />
              {/* 설정은 탭 바 없이 전체 화면으로 열린다 */}
              <Stack.Screen name="settings" />
              {/* 탭 안에서 들어가는 하위 화면들 (탭 바 없이 전체 화면) */}
              <Stack.Screen name="courses" />
              <Stack.Screen name="friend" />
              <Stack.Screen name="crews" />
              <Stack.Screen name="run" />
            </Stack.Protected>
            <Stack.Protected guard={!signedIn}>
              <Stack.Screen name="(auth)/login" />
              <Stack.Screen name="(auth)/signup" />
            </Stack.Protected>
          </Stack>
        </SettingsProvider>
      </AuthContext>
    </ThemeProvider>
  );
}
