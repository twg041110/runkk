/**
 * 하위 화면 공통 헤더: 왼쪽 뒤로가기 + 가운데 제목 (Figma "A형" 헤더)
 * 설정·러닝·커뮤니티 하위 화면에서 같이 써요.
 *
 * 사용 예: <ScreenHeader title="설정" />
 */
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChevronLeftIcon } from '@/components/common/icons';
import { Palette } from '@/constants/theme';

export function ScreenHeader({ title }: { title: string }) {
  // 아이폰 노치·상태바 영역만큼 위에 여백을 줘서 글자가 가려지지 않게 해요.
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      {/* router.back(): 이 화면에 들어오기 직전 화면으로 돌아가요 */}
      <Pressable
        style={styles.side}
        onPress={() => router.back()}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="뒤로가기">
        <ChevronLeftIcon color={Palette.ink} size={22} />
      </Pressable>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {/* 제목이 정확히 가운데 오도록 오른쪽에도 같은 너비의 빈 칸을 둬요 */}
      <View style={styles.side} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 8,
    backgroundColor: Palette.background,
  },
  side: {
    width: 64,
    height: 44,
    paddingLeft: 12,
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: Palette.ink,
  },
});
