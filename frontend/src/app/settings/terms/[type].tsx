/**
 * 약관 화면 (Figma: 이용약관 · 개인정보 처리방침 · 위치기반 서비스 이용약관)
 *
 * 파일 이름의 [type]은 "주소의 이 자리에 오는 글자를 type이라는 이름으로 받겠다"는 뜻이에요.
 *   /settings/terms/service  → type = 'service'  (이용약관)
 *   /settings/terms/privacy  → type = 'privacy'  (개인정보 처리방침)
 *   /settings/terms/location → type = 'location' (위치기반 서비스 이용약관)
 * 그래서 화면 파일 하나로 약관 3개를 보여줄 수 있어요. 글 내용은 constants/terms.ts에 있어요.
 */
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/common/screen-header';
import { TERMS } from '@/constants/terms';
import { Palette } from '@/constants/theme';

export default function TermsScreen() {
  const insets = useSafeAreaInsets();
  // useLocalSearchParams: 주소에 들어 있는 값을 꺼내요 (여기서는 [type] 자리의 글자)
  const { type } = useLocalSearchParams<{ type: string }>();
  const terms = TERMS[type];

  // 없는 약관 주소로 들어왔을 때 (예: /settings/terms/abc)
  if (!terms) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title="약관" />
        <Text style={styles.missing}>약관을 찾을 수 없어요</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader title={terms.title} />

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
        <View style={styles.meta}>
          <Text style={styles.badge}>초안</Text>
          <Text style={styles.date}>{terms.effectiveDate}</Text>
        </View>

        {/* 조항마다 제목(있으면) + 본문을 차례로 보여줘요 */}
        {terms.sections.map((section, index) => (
          <View key={index} style={styles.section}>
            {section.heading && <Text style={styles.heading}>{section.heading}</Text>}
            <Text style={styles.body}>{section.body}</Text>
          </View>
        ))}
      </ScrollView>
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
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 999,
    overflow: 'hidden',
    fontSize: 12,
    fontWeight: '700',
    color: Palette.ink,
    backgroundColor: Palette.accent,
  },
  date: {
    fontSize: 13,
    color: Palette.muted,
  },
  section: {
    gap: 8,
  },
  heading: {
    fontSize: 15,
    fontWeight: '700',
    color: Palette.ink,
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
    color: '#3A3F4A',
  },
  missing: {
    marginTop: 40,
    textAlign: 'center',
    fontSize: 15,
    color: Palette.muted,
  },
});
