import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  Button,
  Chip,
  ConfirmDialog,
  LoadingBlock,
  QueryView,
  Sheet,
  Stepper,
  SubScreen,
  TopBar,
  shared,
  useToast,
} from '@/components/common/ui';
import { CrewCard } from '@/components/crew/crew-parts';
import { Palette } from '@/constants/theme';
import { errorMessage, type CrewRequestBody, type GenderLimit, type JoinType } from '@/lib/api';
import { AGES, DAYS, GENDERS, JOIN_TYPES, ageRange, agesFrom, requestFrom, ruleText } from '@/lib/crew-options';
import {
  answerJoinRequest,
  createMeetup,
  createNotice,
  disbandCrew,
  meetupDay,
  updateCrew,
  useCrew,
  useCrewMembers,
  useMeetups,
  type CrewDetail,
} from '@/lib/crews';
import { ago, initial, toServerDateTime } from '@/lib/format';
import { josa } from '@/utils/josa';

type Setting = 'name' | 'capacity' | 'rule' | 'days' | 'meetup' | 'notice' | null;

export default function CrewManageScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const crewQuery = useCrew(id);
  return (
    <QueryView
      query={crewQuery}
      loading={
        <SubScreen header={<TopBar variant="plain" title="크루 관리" />}>
          <LoadingBlock height={120} count={3} />
        </SubScreen>
      }>
      {(crew) =>
        crew.iAmLeader ? (
          <Manage crew={crew} />
        ) : (
          <SubScreen header={<TopBar variant="plain" title="크루 관리" />}>
            <Text style={styles.sub}>크루장만 크루를 관리할 수 있어요.</Text>
          </SubScreen>
        )
      }
    </QueryView>
  );
}

function Manage({ crew }: { crew: CrewDetail }) {
  const toast = useToast();
  const requestsQuery = useCrewMembers(crew.id, 'PENDING');
  const meetupsQuery = useMeetups(crew.id);
  const dto = crew.dto;
  const [editing, setEditing] = useState<Setting>(null);
  const [draftName, setDraftName] = useState(crew.name);
  const [draftCap, setDraftCap] = useState(crew.capacity);
  const [gender, setGender] = useState<GenderLimit>(dto.genderLimit);
  const [ages, setAges] = useState<string[]>(agesFrom(dto.minAge, dto.maxAge));
  const [joinType, setJoinType] = useState<JoinType>(dto.joinType);
  const [draftDays, setDraftDays] = useState<string[]>([]);
  const [meetDay, setMeetDay] = useState(1);
  const [meetHour, setMeetHour] = useState(dto.meetingTime ? Number(dto.meetingTime.slice(0, 2)) : 7);
  const [meetPlace, setMeetPlace] = useState(dto.meetingPlace ?? '');
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeBody, setNoticeBody] = useState('');
  const [disbandOpen, setDisbandOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const days = (dto.meetingDays ?? '').split(',').filter(Boolean);
  const waiting = requestsQuery.data ?? [];

  const run = async (task: () => Promise<unknown>, done: string, close = true) => {
    if (busy) return;
    setBusy(true);
    try {
      await task();
      if (close) setEditing(null);
      toast.show(done);
    } catch (e) {
      toast.show(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  const save = (label: string, patch: Partial<CrewRequestBody>) =>
    run(() => updateCrew(crew.crewId, requestFrom(dto, patch)), `${josa(label, '을', '를')} 저장했어요`);

  // 모임 날짜: 오늘부터 14일 안에서 고른다
  const dateOptions = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });
  const meetAt = new Date(dateOptions[meetDay]);
  meetAt.setHours(meetHour, 0, 0, 0);

  return (
    <SubScreen
      header={<TopBar variant="plain" title="크루 관리" />}
      overlay={
        <>
          <Sheet visible={editing !== null} onClose={() => setEditing(null)}>
            {editing === 'name' ? (
              <>
                <Text style={shared.sheetTitle}>크루 이름</Text>
                <TextInput style={styles.input} value={draftName} onChangeText={setDraftName} maxLength={20} autoFocus />
                <Button
                  label="저장"
                  tone="darkLime"
                  height={52}
                  radius={26}
                  disabled={draftName.trim().length < 2 || busy}
                  onPress={() => save('크루 이름', { name: draftName.trim() })}
                />
              </>
            ) : null}
            {editing === 'capacity' ? (
              <>
                <Text style={shared.sheetTitle}>모집 인원</Text>
                <View style={styles.center}>
                  <Stepper
                    value={`${draftCap}명`}
                    tone="gray"
                    onMinus={() => setDraftCap((c) => Math.max(crew.members, 2, c - 1))}
                    onPlus={() => setDraftCap((c) => Math.min(100, c + 1))}
                  />
                </View>
                <Text style={shared.label12}>지금 멤버 수({crew.members}명)보다 적게는 줄일 수 없어요</Text>
                <Button label="저장" tone="darkLime" height={52} radius={26} disabled={busy} onPress={() => save('모집 인원', { maxMembers: draftCap })} />
              </>
            ) : null}
            {editing === 'rule' ? (
              <>
                <Text style={shared.sheetTitle}>가입 조건</Text>
                <Text style={shared.fieldLabel}>가입 방식</Text>
                <View style={styles.chips}>
                  {JOIN_TYPES.map((j) => (
                    <Chip key={j.value} label={j.label} selected={joinType === j.value} onPress={() => setJoinType(j.value)} selectedTextColor={Palette.accent} />
                  ))}
                </View>
                <Text style={shared.fieldLabel}>성별</Text>
                <View style={styles.chips}>
                  {GENDERS.map((g) => (
                    <Chip key={g.value} label={g.label} selected={gender === g.value} onPress={() => setGender(g.value)} selectedTextColor={Palette.accent} />
                  ))}
                </View>
                <Text style={shared.fieldLabel}>나이 (고르지 않으면 제한 없음)</Text>
                <View style={styles.chips}>
                  {AGES.map((a) => (
                    <Chip
                      key={a}
                      label={a}
                      selected={ages.includes(a)}
                      selectedTextColor={Palette.accent}
                      onPress={() => setAges((l) => (l.includes(a) ? l.filter((x) => x !== a) : [...l, a]))}
                    />
                  ))}
                </View>
                <Button
                  label="저장"
                  tone="darkLime"
                  height={52}
                  radius={26}
                  disabled={busy}
                  onPress={() => save('가입 조건', { joinType, genderLimit: gender, ...ageRange(ages) })}
                />
              </>
            ) : null}
            {editing === 'days' ? (
              <>
                <Text style={shared.sheetTitle}>모임 요일</Text>
                <View style={styles.chips}>
                  {DAYS.map((d) => (
                    <Chip
                      key={d}
                      label={d}
                      selected={draftDays.includes(d)}
                      selectedTextColor={Palette.accent}
                      onPress={() => setDraftDays((l) => (l.includes(d) ? l.filter((x) => x !== d) : [...l, d]))}
                    />
                  ))}
                </View>
                <Button
                  label="저장"
                  tone="darkLime"
                  height={52}
                  radius={26}
                  disabled={busy}
                  onPress={() => save('모임 요일', { meetingDays: DAYS.filter((d) => draftDays.includes(d)).join(',') || null })}
                />
              </>
            ) : null}
            {editing === 'meetup' ? (
              <>
                <Text style={shared.sheetTitle}>모임 만들기</Text>
                <Text style={shared.sheetCaption}>만들면 크루원들에게 알림이 가요</Text>
                <Text style={shared.fieldLabel}>날짜</Text>
                <View style={styles.chips}>
                  {dateOptions.map((d, i) => (
                    <Chip
                      key={i}
                      size="sm"
                      label={`${d.getMonth() + 1}/${d.getDate()} (${'일월화수목금토'[d.getDay()]})`}
                      selected={meetDay === i}
                      selectedTextColor={Palette.accent}
                      onPress={() => setMeetDay(i)}
                    />
                  ))}
                </View>
                <View style={styles.rowBetween}>
                  <Text style={shared.fieldLabel}>시간</Text>
                  <Stepper
                    value={`${meetHour < 12 ? '오전' : '오후'} ${meetHour % 12 === 0 ? 12 : meetHour % 12}시`}
                    tone="gray"
                    onMinus={() => setMeetHour((h) => (h + 23) % 24)}
                    onPlus={() => setMeetHour((h) => (h + 1) % 24)}
                  />
                </View>
                <TextInput
                  style={styles.input}
                  value={meetPlace}
                  onChangeText={setMeetPlace}
                  placeholder="모이는 곳"
                  placeholderTextColor={Palette.hint}
                  maxLength={100}
                />
                <Button
                  label="모임 만들기"
                  tone="darkLime"
                  height={52}
                  radius={26}
                  disabled={busy || meetAt.getTime() <= Date.now()}
                  onPress={() =>
                    run(
                      () => createMeetup(crew.crewId, { runAt: toServerDateTime(meetAt), meetingPlace: meetPlace.trim() || null }),
                      '모임을 만들고 크루원들에게 알렸어요',
                    )
                  }
                />
              </>
            ) : null}
            {editing === 'notice' ? (
              <>
                <Text style={shared.sheetTitle}>공지 쓰기</Text>
                <TextInput
                  style={styles.input}
                  value={noticeTitle}
                  onChangeText={setNoticeTitle}
                  placeholder="제목"
                  placeholderTextColor={Palette.hint}
                  maxLength={100}
                />
                <TextInput
                  style={[styles.input, styles.textarea]}
                  value={noticeBody}
                  onChangeText={setNoticeBody}
                  placeholder="크루원들에게 알릴 내용"
                  placeholderTextColor={Palette.hint}
                  multiline
                  maxLength={5000}
                  textAlignVertical="top"
                />
                <Button
                  label="공지 올리기"
                  tone="darkLime"
                  height={52}
                  radius={26}
                  disabled={busy || !noticeTitle.trim() || !noticeBody.trim()}
                  onPress={() =>
                    run(async () => {
                      await createNotice(crew.crewId, noticeTitle.trim(), noticeBody.trim());
                      setNoticeTitle('');
                      setNoticeBody('');
                    }, '공지를 올리고 크루원들에게 알렸어요')
                  }
                />
              </>
            ) : null}
          </Sheet>
          <ConfirmDialog
            visible={disbandOpen}
            title="크루를 해체할까요?"
            message="해체하면 크루, 모임, 공지가 모두 사라지고 되돌릴 수 없어요. 크루원들의 러닝 기록은 남아요."
            confirmLabel="해체하기"
            danger
            onCancel={() => setDisbandOpen(false)}
            onConfirm={async () => {
              setDisbandOpen(false);
              try {
                await disbandCrew(crew.crewId);
                router.replace({ pathname: '/crews/done', params: { type: 'disbanded' } });
              } catch (e) {
                toast.show(errorMessage(e));
              }
            }}
          />
          {toast.node}
        </>
      }>
      <CrewCard style={styles.head}>
        <View style={[styles.headAvatar, { backgroundColor: crew.color }]}>
          <Text style={styles.headLetter}>{crew.letter}</Text>
        </View>
        <View style={styles.flex}>
          <Text style={styles.headName}>{crew.name}</Text>
          <Text style={styles.sub}>
            멤버 {crew.members} / {crew.capacity}명 · {crew.schedule}
          </Text>
        </View>
      </CrewCard>

      <View style={shared.rowBetween}>
        <Text style={styles.section}>가입 신청</Text>
        <Text style={styles.sub}>{waiting.length}명 대기</Text>
      </View>
      <CrewCard style={styles.list}>
        {requestsQuery.data && waiting.length === 0 ? (
          <Text style={[styles.sub, styles.emptyRow]}>
            {dto.joinType === 'AUTO' ? '바로 가입하는 크루라 신청 없이 들어와요' : '새 가입 신청이 없어요'}
          </Text>
        ) : null}
        {waiting.map((request, index) => (
          <View key={request.crewMemberId} style={[styles.reqRow, index > 0 && styles.border]}>
            <View style={styles.reqAvatar}>
              <Text style={styles.reqLetter}>{initial(request.member.nickname)}</Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.reqName}>{request.member.nickname}</Text>
              <Text style={styles.sub}>{request.joinedAt ? `${ago(request.joinedAt)} 신청` : '가입 신청'}</Text>
            </View>
            <SmallButton
              label="거절"
              onPress={() =>
                run(
                  () => answerJoinRequest(crew.crewId, request.crewMemberId, false),
                  `${request.member.nickname}님의 가입 신청을 거절했어요`,
                  false,
                )
              }
            />
            <SmallButton
              label="수락"
              dark
              onPress={() =>
                run(
                  () => answerJoinRequest(crew.crewId, request.crewMemberId, true),
                  `${request.member.nickname}님이 크루원이 됐어요`,
                  false,
                )
              }
            />
          </View>
        ))}
      </CrewCard>

      <View style={shared.rowBetween}>
        <Text style={styles.section}>모임 일정</Text>
        <Pressable onPress={() => setEditing('meetup')} hitSlop={8} accessibilityRole="button">
          <Text style={styles.action}>+ 모임 만들기</Text>
        </Pressable>
      </View>
      <CrewCard style={styles.list}>
        {meetupsQuery.data && meetupsQuery.data.length === 0 ? (
          <Text style={[styles.sub, styles.emptyRow]}>예정된 모임이 없어요. 첫 모임을 만들어 보세요.</Text>
        ) : null}
        {(meetupsQuery.data ?? []).map((m, index) => (
          <View key={m.meetupId} style={[styles.setRow, index > 0 && styles.border]}>
            <View style={styles.flex}>
              <Text style={styles.setLabel}>{meetupDay(m.runAt)}</Text>
              <Text style={styles.sub}>{m.meetingPlace ?? crew.place}</Text>
            </View>
            <Text style={styles.setValue}>{m.attendingCount}명 참석</Text>
          </View>
        ))}
      </CrewCard>

      <Text style={styles.section}>크루 설정</Text>
      <CrewCard style={styles.list}>
        {[
          { key: 'name' as const, label: '크루 이름', value: crew.name, open: () => setDraftName(crew.name) },
          { key: 'capacity' as const, label: '모집 인원', value: `${crew.capacity}명`, open: () => setDraftCap(crew.capacity) },
          { key: 'rule' as const, label: '가입 조건', value: ruleText(dto.genderLimit, agesFrom(dto.minAge, dto.maxAge), dto.joinType), open: () => {} },
          { key: 'days' as const, label: '모임 요일', value: days.length ? days.join('·') : '미정', open: () => setDraftDays(days) },
          { key: 'notice' as const, label: '공지 쓰기', value: '크루원에게 알림', open: () => {} },
        ].map((row, index) => (
          <Pressable
            key={row.key}
            onPress={() => {
              row.open();
              setEditing(row.key);
            }}
            style={[styles.setRow, index > 0 && styles.border]}
            accessibilityRole="button">
            <Text style={styles.setLabel}>{row.label}</Text>
            <Text style={styles.setValue} numberOfLines={1}>
              {row.value} ›
            </Text>
          </Pressable>
        ))}
        <Pressable
          onPress={() =>
            run(
              () => updateCrew(crew.crewId, requestFrom(dto, { recruiting: !crew.recruiting })),
              crew.recruiting ? '모집을 멈췄어요' : '다시 모집을 시작했어요',
              false,
            )
          }
          style={[styles.setRow, styles.border]}
          accessibilityRole="button">
          <Text style={styles.setLabel}>멤버 모집</Text>
          <Text style={styles.setValue}>{crew.recruiting ? '모집 중 ›' : '모집 멈춤 ›'}</Text>
        </Pressable>
      </CrewCard>

      <Pressable onPress={() => setDisbandOpen(true)} style={styles.disband} accessibilityRole="button">
        <Text style={styles.disbandText}>크루 해체하기</Text>
      </Pressable>
    </SubScreen>
  );
}

function SmallButton({ label, dark, onPress }: { label: string; dark?: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.small, { backgroundColor: dark ? Palette.ink : Palette.chip }]}
      accessibilityRole="button">
      <Text style={[styles.smallText, dark && { color: Palette.accent }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 3 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  head: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16 },
  headAvatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  headLetter: { fontSize: 20, fontWeight: '900', color: Palette.ink },
  headName: { fontSize: 17, fontWeight: '700', color: Palette.ink },
  sub: { fontSize: 12, color: Palette.muted },
  section: { fontSize: 16, fontWeight: '900', color: Palette.ink },
  action: { fontSize: 13, fontWeight: '700', color: Palette.ink },
  list: { paddingTop: 4, paddingBottom: 4 },
  emptyRow: { paddingVertical: 14 },
  reqRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14 },
  border: { borderTopWidth: 1, borderTopColor: Palette.divider },
  reqAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#BFD7F2', alignItems: 'center', justifyContent: 'center' },
  reqLetter: { fontSize: 15, fontWeight: '900', color: Palette.ink },
  reqName: { fontSize: 14, fontWeight: '700', color: Palette.ink },
  small: { width: 52, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  smallText: { fontSize: 12, fontWeight: '700', color: Palette.ink },
  setRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, gap: 12 },
  setLabel: { fontSize: 14, color: Palette.ink },
  setValue: { flexShrink: 1, fontSize: 14, fontWeight: '500', color: Palette.muted },
  disband: { alignItems: 'center', paddingVertical: 14 },
  disbandText: { fontSize: 15, fontWeight: '700', color: Palette.alert },
  input: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.white,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '700',
    color: Palette.ink,
  },
  textarea: { height: 120, paddingTop: 14, fontSize: 14, fontWeight: '500' },
  center: { alignItems: 'center', paddingVertical: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
