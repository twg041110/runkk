import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar, Button, Chip, Sheet, Stepper, shared } from '@/components/common/ui';
import { Palette } from '@/constants/theme';
import type { Course } from '@/data/courses';
import { FRIENDS, getFriend } from '@/data/friends';
import { actions, useAppStore } from '@/hooks/use-app-store';

const WEEK = ['일', '월', '화', '수', '목', '금', '토'];
const MINUTES = ['00', '10', '20', '30', '40', '50'];

/**
 * 같이 달리기 초대 시트.
 * 1단계: 초대할 친구 고르기 (friendId 를 주면 건너뜀)
 * 2단계: 날짜 · 시간 · 만나는 곳 · 목표 페이스 정하기
 */
export function InviteSheet({
  visible,
  course,
  friendId,
  onClose,
  onSent,
}: {
  visible: boolean;
  course: Course;
  friendId?: string;
  onClose: () => void;
  onSent: (friendName: string, when: string) => void;
}) {
  const invited = useAppStore((s) => s.invitedFriends);
  const [picked, setPicked] = useState<string | null>(null);
  const target = friendId ?? picked;

  const close = () => {
    setPicked(null);
    onClose();
  };

  return (
    <Sheet visible={visible} onClose={close}>
      {target ? (
        <TimeStep
          course={course}
          friendName={getFriend(target).name}
          onSend={(when) => {
            actions.inviteFriend(target);
            onSent(getFriend(target).name, when);
            close();
          }}
        />
      ) : (
        <>
          <View>
            <Text style={shared.sheetTitle}>같이 달릴 친구 초대</Text>
            <Text style={shared.sheetCaption}>
              {course.name} {course.distanceKm}km · 초대받은 친구에게 알림이 가요
            </Text>
          </View>
          <View>
            {FRIENDS.slice(0, 5).map((friend) => {
              const done = invited.includes(friend.id);
              return (
                <View key={friend.id} style={styles.friendRow}>
                  <Avatar name={friend.name} size={40} />
                  <View style={styles.friendText}>
                    <Text style={styles.friendName}>{friend.name}</Text>
                    <Text style={styles.friendSub}>
                      {friend.status === 'running' ? '지금 러닝 중' : `최근 러닝 · ${friend.recent[0]?.date ?? '기록 없음'}`}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => !done && setPicked(friend.id)}
                    style={[styles.inviteButton, done && styles.inviteDone]}
                    accessibilityRole="button"
                    accessibilityLabel={`${friend.name} 초대`}>
                    <Text style={[styles.inviteText, done && styles.inviteDoneText]}>{done ? '초대함' : '초대'}</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </>
      )}
    </Sheet>
  );
}

function TimeStep({
  course,
  friendName,
  onSend,
}: {
  course: Course;
  friendName: string;
  onSend: (when: string) => void;
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

  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const paceText = `${Math.floor(pace / 60)}'${String(pace % 60).padStart(2, '0')}"`;
  const weekday = WEEK[new Date(year, month, day).getDay()];
  const when = `${month + 1}.${day} (${weekday}) ${ampm} ${hour}:${minute}`;

  return (
    <>
      <View>
        <Text style={shared.sheetTitle}>{friendName}님과 언제 달릴까요?</Text>
        <Text style={shared.sheetCaption}>
          {course.name} {course.distanceKm}km
        </Text>
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
            const past = n !== null && n < today.getDate();
            const selected = n === day;
            return (
              <Pressable
                key={i}
                disabled={n === null || past}
                onPress={() => n && setDay(n)}
                style={styles.dayCell}
                accessibilityRole="button"
                accessibilityState={{ selected, disabled: past }}>
                {n ? (
                  <View style={[styles.dayCircle, selected && styles.daySelected]}>
                    <Text style={[styles.dayText, past && styles.dayPast, selected && styles.daySelectedText]}>{n}</Text>
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
            {course.start.split('·')[1]?.replace('출발', '').trim() ?? course.town}
          </Text>
        </View>
        <View style={styles.meetBox}>
          <Text style={styles.meetLabel}>목표 페이스</Text>
          <View style={styles.paceRow}>
            <Text style={styles.meetValue}>{paceText} /km</Text>
            <Pressable onPress={() => setPace((p) => Math.max(240, p - 10))} hitSlop={8} accessibilityLabel="페이스 빠르게">
              <Text style={styles.paceButton}>−</Text>
            </Pressable>
            <Pressable onPress={() => setPace((p) => Math.min(540, p + 10))} hitSlop={8} accessibilityLabel="페이스 느리게">
              <Text style={styles.paceButton}>+</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <Button label={`${friendName}님에게 초대 보내기`} tone="dark" height={54} onPress={() => onSend(when)} />
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
