/**
 * 계정 관리 (Figma: 계정 관리, 계정 관리 - 로그아웃 확인, 계정 관리 - 비밀번호 변경 완료)
 * 들어오는 곳: 설정 → 계정 관리
 */
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { ScreenHeader } from '@/components/common/screen-header';
import { Toast } from '@/components/common/toast';
import { SettingRow, SettingSection } from '@/components/settings/setting-list';
import { Palette } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useSettings } from '@/hooks/use-settings';

// TODO: 로그인 기능이 생기면 서버에서 받은 내 정보(GET /api/me)로 바꿔요. 지금은 Figma 예시 값이에요.
const MY_ACCOUNT = { email: 'runkk@email.com', loginMethod: '이메일' };

export default function AccountScreen() {
  const { signOut } = useAuth();
  const { settings, update } = useSettings();
  const [logoutOpen, setLogoutOpen] = useState(false); // 로그아웃 확인 팝업이 열려 있는지

  return (
    <View style={styles.screen}>
      <ScreenHeader title="계정 관리" />

      <View style={styles.content}>
        <SettingSection title="내 계정">
          <SettingRow title="이메일" value={MY_ACCOUNT.email} />
          <SettingRow title="로그인 방식" value={MY_ACCOUNT.loginMethod} />
          <SettingRow title="비밀번호 변경" onPress={() => router.push('/settings/password')} />
          <SettingRow
            title="차단한 친구"
            value={`${settings.blockedFriends.length}명`}
            onPress={() => router.push('/settings/blocked-friends')}
          />
        </SettingSection>

        <SettingSection>
          <SettingRow title="로그아웃" onPress={() => setLogoutOpen(true)} />
        </SettingSection>

        <SettingSection>
          <SettingRow
            title="회원 탈퇴"
            description="탈퇴하면 기록이 모두 삭제돼요"
            danger
            onPress={() => router.push('/settings/withdraw')}
          />
        </SettingSection>
      </View>

      <ConfirmDialog
        visible={logoutOpen}
        title="로그아웃할까요?"
        message="다시 로그인하면 러닝 기록과 저장한 코스를 그대로 볼 수 있어요."
        confirmLabel="로그아웃"
        onCancel={() => setLogoutOpen(false)}
        onConfirm={() => {
          setLogoutOpen(false);
          // TODO: 로그인 기능이 생기면 여기서 폰에 저장한 로그인 토큰도 지워요.
          // signOut()으로 로그인 상태가 false가 되면 _layout.tsx의 Stack.Protected가
          // 설정·탭 화면을 막고 로그인 화면으로 보내요. 그래서 뒤로가기로 돌아올 수 없어요.
          signOut();
        }}
      />

      {/* 비밀번호 변경 화면에서 성공하고 돌아오면 settings.notice에 문구가 들어 있어요 */}
      <Toast message={settings.notice} onHide={() => update({ notice: '' })} />
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
