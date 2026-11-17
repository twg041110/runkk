/**
 * 화면 아래쪽에 잠깐 떴다가 사라지는 안내 문구 (예: "비밀번호를 바꿨어요")
 *
 * message가 빈 문자열이 아니면 보이고, 2.5초 뒤에 onHide를 불러서 사라지게 해요.
 */
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CheckIcon } from '@/components/common/icons';
import { Palette } from '@/constants/theme';

export function Toast({ message, onHide }: { message: string; onHide: () => void }) {
  const insets = useSafeAreaInsets();

  // useEffect: message가 바뀔 때마다 실행돼요. 2.5초 타이머를 걸고,
  // 화면을 떠나거나 문구가 바뀌면 return의 함수로 타이머를 정리해요.
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onHide, 2500);
    return () => clearTimeout(timer);
  }, [message, onHide]);

  if (!message) return null;

  return (
    <View style={[styles.toast, { bottom: insets.bottom + 24 }]} pointerEvents="none">
      <CheckIcon color={Palette.accent} size={18} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: Palette.ink,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    color: Palette.background,
  },
});
