/**
 * 설정 메인 (Figma: 설정)
 * 들어오는 곳: 내 정보 → 설정
 */
import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/common/screen-header';
import { SettingRow, SettingSection } from '@/components/settings/setting-list';
import { Palette } from '@/constants/theme';
import { useSettings } from '@/hooks/use-settings';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  // settings: 지금 값들, update: 값 바꾸기 (hooks/use-settings.tsx 참고)
  const { settings, update } = useSettings();

  return (
    <View style={styles.screen}>
      <ScreenHeader title="설정" />

      {/* ScrollView: 내용이 화면보다 길면 위아래로 스크롤돼요 */}
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <SettingSection title="알림">
          {/* router.push('/주소'): 그 화면을 위에 쌓아서 열어요 (뒤로가기로 여기로 돌아와요) */}
          <SettingRow
            title="알림 설정"
            description="친구 · 크루 · 커뮤니티 · 러닝 알림"
            onPress={() => router.push('/settings/notifications')}
          />
        </SettingSection>

        <SettingSection title="러닝">
          <SettingRow
            title="거리 단위"
            value={settings.distanceUnit} // 거리 단위 화면에서 바꾸면 여기 글자도 바로 바뀌어요
            onPress={() => router.push('/settings/distance-unit')}
          />
          {/* 스위치는 이 화면에서 바로 켜고 꺼요. update({ 바꿀값 })으로 저장해요 */}
          <SettingRow
            title="음성 안내"
            description="1km마다 거리와 페이스를 알려줘요"
            switchValue={settings.voiceGuide}
            onSwitch={(next) => update({ voiceGuide: next })}
          />
          <SettingRow
            title="자동 일시정지"
            description="멈추면 기록도 잠시 멈춰요"
            switchValue={settings.autoPause}
            onSwitch={(next) => update({ autoPause: next })}
          />
          <SettingRow
            title="러닝 중 화면 켜짐 유지"
            switchValue={settings.keepScreenOn}
            onSwitch={(next) => update({ keepScreenOn: next })}
          />
        </SettingSection>

        <SettingSection title="앱 정보">
          {/* 약관 3종은 같은 화면 파일(terms/[type].tsx)을 쓰고, 주소 끝 글자로 어떤 약관인지 구분해요 */}
          <SettingRow title="이용약관" onPress={() => router.push('/settings/terms/service')} />
          <SettingRow title="개인정보 처리방침" onPress={() => router.push('/settings/terms/privacy')} />
          <SettingRow
            title="위치기반 서비스 이용약관"
            onPress={() => router.push('/settings/terms/location')}
          />
          <SettingRow title="버전" value="1.0.0" />
        </SettingSection>

        <SettingSection title="계정">
          <SettingRow
            title="계정 관리"
            description="로그아웃 · 회원 탈퇴"
            onPress={() => router.push('/settings/account')}
          />
        </SettingSection>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  content: {
    gap: 20,
    paddingTop: 8,
    paddingHorizontal: 20,
  },
});
