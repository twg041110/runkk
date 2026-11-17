import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, ConfirmDialog, DarkPill, SubScreen, TopBar } from '@/components/common/ui';
import { CrewAbout, CrewCard, CrewHero, CrewInfo, CrewMembers } from '@/components/crew/crew-parts';
import { Palette } from '@/constants/theme';
import { MY_RUNS, REQUIRED_RUNS, getCrew, meetingOf } from '@/data/crews';
import { actions, useAppStore } from '@/hooks/use-app-store';

export default function CrewDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const crew = getCrew(id);
  const myCrew = useAppStore((s) => s.myCrew);
  const pending = useAppStore((s) => s.pendingCrew);
  const joinedMeeting = useAppStore((s) => s.joinedMeeting);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const mine = myCrew === crew.id;
  const isPending = pending === crew.id;
  const meeting = meetingOf(crew);

  const apply = () => {
    if (myCrew) {
      router.push({ pathname: '/crews/done', params: { type: 'limit' } });
      return;
    }
    if (crew.womenOnly) {
      router.push({ pathname: '/crews/done', params: { type: 'fail', id: crew.id } });
      return;
    }
    const counted = MY_RUNS.filter((run) => run.km >= 1).length;
    if (counted < REQUIRED_RUNS) {
      router.push('/crews/eligibility');
      return;
    }
    if (crew.join === '바로 가입') {
      actions.joinCrew(crew.id);
      router.replace({ pathname: '/crews/done', params: { type: 'joined', id: crew.id } });
      return;
    }
    actions.applyCrew(crew.id);
    router.replace({ pathname: '/crews/done', params: { type: 'applied', id: crew.id } });
  };

  if (mine) {
    return (
      <SubScreen
        header={<TopBar variant="plain" title="내 크루" />}
        bottom={
          <>
            <Button label="크루 탈퇴" tone="danger" height={56} radius={28} fontSize={16} onPress={() => setLeaveOpen(true)} />
            <Button
              label={joinedMeeting ? '모임 참여 완료' : '모임 참여하기'}
              tone="darkLime"
              height={56}
              radius={28}
              fontSize={16}
              flex
              onPress={() => router.push('/crews/run')}
            />
          </>
        }
        overlay={
          <ConfirmDialog
            visible={leaveOpen}
            title="크루를 탈퇴할까요?"
            message="탈퇴하면 크루 모임과 채팅에서 나가게 돼요. 다시 가입하려면 가입 신청을 새로 해야 해요."
            confirmLabel="탈퇴하기"
            danger
            onCancel={() => setLeaveOpen(false)}
            onConfirm={() => {
              setLeaveOpen(false);
              actions.leaveCrew();
              router.replace({ pathname: '/crews/done', params: { type: 'left', id: crew.id } });
            }}
          />
        }>
        <CrewHero crew={crew} />
        <Pressable onPress={() => router.push('/crews/run')} accessibilityRole="button">
          <CrewCard style={styles.next}>
            <View style={styles.flex}>
              <Text style={styles.nextLabel}>다음 모임</Text>
              <Text style={styles.nextDay}>{meeting.day}</Text>
              <Text style={styles.nextLabel}>{meeting.summary}</Text>
            </View>
            <View style={styles.nextRight}>
              <DarkPill label={meeting.dday} size={12} />
              {joinedMeeting ? <Text style={styles.joined}>참여 예정</Text> : null}
            </View>
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
          <Button
            label="가입 신청 취소"
            tone="outline"
            height={56}
            radius={28}
            fontSize={16}
            flex
            onPress={() => {
              actions.cancelApply();
              router.back();
            }}
          />
        ) : (
          <Button label="가입 신청하기" tone="darkLime" height={56} radius={28} fontSize={16} flex onPress={apply} />
        )
      }>
      <CrewHero crew={crew} restricted={crew.womenOnly ? '여성 전용' : undefined} />
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
