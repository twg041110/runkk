import { router, useLocalSearchParams } from 'expo-router';
import { Share, StyleSheet, Text, View } from 'react-native';

import { CheckIcon, ShareIcon } from '@/components/common/icons';
import { Avatar, Button, SubScreen } from '@/components/common/ui';
import { Palette } from '@/constants/theme';
import { ME, getFriend } from '@/data/friends';

const WEEK = ['일', '월', '화', '수', '목', '금', '토'];
const toSec = (t: string) => {
  const [m, s] = t.split(':').map(Number);
  return m * 60 + s;
};
const paceOf = (km: number, time: string) => {
  const sec = km > 0 ? toSec(time) / km : 0;
  return `${Math.floor(sec / 60)}'${String(Math.round(sec % 60)).padStart(2, '0')}"`;
};

export default function TogetherResultScreen() {
  const params = useLocalSearchParams<{
    id: string;
    km?: string;
    time?: string;
    friendKm?: string;
    friendTime?: string;
    calories?: string;
    gap?: string;
  }>();
  const friend = getFriend(params.id);
  const km = Number(params.km ?? 5);
  const myTime = params.time ?? '30:10';
  const friendTime = params.friendTime ?? '27:40';
  const friendKm = Number(params.friendKm ?? km);
  const now = new Date();
  const hour = now.getHours();
  const date = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일 (${WEEK[now.getDay()]}) ${hour < 12 ? '오전' : '오후'} ${hour % 12 || 12}:${String(now.getMinutes()).padStart(2, '0')}`;
  const done = km >= (friend.live?.goalKm ?? 5) - 0.01;
  // 둘 다 완주했으면 누가 먼저 들어왔는지, 아니면 누가 더 멀리 달렸는지로 비교한다
  let summary: string;
  if (params.gap) {
    const gap = Number(params.gap);
    const abs = Math.abs(gap);
    const gapText = `${Math.floor(abs / 60)}분 ${abs % 60}초`;
    summary = gap > 0 ? `${friend.name} 님이 ${gapText} 먼저 들어왔어요` : gap < 0 ? `내가 ${gapText} 먼저 들어왔어요` : '나란히 들어왔어요';
  } else {
    const more = Math.abs(friendKm - km).toFixed(2);
    summary = friendKm > km ? `${friend.name} 님이 ${more}km 더 달렸어요` : friendKm < km ? `내가 ${more}km 더 달렸어요` : '똑같이 달렸어요';
  }

  return (
    <SubScreen
      header={
        <View style={styles.head}>
          <View style={styles.headLeft}>
            <View style={styles.dot} />
            <Text style={styles.headText}>함께 러닝 결과</Text>
          </View>
          <Text style={styles.headRight}>{friend.name} 님과 함께</Text>
        </View>
      }
      bottom={
        <>
          <Button
            label="공유하기"
            tone="outline"
            flex
            icon={(color) => <ShareIcon color={color} size={18} />}
            onPress={() =>
              Share.share({ message: `${friend.name}님과 함께 ${km.toFixed(2)}km를 ${myTime}에 달렸어요! #런크크` })
            }
          />
          <Button
            label="완료"
            tone="dark"
            flex
            icon={(color) => <CheckIcon color={color} size={18} />}
            onPress={() => router.dismissTo('/friends')}
          />
        </>
      }>
      <View style={styles.pair}>
        <Avatar name="나" size={34} color={Palette.accent} />
        <View style={styles.overlap}>
          <Avatar name={friend.name} size={34} />
        </View>
      </View>
      <View style={styles.titleBox}>
        <Text style={styles.title}>{done ? `함께 ${km.toFixed(0)}km 완주!` : `함께 ${km.toFixed(2)}km 달렸어요`}</Text>
        <Text style={styles.date}>{date}</Text>
      </View>

      <View style={styles.card}>
        <Row letter="나" color={Palette.accent} name={ME.name} km={km} time={myTime} />
        <View style={styles.divider} />
        <Row letter={friend.name} name={friend.name} km={friendKm} time={friendTime} />
        <View style={styles.summary}>
          <Text style={styles.summaryText}>{summary}</Text>
        </View>
      </View>

      <View style={styles.stats}>
        <Stat label="함께 달린 거리" value={km.toFixed(2)} unit="km" />
        <Stat label="함께 달린 횟수" value={String(friend.together.count + 1)} unit="번째" />
        <Stat label="칼로리" value={params.calories ?? '300'} unit="kcal" />
      </View>
    </SubScreen>
  );
}

function Row({ letter, color, name, km, time }: { letter: string; color?: string; name: string; km: number; time: string }) {
  return (
    <View style={styles.row}>
      <Avatar name={letter} size={28} color={color} />
      <Text style={styles.rowName}>{name}</Text>
      <View style={styles.rowRight}>
        <Text style={styles.rowTime}>{time}</Text>
        <Text style={styles.rowSub}>
          {km.toFixed(2)}km · {paceOf(km, time)}/km
        </Text>
      </View>
    </View>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>
        {value}
        <Text style={styles.statUnit}> {unit}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 32 },
  headLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Palette.ink },
  headText: { fontSize: 13, fontWeight: '700', color: Palette.ink },
  headRight: { fontSize: 13, color: Palette.muted },
  pair: { flexDirection: 'row' },
  overlap: { marginLeft: 4 },
  titleBox: { gap: 6 },
  title: { fontSize: 30, fontWeight: '900', color: Palette.ink },
  date: { fontSize: 14, color: Palette.muted },
  card: {
    backgroundColor: Palette.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: 16,
    gap: 12,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowName: { flex: 1, fontSize: 14, fontWeight: '700', color: Palette.ink },
  rowRight: { alignItems: 'flex-end', gap: 2 },
  rowTime: { fontSize: 22, fontWeight: '900', color: Palette.ink },
  rowSub: { fontSize: 11, color: Palette.muted },
  divider: { height: 1, backgroundColor: Palette.divider },
  summary: { backgroundColor: Palette.accentSoft, borderRadius: 12, paddingVertical: 10 },
  summaryText: { fontSize: 13, fontWeight: '700', color: Palette.ink, textAlign: 'center' },
  stats: { flexDirection: 'row', gap: 8 },
  stat: {
    flex: 1,
    backgroundColor: Palette.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: 12,
    gap: 4,
  },
  statLabel: { fontSize: 11, color: Palette.muted },
  statValue: { fontSize: 19, fontWeight: '900', color: Palette.ink },
  statUnit: { fontSize: 11, fontWeight: '500', color: Palette.muted },
});
