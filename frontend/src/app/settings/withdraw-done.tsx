/**
 * 탈퇴 완료 (Figma: 탈퇴 완료)
 * 들어오는 곳: 회원 탈퇴 → 탈퇴하기
 *
 * "확인"을 누르면 로그아웃 상태가 되면서 로그인 화면으로 가요.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CheckIcon } from '@/components/common/icons';
import { Palette } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';

export default function WithdrawDoneScreen() {
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();

  return (
    // 이 화면은 헤더(뒤로가기)가 없어요. 탈퇴가 끝났으니 돌아갈 곳이 없어서예요.
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom + 16 }]}>
      <View style={styles.center}>
        <View style={styles.circle}>
          <CheckIcon color={Palette.accent} size={32} />
        </View>
        <Text style={styles.title}>탈퇴가 완료됐어요</Text>
        <Text style={styles.message}>
          그동안 런크크와 함께 달려 주셔서 고마워요.{'\n'}언제든 다시 돌아오세요.
        </Text>
      </View>

      {/* signOut(): 로그인 상태를 끄면 _layout.tsx가 자동으로 로그인 화면으로 보내요 */}
      <Pressable style={styles.button} onPress={signOut} accessibilityRole="button">
        <Text style={styles.buttonLabel}>확인</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: Palette.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  circle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.ink,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: Palette.ink,
  },
  message: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 21,
    color: Palette.muted,
  },
  button: {
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.ink,
  },
  buttonLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: Palette.background,
  },
});
