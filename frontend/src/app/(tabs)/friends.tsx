import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddUserIcon, CalendarIcon } from '@/components/common/icons';
import {
  Avatar,
  Button,
  Card,
  Chip,
  ConfirmDialog,
  EmptyState,
  IconButton,
  MoreLink,
  TabHeader,
  shared,
  useToast,
} from '@/components/common/ui';
import { InviteSheet } from '@/components/friend/invite-sheet';
import { Palette } from '@/constants/theme';
import { getCourse } from '@/data/courses';
import { FRIENDS, FRIEND_REQUESTS, ME, RUN_INVITE, getFriend, type Friend } from '@/data/friends';
import { actions, useAppStore } from '@/hooks/use-app-store';

type ListFilter = 'all' | 'running' | 'online';

export default function FriendsScreen() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const removed = useAppStore((s) => s.removedFriends);
  const invite = useAppStore((s) => s.runInvite);
  const accepted = useAppStore((s) => s.acceptedRequests);
  const rejected = useAppStore((s) => s.rejectedRequests);
  const [filter, setFilter] = useState<ListFilter>('all');
  const [editing, setEditing] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<Friend | null>(null);
  const [inviteTarget, setInviteTarget] = useState<string | null>(null);

  const friends = FRIENDS.filter((friend) => !removed.includes(friend.id));
  const running = friends.filter((friend) => friend.status === 'running');
  const online = friends.filter((friend) => friend.status !== 'offline');
  const shown = filter === 'running' ? running : filter === 'online' ? online : friends;
  const pendingRequests = FRIEND_REQUESTS.filter((r) => !accepted.includes(r.id) && !rejected.includes(r.id)).length;

  // 이번 주 랭킹: 나 포함 상위 3명과 내 위치
  const ranking = [...friends.map((f) => ({ name: f.name, km: f.weeklyKm, me: false })), { name: '나', km: ME.weeklyKm, me: true }]
    .sort((a, b) => b.km - a.km);
  const myRank = ranking.findIndex((r) => r.me);
  const top = ranking.slice(0, 3);
  if (myRank >= 3) top[2] = ranking[myRank];
  const above = myRank > 0 ? ranking[myRank - 1] : null;
  const maxKm = ranking[0].km || 1;
  const inviter = getFriend(RUN_INVITE.from);

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[shared.tabContent, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}>
        <TabHeader
          title="친구와 러닝"
          caption="함께 달리면 더 멀리 갈 수 있어요"
          right={
            <IconButton label="친구 추가" badge={pendingRequests || undefined} onPress={() => router.push('/friend/add')}>
              <AddUserIcon color={Palette.ink} />
            </IconButton>
          }
        />

        {friends.length === 0 ? (
          <Card style={styles.noFriend}>
            <EmptyState title="아직 친구가 없어요" message={'친구 코드나 닉네임으로\n함께 달릴 친구를 찾아보세요'} />
            <Button label="친구 추가하기" tone="dark" onPress={() => router.push('/friend/add')} />
          </Card>
        ) : null}

        {/* 지금 달리는 친구 */}
        {friends.length > 0 ? (
          <View style={styles.live}>
            <View style={styles.liveHead}>
              <View style={styles.liveDot} />
              <Text style={styles.liveTitle}>지금 달리는 친구</Text>
              <View style={styles.liveCount}>
                <Text style={styles.liveCountText}>{running.length}</Text>
              </View>
            </View>
            {running.length === 0 ? (
              <Text style={styles.liveEmpty}>지금 달리는 친구가 없어요. 먼저 달리고 친구에게 알려보세요!</Text>
            ) : (
              running.map((friend, index) => (
                <View key={friend.id} style={[styles.liveRow, index < running.length - 1 && styles.liveBorder]}>
                  <Pressable
                    onPress={() => router.push(`/friend/${friend.id}`)}
                    style={styles.rowMain}
                    accessibilityRole="button">
                    <Avatar name={friend.name} status="running" />
                    <View style={styles.flex}>
                      <Text style={styles.liveName}>{friend.name}</Text>
                      <Text style={styles.liveSub} numberOfLines={1}>
                        {friend.live?.course} · {friend.live?.km.toFixed(2)}km · {friend.live?.pace}
                      </Text>
                    </View>
                  </Pressable>
                  <Pressable
                    onPress={() => router.push(`/friend/${friend.id}/join`)}
                    style={styles.joinButton}
                    accessibilityRole="button"
                    accessibilityLabel={`${friend.name}님 러닝 참여`}>
                    <Text style={styles.joinText}>참여</Text>
                  </Pressable>
                </View>
              ))
            )}
          </View>
        ) : null}

        {/* 같이 달리기 초대 */}
        {invite !== 'rejected' ? (
          <Card tone="white" style={styles.invite}>
            <View style={styles.inviteHead}>
              <Avatar name={inviter.name} size={40} />
              <View style={styles.flex}>
                <Text style={styles.inviteTitle}>{inviter.name} 님의 같이 달리기 초대</Text>
                <View style={styles.inviteMeta}>
                  <CalendarIcon color={Palette.muted} />
                  <Text style={styles.inviteMetaText} numberOfLines={1}>
                    {RUN_INVITE.when} · {RUN_INVITE.course}
                  </Text>
                </View>
              </View>
            </View>
            {invite === 'accepted' ? (
              <View style={styles.inviteDone}>
                <Text style={styles.inviteDoneText}>참여하기로 했어요. 시작 30분 전에 알려드릴게요</Text>
              </View>
            ) : (
              <View style={styles.inviteButtons}>
                <Button
                  label="거절"
                  tone="gray"
                  height={40}
                  radius={12}
                  flex
                  fontSize={13}
                  onPress={() => {
                    actions.answerRunInvite('rejected');
                    toast.show(`${inviter.name}님의 초대를 거절했어요`);
                  }}
                />
                <Button
                  label="참여하기"
                  tone="dark"
                  height={40}
                  radius={12}
                  flex
                  fontSize={13}
                  onPress={() => {
                    actions.answerRunInvite('accepted');
                    toast.show(`${inviter.name}님과 같이 달리기로 했어요`);
                  }}
                />
              </View>
            )}
          </Card>
        ) : null}

        {/* 이번 주 친구 랭킹 */}
        {friends.length > 0 ? (
          <Card style={styles.gap12}>
            <View style={shared.rowBetween}>
              <Text style={styles.cardTitle}>이번 주 친구 랭킹</Text>
              <MoreLink label="전체" onPress={() => router.push('/friend/ranking')} />
            </View>
            {top.map((row) => {
              const rank = ranking.indexOf(row) + 1;
              return (
                <View key={row.name} style={[styles.rankRow, row.me && styles.rankMe]}>
                  <Text style={[styles.rankNo, rank === 1 && { color: Palette.ink }]}>{rank}</Text>
                  <Avatar name={row.name} size={32} />
                  <View style={styles.rankBody}>
                    <View style={shared.rowBetween}>
                      <Text style={styles.rankName}>{row.me ? `나 (${ME.name})` : row.name}</Text>
                      <Text style={styles.rankName}>{row.km.toFixed(1)} km</Text>
                    </View>
                    <View style={styles.track}>
                      <View
                        style={[
                          styles.fill,
                          { width: `${(row.km / maxKm) * 100}%`, backgroundColor: row.me ? Palette.ink : Palette.hint },
                        ]}
                      />
                    </View>
                  </View>
                </View>
              );
            })}
            <Text style={styles.rankHint}>
              {above
                ? `${above.name} 님까지 ${(above.km - ME.weeklyKm).toFixed(1)}km 남았어요. 이번 주 ${myRank}등에 도전해보세요!`
                : '이번 주 1등이에요! 이 기록을 지켜보세요'}
            </Text>
          </Card>
        ) : null}

        {/* 내 친구 */}
        {friends.length > 0 ? (
          <Card style={styles.friendList}>
            <View style={shared.rowBetween}>
              <View style={shared.row}>
                <Text style={styles.cardTitle}>내 친구 </Text>
                <Text style={[styles.cardTitle, { color: Palette.muted }]}>{friends.length}</Text>
              </View>
              <Pressable onPress={() => setEditing((v) => !v)} hitSlop={8} accessibilityRole="button">
                <Text style={styles.edit}>{editing ? '완료' : '편집'}</Text>
              </Pressable>
            </View>
            <View style={styles.filters}>
              <Chip label="전체" size="sm" selected={filter === 'all'} onPress={() => setFilter('all')} />
              <Chip
                label={`러닝 중 ${running.length}`}
                size="sm"
                selected={filter === 'running'}
                onPress={() => setFilter('running')}
              />
              <Chip
                label={`온라인 ${online.length}`}
                size="sm"
                selected={filter === 'online'}
                onPress={() => setFilter('online')}
              />
            </View>
            {shown.length === 0 ? (
              <Text style={styles.listEmpty}>
                {filter === 'running' ? '지금 달리는 친구가 없어요' : '지금 접속한 친구가 없어요'}
              </Text>
            ) : null}
            {shown.map((friend, index) => (
              <FriendRow
                key={friend.id}
                friend={friend}
                last={index === shown.length - 1}
                editing={editing}
                onRemove={() => setRemoveTarget(friend)}
                onInvite={() => setInviteTarget(friend.id)}
                onCheer={() => {
                  actions.cheerFriend(friend.id);
                  toast.show(`${friend.name}님에게 응원을 보냈어요`);
                }}
              />
            ))}
          </Card>
        ) : null}
      </ScrollView>

      <ConfirmDialog
        visible={removeTarget !== null}
        title={`${removeTarget?.name ?? ''}님을 친구에서 삭제할까요?`}
        message="삭제하면 서로의 러닝 소식과 랭킹이 보이지 않아요. 상대방에게 알림은 가지 않아요."
        confirmLabel="삭제"
        danger
        onCancel={() => setRemoveTarget(null)}
        onConfirm={() => {
          if (removeTarget) {
            const target = removeTarget;
            actions.removeFriend(target.id);
            toast.show(`${target.name}님을 친구에서 삭제했어요`, {
              label: '되돌리기',
              onPress: () => actions.restoreFriend(target.id),
            });
          }
          setRemoveTarget(null);
        }}
      />
      <InviteSheet
        visible={inviteTarget !== null}
        course={getCourse('yeouido')}
        friendId={inviteTarget ?? undefined}
        onClose={() => setInviteTarget(null)}
        onSent={(name, when) => toast.show(`${name}님에게 초대를 보냈어요 · ${when}`)}
      />
      {toast.node}
    </View>
  );
}

function FriendRow({
  friend,
  last,
  editing,
  onRemove,
  onInvite,
  onCheer,
}: {
  friend: Friend;
  last: boolean;
  editing: boolean;
  onRemove: () => void;
  onInvite: () => void;
  onCheer: () => void;
}) {
  const cheered = useAppStore((s) => s.cheeredFriends).includes(friend.id);
  const sub =
    friend.status === 'running'
      ? { text: `러닝 중 · ${friend.live?.km.toFixed(2)}km`, color: Palette.running }
      : friend.status === 'online'
        ? { text: '온라인', color: Palette.online }
        : { text: friend.lastSeen ?? '오프라인', color: Palette.offline };

  let action = (
    <Pressable onPress={onCheer} style={[styles.rowButton, { backgroundColor: Palette.chip }]} accessibilityRole="button">
      <Text style={[styles.rowButtonText, { color: Palette.inkSoft }]}>{cheered ? '응원함' : '응원'}</Text>
    </Pressable>
  );
  if (friend.status === 'running') {
    action = (
      <Pressable
        onPress={() => router.push(`/friend/${friend.id}/join`)}
        style={[styles.rowButton, { backgroundColor: Palette.accent }]}
        accessibilityRole="button">
        <Text style={styles.rowButtonText}>참여</Text>
      </Pressable>
    );
  } else if (friend.status === 'online') {
    action = (
      <Pressable onPress={onInvite} style={[styles.rowButton, { backgroundColor: Palette.ink }]} accessibilityRole="button">
        <Text style={[styles.rowButtonText, { color: Palette.white }]}>초대</Text>
      </Pressable>
    );
  }
  if (editing) {
    action = (
      <Pressable onPress={onRemove} style={[styles.rowButton, styles.removeButton]} accessibilityRole="button">
        <Text style={[styles.rowButtonText, { color: Palette.alert }]}>삭제</Text>
      </Pressable>
    );
  }

  return (
    <View style={[styles.friendRow, !last && styles.friendBorder]}>
      <Pressable onPress={() => router.push(`/friend/${friend.id}`)} style={styles.rowMain} accessibilityRole="button">
        <Avatar name={friend.name} status={friend.status} />
        <View style={styles.flex}>
          <Text style={styles.friendName}>{friend.name}</Text>
          <Text style={[styles.friendSub, { color: sub.color }]}>{sub.text}</Text>
        </View>
        <View style={styles.total}>
          <Text style={styles.totalValue}>{friend.totalKm.toFixed(1)}</Text>
          <Text style={styles.totalLabel}>누적 km</Text>
        </View>
      </Pressable>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Palette.background },
  flex: { flex: 1, gap: 3 },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  gap12: { gap: 12 },
  noFriend: { gap: 4 },
  live: { backgroundColor: Palette.darkCard, borderRadius: 22, paddingTop: 18, paddingBottom: 8, paddingHorizontal: 18 },
  liveHead: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 6 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Palette.alert },
  liveTitle: { fontSize: 15, fontWeight: '700', color: Palette.white },
  liveCount: { backgroundColor: Palette.accent, borderRadius: 9, paddingHorizontal: 7, paddingVertical: 1 },
  liveCountText: { fontSize: 12, fontWeight: '900', color: Palette.ink },
  liveEmpty: { fontSize: 13, color: Palette.darkText, paddingVertical: 12 },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  liveBorder: { borderBottomWidth: 1, borderBottomColor: Palette.darkLine },
  liveName: { fontSize: 15, fontWeight: '700', color: Palette.white },
  liveSub: { fontSize: 12, color: Palette.darkText },
  joinButton: { backgroundColor: Palette.accent, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9 },
  joinText: { fontSize: 13, fontWeight: '700', color: Palette.ink },
  invite: { padding: 16, gap: 12 },
  inviteHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  inviteTitle: { fontSize: 14, fontWeight: '700', color: Palette.ink },
  inviteMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  inviteMetaText: { fontSize: 12, color: Palette.muted, flexShrink: 1 },
  inviteButtons: { flexDirection: 'row', gap: 8 },
  inviteDone: { backgroundColor: Palette.accentSoft, borderRadius: 12, padding: 12 },
  inviteDoneText: { fontSize: 13, fontWeight: '500', color: Palette.ink },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Palette.ink },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12 },
  rankMe: { backgroundColor: Palette.accentSoft },
  rankNo: { width: 12, fontSize: 15, fontWeight: '900', color: Palette.muted },
  rankBody: { flex: 1, gap: 5 },
  rankName: { fontSize: 13, fontWeight: '700', color: Palette.ink },
  track: { height: 6, borderRadius: 3, backgroundColor: Palette.border, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
  rankHint: { fontSize: 12, fontWeight: '500', color: Palette.muted },
  friendList: { paddingBottom: 8, gap: 10 },
  edit: { fontSize: 13, fontWeight: '500', color: Palette.muted },
  filters: { flexDirection: 'row', gap: 6 },
  listEmpty: { fontSize: 13, color: Palette.muted, paddingVertical: 16, textAlign: 'center' },
  friendRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  friendBorder: { borderBottomWidth: 1, borderBottomColor: Palette.chip },
  friendName: { fontSize: 15, fontWeight: '700', color: Palette.ink },
  friendSub: { fontSize: 12, fontWeight: '500' },
  total: { alignItems: 'flex-end' },
  totalValue: { fontSize: 15, fontWeight: '900', color: Palette.ink },
  totalLabel: { fontSize: 10, color: Palette.muted },
  rowButton: { width: 52, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  rowButtonText: { fontSize: 12, fontWeight: '700', color: Palette.ink },
  removeButton: { backgroundColor: Palette.white, borderWidth: 1, borderColor: Palette.border },
});
