/**
 * 회원 탈퇴 (Figma: 회원 탈퇴 확인, 회원 탈퇴 확인 - 기타 입력)
 * 들어오는 곳: 설정 → 계정 관리 → 회원 탈퇴
 *
 * "안내 내용을 모두 확인했어요"에 체크해야 빨간 "탈퇴하기" 버튼을 누를 수 있어요.
 * 탈퇴 이유는 선택이고, "기타"를 고르면 직접 쓰는 칸(최대 100자)이 나와요.
 */
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CheckIcon } from '@/components/common/icons';
import { ScreenHeader } from '@/components/common/screen-header';
import { Palette } from '@/constants/theme';

// TODO: 러닝 기록 개수는 서버에서 받은 실제 값으로 바꿔요. (Figma 예시: 37개)
const RUN_COUNT = 37;

const NOTICES = [
  `러닝 기록 ${RUN_COUNT}개와 통계가 모두 삭제돼요`,
  '가입한 크루에서 자동으로 탈퇴돼요',
  '친구 목록과 저장한 코스가 사라져요',
  '작성한 글과 댓글은 삭제되지 않아요',
  '같은 이메일로 30일 동안 다시 가입할 수 없어요',
];

const REASONS = ['자주 안 써요', '기록이 정확하지 않아요', '다른 앱을 써요', '기타'];
const MAX_ETC = 100; // 기타 이유 최대 글자 수

export default function WithdrawScreen() {
  const insets = useSafeAreaInsets();
  const [reason, setReason] = useState<string | null>(null); // 고른 이유 (안 골라도 됨)
  const [etc, setEtc] = useState(''); // 기타를 골랐을 때 직접 쓴 내용
  const [agreed, setAgreed] = useState(false); // 안내 확인 체크

  const handleWithdraw = () => {
    // TODO: 서버가 생기면 DELETE /api/me 로 탈퇴를 요청하고 (이유도 같이 보내요), 성공하면 완료 화면으로 가요.
    // router.replace: 지금 화면을 완료 화면으로 "바꿔치기"해서, 완료 화면에서 뒤로가기로 여기 못 돌아오게 해요.
    router.replace('/settings/withdraw-done');
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader title="회원 탈퇴" />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.intro}>
          <Text style={styles.title}>정말 탈퇴하시겠어요?</Text>
          <Text style={styles.subtitle}>탈퇴하기 전에 아래 내용을 꼭 확인해 주세요</Text>
        </View>

        <View style={styles.noticeCard}>
          {NOTICES.map((notice) => (
            <View key={notice} style={styles.noticeRow}>
              <View style={styles.dot} />
              <Text style={styles.noticeText}>{notice}</Text>
            </View>
          ))}
        </View>

        <View style={styles.reasonBox}>
          <Text style={styles.reasonTitle}>탈퇴하는 이유를 알려주세요 (선택)</Text>
          {/* flexWrap: 칩이 한 줄에 안 들어가면 다음 줄로 넘겨요 */}
          <View style={styles.chips}>
            {REASONS.map((item) => {
              const selected = reason === item;
              return (
                <Pressable
                  key={item}
                  style={[styles.chip, selected && styles.chipSelected]}
                  // 이미 고른 칩을 다시 누르면 선택이 풀려요
                  onPress={() => setReason(selected ? null : item)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}>
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{item}</Text>
                </Pressable>
              );
            })}
          </View>

          {reason === '기타' && (
            <View style={styles.etcBox}>
              <TextInput
                style={styles.etcInput}
                value={etc}
                onChangeText={setEtc}
                maxLength={MAX_ETC}
                placeholder="탈퇴하는 이유를 적어 주세요"
                placeholderTextColor={Palette.hint}
                multiline
              />
              <Text style={styles.counter}>
                {etc.length}/{MAX_ETC}
              </Text>
            </View>
          )}
        </View>

        <Pressable
          style={styles.agreeRow}
          onPress={() => setAgreed((value) => !value)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: agreed }}>
          <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
            {agreed && <CheckIcon color={Palette.accent} size={16} />}
          </View>
          <Text style={styles.agreeText}>안내 내용을 모두 확인했어요</Text>
        </Pressable>
      </ScrollView>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          style={[styles.withdrawButton, !agreed && styles.disabled]}
          onPress={handleWithdraw}
          disabled={!agreed}
          accessibilityRole="button"
          accessibilityState={{ disabled: !agreed }}>
          <Text style={styles.withdrawLabel}>탈퇴하기</Text>
        </Pressable>
        <Pressable style={styles.cancel} onPress={() => router.back()} accessibilityRole="button">
          <Text style={styles.cancelLabel}>취소</Text>
        </Pressable>
      </View>
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
  intro: {
    gap: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: Palette.ink,
  },
  subtitle: {
    fontSize: 14,
    color: Palette.muted,
  },
  noticeCard: {
    gap: 10,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
  },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Palette.alert,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    color: '#3A3F4A',
  },
  reasonBox: {
    gap: 10,
  },
  reasonTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Palette.ink,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
  },
  chipSelected: {
    borderColor: Palette.ink,
    backgroundColor: Palette.ink,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#3A3F4A',
  },
  chipTextSelected: {
    fontWeight: '700',
    color: Palette.background,
  },
  etcBox: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
  },
  etcInput: {
    minHeight: 60,
    fontSize: 14,
    color: Palette.ink,
    textAlignVertical: 'top',
  },
  counter: {
    alignSelf: 'flex-end',
    fontSize: 12,
    color: Palette.hint,
  },
  agreeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#C9CBD1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    borderWidth: 0,
    backgroundColor: Palette.ink,
  },
  agreeText: {
    fontSize: 14,
    fontWeight: '500',
    color: Palette.ink,
  },
  bottom: {
    gap: 4,
    paddingTop: 12,
    paddingHorizontal: 20,
  },
  withdrawButton: {
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.alert,
  },
  disabled: {
    opacity: 0.35,
  },
  withdrawLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancel: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Palette.muted,
  },
});
