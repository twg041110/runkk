import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  Button,
  CardHeading,
  DarkPill,
  EmptyState,
  InfoRows,
  LoadingBlock,
  SubScreen,
  TopBar,
  useToast,
} from '@/components/common/ui';
import { CrewCard, MemberAvatars } from '@/components/crew/crew-parts';
import { Palette } from '@/constants/theme';
import { errorMessage } from '@/lib/api';
import { meetupDay, setAttendance, useCrew, useCrewMembers } from '@/lib/crews';
import { dday, parseDate } from '@/lib/format';

// 크루 다음 모임: 참석/불참을 정하고, 모임 시간이 되면 여기서 바로 달리기를 시작한다
export default function CrewRunScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const crewQuery = useCrew(id);
  const membersQuery = useCrewMembers(id);
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const crew = crewQuery.data;
  const meetup = crew?.nextMeetup ?? null;

  if (!crew) {
    return (
      <SubScreen header={<TopBar variant="plain" title="크루런 참여" />}>
        <LoadingBlock height={140} count={2} />
      </SubScreen>
    );
  }
  if (!meetup) {
    return (
      <SubScreen header={<TopBar variant="plain" title="크루런 참여" />}>
        <EmptyState title="예정된 모임이 없어요" message="크루장이 모임을 만들면 알림으로 알려 드릴게요" />
      </SubScreen>
    );
  }

  const attending = meetup.myAttendance === 'ATTENDING';
  // 모임 시작 1시간 전부터 끝난 뒤 3시간까지 달리기를 시작할 수 있다
  const start = parseDate(meetup.runAt).getTime();
  const canRun = Date.now() >= start - 3600000 && Date.now() <= start + 3 * 3600000;
  const when = meetupDay(meetup.runAt);
  const place = meetup.meetingPlace ?? crew.place;

  const answer = async (status: 'ATTENDING' | 'ABSENT') => {
    if (busy) return;
    setBusy(true);
    try {
      await setAttendance(meetup.meetupId, status);
      router.replace({
        pathname: '/crews/done',
        params: { type: status === 'ATTENDING' ? 'crewrun' : 'absent', name: crew.name, when, place },
      });
    } catch (e) {
      toast.show(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SubScreen
      header={<TopBar variant="plain" title="크루런 참여" />}
      overlay={toast.node}
      bottom={
        attending ? (
          <>
            <Button label="불참하기" tone="danger" height={56} radius={28} fontSize={16} disabled={busy} onPress={() => answer('ABSENT')} />
            <Button
              label={canRun ? '크루런 시작' : '확인'}
              tone="darkLime"
              height={56}
              radius={28}
              fontSize={16}
              flex
              onPress={() =>
                canRun
                  ? router.push({ pathname: '/run', params: { meetupId: String(meetup.meetupId) } })
                  : router.back()
              }
            />
          </>
        ) : (
          <Button
            label="같이 달리기"
            tone="darkLime"
            height={56}
            radius={28}
            fontSize={16}
            flex
            disabled={busy}
            onPress={() => answer('ATTENDING')}
          />
        )
      }>
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <Text style={styles.heroLabel}>{crew.name} 정기런</Text>
          <DarkPill label={dday(meetup.runAt)} size={12} />
        </View>
        <Text style={styles.heroDay}>{when}</Text>
        <Text style={styles.heroSub}>{place}</Text>
      </View>

      <CrewCard style={styles.info}>
        <CardHeading>크루런 정보</CardHeading>
        <InfoRows
          rows={[
            { label: '집결 장소', value: place || '정해지지 않았어요' },
            { label: '목표 페이스', value: crew.dto.avgPaceSec ? `${crew.pace}/km` : '자유' },
            { label: '안내', value: meetup.description ?? '편한 러닝화와 물을 챙겨 오세요' },
          ]}
        />
      </CrewCard>

      <CrewCard style={styles.members}>
        <CardHeading>{`참석 예정 ${meetup.attendingCount}명`}</CardHeading>
        <MemberAvatars names={(membersQuery.data ?? []).map((m) => m.member.nickname)} total={crew.members} />
      </CrewCard>

      <Text style={styles.note}>
        {attending
          ? canRun
            ? '모임 시간이에요. 크루런 시작을 누르면 이 모임 기록으로 저장돼요.'
            : '모임 1시간 전부터 이 화면에서 크루런을 시작할 수 있어요.'
          : '참석을 누르면 크루장과 크루원들이 함께 달릴 인원을 알 수 있어요.'}
      </Text>
    </SubScreen>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: Palette.accent, borderRadius: 24, padding: 18, gap: 6 },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroLabel: { fontSize: 12, fontWeight: '700', color: Palette.ink },
  heroDay: { fontSize: 24, fontWeight: '900', color: Palette.ink },
  heroSub: { fontSize: 12, color: Palette.inkSoft },
  info: { paddingTop: 12, paddingBottom: 4 },
  members: { paddingTop: 12, paddingBottom: 14, gap: 6 },
  note: { fontSize: 12, color: Palette.muted },
});
