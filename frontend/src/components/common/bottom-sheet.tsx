/**
 * 아래에서 올라오는 시트 (예: 방해 금지 시간 고르기)
 *
 * animationType="slide": 아래에서 위로 올라오고, 닫을 때 아래로 내려가요.
 * 어두운 배경을 누르면 닫혀요. (Figma: 배경 누르기 · 저장 · 아래로 끌기로 닫힘)
 * TODO: 손가락으로 아래로 끌어서 닫기는 아직 없어요. 필요하면 react-native-gesture-handler로 추가해요.
 */
import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Palette } from '@/constants/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode; // 시트 안에 들어갈 내용
};

export function BottomSheet({ visible, onClose, children }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.wrap}>
        {/* 시트 위쪽의 어두운 빈 공간. 누르면 닫혀요 */}
        <Pressable style={styles.dim} onPress={onClose} accessibilityLabel="닫기" />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          {/* 맨 위 회색 손잡이 (끌 수 있다는 표시) */}
          <View style={styles.handle} />
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  dim: {
    flex: 1,
  },
  sheet: {
    paddingTop: 10,
    paddingHorizontal: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: Palette.surface,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 16,
    backgroundColor: '#DDE1E6',
  },
});
