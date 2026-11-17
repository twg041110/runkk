/**
 * 비밀번호 변경 (Figma: 비밀번호 변경, 비밀번호 변경 - 현재 비밀번호 틀림)
 * 들어오는 곳: 설정 → 계정 관리 → 비밀번호 변경
 *
 * 새 비밀번호 조건(8자 이상 · 영문 포함 · 숫자 포함)은 입력하는 대로 체크가 채워지고,
 * 세 칸이 모두 맞아야 아래 "비밀번호 변경" 버튼을 누를 수 있어요.
 */
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CheckIcon, EyeIcon } from '@/components/common/icons';
import { ScreenHeader } from '@/components/common/screen-header';
import { Palette } from '@/constants/theme';
import { useSettings } from '@/hooks/use-settings';

// TODO: 서버가 생기면 PATCH /api/me/password로 보내고, 서버가 "현재 비밀번호가 틀림"이라고 답하면 오류를 보여줘요.
// 지금은 서버가 없어서, 테스트용으로 현재 비밀번호가 이 값일 때만 맞는 것으로 처리해요.
const FAKE_CURRENT_PASSWORD = 'runkk1234';

export default function PasswordScreen() {
  const insets = useSafeAreaInsets();
  const { update } = useSettings();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [currentError, setCurrentError] = useState(false); // 현재 비밀번호가 틀렸는지

  // 새 비밀번호 조건. 정규식(/[a-zA-Z]/)은 "영문 글자가 하나라도 있나?"를 검사해요.
  const rules = [
    { label: '8자 이상', ok: next.length >= 8 },
    { label: '영문 포함', ok: /[a-zA-Z]/.test(next) },
    { label: '숫자 포함', ok: /[0-9]/.test(next) },
  ];
  const matches = confirm.length > 0 && confirm === next;
  // 버튼을 누를 수 있는 조건: 현재 비밀번호 입력 + 조건 3개 통과 + 확인 칸 일치
  const canSubmit = current.length > 0 && rules.every((rule) => rule.ok) && matches;

  const handleSubmit = () => {
    if (current !== FAKE_CURRENT_PASSWORD) {
      setCurrentError(true);
      return;
    }
    // 계정 관리 화면으로 돌아가면서 "비밀번호를 바꿨어요" 안내를 띄우게 해요
    update({ notice: '비밀번호를 바꿨어요' });
    router.back();
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader title="비밀번호 변경" />

      {/* keyboardShouldPersistTaps: 키보드가 떠 있어도 버튼이 한 번에 눌리게 해요 */}
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.field}>
          <Text style={styles.label}>현재 비밀번호</Text>
          <PasswordInput
            value={current}
            onChangeText={(text) => {
              setCurrent(text);
              setCurrentError(false); // 다시 입력하면 빨간 오류를 지워요
            }}
            error={currentError}
          />
          {currentError && <Text style={styles.error}>현재 비밀번호가 맞지 않아요.</Text>}
          {/* TODO: 비밀번호 찾기 화면(로그인 담당)이 생기면 연결해요 */}
          <Pressable style={styles.link} accessibilityRole="button">
            <Text style={styles.linkText}>비밀번호가 기억나지 않나요?</Text>
          </Pressable>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>새 비밀번호</Text>
          <PasswordInput value={next} onChangeText={setNext} />
          <View style={styles.rules}>
            {rules.map((rule) => (
              <Rule key={rule.label} label={rule.label} ok={rule.ok} />
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>새 비밀번호 확인</Text>
          <PasswordInput value={confirm} onChangeText={setConfirm} />
          {/* 확인 칸에 뭔가 입력했을 때만 일치 여부를 보여줘요 */}
          {confirm.length > 0 && (
            <Rule label={matches ? '비밀번호가 일치해요' : '비밀번호가 일치하지 않아요'} ok={matches} />
          )}
        </View>
      </ScrollView>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          style={[styles.button, !canSubmit && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSubmit }}>
          <Text style={styles.buttonLabel}>비밀번호 변경</Text>
        </Pressable>
      </View>
    </View>
  );
}

// 눈 버튼으로 보이기/숨기기가 되는 비밀번호 입력칸 (이 화면에서 세 번 써서 따로 뺐어요)
function PasswordInput({
  value,
  onChangeText,
  error,
}: {
  value: string;
  onChangeText: (text: string) => void;
  error?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <View style={[styles.inputBox, error && styles.inputBoxError]}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!visible} // true면 ●●●로 가려져요
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Pressable
        onPress={() => setVisible((shown) => !shown)}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel={visible ? '비밀번호 숨기기' : '비밀번호 보기'}>
        <EyeIcon color={visible ? Palette.ink : Palette.hint} size={20} />
      </Pressable>
    </View>
  );
}

// 조건 한 줄 (통과하면 진한 글씨 + 체크)
function Rule({ label, ok }: { label: string; ok: boolean }) {
  return (
    <View style={styles.rule}>
      <CheckIcon color={ok ? Palette.ink : '#C9CBD1'} size={14} />
      <Text style={[styles.ruleText, ok && styles.ruleTextOk]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  content: {
    gap: 24,
    paddingTop: 8,
    paddingHorizontal: 20,
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
  link: {
    alignSelf: 'flex-end',
  },
  linkText: {
    fontSize: 13,
    fontWeight: '500',
    color: Palette.muted,
    textDecorationLine: 'underline',
  },
  rules: {
    flexDirection: 'row',
    gap: 12,
  },
  rule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ruleText: {
    fontSize: 12,
    color: Palette.hint,
  },
  ruleTextOk: {
    fontWeight: '600',
    color: Palette.ink,
  },
  bottom: {
    marginTop: 'auto',
    paddingHorizontal: 20,
  },
  button: {
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.ink,
  },
  buttonDisabled: {
    opacity: 0.35,
  },
  buttonLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: Palette.background,
  },
});
