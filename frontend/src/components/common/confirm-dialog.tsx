/**
 * 가운데 뜨는 확인 팝업 (예: "로그아웃할까요?")
 *
 * Modal: 화면 위에 덮어서 띄우는 React Native 기본 부품이에요.
 * visible이 true일 때만 보이고, 어두운 배경을 누르거나 취소를 누르면 onCancel이 불려요.
 */
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/theme';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string; // 오른쪽 검정 버튼 글자 (예: "로그아웃")
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({ visible, title, message, confirmLabel, onConfirm, onCancel }: Props) {
  return (
    // transparent: 뒤 화면이 비쳐 보이게, animationType="fade": 서서히 나타나게
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      {/* 어두운 배경. 누르면 닫혀요 */}
      <Pressable style={styles.dim} onPress={onCancel}>
        {/* 팝업 상자. 상자를 누를 때는 닫히지 않도록 onPress를 비워 둬요 */}
        <Pressable style={styles.box} onPress={() => {}}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttons}>
            <Pressable style={[styles.button, styles.cancel]} onPress={onCancel} accessibilityRole="button">
              <Text style={styles.cancelLabel}>취소</Text>
            </Pressable>
            <Pressable style={[styles.button, styles.confirm]} onPress={onConfirm} accessibilityRole="button">
              <Text style={styles.confirmLabel}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  dim: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  box: {
    alignSelf: 'stretch',
    gap: 8,
    padding: 20,
    borderRadius: 20,
    backgroundColor: Palette.surface,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Palette.ink,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: Palette.muted,
  },
  buttons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancel: {
    backgroundColor: '#E4E6EB',
  },
  confirm: {
    backgroundColor: Palette.ink,
  },
  cancelLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Palette.ink,
  },
  confirmLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Palette.background,
  },
});
