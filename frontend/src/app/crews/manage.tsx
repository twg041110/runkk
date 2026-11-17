import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button, Chip, ConfirmDialog, Sheet, Stepper, SubScreen, TopBar, shared, useToast } from '@/components/common/ui';
import { CrewCard } from '@/components/crew/crew-parts';
import { Palette } from '@/constants/theme';
import { AGES, DAYS, GENDERS, JOIN_REQUESTS, ruleText } from '@/data/crews';
import { actions, useAppStore } from '@/hooks/use-app-store';
import { josa } from '@/utils/josa';

type Setting = 'name' | 'capacity' | 'rule' | 'days' | null;

export default function CrewManageScreen() {
  const toast = useToast();
  const created = useAppStore((s) => s.createdCrew);
  const answers = useAppStore((s) => s.crewRequests);
  const [crewName, setCrewName] = useState(created?.name ?? '미라클모닝런');
  const [capacity, setCapacity] = useState(created?.capacity ?? 20);
  const [rule, setRule] = useState(created?.rule ?? '성별 제한 없음 · 나이 20~30대');
  const [days, setDays] = useState<string[]>([]);
  const [editing, setEditing] = useState<Setting>(null);
  const [draftName, setDraftName] = useState(crewName);
  const [draftCap, setDraftCap] = useState(capacity);
  const [gender, setGender] = useState('제한 없음');
  const [ages, setAges] = useState<string[]>(['20대', '30대']);
  const [draftDays, setDraftDays] = useState<string[]>([]);
  const [disbandOpen, setDisbandOpen] = useState(false);

  const members = 1 + Object.values(answers).filter((a) => a === 'accepted').length;
  const waiting = JOIN_REQUESTS.filter((r) => !answers[r.id]);

  const save = (label: string) => {
    setEditing(null);
    toast.show(`${josa(label, '을', '를')} 저장했어요`);
  };

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
                  disabled={!draftName.trim()}
                  onPress={() => {
                    setCrewName(draftName.trim());
                    save('크루 이름');
                  }}
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
                    onMinus={() => setDraftCap((c) => Math.max(members, c - 1))}
                    onPlus={() => setDraftCap((c) => Math.min(50, c + 1))}
                  />
                </View>
                <Text style={shared.label12}>지금 멤버 수({members}명)보다 적게는 줄일 수 없어요</Text>
                <Button
                  label="저장"
                  tone="darkLime"
                  height={52}
                  radius={26}
                  onPress={() => {
                    setCapacity(draftCap);
                    save('모집 인원');
                  }}
                />
              </>
            ) : null}
            {editing === 'rule' ? (
              <>
                <Text style={shared.sheetTitle}>가입 조건</Text>
                <Text style={shared.fieldLabel}>성별</Text>
                <View style={styles.chips}>
                  {GENDERS.map((g) => (
                    <Chip key={g} label={g} selected={gender === g} onPress={() => setGender(g)} selectedTextColor={Palette.accent} />
                  ))}
                </View>
                <Text style={shared.fieldLabel}>나이</Text>
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
                <Text style={shared.label12}>선택한 조건에 맞는 사람만 가입 신청할 수 있어요</Text>
                <Button
                  label="저장"
                  tone="darkLime"
                  height={52}
                  radius={26}
                  onPress={() => {
                    setRule(ruleText(gender, ages));
                    save('가입 조건');
                  }}
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
                  onPress={() => {
                    setDays(DAYS.filter((d) => draftDays.includes(d)));
                    save('모임 요일');
                  }}
                />
              </>
            ) : null}
          </Sheet>
          <ConfirmDialog
            visible={disbandOpen}
            title="크루를 해체할까요?"
            message="해체하면 크루와 모임 기록이 모두 사라지고 되돌릴 수 없어요. 크루원들에게 알림이 가요."
            confirmLabel="해체하기"
            danger
            onCancel={() => setDisbandOpen(false)}
            onConfirm={() => {
              setDisbandOpen(false);
              actions.leaveCrew();
              router.replace({ pathname: '/crews/done', params: { type: 'disbanded' } });
            }}
          />
          {toast.node}
        </>
      }>
      <CrewCard style={styles.head}>
        <View style={styles.headAvatar}>
          <Text style={styles.headLetter}>{crewName.slice(0, 1)}</Text>
        </View>
        <View style={styles.flex}>
          <Text style={styles.headName}>{crewName}</Text>
          <Text style={styles.sub}>
            멤버 {members} / {capacity}명 · {days.length ? `매주 ${days.join('·')}요일` : '모임 예정 없음'}
          </Text>
        </View>
      </CrewCard>

      <View style={shared.rowBetween}>
        <Text style={styles.section}>가입 신청</Text>
        <Text style={styles.sub}>{waiting.length}명 대기</Text>
      </View>
      <CrewCard style={styles.list}>
        {JOIN_REQUESTS.map((person, index) => {
          const answer = answers[person.id];
          return (
            <View key={person.id} style={[styles.reqRow, index > 0 && styles.border]}>
              <View style={styles.reqAvatar}>
                <Text style={styles.reqLetter}>{person.name.slice(0, 1)}</Text>
              </View>
              <View style={styles.flex}>
                <Text style={styles.reqName}>{person.name}</Text>
                <Text style={styles.sub}>{person.detail}</Text>
              </View>
              {answer ? (
                <Text style={[styles.answer, answer === 'rejected' && { color: Palette.muted }]}>
                  {answer === 'accepted' ? '수락함' : '거절함'}
                </Text>
              ) : (
                <>
                  <SmallButton
                    label="거절"
                    onPress={() => {
                      actions.answerCrewRequest(person.id, 'rejected');
                      toast.show(`${person.name}님의 가입 신청을 거절했어요`);
                    }}
                  />
                  <SmallButton
                    label="수락"
                    dark
                    onPress={() => {
                      actions.answerCrewRequest(person.id, 'accepted');
                      toast.show(`${person.name}님이 크루원이 됐어요`);
                    }}
                  />
                </>
              )}
            </View>
          );
        })}
      </CrewCard>

      <Text style={styles.section}>크루 설정</Text>
      <CrewCard style={styles.list}>
        {[
          { key: 'name' as const, label: '크루 이름', value: crewName, open: () => setDraftName(crewName) },
          { key: 'capacity' as const, label: '모집 인원', value: `${capacity}명`, open: () => setDraftCap(capacity) },
          { key: 'rule' as const, label: '가입 조건', value: rule.split(' · ')[1]?.replace('나이 ', '') ?? rule, open: () => {} },
          { key: 'days' as const, label: '모임 요일', value: days.length ? days.join('·') : '미정', open: () => setDraftDays(days) },
        ].map((row) => (
          <Pressable
            key={row.key}
            onPress={() => {
              row.open();
              setEditing(row.key);
            }}
            style={[styles.setRow, styles.border]}
            accessibilityRole="button">
            <Text style={styles.setLabel}>{row.label}</Text>
            <Text style={styles.setValue} numberOfLines={1}>
              {row.value} ›
            </Text>
          </Pressable>
        ))}
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
  head: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16 },
  headAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: Palette.accent, alignItems: 'center', justifyContent: 'center' },
  headLetter: { fontSize: 20, fontWeight: '900', color: Palette.ink },
  headName: { fontSize: 17, fontWeight: '700', color: Palette.ink },
  sub: { fontSize: 12, color: Palette.muted },
  section: { fontSize: 16, fontWeight: '900', color: Palette.ink },
  list: { paddingTop: 4, paddingBottom: 4 },
  reqRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14 },
  border: { borderTopWidth: 1, borderTopColor: Palette.divider },
  reqAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#BFD7F2', alignItems: 'center', justifyContent: 'center' },
  reqLetter: { fontSize: 15, fontWeight: '900', color: Palette.ink },
  reqName: { fontSize: 14, fontWeight: '700', color: Palette.ink },
  answer: { fontSize: 12, fontWeight: '700', color: Palette.online },
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
  center: { alignItems: 'center', paddingVertical: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
