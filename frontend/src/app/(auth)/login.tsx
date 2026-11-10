import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EyeIcon } from '@/components/common/icons';
import { Palette } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (!email.trim() || !password) {
      setError('이메일과 비밀번호를 입력해 주세요.');
      return;
    }
    // TODO: 서버 로그인 API가 생기면 여기서 요청하고, 실패하면
    // '이메일 또는 비밀번호가 맞지 않아요. 다시 확인해 주세요.'를 보여준다
    signIn();
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 56, paddingBottom: insets.bottom + 16 }]}>
      <StatusBar style="dark" />

      <View style={styles.content}>
        <View style={styles.logoBox}>
          <Text style={styles.logo}>런크크</Text>
          <Text style={styles.subtitle}>오늘도 좋은 페이스로 달려볼까요?</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>이메일</Text>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setError('');
                }}
                placeholder="runkk@email.com"
                placeholderTextColor={Palette.hint}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>비밀번호</Text>
            <View style={[styles.inputBox, error !== '' && styles.inputBoxError]}>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setError('');
                }}
                placeholder="비밀번호"
                placeholderTextColor={Palette.hint}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="password"
                textContentType="password"
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <Pressable
                onPress={() => setShowPassword((shown) => !shown)}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}>
                <EyeIcon color={showPassword ? Palette.ink : Palette.hint} size={20} />
              </Pressable>
            </View>
            {error !== '' && <Text style={styles.error}>{error}</Text>}
          </View>

          {/* TODO: 비밀번호 찾기 화면이 생기면 연결 */}
          <Pressable style={styles.findLink} accessibilityRole="button">
            <Text style={styles.linkText}>비밀번호를 잊으셨나요?</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.bottom}>
        <Pressable style={styles.loginButton} onPress={handleLogin} accessibilityRole="button">
          <Text style={styles.loginLabel}>로그인</Text>
        </Pressable>

        {/* TODO: 회원가입 화면이 생기면 연결 */}
        <Pressable style={styles.signUpRow} accessibilityRole="button">
          <Text style={styles.signUpHint}>아직 계정이 없나요?</Text>
          <Text style={styles.signUpLink}>회원가입</Text>
        </Pressable>

        {/* TODO: 계정 없이 시작 안내 팝업이 생기면 연결 (지금은 바로 홈으로) */}
        <Pressable onPress={signIn} accessibilityRole="button">
          <Text style={[styles.linkText, styles.underline]}>계정 없이 시작하기</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    backgroundColor: Palette.background,
  },
  content: {
    gap: 28,
  },
  logoBox: {
    gap: 10,
  },
  logo: {
    fontSize: 46,
    fontWeight: '900',
    color: Palette.ink,
  },
  subtitle: {
    fontSize: 15,
    color: Palette.muted,
  },
  form: {
    gap: 16,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: Palette.hint,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingLeft: 18,
    paddingRight: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
  },
  inputBoxError: {
    borderWidth: 1.5,
    borderColor: Palette.alert,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    fontWeight: '500',
    color: Palette.ink,
  },
  error: {
    fontSize: 13,
    fontWeight: '500',
    color: Palette.alert,
  },
  findLink: {
    alignSelf: 'flex-end',
  },
  linkText: {
    fontSize: 14,
    fontWeight: '500',
    color: Palette.muted,
  },
  underline: {
    textDecorationLine: 'underline',
  },
  bottom: {
    alignItems: 'center',
    gap: 16,
  },
  loginButton: {
    alignSelf: 'stretch',
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.ink,
  },
  loginLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: Palette.background,
  },
  signUpRow: {
    flexDirection: 'row',
    gap: 6,
  },
  signUpHint: {
    fontSize: 14,
    fontWeight: '500',
    color: Palette.hint,
  },
  signUpLink: {
    fontSize: 14,
    fontWeight: '700',
    color: Palette.ink,
  },
});
