/**
 * 차단한 친구 (Figma: 차단한 친구, 차단한 친구 - 차단 해제 후)
 * 들어오는 곳: 설정 → 계정 관리 → 차단한 친구
 *
 * "차단 해제"를 누르면 목록에서 빠지고 아래에 안내가 잠깐 떠요.
 * 마지막 한 명까지 해제하면 "차단한 친구가 없어요" 빈 화면이 나와요.
 */
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { ScreenHeader } from '@/components/common/screen-header';
import { Toast } from '@/components/common/toast';
import { Palette } from '@/constants/theme';
import { useSettings, type BlockedFriend } from '@/hooks/use-settings';

export default function BlockedFriendsScreen() {
  const { settings, update } = useSettings();
  const [toast, setToast] = useState('');

  const unblock = (friend: BlockedFriend) => {
    // TODO: 서버가 생기면 DELETE /api/friends/blocks/{id} 같은 API로 보내요 (친구 담당과 이름 정하기)
    // filter: 해제한 친구만 빼고 나머지로 새 목록을 만들어요
    update({ blockedFriends: settings.blockedFriends.filter((f) => f.id !== friend.id) });
    setToast(`${friend.name} 님의 차단을 해제했어요`);
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader title="차단한 친구" />

      {/* FlatList: 목록을 그리는 부품. 항목이 많아져도 화면에 보이는 것만 그려서 빨라요 */}
      <FlatList
        data={settings.blockedFriends}
        keyExtractor={(friend) => String(friend.id)}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <Text style={styles.guide}>
            차단한 친구는 내 기록과 러닝 중 상태를 볼 수 없고, 같이 달리기 초대도 보낼 수 없어요.
          </Text>
        }
        ListEmptyComponent={<Text style={styles.empty}>차단한 친구가 없어요</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {/* 프로필 사진 대신 이름 첫 글자 동그라미 */}
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.name.slice(0, 1)}</Text>
            </View>
            <View style={styles.texts}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.date}>{item.blockedAt}에 차단함</Text>
            </View>
            <Pressable style={styles.unblock} onPress={() => unblock(item)} accessibilityRole="button">
              <Text style={styles.unblockText}>차단 해제</Text>
            </Pressable>
          </View>
        )}
      />

      <Toast message={toast} onHide={() => setToast('')} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  content: {
    gap: 12,
    paddingTop: 8,
    paddingHorizontal: 20,
  },
  guide: {
    fontSize: 14,
    lineHeight: 21,
    color: Palette.muted,
  },
  empty: {
    marginTop: 60,
    textAlign: 'center',
    fontSize: 15,
    color: Palette.hint,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FCE3C3',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: Palette.ink,
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: Palette.ink,
  },
  date: {
    fontSize: 12,
    color: Palette.hint,
  },
  unblock: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: '#FFFFFF',
  },
  unblockText: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.ink,
  },
});
