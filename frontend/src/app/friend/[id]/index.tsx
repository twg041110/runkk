import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CalendarIcon, MegaphoneIcon, MoreIcon } from '@/components/common/icons';
import {
  Avatar,
  Button,
  Card,
  Chip,
  ConfirmDialog,
  IconButton,
  MoreLink,
  Sheet,
  SubScreen,
  TopBar,
  shared,
  useToast,
} from '@/components/common/ui';
import { InviteSheet } from '@/components/friend/invite-sheet';
import { Palette } from '@/constants/theme';
import { getCourse } from '@/data/courses';
import { getFriend } from '@/data/friends';
import { actions } from '@/hooks/use-app-store';

const REPORT_REASONS = ['욕설이나 비하 발언', '스팸·광고', '부적절한 프로필', '사칭', '기타'];

export default function FriendProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const friend = getFriend(id);
  const toast = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirm, setConfirm] = useState<'remove' | 'block' | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const status =
    friend.status === 'running' ? '러닝 중' : friend.status === 'online' ? '온라인' : (friend.lastSeen ?? '오프라인');
  const recent = showAll ? friend.recent : friend.recent.slice(0, 3);

  return (
    <SubScreen
      header={
        <TopBar
          title="친구 프로필"
          right={
            <IconButton label="더보기" style={styles.white} onPress={() => setMenuOpen(true)}>
              <MoreIcon color={Palette.ink} />
            </IconButton>
          }
        />
      }
      bottom={
        <>
          <Button
            label="응원 보내기"
            tone="outline"
            icon={(color) => <MegaphoneIcon color={color} size={18} />}
            onPress={() => {
              actions.cheerFriend(friend.id);
              toast.show(`${friend.name}님에게 응원을 보냈어요`);
            }}
          />
          <Button
            label="같이 달리기 예약"
            tone="dark"
            flex
            icon={(color) => <CalendarIcon color={color} size={18} />}
            onPress={() => setInviteOpen(true)}
          />
        </>
      }
      overlay={
        <>
          <Sheet visible={menuOpen} onClose={() => setMenuOpen(false)}>
            <Text style={shared.sheetTitle}>{friend.name}님</Text>
            {[
              { label: '친구 삭제', onPress: () => setConfirm('remove') },
              { label: '차단하기', onPress: () => setConfirm('block') },
              { label: '신고하기', onPress: () => setReportOpen(true), danger: true },
            ].map((item) => (
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
            title={confirm === 'block' ? `${friend.name}님을 차단할까요?` : `${friend.name}님을 친구에서 삭제할까요?`}
            message={
              confirm === 'block'
                ? '차단하면 서로 친구 요청과 초대를 보낼 수 없어요. 내 정보 > 차단한 친구에서 풀 수 있어요.'
                : '삭제하면 서로의 러닝 소식과 랭킹이 보이지 않아요.'
            }
            confirmLabel={confirm === 'block' ? '차단' : '삭제'}
            danger
            onCancel={() => setConfirm(null)}
            onConfirm={() => {
              actions.removeFriend(friend.id);
              setConfirm(null);
              router.back();
            }}
          />
          <Sheet visible={reportOpen} onClose={() => setReportOpen(false)}>
            <View>
              <Text style={shared.sheetTitle}>신고 사유를 골라주세요</Text>
              <Text style={shared.sheetCaption}>신고 내용은 상대방에게 알려지지 않아요</Text>
            </View>
            <View style={styles.reasons}>
              {REPORT_REASONS.map((item) => (
                <Chip key={item} label={item} selected={reason === item} onPress={() => setReason(item)} />
              ))}
            </View>
            <Button
              label="신고하기"
              tone="dark"
              disabled={!reason}
              onPress={() => {
                setReportOpen(false);
                setReason(null);
                toast.show('신고가 접수됐어요. 검토 후 알려드릴게요');
              }}
            />
          </Sheet>
          <InviteSheet
            visible={inviteOpen}
            course={getCourse('yeouido')}
            friendId={friend.id}
            onClose={() => setInviteOpen(false)}
            onSent={(name, when) => toast.show(`${name}님에게 초대를 보냈어요 · ${when}`)}
          />
          {toast.node}
        </>
      }>
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <Avatar name={friend.name} size={60} status={friend.status} />
          <View style={styles.flex}>
            <Text style={styles.heroName}>{friend.name}</Text>
            <Text style={styles.heroStatus}>
              {status} · {friend.region}
            </Text>
            <Text style={styles.heroDays}>친구가 된 지 {friend.days}일</Text>
          </View>
        </View>
        <Text style={styles.heroLabel}>누적 거리</Text>
        <View style={styles.heroTotalRow}>
          <Text style={styles.heroTotal}>{friend.totalKm.toFixed(1)}</Text>
          <Text style={styles.heroUnit}>km</Text>
        </View>
        <View style={styles.heroStats}>
          <DarkStat label="이번 달" value={`${friend.monthlyKm}km`} />
          <DarkStat label="러닝 횟수" value={`${friend.runs}회`} />
          <DarkStat label="평균 페이스" value={friend.avgPace} />
        </View>
      </View>

      {friend.live ? (
        <View style={styles.live}>
          <View style={styles.flex}>
            <View style={styles.liveHead}>
              <View style={styles.liveDot} />
              <Text style={styles.liveTitle}>지금 러닝 중</Text>
            </View>
            <Text style={styles.liveSub} numberOfLines={1}>
              {friend.live.course} · {friend.live.km.toFixed(2)}km · {friend.live.elapsed} 경과
            </Text>
          </View>
          <Pressable
            onPress={() => router.push(`/friend/${friend.id}/join`)}
            style={styles.liveButton}
            accessibilityRole="button">
            <Text style={styles.liveButtonText}>참여하기</Text>
          </Pressable>
        </View>
      ) : null}

      <Card style={styles.gap12}>
        <Text style={styles.cardTitle}>{friend.name} 님과 함께한 기록</Text>
        {friend.together.count > 0 ? (
          <>
            <View style={styles.togetherRow}>
              <WhiteStat label="함께 달린 거리" value={`${friend.together.km}km`} />
              <WhiteStat label="함께 달린 횟수" value={`${friend.together.count}회`} />
            </View>
            <Text style={styles.small}>마지막으로 함께 달린 날 · {friend.together.last}</Text>
          </>
        ) : (
          <Text style={styles.small}>아직 함께 달린 기록이 없어요. 같이 달리기를 예약해 보세요.</Text>
        )}
      </Card>

      <Card style={styles.recent}>
        <View style={shared.rowBetween}>
          <Text style={styles.cardTitle}>최근 러닝</Text>
          {friend.recent.length > 3 ? (
            <MoreLink label={showAll ? '접기' : '전체'} onPress={() => setShowAll((v) => !v)} />
          ) : null}
        </View>
        {recent.length === 0 ? <Text style={styles.small}>최근 러닝 기록이 없어요</Text> : null}
        {recent.map((run, index) => (
          <View key={`${run.date}-${index}`} style={[styles.runRow, index < recent.length - 1 && styles.border]}>
            <View style={styles.flex}>
              <Text style={styles.runName}>{run.course}</Text>
              <Text style={styles.small}>{run.date}</Text>
            </View>
            <View style={styles.runRight}>
              <Text style={styles.runKm}>{run.km.toFixed(2)}km</Text>
              <Text style={styles.small}>{run.pace} /km</Text>
            </View>
          </View>
        ))}
      </Card>
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
  live: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Palette.accent,
    borderRadius: 18,
    padding: 14,
  },
  liveHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Palette.alert },
  liveTitle: { fontSize: 14, fontWeight: '700', color: Palette.ink },
  liveSub: { fontSize: 12, color: Palette.inkSoft },
  liveButton: { backgroundColor: Palette.ink, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9 },
  liveButtonText: { fontSize: 13, fontWeight: '700', color: Palette.white },
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
