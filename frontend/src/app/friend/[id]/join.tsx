import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { GlobeIcon, PlaySmallIcon } from '@/components/common/icons';
import { Avatar, Button, Card, SubScreen, Toggle, TopBar } from '@/components/common/ui';
import { LiveMap } from '@/components/friend/live-map';
import { Palette } from '@/constants/theme';
import { getFriend } from '@/data/friends';

export default function JoinRunScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const friend = getFriend(id);
  const live = friend.live;
  const [voice, setVoice] = useState(true);
  const [share, setShare] = useState(true);

  return (
    <SubScreen
      header={<TopBar title="같이 달리기" />}
      bottom={
        <Button
          label="참여하고 러닝 시작"
          tone="lime"
          flex
          icon={(color) => <PlaySmallIcon color={color} />}
          onPress={() =>
            router.replace({ pathname: '/friend/[id]/running', params: { id: friend.id, voice: voice ? '1' : '0' } })
          }
        />
      }>
      <LiveMap me={0} friend={live ? live.km / live.goalKm : 0} friendLetter={friend.name.slice(0, 1)} />

      <Card tone="white" style={styles.status}>
        <View style={styles.statusHead}>
          <Avatar name={friend.name} size={40} />
          <View style={styles.flex}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{friend.name} 님이 달리는 중</Text>
              <View style={styles.liveBadge}>
                <Text style={styles.liveBadgeText}>LIVE</Text>
              </View>
            </View>
            <Text style={styles.sub}>
              {live?.course ?? '자유 러닝'} · 목표 {live?.goalKm ?? 5}km
            </Text>
          </View>
        </View>
        <View style={styles.stats}>
          <Stat label="거리" value={`${(live?.km ?? 0).toFixed(2)}km`} />
          <Stat label="시간" value={live?.elapsed ?? '00:00'} />
          <Stat label="페이스" value={live?.pace ?? `-'--"`} />
        </View>
      </Card>

      <Text style={styles.section}>이렇게 함께 달려요</Text>
      <View style={styles.mode}>
        <View style={styles.modeIcon}>
          <GlobeIcon color={Palette.accent} size={20} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.modeTitle}>각자 위치에서 함께 달리기</Text>
          <Text style={styles.modeSub}>떨어져 있어도 실시간으로 거리와 페이스를 비교하며 같이 달려요</Text>
        </View>
      </View>

      <Card tone="white" style={styles.options}>
        <View style={styles.option}>
          <View style={styles.flex}>
            <Text style={styles.optionTitle}>친구 소식 음성 안내</Text>
            <Text style={styles.sub}>&quot;{friend.name} 님이 4km를 통과했어요&quot;</Text>
          </View>
          <Toggle value={voice} onChange={setVoice} label="친구 소식 음성 안내" />
        </View>
        <View style={styles.divider} />
        <View style={styles.option}>
          <View style={styles.flex}>
            <Text style={styles.optionTitle}>내 위치를 {friend.name} 님에게 공유</Text>
            <Text style={styles.sub}>러닝이 끝나면 자동으로 공유가 꺼져요</Text>
          </View>
          <Toggle value={share} onChange={setShare} label="내 위치 공유" />
        </View>
      </Card>
    </SubScreen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 3 },
  status: { padding: 16, gap: 14 },
  statusHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { fontSize: 15, fontWeight: '700', color: Palette.ink },
  liveBadge: { backgroundColor: '#FFE1E2', borderRadius: 6, paddingHorizontal: 5, paddingVertical: 1 },
  liveBadgeText: { fontSize: 10, fontWeight: '900', color: Palette.alert },
  sub: { fontSize: 12, color: Palette.muted },
  stats: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, backgroundColor: Palette.background, borderRadius: 12, padding: 12, gap: 3 },
  statLabel: { fontSize: 11, color: Palette.muted },
  statValue: { fontSize: 16, fontWeight: '900', color: Palette.ink },
  section: { fontSize: 17, fontWeight: '700', color: Palette.ink },
  mode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: Palette.ink,
    backgroundColor: Palette.accentSoft,
  },
  modeIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: Palette.ink, alignItems: 'center', justifyContent: 'center' },
  modeTitle: { fontSize: 15, fontWeight: '700', color: Palette.ink },
  modeSub: { fontSize: 12, lineHeight: 17, color: Palette.inkSoft },
  options: { paddingVertical: 4, paddingHorizontal: 16 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  optionTitle: { fontSize: 14, fontWeight: '700', color: Palette.ink },
  divider: { height: 1, backgroundColor: Palette.divider },
});
