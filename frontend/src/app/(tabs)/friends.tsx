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
  LoadingBlock,
  MoreLink,
  QueryView,
  TabHeader,
  shared,
  useToast,
} from '@/components/common/ui';
import { InviteSheet } from '@/components/friend/invite-sheet';
import { Palette } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { errorMessage, type InviteDto } from '@/lib/api';
import { dateTimeLabel } from '@/lib/format';
import {
  answerRunInvite,
  removeFriend,
  useFriendRequests,
  useFriends,
  useInvites,
  useRanking,
  type Friend,
} from '@/lib/friends';

type ListFilter = 'all' | 'active';

export default function FriendsScreen() {
  const insets = useSafeAreaInsets();
  const { me, requireLogin } = useAuth();

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[shared.tabContent, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}>
        {me ? (
          <FriendsContent />
        ) : (
          <>
            <TabHeader title="친구와 러닝" caption="함께 달리면 더 멀리 갈 수 있어요" />
            <Card style={styles.noFriend}>
              <EmptyState
                title="로그인하고 친구와 달려요"
                message={'친구 코드로 친구를 추가하고\n같이 달리기를 신청할 수 있어요'}
                action={{ label: '로그인하기', onPress: requireLogin }}
              />
            </Card>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function FriendsContent() {
  const toast = useToast();
  const { me } = useAuth();
  const friendsQuery = useFriends();
  const requestsQuery = useFriendRequests();
  const invitesQuery = useInvites();
  const rankingQuery = useRanking('WEEK');
  const [filter, setFilter] = useState<ListFilter>('all');
  const [editing, setEditing] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<Friend | null>(null);
  const [inviteTarget, setInviteTarget] = useState<Friend | null>(null);
  const [answering, setAnswering] = useState<number | null>(null);

  const friends = friendsQuery.data ?? [];
  const active = friends.filter((f) => f.weeklyRuns > 0);
  const shown = filter === 'active' ? active : friends;
  const pendingRequests = requestsQuery.data?.received.length ?? 0;
  const myId = me?.memberId;

  // 다가오는 같이 달리기: 서로 수락한 초대 / 받은 초대 중 아직 답하지 않은 것
  const received = invitesQuery.data?.received ?? [];
  const sent = invitesQuery.data?.sent ?? [];
  const upcoming = [...received, ...sent]
    .filter((i) => i.status === 'ACCEPTED')
    .sort((a, b) => a.runAt.localeCompare(b.runAt));
  const waiting = received.filter((i) => i.status === 'PENDING');
  const other = (i: InviteDto) => (i.inviter.memberId === myId ? i.invitee : i.inviter);

  const answer = async (invite: InviteDto, accept: boolean) => {
    setAnswering(invite.inviteId);
    try {
      await answerRunInvite(invite.inviteId, accept ? 'accept' : 'reject');
      toast.show(
        accept ? `${invite.inviter.nickname}님과 같이 달리기로 했어요` : `${invite.inviter.nickname}님의 초대를 거절했어요`,
      );
    } catch (e) {
      toast.show(errorMessage(e));
    } finally {
      setAnswering(null);
    }
  };

  // 이번 주 랭킹: 상위 3명 (내가 3등 밖이면 3번째 자리에 나를 보여 준다)
  const ranking = rankingQuery.data ?? [];
  const myRow = ranking.find((r) => r.me);
  const top = ranking.slice(0, 3);
  if (myRow && myRow.rank > 3) top[2] = myRow;
  const above = myRow && myRow.rank > 1 ? ranking[myRow.rank - 2] : null;
  const maxKm = Number(ranking[0]?.distanceKm ?? 0) || 1;

  return (
    <>
      <TabHeader
        title="친구와 러닝"
        caption="함께 달리면 더 멀리 갈 수 있어요"
        right={
          <IconButton label="친구 추가" badge={pendingRequests || undefined} onPress={() => router.push('/friend/add')}>
            <AddUserIcon color={Palette.ink} />
          </IconButton>
        }
      />

      <QueryView query={friendsQuery} loading={<LoadingBlock height={140} count={3} />}>
        {() =>
          friends.length === 0 ? (
            <Card style={styles.noFriend}>
              <EmptyState
                title="아직 친구가 없어요"
                message={
                  pendingRequests > 0
                    ? `받은 친구 요청이 ${pendingRequests}개 있어요.\n확인하고 친구가 되어 보세요`
                    : '친구 코드나 닉네임으로\n함께 달릴 친구를 찾아보세요'
                }
              />
              <Button
                label={pendingRequests > 0 ? '친구 요청 보기' : '친구 추가하기'}
                tone="dark"
                onPress={() => router.push('/friend/add')}
              />
            </Card>
          ) : (
            <>
              {/* 다가오는 같이 달리기 */}
              <View style={styles.live}>
                <View style={styles.liveHead}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveTitle}>다가오는 같이 달리기</Text>
                  <View style={styles.liveCount}>
                    <Text style={styles.liveCountText}>{upcoming.length}</Text>
                  </View>
                </View>
                {upcoming.length === 0 ? (
                  <Text style={styles.liveEmpty}>약속한 러닝이 없어요. 친구 옆 초대 버튼으로 같이 달리자고 해 보세요!</Text>
                ) : (
                  upcoming.map((invite, index) => {
                    const friend = other(invite);
                    return (
                      <View key={invite.inviteId} style={[styles.liveRow, index < upcoming.length - 1 && styles.liveBorder]}>
                        <Pressable
                          onPress={() => router.push(`/friend/${friend.memberId}`)}
                          style={styles.rowMain}
                          accessibilityRole="button">
                          <Avatar name={friend.nickname} />
                          <View style={styles.flex}>
                            <Text style={styles.liveName}>{friend.nickname}</Text>
                            <Text style={styles.liveSub} numberOfLines={1}>
                              {dateTimeLabel(invite.runAt)} · {invite.courseName ?? '자유 러닝'}
                            </Text>
                          </View>
                        </Pressable>
                        <Pressable
                          onPress={() =>
                            router.push({
                              pathname: '/run',
                              params: {
                                inviteId: String(invite.inviteId),
                                with: friend.nickname,
                                courseId: invite.courseId ? String(invite.courseId) : '',
                              },
                            })
                          }
                          style={styles.joinButton}
                          accessibilityRole="button"
                          accessibilityLabel={`${friend.nickname}님과 달리기 시작`}>
                          <Text style={styles.joinText}>시작</Text>
                        </Pressable>
                      </View>
                    );
                  })
                )}
              </View>

              {/* 받은 같이 달리기 초대 */}
              {waiting.map((invite) => (
                <Card key={invite.inviteId} tone="white" style={styles.invite}>
                  <View style={styles.inviteHead}>
                    <Avatar name={invite.inviter.nickname} size={40} />
                    <View style={styles.flex}>
                      <Text style={styles.inviteTitle}>{invite.inviter.nickname} 님의 같이 달리기 초대</Text>
                      <View style={styles.inviteMeta}>
                        <CalendarIcon color={Palette.muted} />
                        <Text style={styles.inviteMetaText} numberOfLines={1}>
                          {dateTimeLabel(invite.runAt)} · {invite.courseName ?? '자유 러닝'}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.inviteButtons}>
                    <Button
                      label="거절"
                      tone="gray"
                      height={40}
                      radius={12}
                      flex
                      fontSize={13}
                      disabled={answering === invite.inviteId}
                      onPress={() => answer(invite, false)}
                    />
                    <Button
                      label="참여하기"
                      tone="dark"
                      height={40}
                      radius={12}
                      flex
                      fontSize={13}
                      disabled={answering === invite.inviteId}
                      onPress={() => answer(invite, true)}
                    />
                  </View>
                </Card>
              ))}

              {/* 이번 주 친구 랭킹 */}
              <Card style={styles.gap12}>
                <View style={shared.rowBetween}>
                  <Text style={styles.cardTitle}>이번 주 친구 랭킹</Text>
                  <MoreLink label="전체" onPress={() => router.push('/friend/ranking')} />
                </View>
                {top.map((row) => {
                  const km = Number(row.distanceKm);
                  return (
                    <View key={row.member.memberId} style={[styles.rankRow, row.me && styles.rankMe]}>
                      <Text style={[styles.rankNo, row.rank === 1 && { color: Palette.ink }]}>{row.rank}</Text>
                      <Avatar name={row.member.nickname} size={32} />
                      <View style={styles.rankBody}>
                        <View style={shared.rowBetween}>
                          <Text style={styles.rankName}>{row.me ? `나 (${row.member.nickname})` : row.member.nickname}</Text>
                          <Text style={styles.rankName}>{km.toFixed(1)} km</Text>
                        </View>
                        <View style={styles.track}>
                          <View
                            style={[
                              styles.fill,
                              { width: `${(km / maxKm) * 100}%`, backgroundColor: row.me ? Palette.ink : Palette.hint },
                            ]}
                          />
                        </View>
                      </View>
                    </View>
                  );
                })}
                <Text style={styles.rankHint}>
                  {!myRow || Number(myRow.distanceKm) === 0
                    ? '이번 주 첫 러닝을 기록하면 랭킹에 올라가요'
                    : above
                      ? `${above.member.nickname} 님까지 ${(Number(above.distanceKm) - Number(myRow.distanceKm)).toFixed(1)}km 남았어요. 이번 주 ${myRow.rank - 1}등에 도전해 보세요!`
                      : '이번 주 1등이에요! 이 기록을 지켜보세요'}
                </Text>
              </Card>

              {/* 내 친구 */}
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
                    label={`이번 주 달린 친구 ${active.length}`}
                    size="sm"
                    selected={filter === 'active'}
                    onPress={() => setFilter('active')}
                  />
                </View>
                {shown.length === 0 ? <Text style={styles.listEmpty}>이번 주 아직 달린 친구가 없어요</Text> : null}
                {shown.map((friend, index) => (
                  <FriendRow
                    key={friend.id}
                    friend={friend}
                    last={index === shown.length - 1}
                    editing={editing}
                    onRemove={() => setRemoveTarget(friend)}
                    onInvite={() => setInviteTarget(friend)}
                  />
                ))}
              </Card>
            </>
          )
        }
      </QueryView>

      <ConfirmDialog
        visible={removeTarget !== null}
        title={`${removeTarget?.name ?? ''}님을 친구에서 삭제할까요?`}
        message="삭제하면 서로의 러닝 소식과 랭킹이 보이지 않아요. 상대방에게 알림은 가지 않아요."
        confirmLabel="삭제"
        danger
        onCancel={() => setRemoveTarget(null)}
        onConfirm={async () => {
          const target = removeTarget;
          setRemoveTarget(null);
          if (!target) return;
          try {
            await removeFriend(target.friendshipId);
            toast.show(`${target.name}님을 친구에서 삭제했어요`);
          } catch (e) {
            toast.show(errorMessage(e));
          }
        }}
      />
      <InviteSheet
        visible={inviteTarget !== null}
        friend={inviteTarget ? { memberId: inviteTarget.memberId, name: inviteTarget.name } : undefined}
        onClose={() => setInviteTarget(null)}
        onSent={(name, when) => toast.show(`${name}님에게 초대를 보냈어요 · ${when}`)}
      />
      {toast.node}
    </>
  );
}

function FriendRow({
  friend,
  last,
  editing,
  onRemove,
  onInvite,
}: {
  friend: Friend;
  last: boolean;
  editing: boolean;
  onRemove: () => void;
  onInvite: () => void;
}) {
  const ranThisWeek = friend.weeklyRuns > 0;
  const action = editing ? (
    <Pressable onPress={onRemove} style={[styles.rowButton, styles.removeButton]} accessibilityRole="button">
      <Text style={[styles.rowButtonText, { color: Palette.alert }]}>삭제</Text>
    </Pressable>
  ) : (
    <Pressable
      onPress={onInvite}
      style={[styles.rowButton, { backgroundColor: Palette.ink }]}
      accessibilityRole="button"
      accessibilityLabel={`${friend.name}님에게 같이 달리기 초대`}>
      <Text style={[styles.rowButtonText, { color: Palette.white }]}>초대</Text>
    </Pressable>
  );

  return (
    <View style={[styles.friendRow, !last && styles.friendBorder]}>
      <Pressable onPress={() => router.push(`/friend/${friend.id}`)} style={styles.rowMain} accessibilityRole="button">
        <Avatar name={friend.name} />
        <View style={styles.flex}>
          <Text style={styles.friendName}>{friend.name}</Text>
          <Text style={[styles.friendSub, { color: ranThisWeek ? Palette.online : Palette.offline }]}>
            {ranThisWeek ? `이번 주 ${friend.weeklyRuns}번 달렸어요` : '이번 주 기록 없음'}
          </Text>
        </View>
        <View style={styles.total}>
          <Text style={styles.totalValue}>{friend.weeklyKm.toFixed(1)}</Text>
          <Text style={styles.totalLabel}>이번 주 km</Text>
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
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Palette.accent },
  liveTitle: { fontSize: 15, fontWeight: '700', color: Palette.white },
  liveCount: { backgroundColor: Palette.accent, borderRadius: 9, paddingHorizontal: 7, paddingVertical: 1 },
  liveCountText: { fontSize: 12, fontWeight: '900', color: Palette.ink },
  liveEmpty: { fontSize: 13, lineHeight: 19, color: Palette.darkText, paddingVertical: 12 },
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
