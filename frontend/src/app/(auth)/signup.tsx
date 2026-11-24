import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CheckIcon, ChevronLeftIcon, EyeIcon } from '@/components/common/icons';
import { Palette } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { ApiError, api, errorMessage, type Gender, type TokenResponse } from '@/lib/api';

// 회원가입: 이메일·비밀번호·닉네임 + 필수 약관 4개.
// 성별과 출생연도는 선택이지만, 성별·나이 제한이 있는 크루에 가입하려면 필요하다.

const TERMS = [
  { key: 'SERVICE', label: '서비스 이용약관' },
  { key: 'PRIVACY', label: '개인정보 처리방침' },
  { key: 'LOCATION', label: '위치기반 서비스 이용약관' },
  { key: 'AGE14', label: '만 14세 이상이에요' },
] as const;

type TermKey = (typeof TERMS)[number]['key'];
type Fields = 'email' | 'password' | 'nickname' | 'birthYear';

const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,64}$/;

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [birthYear, setBirthYear] = useState('');
  const [agreed, setAgreed] = useState<TermKey[]>([]);
  const [errors, setErrors] = useState<Partial<Record<Fields | 'form', string>>>({});
  const [busy, setBusy] = useState(false);

  const allAgreed = agreed.length === TERMS.length;
  const toggleTerm = (key: TermKey) =>
    setAgreed((list) => (list.includes(key) ? list.filter((k) => k !== key) : [...list, key]));

  // 칸을 벗어날 때 이미 쓰는 이메일·닉네임인지 바로 알려 준다
  const checkTaken = async (field: 'email' | 'nickname', value: string) => {
    if (!value.trim()) return;
    try {
      const path = field === 'email' ? '/api/auth/check-email' : '/api/auth/check-nickname';
      const { available } = await api.get<{ available: boolean }>(path, { [field]: value.trim() });
      if (!available) {
        setErrors((e) => ({ ...e, [field]: field === 'email' ? '이미 가입한 이메일이에요.' : '이미 쓰고 있는 닉네임이에요.' }));
      }
    } catch {
      // 확인을 못 해도 가입할 때 서버가 다시 검사한다
    }
  };

  const validate = () => {
    const next: typeof errors = {};
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = '이메일 형식을 확인해 주세요.';
    if (!PASSWORD_RULE.test(password)) next.password = '영문과 숫자를 섞어 8자 이상으로 정해 주세요.';
    const nick = nickname.trim();
    if (nick.length < 2 || nick.length > 12) next.nickname = '닉네임은 2~12자로 정해 주세요.';
    const year = Number(birthYear);
    if (birthYear && (!Number.isInteger(year) || year < 1920 || year > new Date().getFullYear() - 14)) {
      next.birthYear = '출생연도를 확인해 주세요.';
    }
    if (!allAgreed) next.form = '필수 약관에 모두 동의해 주세요.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    if (busy || !validate()) return;
    setBusy(true);
    try {
      const result = await api.post<TokenResponse>('/api/auth/signup', {
        email: email.trim(),
        password,
        nickname: nickname.trim(),
        agreedTerms: agreed,
        gender,
        birthYear: birthYear ? Number(birthYear) : null,
      });
      signIn(result);
    } catch (e) {
      if (e instanceof ApiError && e.fields) {
        setErrors({ ...e.fields, form: e.message });
      } else {
        setErrors({ form: errorMessage(e) });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back} accessibilityRole="button" accessibilityLabel="뒤로">
          <ChevronLeftIcon color={Palette.ink} />
        </Pressable>

        <View style={styles.titleBox}>
          <Text style={styles.title}>회원가입</Text>
          <Text style={styles.subtitle}>기록을 남기고 친구, 크루와 함께 달려요</Text>
        </View>

        <Field label="이메일" error={errors.email}>
          <Input
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              setErrors((e) => ({ ...e, email: undefined }));
            }}
            onBlur={() => checkTaken('email', email)}
            placeholder="runkk@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
          />
        </Field>

        <Field label="비밀번호" error={errors.password} hint="영문과 숫자를 섞어 8자 이상">
          <Input
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              setErrors((e) => ({ ...e, password: undefined }));
            }}
            placeholder="비밀번호"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            right={
              <Pressable
                onPress={() => setShowPassword((s) => !s)}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}>
                <EyeIcon color={showPassword ? Palette.ink : Palette.hint} size={20} />
              </Pressable>
            }
          />
        </Field>

        <Field label="닉네임" error={errors.nickname} hint="친구와 크루에게 보이는 이름이에요 (2~12자)">
          <Input
            value={nickname}
            onChangeText={(t) => {
              setNickname(t);
              setErrors((e) => ({ ...e, nickname: undefined }));
            }}
            onBlur={() => checkTaken('nickname', nickname)}
            placeholder="달리는 사람"
            maxLength={12}
          />
        </Field>

        <View style={styles.optional}>
          <Text style={styles.optionalTitle}>선택 정보</Text>
          <Text style={styles.optionalHint}>성별·나이 조건이 있는 크루에 가입할 때 필요해요</Text>
          <View style={styles.genderRow}>
            {(
              [
                ['FEMALE', '여성'],
                ['MALE', '남성'],
              ] as const
            ).map(([value, label]) => (
              <Pressable
                key={value}
                onPress={() => setGender((g) => (g === value ? null : value))}
                style={[styles.choice, gender === value && styles.choiceOn]}
                accessibilityRole="radio"
                accessibilityState={{ selected: gender === value }}>
                <Text style={[styles.choiceText, gender === value && styles.choiceTextOn]}>{label}</Text>
              </Pressable>
            ))}
          </View>
          <Field label="출생연도" error={errors.birthYear}>
            <Input
              value={birthYear}
              onChangeText={(t) => {
                setBirthYear(t.replace(/\D/g, '').slice(0, 4));
                setErrors((e) => ({ ...e, birthYear: undefined }));
              }}
              placeholder="예: 2001"
              keyboardType="number-pad"
            />
          </Field>
        </View>

        <View style={styles.terms}>
          <Pressable
            onPress={() => setAgreed(allAgreed ? [] : TERMS.map((t) => t.key))}
            style={styles.termAll}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: allAgreed }}>
            <Box checked={allAgreed} />
            <Text style={styles.termAllText}>약관에 모두 동의</Text>
          </Pressable>
          {TERMS.map((term) => (
            <Pressable
              key={term.key}
              onPress={() => toggleTerm(term.key)}
              style={styles.termRow}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: agreed.includes(term.key) }}>
              <Box checked={agreed.includes(term.key)} small />
              <Text style={styles.termText}>(필수) {term.label}</Text>
            </Pressable>
          ))}
        </View>

        {errors.form ? <Text style={styles.formError}>{errors.form}</Text> : null}

        <Pressable
          style={[styles.submit, busy && styles.submitBusy]}
          onPress={submit}
          accessibilityRole="button"
          accessibilityState={{ busy }}>
          {busy ? <ActivityIndicator color={Palette.background} /> : <Text style={styles.submitLabel}>가입하고 시작하기</Text>}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

function Input({ right, ...props }: TextInputProps & { right?: React.ReactNode }) {
  return (
    <View style={styles.inputBox}>
      <TextInput style={styles.input} placeholderTextColor={Palette.hint} {...props} />
      {right}
    </View>
  );
}

function Box({ checked, small }: { checked: boolean; small?: boolean }) {
  const size = small ? 20 : 24;
  return (
    <View style={[styles.box, { width: size, height: size }, checked && styles.boxOn]}>
      {checked ? <CheckIcon color={Palette.accent} size={small ? 14 : 16} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Palette.background },
  content: { paddingHorizontal: 24, gap: 18 },
  back: { alignSelf: 'flex-start', paddingVertical: 6 },
  titleBox: { gap: 8, marginBottom: 4 },
  title: { fontSize: 30, fontWeight: '900', color: Palette.ink },
  subtitle: { fontSize: 15, color: Palette.muted },
  field: { gap: 8 },
  label: { fontSize: 13, fontWeight: '500', color: Palette.hint },
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
  input: { flex: 1, height: '100%', fontSize: 16, fontWeight: '500', color: Palette.ink },
  error: { fontSize: 13, fontWeight: '500', color: Palette.alert },
  hint: { fontSize: 12, color: Palette.hint },
  optional: { gap: 10, paddingTop: 6 },
  optionalTitle: { fontSize: 15, fontWeight: '700', color: Palette.ink },
  optionalHint: { fontSize: 12, color: Palette.muted, marginTop: -6 },
  genderRow: { flexDirection: 'row', gap: 8 },
  choice: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceOn: { backgroundColor: Palette.ink, borderColor: Palette.ink },
  choiceText: { fontSize: 15, fontWeight: '600', color: Palette.inkSoft },
  choiceTextOn: { color: Palette.white },
  terms: { gap: 2, paddingTop: 6, borderTopWidth: 1, borderTopColor: Palette.divider },
  termAll: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  termAllText: { fontSize: 16, fontWeight: '700', color: Palette.ink },
  termRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingLeft: 2 },
  termText: { fontSize: 14, color: Palette.inkSoft },
  box: {
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOn: { backgroundColor: Palette.ink, borderColor: Palette.ink },
  formError: { fontSize: 13, fontWeight: '600', color: Palette.alert, textAlign: 'center' },
  submit: {
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.ink,
    marginTop: 4,
  },
  submitBusy: { opacity: 0.7 },
  submitLabel: { fontSize: 17, fontWeight: '700', color: Palette.background },
});
