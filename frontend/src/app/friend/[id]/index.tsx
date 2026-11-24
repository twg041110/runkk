import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CalendarIcon, MoreIcon, PlusIcon } from '@/components/common/icons';
import {
  Avatar,
  Button,
  Card,
  Chip,
  ConfirmDialog,
  IconButton,
  LoadingBlock,
  MoreLink,
  QueryView,
  Sheet,
  SubScreen,
  TopBar,
  shared,
  useToast,
} from '@/components/common/ui';
import { InviteSheet } from '@/components/friend/invite-sheet';
import { Palette } from '@/constants/theme';
import { invalidate } from '@/hooks/use-query';
import { api, errorMessage, type FriendStatsDto } from '@/lib/api';
import { dateLabel, pace, parseDate } from '@/lib/format';
import { removeFriend, sendFriendRequest, useFriendStats, useFriends } from '@/lib/friends';

const REPORT_REASONS = ['욕설이나 비하 발언', '스팸·광고', '부적절한 프로필', '사칭', '기타'];

export default function FriendProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const statsQuery = useFriendStats(id);
  return (
    <QueryView
      query={statsQuery}
      loading={
        <SubScreen header={<TopBar title="친구 프로필" />}>
          <LoadingBlock height={200} count={3} />
        </SubScreen>
      }>
      {(stats) => <FriendProfile stats={stats} />}
    </QueryView>
  );
}

function FriendProfile({ stats }: { stats: FriendStatsDto }) {
  const toast = useToast();
  const friendsQuery = useFriends();
  const person = stats.member;
  const friendship = friendsQuery.data?.find((f) => f.memberId === person.memberId);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirm, setConfirm] = useState<'remove' | 'block' | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [requested, setRequested] = useState(false);

  const days = friendship ? Math.max(1, Math.ceil((Date.now() - parseDate(friendship.since).getTime()) / 86400000)) : null;
  const recent = showAll ? stats.recentRuns : stats.recentRuns.slice(0, 3);

  const doConfirm = async () => {
    const kind = confirm;
    setConfirm(null);
    try {
      if (kind === 'block') {
        await api.post(`/api/blocks/${person.memberId}`);
        invalidate('friends');
        toast.show(`${person.nickname}님을 차단했어요`);
      } else if (kind === 'remove' && friendship) {
        await removeFriend(friendship.friendshipId);
        toast.show(`${person.nickname}님을 친구에서 삭제했어요`);
      }
      setTimeout(() => router.back(), 600);
    } catch (e) {
      toast.show(errorMessage(e));
    }
  };

  const report = async () => {
    if (!reason) return;
    setReportOpen(false);
    try {
      await api.post('/api/reports', { targetType: 'MEMBER', targetId: person.memberId, reason });
      toast.show('신고가 접수됐어요. 검토 후 조치할게요');
    } catch (e) {
      toast.show(errorMessage(e));
    } finally {
      setReason(null);
    }
  };

  const menu = [
    ...(stats.friend ? [{ label: '친구 삭제', onPress: () => setConfirm('remove'), danger: false }] : []),
    { label: '차단하기', onPress: () => setConfirm('block'), danger: false },
    { label: '신고하기', onPress: () => setReportOpen(true), danger: true },
  ];

  return (
    <SubScreen
      header={
        <TopBar
          title={stats.friend ? '친구 프로필' : '러너 프로필'}
          right={
            <IconButton label="더보기" style={styles.white} onPress={() => setMenuOpen(true)}>
              <MoreIcon color={Palette.ink} />
            </IconButton>
          }
        />
      }
      bottom={
        stats.friend ? (
          <Button
            label="같이 달리기 예약"
            tone="dark"
            flex
            icon={(color) => <CalendarIcon color={color} size={18} />}
            onPress={() => setInviteOpen(true)}
          />
        ) : (
          <Button
            label={requested ? '친구 요청을 보냈어요' : '친구 요청 보내기'}
            tone="dark"
            flex
            disabled={requested}
            icon={(color) => <PlusIcon color={color} size={18} />}
            onPress={async () => {
              try {
                await sendFriendRequest({ memberId: person.memberId });
                setRequested(true);
                toast.show(`${person.nickname}님에게 친구 요청을 보냈어요`);
              } catch (e) {
                toast.show(errorMessage(e));
              }
            }}
          />
        )
      }
      overlay={
        <>
          <Sheet visible={menuOpen} onClose={() => setMenuOpen(false)}>
            <Text style={shared.sheetTitle}>{person.nickname}님</Text>
            {menu.map((item) => (
              <Pressable
                key={item.label}
                onPress={() => {
                  setMenuOpen(false);
                  // iOS 는 시트가 다 닫힌 뒤에 다음 팝업을 열어야 화면에 뜬다
                  setTimeout(item.onPress, 350);
                }}
                style={styles.menuItem}
                accessibilityRole="button">
                <Text style={[styles.menuText, item.danger && { color: Palette.alert }]}>{item.label}</Text>
              </Pressable>
            ))}
          </Sheet>
          <ConfirmDialog
            visible={confirm !== null}
            title={confirm === 'block' ? `${person.nickname}님을 차단할까요?` : `${person.nickname}님을 친구에서 삭제할까요?`}
            message={
              confirm === 'block'
                ? '차단하면 친구에서도 삭제되고, 서로 친구 요청과 초대를 보낼 수 없어요. 상대 글도 보이지 않아요.'
                : '삭제하면 서로의 러닝 소식과 랭킹이 보이지 않아요.'
            }
            confirmLabel={confirm === 'block' ? '차단' : '삭제'}
            danger
            onCancel={() => setConfirm(null)}
            onConfirm={doConfirm}
          />
          <Sheet visible={reportOpen} onClose={() => setReportOpen(false)}>
            <View>
              <Text style={shared.sheetTitle}>신고 사유를 골라 주세요</Text>
              <Text style={shared.sheetCaption}>신고 내용은 상대방에게 알려지지 않아요</Text>
            </View>
            <View style={styles.reasons}>
              {REPORT_REASONS.map((item) => (
                <Chip key={item} label={item} selected={reason === item} onPress={() => setReason(item)} />
              ))}
            </View>
            <Button label="신고하기" tone="dark" disabled={!reason} onPress={report} />
          </Sheet>
          <InviteSheet
            visible={inviteOpen}
            friend={{ memberId: person.memberId, name: person.nickname }}
            onClose={() => setInviteOpen(false)}
            onSent={(name, when) => toast.show(`${name}님에게 초대를 보냈어요 · ${when}`)}
          />
          {toast.node}
        </>
      }>
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <Avatar name={person.nickname} size={60} />
          <View style={styles.flex}>
            <Text style={styles.heroName}>{person.nickname}</Text>
            <Text style={styles.heroStatus}>
              {[person.region, person.friendCode].filter(Boolean).join(' · ')}
            </Text>
            {days ? <Text style={styles.heroDays}>친구가 된 지 {days}일</Text> : null}
          </View>
        </View>
        {stats.friend ? (
          <>
            <Text style={styles.heroLabel}>누적 거리</Text>
            <View style={styles.heroTotalRow}>
              <Text style={styles.heroTotal}>{Number(stats.totalKm).toFixed(1)}</Text>
              <Text style={styles.heroUnit}>km</Text>
            </View>
            <View style={styles.heroStats}>
              <DarkStat label="이번 달" value={`${Number(stats.monthlyKm).toFixed(1)}km`} />
              <DarkStat label="러닝 횟수" value={`${stats.runCount}회`} />
              <DarkStat label="평균 페이스" value={pace(stats.avgPaceSec)} />
            </View>
          </>
        ) : (
          <Text style={styles.heroLabel}>{person.bio ?? '친구가 되면 서로의 러닝 기록을 볼 수 있어요'}</Text>
        )}
      </View>

      {stats.friend ? (
        <>
          <Card style={styles.gap12}>
            <Text style={styles.cardTitle}>{person.nickname} 님과 함께한 기록</Text>
            {stats.togetherCount > 0 ? (
              <>
                <View style={styles.togetherRow}>
                  <WhiteStat label="함께 달린 거리" value={`${Number(stats.togetherKm).toFixed(1)}km`} />
                  <WhiteStat label="함께 달린 횟수" value={`${stats.togetherCount}회`} />
                </View>
                {stats.lastTogether ? (
                  <Text style={styles.small}>마지막으로 함께 달린 날 · {dateLabel(stats.lastTogether)}</Text>
                ) : null}
              </>
            ) : (
              <Text style={styles.small}>아직 함께 달린 기록이 없어요. 같이 달리기를 예약해 보세요.</Text>
            )}
          </Card>

          <Card style={styles.recent}>
            <View style={shared.rowBetween}>
              <Text style={styles.cardTitle}>최근 러닝</Text>
              {stats.recentRuns.length > 3 ? (
                <MoreLink label={showAll ? '접기' : '전체'} onPress={() => setShowAll((v) => !v)} />
              ) : null}
            </View>
            {recent.length === 0 ? <Text style={styles.small}>최근 러닝 기록이 없어요</Text> : null}
            {recent.map((run, index) => (
              <View key={run.recordId} style={[styles.runRow, index < recent.length - 1 && styles.border]}>
                <View style={styles.flex}>
                  <Text style={styles.runName}>{run.courseName ?? '자유 러닝'}</Text>
                  <Text style={styles.small}>{dateLabel(run.startedAt)}</Text>
                </View>
                <View style={styles.runRight}>
                  <Text style={styles.runKm}>{Number(run.distanceKm).toFixed(2)}km</Text>
                  <Text style={styles.small}>{pace(run.avgPaceSec)} /km</Text>
                </View>
              </View>
            ))}
          </Card>
        </>
      ) : null}
    </SubScreen>
  );
}

function DarkStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.darkStat}>
      <Text style={styles.darkStatLabel}>{label}</Text>
      <Text style={styles.darkStatValue}>{value}</Text>
    </View>
  );
}

function WhiteStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.whiteStat}>
      <Text style={styles.small}>{label}</Text>
      <Text style={styles.whiteStatValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  white: { backgroundColor: Palette.white },
  flex: { flex: 1, gap: 3 },
  gap12: { gap: 12 },
  hero: { backgroundColor: Palette.darkCard, borderRadius: 22, padding: 20, gap: 6 },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  heroName: { fontSize: 22, fontWeight: '900', color: Palette.white },
  heroStatus: { fontSize: 12, fontWeight: '500', color: Palette.accent },
  heroDays: { fontSize: 11, color: Palette.darkText },
  heroLabel: { fontSize: 12, color: Palette.darkText },
  heroTotalRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  heroTotal: { fontSize: 40, fontWeight: '900', color: Palette.accent },
  heroUnit: { fontSize: 16, fontWeight: '700', color: Palette.white },
  heroStats: { flexDirection: 'row', gap: 8, marginTop: 10 },
  darkStat: { flex: 1, backgroundColor: Palette.darkLine, borderRadius: 12, padding: 10, gap: 2 },
  darkStatLabel: { fontSize: 11, color: Palette.darkText },
  darkStatValue: { fontSize: 15, fontWeight: '900', color: Palette.white },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Palette.ink },
  togetherRow: { flexDirection: 'row', gap: 8 },
  whiteStat: {
    flex: 1,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: 14,
    padding: 12,
    gap: 4,
  },
  whiteStatValue: { fontSize: 18, fontWeight: '900', color: Palette.ink },
  small: { fontSize: 12, color: Palette.muted },
  recent: { gap: 6, paddingBottom: 8 },
  runRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  border: { borderBottomWidth: 1, borderBottomColor: Palette.chip },
  runName: { fontSize: 14, fontWeight: '700', color: Palette.ink },
  runRight: { alignItems: 'flex-end', gap: 3 },
  runKm: { fontSize: 15, fontWeight: '900', color: Palette.ink },
  menuItem: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Palette.divider },
  menuText: { fontSize: 16, fontWeight: '500', color: Palette.ink },
  reasons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
