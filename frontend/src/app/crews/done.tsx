import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { CheckIcon, CloseIcon } from '@/components/common/icons';
import { Button, DarkPill, InfoRows, ResultScreen } from '@/components/common/ui';
import { CrewCard } from '@/components/crew/crew-parts';
import { Palette } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useMyCrew } from '@/lib/crews';

// 크루 쪽 완료 · 안내 화면 모음 (피그마: 가입 신청 완료, 가입 실패, 가입 제한 안내,
// 크루런 참여 완료, 크루런 불참 완료, 크루 탈퇴 완료, 크루 만들기 완료, 크루 해체 완료)
// 보여 줄 내용(크루 이름, 모임 시간 등)은 앞 화면이 주소 값(params)으로 넘겨준다.
type DoneType = 'applied' | 'joined' | 'fail' | 'limit' | 'crewrun' | 'absent' | 'left' | 'created' | 'disbanded';

// 하위 화면을 모두 닫고 크루 탭으로 돌아간다 (navigate 는 탭 화면을 새로 쌓는다)
const toCrewTab = () => router.dismissTo('/crew');

export default function CrewDoneScreen() {
  const params = useLocalSearchParams<{
    type: DoneType;
    id?: string;
    name?: string;
    reason?: string;
    when?: string;
    place?: string;
    capacity?: string;
    rule?: string;
  }>();
  const { me } = useAuth();
  const myCrew = useMyCrew(params.type === 'limit' && !!me).data?.crew ?? null;
  const name = params.name ?? '크루';
  const check = <CheckIcon color={Palette.ink} size={44} strokeWidth={2.6} />;

  switch (params.type) {
    case 'applied':
      return (
        <ResultScreen
          icon={check}
          title="가입 신청이 완료됐어요"
          message={'크루장이 승인하면 알려드릴게요.\n승인되면 크루 모임에 참여할 수 있어요.'}
          bottom={<Button label="확인" tone="darkLime" height={56} radius={28} fontSize={16} flex onPress={toCrewTab} />}>
          <CrewCard style={styles.detail}>
            <InfoRows rows={[{ label: '신청 크루', value: name }, { label: '상태', value: <DarkPill label="승인 대기 중" size={12} /> }]} />
          </CrewCard>
        </ResultScreen>
      );
    case 'joined':
      return (
        <ResultScreen
          icon={check}
          title={`${name}에 가입했어요`}
          message={'바로 가입하는 크루라 지금부터 함께할 수 있어요.\n다음 모임에 참여해 보세요.'}
          bottom={
            <Button
              label="내 크루 보기"
              tone="darkLime"
              height={56}
              radius={28}
              fontSize={16}
              flex
              onPress={() => router.replace(`/crews/${params.id}`)}
            />
          }
        />
      );
    case 'fail':
      return (
        <ResultScreen
          icon={<CloseIcon color={Palette.alert} size={40} />}
          iconBg="#F4C6C6"
          title="가입에 실패했어요"
          message={'가입 조건이 충족되지 않아\n이 크루에는 가입할 수 없어요.'}
          bottom={
            <>
              <Button label="크루 상세로" tone="outline" height={56} radius={28} fontSize={16} onPress={() => router.back()} />
              <Button label="다른 크루 찾기" tone="darkLime" height={56} radius={28} fontSize={16} flex onPress={toCrewTab} />
            </>
          }>
          <Text style={styles.failLabel}>충족하지 못한 조건</Text>
          <CrewCard style={styles.detail}>
            <InfoRows rows={[{ label: name, value: <Text style={styles.failValue}>{params.reason ?? '가입 조건'}</Text> }]} />
          </CrewCard>
        </ResultScreen>
      );
    case 'limit':
      return (
        <ResultScreen
          icon={<Text style={styles.bang}>!</Text>}
          title="이미 가입한 크루가 있어요"
          message={'크루는 한 번에 하나만 가입할 수 있어요.\n새 크루를 만들거나 가입하려면 기존 크루를 탈퇴해야 해요.'}
          bottom={
            <>
              <Button label="취소" tone="outline" height={56} radius={28} fontSize={16} onPress={() => router.back()} />
              <Button
                label={myCrew?.iAmLeader ? '내 크루 관리하기' : '기존 크루 보기'}
                tone="darkLime"
                height={56}
                radius={28}
                fontSize={16}
                flex
                disabled={!myCrew}
                onPress={() =>
                  myCrew &&
                  router.replace(
                    myCrew.iAmLeader ? { pathname: '/crews/manage', params: { id: myCrew.id } } : `/crews/${myCrew.id}`,
                  )
                }
              />
            </>
          }>
          <CrewCard style={styles.detail}>
            <InfoRows
              rows={[
                { label: '현재 가입한 크루', value: myCrew?.name ?? '-' },
                { label: '새 크루 만들기', value: myCrew?.iAmLeader ? '해체 후 가능' : '탈퇴 후 가능' },
              ]}
            />
          </CrewCard>
        </ResultScreen>
      );
    case 'crewrun':
      return (
        <ResultScreen
          icon={check}
          title="크루런 참여가 완료됐어요"
          message={'모임 날 이 화면에서 바로 달리기를 시작할 수 있어요.\n크루원들이 함께 달릴 준비를 하고 있어요.'}
          bottom={<Button label="확인" tone="darkLime" height={56} radius={28} fontSize={16} flex onPress={() => router.back()} />}>
          <CrewCard style={styles.detail}>
            <InfoRows
              rows={[
                { label: '크루런', value: `${name} 정기런` },
                { label: '일시', value: params.when ?? '-' },
                { label: '장소', value: params.place ?? '-' },
              ]}
            />
          </CrewCard>
        </ResultScreen>
      );
    case 'absent':
      return (
        <ResultScreen
          icon={check}
          iconBg={Palette.chip}
          title="불참으로 바꿨어요"
          message={'다음 모임에서 만나요.\n모임 전까지는 언제든 다시 참여할 수 있어요.'}
          bottom={<Button label="확인" tone="darkLime" height={56} radius={28} fontSize={16} flex onPress={() => router.back()} />}
        />
      );
    case 'left':
      return (
        <ResultScreen
          icon={check}
          iconBg={Palette.chip}
          title="크루에서 탈퇴했어요"
          message={'그동안 함께 달려줘서 고마워요.\n새로운 크루를 찾아보세요.'}
          bottom={<Button label="크루 둘러보기" tone="darkLime" height={56} radius={28} fontSize={16} flex onPress={toCrewTab} />}>
          <CrewCard style={styles.detail}>
            <InfoRows rows={[{ label: '탈퇴한 크루', value: name }]} />
          </CrewCard>
        </ResultScreen>
      );
    case 'disbanded':
      return (
        <ResultScreen
          icon={check}
          iconBg={Palette.chip}
          title="크루를 해체했어요"
          message={'크루의 모임과 공지가 모두 정리됐어요.\n언제든 새 크루를 만들 수 있어요.'}
          bottom={<Button label="크루 둘러보기" tone="darkLime" height={56} radius={28} fontSize={16} flex onPress={toCrewTab} />}
        />
      );
    case 'created':
    default:
      return (
        <ResultScreen
          icon={check}
          title={`${name} 크루를 만들었어요`}
          message={'크루가 만들어졌어요.\n이제 크루원을 모집해 보세요.'}
          bottom={<Button label="돌아가기" tone="darkLime" height={56} radius={28} fontSize={16} flex onPress={toCrewTab} />}>
          {params.capacity ? (
            <CrewCard style={styles.detail}>
              <InfoRows
                rows={[
                  { label: '크루 이름', value: name },
                  { label: '모집 인원', value: `${params.capacity}명` },
                  { label: '가입 조건', value: params.rule ?? '-' },
                ]}
              />
            </CrewCard>
          ) : (
            <View />
          )}
        </ResultScreen>
      );
  }
}

const styles = StyleSheet.create({
  detail: { alignSelf: 'stretch', paddingVertical: 4 },
  failLabel: { fontSize: 12, fontWeight: '700', color: Palette.alert },
  failValue: { fontSize: 13, fontWeight: '700', color: Palette.alert, flexShrink: 1, textAlign: 'right' },
  bang: { fontSize: 40, fontWeight: '900', color: Palette.ink },
});
