import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ComingSoon } from '@/components/common/coming-soon';
import { Palette } from '@/constants/theme';

export default function ProfileScreen() {
  return (
    <View style={styles.screen}>
      <ComingSoon title="내 정보" />
      {/* TODO(임시 입구): 내 정보 화면이 만들어지면 그 화면의 설정 버튼으로 옮기고 이 버튼은 지워요 */}
      <Pressable style={styles.button} onPress={() => router.push('/settings')} accessibilityRole="button">
        <Text style={styles.label}>설정 열기 (임시)</Text>
      </Pressable>
      {/* TODO(임시 입구): 홈의 가운데 러닝 버튼과 연결되면 이 버튼은 지워요 */}
      <Pressable style={[styles.button, styles.runButton]} onPress={() => router.push('/run')} accessibilityRole="button">
        <Text style={styles.label}>러닝 시작 (임시)</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  button: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 140,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 999,
    backgroundColor: Palette.ink,
  },
  runButton: {
    bottom: 196,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: Palette.background,
  },
});
