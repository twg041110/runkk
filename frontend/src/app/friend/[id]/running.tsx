import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MegaphoneIcon, PauseIcon, PlayIcon, StopIcon } from '@/components/common/icons';
import { Avatar, useToast } from '@/components/common/ui';
import { LiveMap } from '@/components/friend/live-map';
import { Palette } from '@/constants/theme';
import { getFriend } from '@/data/friends';

// 실제 GPS 연동 전까지는 정해진 속도로 거리가 늘어나는 예시 화면이다.
const MY_SEC_PER_KM = 360; // 6'00"
const FRIEND_SEC_PER_KM = 332; // 5'32"

const clock = (sec: number) =>
  `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
const paceText = (secPerKm: number) => `${Math.floor(secPerKm / 60)}'${String(Math.round(secPerKm % 60)).padStart(2, '0')}"`;

export default function RunningTogetherScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const friend = getFriend(id);
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const goal = friend.live?.goalKm ?? 5;
  const friendStartKm = friend.live?.km ?? 0;
  const [seconds, setSeconds] = useState(0);
  const [paused, setPaused] = useState(false);
  const [holding, setHolding] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (paused) return;
    // 예시 화면이라 1초에 6초씩 흐르게 해서 움직임이 보이게 한다
    timer.current = setInterval(() => setSeconds((s) => s + 6), 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [paused]);

  const myKm = Math.min(seconds / MY_SEC_PER_KM, goal);
  const friendKm = Math.min(friendStartKm + seconds / FRIEND_SEC_PER_KM, goal);
  const gap = friendKm - myKm;
  const calories = Math.round(myKm * 60);

  useEffect(() => {
    if (myKm >= goal) finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myKm >= goal]);

  function finish() {
    // 친구는 내가 참여하기 전부터 달리고 있었으므로, 친구 기록은 친구가 출발한 때부터 센다
    const friendElapsedAtJoin = friendStartKm * FRIEND_SEC_PER_KM;
    const friendDoneAt = (goal - friendStartKm) * FRIEND_SEC_PER_KM; // 내가 참여한 뒤 몇 초에 친구가 완주했는지
    const friendTotal = friendKm >= goal ? goal * FRIEND_SEC_PER_KM : friendElapsedAtJoin + seconds;
    const bothDone = myKm >= goal && friendKm >= goal;
    router.replace({
      pathname: '/friend/[id]/result',
      params: {
        id: friend.id,
        km: myKm.toFixed(2),
        time: clock(seconds),
        friendKm: friendKm.toFixed(2),
        friendTime: clock(friendTotal),
        calories: String(calories),
        // 둘 다 완주했을 때만: 친구가 나보다 몇 초 먼저 들어왔는지 (음수면 내가 먼저)
        gap: bothDone ? String(Math.round(seconds - friendDoneAt)) : '',
      },
    });
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12, paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
      <View style={styles.head}>
        <View style={styles.headLeft}>
          <View style={[styles.dot, paused && { backgroundColor: Palette.hint }]} />
          <Text style={styles.headTitle}>{paused ? '일시정지' : '함께 러닝 중'}</Text>
        </View>
        <View style={styles.withChip}>
          <Avatar name={friend.name} size={22} />
          <Text style={styles.withText}>{friend.name} 님과 함께</Text>
        </View>
      </View>

      <View style={styles.mapWrap}>
        <LiveMap height={150} me={myKm / goal} friend={friendKm / goal} friendLetter={friend.name.slice(0, 1)} />
        <View style={styles.legend}>
          <View style={[styles.legendDot, { backgroundColor: Palette.accent }]} />
          <Text style={styles.legendText}>나</Text>
          <View style={[styles.legendDot, { backgroundColor: '#FF8A3D' }]} />
          <Text style={styles.legendText}>{friend.name}</Text>
        </View>
      </View>

      <View style={styles.distanceRow}>
        <Text style={styles.distance}>{myKm.toFixed(2)}</Text>
        <Text style={styles.distanceUnit}>km</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHead}>
          <Text style={styles.cardTitle}>함께 달린 지 {clock(seconds)}</Text>
          <Text style={styles.cardGoal}>목표 {goal.toFixed(1)}km</Text>
        </View>
        <Lane label="나" km={myKm} pace={paceText(MY_SEC_PER_KM)} goal={goal} color={Palette.accent} />
        <Lane label={friend.name} km={friendKm} pace={paceText(FRIEND_SEC_PER_KM)} goal={goal} color="#FF8A3D" />
        <View style={styles.hint}>
          <Text style={styles.hintText}>
            {gap > 0.005
              ? `${friend.name} 님보다 ${gap.toFixed(2)}km 뒤에 있어요. 조금만 더 힘내요!`
              : `${friend.name} 님보다 ${Math.abs(gap).toFixed(2)}km 앞서고 있어요!`}
          </Text>
        </View>
      </View>

      <View style={styles.stats}>
        <Stat label="시간" value={clock(seconds)} />
        <Stat label="평균 페이스" value={paceText(MY_SEC_PER_KM)} />
        <Stat label="칼로리" value={String(calories)} unit="kcal" />
      </View>

      <View style={styles.controls}>
        <Control
          label="응원"
          onPress={() => toast.show(`${friend.name}님에게 응원을 보냈어요`)}
          icon={<MegaphoneIcon color={Palette.ink} size={22} />}
        />
        <Control
          big
          label={paused ? '다시 시작' : '일시정지'}
          onPress={() => setPaused((p) => !p)}
          icon={paused ? <PlayIcon color={Palette.ink} size={30} /> : <PauseIcon color={Palette.ink} size={30} />}
        />
        <Control
          label={holding ? '계속 누르세요' : '종료'}
          onPress={() => toast.show('종료하려면 길게 눌러주세요')}
          onLongPress={finish}
          onPressIn={() => setHolding(true)}
          onPressOut={() => setHolding(false)}
          icon={<StopIcon color={holding ? Palette.alert : Palette.ink} size={22} />}
        />
      </View>
      {toast.node}
    </View>
  );
}

function Lane({ label, km, pace, goal, color }: { label: string; km: number; pace: string; goal: number; color: string }) {
  return (
    <View style={styles.lane}>
      <View style={styles.laneHead}>
        <View style={styles.laneName}>
          <View style={[styles.legendDot, { backgroundColor: color }]} />
          <Text style={styles.laneLabel}>{label}</Text>
        </View>
        <Text style={styles.laneValue}>
          {km.toFixed(2)}km · {pace}
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${(km / goal) * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>
        {value}
        {unit ? <Text style={styles.statUnit}> {unit}</Text> : null}
      </Text>
    </View>
  );
}

function Control({
  label,
  icon,
  big,
  onPress,
  onLongPress,
  onPressIn,
  onPressOut,
}: {
  label: string;
  icon: React.ReactNode;
  big?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
}) {
  return (
    <View style={styles.control}>
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={900}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={({ pressed }) => [big ? styles.bigButton : styles.smallButton, pressed && { opacity: 0.8 }]}
        accessibilityRole="button"
        accessibilityLabel={label}>
        {icon}
      </Pressable>
      <Text style={styles.controlLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Palette.background, paddingHorizontal: 20, gap: 12 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Palette.alert },
  headTitle: { fontSize: 15, fontWeight: '700', color: Palette.ink },
  withChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 4,
    paddingRight: 10,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.white,
  },
  withText: { fontSize: 12, fontWeight: '500', color: Palette.ink },
  mapWrap: { position: 'relative' },
  legend: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Palette.white,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, fontWeight: '700', color: Palette.ink, marginRight: 4 },
  distanceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  distance: { fontSize: 72, lineHeight: 80, fontWeight: '900', color: Palette.ink, letterSpacing: -2 },
  distanceUnit: { fontSize: 22, fontWeight: '700', color: Palette.muted },
  card: {
    backgroundColor: Palette.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: 16,
    gap: 12,
  },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between' },
  cardTitle: { fontSize: 14, fontWeight: '700', color: Palette.ink },
  cardGoal: { fontSize: 12, color: Palette.muted },
  lane: { gap: 6 },
  laneHead: { flexDirection: 'row', justifyContent: 'space-between' },
  laneName: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  laneLabel: { fontSize: 13, fontWeight: '700', color: Palette.ink },
  laneValue: { fontSize: 13, fontWeight: '700', color: Palette.ink },
  track: { height: 7, borderRadius: 4, backgroundColor: Palette.divider, overflow: 'hidden' },
  fill: { height: 7, borderRadius: 4 },
  hint: { backgroundColor: Palette.accentSoft, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 12 },
  hintText: { fontSize: 12, fontWeight: '500', color: Palette.ink },
  stats: { flexDirection: 'row', gap: 8 },
  stat: {
    flex: 1,
    backgroundColor: Palette.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: 12,
    gap: 3,
  },
  statLabel: { fontSize: 11, color: Palette.muted },
  statValue: { fontSize: 19, fontWeight: '900', color: Palette.ink },
  statUnit: { fontSize: 11, fontWeight: '500', color: Palette.muted },
  controls: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around' },
  control: { alignItems: 'center', gap: 8 },
  smallButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlLabel: { fontSize: 12, fontWeight: '700', color: Palette.ink },
});
