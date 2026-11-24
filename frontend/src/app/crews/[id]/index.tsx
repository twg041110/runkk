import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  Button,
  ConfirmDialog,
  DarkPill,
  LoadingBlock,
  QueryView,
  SubScreen,
  TopBar,
  useToast,
} from '@/components/common/ui';
import { CrewAbout, CrewCard, CrewHero, CrewInfo, CrewMembers } from '@/components/crew/crew-parts';
import { Palette } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { errorMessage } from '@/lib/api';
import { joinCrew, leaveCrew, meetupDay, useCrew, type CrewDetail } from '@/lib/crews';

export default function CrewDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const crewQuery = useCrew(id);
  return (
    <QueryView
      query={crewQuery}
      loading={
        <SubScreen header={<TopBar variant="plain" title="크루 상세" />}>
          <LoadingBlock height={160} count={3} />
        </SubScreen>
      }>
      {(crew) => <CrewDetailView crew={crew} />}
    </QueryView>
  );
}

function CrewDetailView({ crew }: { crew: CrewDetail }) {
  const { requireLogin } = useAuth();
  const toast = useToast();
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const mine = crew.myStatus === 'JOINED';
  const isPending = crew.myStatus === 'PENDING';
  const meetup = crew.nextMeetup;

  // 가입 규칙(러닝 5회, 성별·나이, 정원, 크루 하나만)은 서버가 확인하고, 안 되면 이유를 알려 준다
  const apply = async () => {
    if (!requireLogin() || busy) return;
    setBusy(true);
    try {
      const status = await joinCrew(crew.crewId);
      router.replace({
        pathname: '/crews/done',
        params: { type: status === 'JOINED' ? 'joined' : 'applied', id: crew.id, name: crew.name },
      });
    } catch (e) {
      const message = errorMessage(e);
      if (message.includes('러닝 기록')) router.push('/crews/eligibility');
      else if (message.includes('하나만')) router.push({ pathname: '/crews/done', params: { type: 'limit' } });
      else if (message.includes('성별') || message.includes('나이') || message.includes('만 가입'))
        router.push({ pathname: '/crews/done', params: { type: 'fail', id: crew.id, name: crew.name, reason: message } });
      else toast.show(message);
    } finally {
      setBusy(false);
    }
  };

  const leave = async () => {
    setLeaveOpen(false);
    try {
      await leaveCrew(crew.crewId);
      if (isPending) {
        toast.show('가입 신청을 취소했어요');
      } else {
        router.replace({ pathname: '/crews/done', params: { type: 'left', name: crew.name } });
      }
    } catch (e) {
      toast.show(errorMessage(e));
    }
  };

  if (mine) {
    return (
      <SubScreen
        header={<TopBar variant="plain" title="내 크루" />}
        bottom={
          <>
            {crew.iAmLeader ? (
              <Button
                label="크루 관리"
                tone="outline"
                height={56}
                radius={28}
                fontSize={16}
                onPress={() => router.push({ pathname: '/crews/manage', params: { id: crew.id } })}
              />
            ) : (
              <Button label="크루 탈퇴" tone="danger" height={56} radius={28} fontSize={16} onPress={() => setLeaveOpen(true)} />
            )}
            <Button
              label={!meetup ? '예정된 모임 없음' : meetup.myAttendance === 'ATTENDING' ? '모임 참여 예정' : '모임 참여하기'}
              tone="darkLime"
              height={56}
              radius={28}
              fontSize={16}
              flex
              disabled={!meetup}
              onPress={() => router.push({ pathname: '/crews/run', params: { id: crew.id } })}
            />
          </>
        }
        overlay={
          <>
            <ConfirmDialog
              visible={leaveOpen}
              title="크루를 탈퇴할까요?"
              message="탈퇴하면 크루 모임 일정과 공지를 더 볼 수 없어요. 다시 가입하려면 가입 신청을 새로 해야 해요."
              confirmLabel="탈퇴하기"
              danger
              onCancel={() => setLeaveOpen(false)}
              onConfirm={leave}
            />
            {toast.node}
          </>
        }>
        <CrewHero crew={crew} />
        <Pressable
          disabled={!meetup}
          onPress={() => router.push({ pathname: '/crews/run', params: { id: crew.id } })}
          accessibilityRole="button">
          <CrewCard style={styles.next}>
            <View style={styles.flex}>
              <Text style={styles.nextLabel}>다음 모임</Text>
              {meetup ? (
                <>
                  <Text style={styles.nextDay}>{meetupDay(meetup.runAt)}</Text>
                  <Text style={styles.nextLabel}>
                    {meetup.meetingPlace ?? crew.place} · {meetup.attendingCount}명 참석
                  </Text>
                </>
              ) : (
                <Text style={styles.nextDay}>{crew.iAmLeader ? '크루 관리에서 모임을 만들어 보세요' : '아직 잡힌 모임이 없어요'}</Text>
              )}
            </View>
            {meetup ? (
              <View style={styles.nextRight}>
                <DarkPill label={crew.badge} size={12} />
                {meetup.myAttendance === 'ATTENDING' ? <Text style={styles.joined}>참여 예정</Text> : null}
              </View>
            ) : null}
          </CrewCard>
        </Pressable>
        <CrewAbout crew={crew} />
        <CrewInfo crew={crew} />
        <CrewMembers crew={crew} />
      </SubScreen>
    );
  }

  return (
    <SubScreen
      header={<TopBar variant="plain" title="크루 상세" />}
      bottom={
        isPending ? (
          <Button label="가입 신청 취소" tone="outline" height={56} radius={28} fontSize={16} flex onPress={leave} />
        ) : (
          <Button
            label={!crew.recruiting ? '지금은 모집하지 않아요' : busy ? '신청하는 중…' : crew.dto.joinType === 'AUTO' ? '바로 가입하기' : '가입 신청하기'}
            tone="darkLime"
            height={56}
            radius={28}
            fontSize={16}
            flex
            disabled={!crew.recruiting || busy}
            onPress={apply}
          />
        )
      }
      overlay={toast.node}>
      <CrewHero
        crew={crew}
        restricted={crew.womenOnly ? '여성 전용' : crew.dto.genderLimit === 'MALE' ? '남성 전용' : undefined}
      />
      {isPending ? (
        <View style={styles.pending}>
          <Text style={styles.pendingText}>가입 신청을 보냈어요. 크루장이 승인하면 알려드릴게요</Text>
        </View>
      ) : null}
      <CrewAbout crew={crew} />
      <CrewInfo crew={crew} full />
      <CrewMembers crew={crew} />
    </SubScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 4 },
  next: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  nextLabel: { fontSize: 12, color: Palette.muted },
  nextDay: { fontSize: 17, fontWeight: '900', color: Palette.ink },
  nextRight: { alignItems: 'flex-end', gap: 6 },
  joined: { fontSize: 11, fontWeight: '700', color: Palette.online },
  pending: { backgroundColor: Palette.accentSoft, borderRadius: 16, padding: 14 },
  pendingText: { fontSize: 13, fontWeight: '500', color: Palette.ink },
});
