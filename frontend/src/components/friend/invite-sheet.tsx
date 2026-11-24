import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar, Button, Chip, EmptyState, Sheet, Stepper, shared } from '@/components/common/ui';
import { Palette } from '@/constants/theme';
import { errorMessage } from '@/lib/api';
import type { Course } from '@/lib/courses';
import { pace as paceText, toServerDateTime } from '@/lib/format';
import { sendRunInvite, useFriends, useInvites } from '@/lib/friends';

const WEEK = ['일', '월', '화', '수', '목', '금', '토'];
const MINUTES = ['00', '10', '20', '30', '40', '50'];

/**
 * 같이 달리기 초대 시트.
 * 1단계: 초대할 친구 고르기 (friend 를 주면 건너뜀)
 * 2단계: 날짜 · 시간 · 목표 페이스 정하고 보내기 → 친구에게 알림이 간다
 */
export function InviteSheet({
  visible,
  course,
  friend,
  onClose,
  onSent,
}: {
  visible: boolean;
  course?: Course;
  friend?: { memberId: number; name: string };
  onClose: () => void;
  onSent: (friendName: string, when: string) => void;
}) {
  const friendsQuery = useFriends(visible && !friend);
  const invitesQuery = useInvites(visible && !friend);
  const [picked, setPicked] = useState<{ memberId: number; name: string } | null>(null);
  const target = friend ?? picked;
  // 이 코스로 이미 초대를 보내 대기 중인 친구
  const invited = new Set(
    (invitesQuery.data?.sent ?? [])
      .filter((i) => i.status === 'PENDING' && (course ? i.courseId === course.courseId : true))
      .map((i) => i.invitee.memberId),
  );

  const close = () => {
    setPicked(null);
    onClose();
  };

  return (
    <Sheet visible={visible} onClose={close}>
      {target ? (
        <TimeStep
          course={course}
          friendName={target.name}
          onSend={async (runAt, when, targetPaceSec) => {
            await sendRunInvite({
              inviteeId: target.memberId,
              courseId: course?.courseId ?? null,
              runAt,
              meetingPlace: course ? meetingPlace(course) : null,
              targetPaceSec,
            });
            onSent(target.name, when);
            close();
          }}
        />
      ) : (
        <>
          <View>
            <Text style={shared.sheetTitle}>같이 달릴 친구 초대</Text>
            <Text style={shared.sheetCaption}>
              {course ? `${course.name} ${course.distanceKm}km · ` : ''}초대받은 친구에게 알림이 가요
            </Text>
          </View>
          {friendsQuery.data === undefined ? (
            friendsQuery.error ? (
              <Text style={styles.error}>{friendsQuery.error}</Text>
            ) : (
              <ActivityIndicator color={Palette.ink} style={styles.loading} />
            )
          ) : friendsQuery.data.length === 0 ? (
            <EmptyState
              compact
              title="아직 친구가 없어요"
              message="친구를 추가하면 같이 달리자고 초대할 수 있어요"
              action={{
                label: '친구 추가하기',
                onPress: () => {
                  close();
                  router.push('/friend/add');
                },
              }}
            />
          ) : (
            <View>
              {friendsQuery.data.slice(0, 6).map((f) => {
                const sent = invited.has(f.memberId);
                return (
                  <View key={f.id} style={styles.friendRow}>
                    <Avatar name={f.name} size={40} />
                    <View style={styles.friendText}>
                      <Text style={styles.friendName}>{f.name}</Text>
                      <Text style={styles.friendSub}>
                        {f.weeklyRuns > 0 ? `이번 주 ${f.weeklyKm.toFixed(1)}km 달렸어요` : '이번 주 아직 기록 없음'}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => !sent && setPicked({ memberId: f.memberId, name: f.name })}
                      style={[styles.inviteButton, sent && styles.inviteDone]}
                      accessibilityRole="button"
                      accessibilityLabel={`${f.name} 초대`}>
                      <Text style={[styles.inviteText, sent && styles.inviteDoneText]}>{sent ? '초대함' : '초대'}</Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          )}
        </>
      )}
    </Sheet>
  );
}

function meetingPlace(course: Course) {
  return course.start.split('·')[1]?.replace('출발', '').trim() || course.town || course.name;
}

function TimeStep({
  course,
  friendName,
  onSend,
}: {
  course?: Course;
  friendName: string;
  onSend: (runAt: string, when: string, targetPaceSec: number) => Promise<void>;
}) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const [day, setDay] = useState(Math.min(today.getDate() + 2, days));
  const [ampm, setAmpm] = useState<'오전' | '오후'>('오후');
  const [hour, setHour] = useState(7);
  const [minute, setMinute] = useState('00');
  const [pace, setPace] = useState(370); // 초 단위 (6'10")
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const weekday = WEEK[new Date(year, month, day).getDay()];
  const when = `${month + 1}.${day} (${weekday}) ${ampm} ${hour}:${minute}`;
  const hour24 = (hour % 12) + (ampm === '오후' ? 12 : 0);
  const runAt = new Date(year, month, day, hour24, Number(minute));
  const past = runAt.getTime() <= Date.now();

  const send = async () => {
    if (busy) return;
    if (past) {
      setError('지난 시간으로는 초대할 수 없어요. 시간을 다시 골라 주세요.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await onSend(toServerDateTime(runAt), when, pace);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <View>
        <Text style={shared.sheetTitle}>{friendName}님과 언제 달릴까요?</Text>
        <Text style={shared.sheetCaption}>{course ? `${course.name} ${course.distanceKm}km` : '자유 러닝'}</Text>
      </View>

      <View style={styles.block}>
        <Text style={shared.fieldLabel}>날짜</Text>
        <Text style={styles.month}>
          {year}년 {month + 1}월
        </Text>
        <View style={styles.calendar}>
          {WEEK.map((w) => (
            <Text key={w} style={styles.weekLabel}>
              {w}
            </Text>
          ))}
          {cells.map((n, i) => {
            const pastDay = n !== null && n < today.getDate();
            const selected = n === day;
            return (
              <Pressable
                key={i}
                disabled={n === null || pastDay}
                onPress={() => n && setDay(n)}
                style={styles.dayCell}
                accessibilityRole="button"
                accessibilityState={{ selected, disabled: pastDay }}>
                {n ? (
                  <View style={[styles.dayCircle, selected && styles.daySelected]}>
                    <Text style={[styles.dayText, pastDay && styles.dayPast, selected && styles.daySelectedText]}>{n}</Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.block}>
        <Text style={shared.fieldLabel}>시간</Text>
        <View style={styles.timeRow}>
          <Chip label="오전" size="sm" selected={ampm === '오전'} onPress={() => setAmpm('오전')} />
          <Chip label="오후" size="sm" selected={ampm === '오후'} onPress={() => setAmpm('오후')} />
          <View style={styles.flex} />
          <Stepper
            value={`${hour}시`}
            tone="gray"
            onMinus={() => setHour((h) => (h === 1 ? 12 : h - 1))}
            onPlus={() => setHour((h) => (h === 12 ? 1 : h + 1))}
          />
        </View>
        <View style={styles.timeRow}>
          {MINUTES.map((m) => (
            <Chip key={m} label={`${m}분`} size="sm" selected={minute === m} onPress={() => setMinute(m)} />
          ))}
        </View>
      </View>

      <View style={styles.meetRow}>
        <View style={styles.meetBox}>
          <Text style={styles.meetLabel}>만나는 곳</Text>
          <Text style={styles.meetValue} numberOfLines={1}>
            {course ? meetingPlace(course) : '만나서 정해요'}
          </Text>
        </View>
        <View style={styles.meetBox}>
          <Text style={styles.meetLabel}>목표 페이스</Text>
          <View style={styles.paceRow}>
            <Text style={styles.meetValue}>{paceText(pace)} /km</Text>
            <Pressable onPress={() => setPace((p) => Math.max(240, p - 10))} hitSlop={8} accessibilityLabel="페이스 빠르게">
              <Text style={styles.paceButton}>−</Text>
            </Pressable>
            <Pressable onPress={() => setPace((p) => Math.min(540, p + 10))} hitSlop={8} accessibilityLabel="페이스 느리게">
              <Text style={styles.paceButton}>+</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button
        label={busy ? '보내는 중…' : `${friendName}님에게 초대 보내기`}
        tone="dark"
        height={54}
        disabled={busy}
        onPress={send}
      />
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: { paddingVertical: 24 },
  error: { fontSize: 13, fontWeight: '600', color: Palette.alert },
  friendRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  friendText: { flex: 1, gap: 2 },
  friendName: { fontSize: 15, fontWeight: '700', color: Palette.ink },
  friendSub: { fontSize: 12, color: Palette.muted },
  inviteButton: { backgroundColor: Palette.ink, borderRadius: 11, paddingHorizontal: 14, paddingVertical: 8 },
  inviteDone: { backgroundColor: Palette.chip },
  inviteText: { fontSize: 13, fontWeight: '700', color: Palette.white },
  inviteDoneText: { color: Palette.muted },
  block: { gap: 10 },
  month: { textAlign: 'center', fontSize: 15, fontWeight: '700', color: Palette.ink },
  calendar: { flexDirection: 'row', flexWrap: 'wrap' },
  weekLabel: { width: `${100 / 7}%`, textAlign: 'center', fontSize: 12, color: Palette.muted, paddingBottom: 6 },
  dayCell: { width: `${100 / 7}%`, height: 38, alignItems: 'center', justifyContent: 'center' },
  dayCircle: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  daySelected: { backgroundColor: Palette.ink },
  dayText: { fontSize: 14, fontWeight: '500', color: Palette.ink },
  dayPast: { color: '#C9CBD1' },
  daySelectedText: { color: Palette.accent, fontWeight: '700' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  meetRow: { flexDirection: 'row', gap: 8 },
  meetBox: { flex: 1, backgroundColor: Palette.background, borderRadius: 14, padding: 14, gap: 4 },
  meetLabel: { fontSize: 12, color: Palette.muted },
  meetValue: { fontSize: 14, fontWeight: '700', color: Palette.ink, flexShrink: 1 },
  paceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  paceButton: { fontSize: 18, fontWeight: '700', color: Palette.ink, paddingHorizontal: 2 },
});
