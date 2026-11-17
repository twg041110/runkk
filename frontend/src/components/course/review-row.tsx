import { StyleSheet, Text, View } from 'react-native';

import { Avatar, Tag } from '@/components/common/ui';
import { Palette } from '@/constants/theme';
import type { Review } from '@/data/courses';

/** 코스 후기 한 줄 */
export function ReviewRow({ review, last }: { review: Review; last?: boolean }) {
  return (
    <View style={[styles.row, !last && styles.border]}>
      <Avatar name={review.name} size={34} />
      <View style={styles.body}>
        <View style={styles.head}>
          <Text style={styles.name}>{review.name}</Text>
          <Tag label={review.badge} size={10} style={styles.badge} />
          <Text style={styles.when}>{review.when}</Text>
        </View>
        <Text style={styles.text}>{review.text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, paddingVertical: 12 },
  border: { borderBottomWidth: 1, borderBottomColor: Palette.chip },
  body: { flex: 1, gap: 4 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 13, fontWeight: '700', color: Palette.ink },
  badge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 },
  when: { fontSize: 11, color: Palette.hint },
  text: { fontSize: 13, lineHeight: 19, color: Palette.inkSoft },
});
