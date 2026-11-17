import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button, CardHeading, DarkPill, InfoRows, SubScreen, TopBar } from '@/components/common/ui';
import { CrewCard, MemberAvatars } from '@/components/crew/crew-parts';
import { Palette } from '@/constants/theme';
import { getCrew, meetingOf } from '@/data/crews';
import { actions, useAppStore } from '@/hooks/use-app-store';

export default function CrewRunScreen() {
  const joined = useAppStore((s) => s.joinedMeeting);
  const myCrew = useAppStore((s) => s.myCrew);
  const meeting = meetingOf(getCrew(myCrew ?? ''));
  const count = meeting.joined + (joined ? 1 : 0);

  return (
    <SubScreen
      header={<TopBar variant="plain" title="크루런 참여" />}
      bottom={
        joined ? (
          <>
            <Button
              label="불참하기"
              tone="danger"
              height={56}
              radius={28}
              fontSize={16}
              onPress={() => {
                actions.setMeeting(false);
                router.replace({ pathname: '/crews/done', params: { type: 'absent' } });
              }}
            />
            <Button label="확인" tone="darkLime" height={56} radius={28} fontSize={16} flex onPress={() => router.back()} />
          </>
        ) : (
          <Button
            label="같이 달리기"
            tone="darkLime"
            height={56}
            radius={28}
            fontSize={16}
            flex
            onPress={() => {
              actions.setMeeting(true);
              router.replace({ pathname: '/crews/done', params: { type: 'crewrun' } });
            }}
          />
        )
      }>
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <Text style={styles.heroLabel}>{meeting.title}</Text>
          <DarkPill label={meeting.dday} size={12} />
        </View>
        <Text style={styles.heroDay}>{meeting.day}</Text>
        <Text style={styles.heroSub}>{meeting.summary}</Text>
      </View>

      <CrewCard style={styles.info}>
        <CardHeading>크루런 정보</CardHeading>
        <InfoRows
          rows={[
            { label: '집결 장소', value: meeting.gather },
            { label: '코스', value: meeting.course },
            { label: '목표 페이스', value: meeting.pace },
            { label: '준비물', value: meeting.bring },
          ]}
        />
      </CrewCard>

      <CrewCard style={styles.members}>
        <CardHeading>{`함께 달릴 러너 ${count}명`}</CardHeading>
        <MemberAvatars extra={count - 5} />
      </CrewCard>

      <Text style={styles.note}>출발 1시간 전까지 불참으로 바꿀 수 있어요.</Text>
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
