import { StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/theme';

export function ComingSoon({ title }: { title: string }) {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.caption}>준비 중인 화면이에요</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Palette.background,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Palette.ink,
  },
  caption: {
    fontSize: 14,
    color: Palette.muted,
  },
});