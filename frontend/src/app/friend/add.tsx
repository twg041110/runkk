import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';

import { ChatIcon, CopyIcon, LinkIcon, PlusIcon, SearchIcon } from '@/components/common/icons';
import { Avatar, Button, Card, EmptyState, SubScreen, TopBar, useToast } from '@/components/common/ui';
import { Palette } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { errorMessage, type Profile } from '@/lib/api';
import { ago } from '@/lib/format';
import {
  answerFriendRequest,
  removeFriend,
  sendFriendRequest,
  useFriendRequests,
  useFriends,
  useMemberSearch,
} from '@/lib/friends';

const CODE_PATTERN = /^RKK-[A-Z0-9]{4}$/;

export default function AddFriendScreen() {
  const toast = useToast();
  const { me } = useAuth();
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<number | string | null>(null);
  const requestsQuery = useFriendRequests();
  const friendsQuery = useFriends();
  const q = query.trim();
  const asCode = q.toUpperCase();
  const isCode = CODE_PATTERN.test(asCode);
  const searchQuery = useMemberSearch(isCode ? '' : q);

  const myCode = me?.friendCode ?? '';
  const received = requestsQuery.data?.received ?? [];
  const sent = requestsQuery.data?.sent ?? [];
  const friendIds = new Set((friendsQuery.data ?? []).map((f) => f.memberId));
  const sentIds = new Set(sent.map((r) => r.member.memberId));
  const results = (searchQuery.data ?? []).filter((p) => p.memberId !== me?.memberId);

  const act = async (key: number | string, task: () => Promise<unknown>, done: string) => {
    setBusyId(key);
    try {
      await task();
      toast.show(done);
    } catch (e) {
      toast.show(errorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  const copyCode = async () => {
    await Clipboard.setStringAsync(myCode);
    toast.show(`내 친구 코드 ${myCode}를 복사했어요`);
  };
  const share = (via: string) =>
    Share.share({ message: `런크크에서 같이 달려요! 친구 추가에서 내 코드 ${myCode} 를 검색해 주세요` }).catch(() =>
      toast.show(`${via} 공유를 열 수 없어요`),
    );

  return (
    <SubScreen header={<TopBar title="친구 추가" />} overlay={toast.node}>
      <View style={styles.search}>
        <SearchIcon color={Palette.hint} size={20} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="닉네임 또는 친구 코드(RKK-XXXX)로 검색"
          placeholderTextColor={Palette.hint}
          autoCapitalize="none"
          returnKeyType="search"
        />
      </View>

      {q ? (
        isCode ? (
          // 친구 코드는 정확히 맞으면 바로 요청을 보낼 수 있다
          <Card style={styles.list}>
            <View style={styles.row}>
              <Avatar name={asCode.slice(4)} size={42} />
              <View style={styles.flex}>
                <Text style={styles.name}>친구 코드 {asCode}</Text>
                <Text style={styles.sub}>
                  {asCode === myCode ? '내 친구 코드예요' : '이 코드의 러너에게 친구 요청을 보내요'}
                </Text>
              </View>
              {asCode !== myCode ? (
                <AddButton
                  busy={busyId === asCode}
                  label="요청"
                  onPress={() =>
                    act(asCode, () => sendFriendRequest({ friendCode: asCode }), '친구 요청을 보냈어요')
                  }
                />
              ) : null}
            </View>
          </Card>
        ) : searchQuery.loading ? (
          <ActivityIndicator color={Palette.ink} style={styles.loading} />
        ) : searchQuery.error ? (
          <EmptyState title="검색하지 못했어요" message={searchQuery.error} />
        ) : results.length > 0 ? (
          <Card style={styles.list}>
            {results.map((person, index) => (
              <PersonRow
                key={person.memberId}
                person={person}
                last={index === results.length - 1}
                state={friendIds.has(person.memberId) ? 'friend' : sentIds.has(person.memberId) ? 'sent' : 'none'}
                busy={busyId === person.memberId}
                onAdd={() =>
                  act(
                    person.memberId,
                    () => sendFriendRequest({ memberId: person.memberId }),
                    `${person.nickname}님에게 친구 요청을 보냈어요`,
                  )
                }
              />
            ))}
          </Card>
        ) : (
          <EmptyState title="찾는 러너가 없어요" message={'닉네임이나 친구 코드를\n다시 확인해 주세요'} />
        )
      ) : (
        <>
          <View style={styles.code}>
            <Text style={styles.codeLabel}>내 친구 코드</Text>
            <Text style={styles.codeValue}>{myCode}</Text>
            <View style={styles.codeButtons}>
              <DarkButton label="코드 복사" icon={<CopyIcon color={Palette.white} size={16} />} onPress={copyCode} />
            </View>
          </View>

          <View style={styles.shareRow}>
            <Button
              label="카카오톡으로 초대"
              tone="lime"
              height={48}
              radius={14}
              flex
              fontSize={14}
              icon={(color) => <ChatIcon color={color} size={16} />}
              onPress={() => share('카카오톡')}
              style={{ backgroundColor: '#FEE500' }}
            />
            <Button
              label="링크 공유"
              tone="outline"
              height={48}
              radius={14}
              flex
              fontSize={14}
              icon={(color) => <LinkIcon color={color} size={16} />}
              onPress={() => share('링크')}
            />
          </View>

          <Card style={styles.list}>
            <View style={styles.headRow}>
              <Text style={styles.cardTitle}>받은 친구 요청</Text>
              {received.length > 0 ? (
                <View style={styles.redBadge}>
                  <Text style={styles.redBadgeText}>{received.length}</Text>
                </View>
              ) : null}
            </View>
            {requestsQuery.loading && !requestsQuery.data ? <ActivityIndicator color={Palette.ink} style={styles.loading} /> : null}
            {requestsQuery.data && received.length === 0 ? <Text style={styles.empty}>받은 친구 요청이 없어요</Text> : null}
            {received.map((request, index) => (
              <View key={request.friendshipId} style={[styles.row, index < received.length - 1 && styles.border]}>
                <Avatar name={request.member.nickname} size={42} />
                <View style={styles.flex}>
                  <Text style={styles.name}>{request.member.nickname}</Text>
                  <Text style={styles.sub}>
                    {[request.member.region, ago(request.requestedAt)].filter(Boolean).join(' · ')}
                  </Text>
                </View>
                <SmallButton
                  label="거절"
                  tone="gray"
                  disabled={busyId === request.friendshipId}
                  onPress={() =>
                    act(
                      request.friendshipId,
                      () => answerFriendRequest(request.friendshipId, false),
                      `${request.member.nickname}님의 요청을 거절했어요`,
                    )
                  }
                />
                <SmallButton
                  label="수락"
                  tone="lime"
                  disabled={busyId === request.friendshipId}
                  onPress={() =>
                    act(
                      request.friendshipId,
                      () => answerFriendRequest(request.friendshipId, true),
                      `${request.member.nickname}님과 친구가 됐어요`,
                    )
                  }
                />
              </View>
            ))}
          </Card>

          {sent.length > 0 ? (
            <Card style={styles.list}>
              <View>
                <Text style={styles.cardTitle}>보낸 친구 요청</Text>
                <Text style={styles.sub}>상대가 수락하면 친구 목록에 나타나요</Text>
              </View>
              {sent.map((request, index) => (
                <View key={request.friendshipId} style={[styles.row, index < sent.length - 1 && styles.border]}>
                  <Avatar name={request.member.nickname} size={42} />
                  <View style={styles.flex}>
                    <Text style={styles.name}>{request.member.nickname}</Text>
                    <Text style={styles.sub}>{ago(request.requestedAt)} 보냄</Text>
                  </View>
                  <SmallButton
                    label="취소"
                    tone="gray"
                    disabled={busyId === request.friendshipId}
                    onPress={() => act(request.friendshipId, () => removeFriend(request.friendshipId), '친구 요청을 취소했어요')}
                  />
                </View>
              ))}
            </Card>
          ) : null}
        </>
      )}
    </SubScreen>
  );
}

function PersonRow({
  person,
  last,
  state,
  busy,
  onAdd,
}: {
  person: Profile;
  last: boolean;
  state: 'none' | 'sent' | 'friend';
  busy: boolean;
  onAdd: () => void;
}) {
  return (
    <View style={[styles.row, !last && styles.border]}>
      <Avatar name={person.nickname} size={42} />
      <View style={styles.flex}>
        <Text style={styles.name}>{person.nickname}</Text>
        <Text style={styles.sub}>{person.region ?? person.bio ?? person.friendCode}</Text>
      </View>
      {state === 'friend' ? (
        <SmallButton label="친구" tone="gray" />
      ) : state === 'sent' ? (
        <SmallButton label="요청함" tone="gray" />
      ) : (
        <AddButton busy={busy} label="추가" onPress={onAdd} accessibilityLabel={`${person.nickname} 친구 추가`} />
      )}
    </View>
  );
}

function AddButton({
  busy,
  label,
  onPress,
  accessibilityLabel,
}: {
  busy: boolean;
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      onPress={busy ? undefined : onPress}
      style={[styles.addButton, busy && styles.busy]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}>
      <PlusIcon color={Palette.white} size={14} strokeWidth={2.6} />
      <Text style={styles.addText}>{label}</Text>
    </Pressable>
  );
}

function SmallButton({
  label,
  tone,
  onPress,
  disabled,
}: {
  label: string;
  tone: 'gray' | 'lime';
  onPress?: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress || disabled}
      style={[styles.small, { backgroundColor: tone === 'lime' ? Palette.accent : Palette.chip }, disabled && styles.busy]}
      accessibilityRole="button">
      <Text style={styles.smallText}>{label}</Text>
    </Pressable>
  );
}

function DarkButton({ label, icon, onPress }: { label: string; icon: React.ReactNode; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.darkButton} accessibilityRole="button">
      {icon}
      <Text style={styles.darkButtonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 4 },
  loading: { paddingVertical: 20 },
  busy: { opacity: 0.5 },
  search: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.white,
  },
  searchInput: { flex: 1, fontSize: 15, color: Palette.ink },
  code: { backgroundColor: Palette.darkCard, borderRadius: 20, padding: 20, gap: 6 },
  codeLabel: { fontSize: 13, fontWeight: '500', color: Palette.darkText },
  codeValue: { fontSize: 24, fontWeight: '900', color: Palette.white },
  codeButtons: { flexDirection: 'row', gap: 8, marginTop: 10 },
  darkButton: {
    flex: 1,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    backgroundColor: Palette.darkLine,
  },
  darkButtonText: { fontSize: 13, fontWeight: '700', color: Palette.white },
  shareRow: { flexDirection: 'row', gap: 8 },
  list: { gap: 4, paddingBottom: 8 },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Palette.ink },
  redBadge: { backgroundColor: Palette.alert, borderRadius: 9, paddingHorizontal: 6, paddingVertical: 1 },
  redBadgeText: { fontSize: 11, fontWeight: '700', color: Palette.white },
  empty: { fontSize: 13, color: Palette.muted, paddingVertical: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  border: { borderBottomWidth: 1, borderBottomColor: Palette.chip },
  name: { fontSize: 15, fontWeight: '700', color: Palette.ink },
  sub: { fontSize: 12, color: Palette.muted },
  small: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  smallText: { fontSize: 12, fontWeight: '700', color: Palette.ink },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Palette.ink,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  addText: { fontSize: 12, fontWeight: '700', color: Palette.white },
});
