import { router, useLocalSearchParams } from 'expo-router';
import { Share, StyleSheet, Text, View } from 'react-native';

import { CheckIcon, ShareIcon } from '@/components/common/icons';
import { Avatar, Button, LoadingBlock, QueryView, SubScreen } from '@/components/common/ui';
import { Palette } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import type { CourseRecordDto } from '@/lib/api';
import { dateTimeLabel, duration, pace } from '@/lib/format';
import { useInvite } from '@/lib/friends';
import { useRun } from '@/lib/runs';

// 달리기 결과. 친구와 함께 달렸으면(inviteId) 두 사람의 기록을 나란히 보여 준다.
export default function RunResultScreen() {
  const params = useLocalSearchParams<{ recordId: string; inviteId?: string; with?: string }>();
  const { me } = useAuth();
  const runQuery = useRun(params.recordId);
  const inviteQuery = useInvite(params.inviteId || undefined);
  const friendName = params.with || null;

  return (
    <QueryView
      query={runQuery}
      loading={
        <SubScreen header={null}>
          <LoadingBlock height={180} count={2} />
        </SubScreen>
      }>
      {({ record }) => {
        const km = Number(record.distanceKm);
        const goalDone = record.goalAchieved === true;
        const friendRecord = inviteQuery.data?.records.find((r) => !r.me) ?? null;
        const myRecord: CourseRecordDto = {
          member: { memberId: me?.memberId ?? 0, nickname: me?.nickname ?? '나', profileImageUrl: null },
          me: true,
          recordId: record.recordId,
          durationSec: record.durationSec,
          distanceKm: km,
          avgPaceSec: record.avgPaceSec,
          startedAt: record.startedAt,
        };
        const title = friendName
          ? goalDone
            ? `함께 ${km.toFixed(1)}km 완주!`
            : `함께 ${km.toFixed(2)}km 달렸어요`
          : goalDone
            ? `${km.toFixed(2)}km 완주!`
            : `${km.toFixed(2)}km 달렸어요`;

        let summary: string | null = null;
        if (friendName && friendRecord) {
          const fk = Number(friendRecord.distanceKm);
          if (Math.abs(fk - km) < 0.05) {
            const gap = record.durationSec - friendRecord.durationSec;
            const abs = Math.abs(gap);
            const gapText = abs >= 60 ? `${Math.floor(abs / 60)}분 ${abs % 60}초` : `${abs}초`;
            summary = gap > 0 ? `${friendName} 님이 ${gapText} 더 빨랐어요` : gap < 0 ? `내가 ${gapText} 더 빨랐어요` : '나란히 들어왔어요';
          } else {
            const more = Math.abs(fk - km).toFixed(2);
            summary = fk > km ? `${friendName} 님이 ${more}km 더 달렸어요` : `내가 ${more}km 더 달렸어요`;
          }
        }

        return (
          <SubScreen
            header={
              <View style={styles.head}>
                <View style={styles.headLeft}>
                  <View style={styles.dot} />
                  <Text style={styles.headText}>{friendName ? '함께 러닝 결과' : '러닝 결과'}</Text>
                </View>
                <Text style={styles.headRight}>{friendName ? `${friendName} 님과 함께` : (record.courseName ?? '자유 러닝')}</Text>
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
                    Share.share({
                      message: `${friendName ? `${friendName}님과 함께 ` : ''}${km.toFixed(2)}km를 ${duration(record.durationSec)}에 달렸어요! #런크크`,
                    })
                  }
                />
                <Button
                  label="완료"
                  tone="dark"
                  flex
                  icon={(color) => <CheckIcon color={color} size={18} />}
                  onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
                />
              </>
            }>
            {friendName ? (
              <View style={styles.pair}>
                <Avatar name="나" size={34} color={Palette.accent} />
                <View style={styles.overlap}>
                  <Avatar name={friendName} size={34} />
                </View>
              </View>
            ) : null}
            <View style={styles.titleBox}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.date}>{dateTimeLabel(record.startedAt)}</Text>
            </View>

            {friendName ? (
              <View style={styles.card}>
                <Row letter="나" color={Palette.accent} name={me?.nickname ?? '나'} record={myRecord} />
                <View style={styles.divider} />
                {friendRecord ? (
                  <Row letter={friendName} name={friendName} record={friendRecord} />
                ) : (
                  <View style={styles.row}>
                    <Avatar name={friendName} size={28} />
                    <Text style={styles.rowName}>{friendName}</Text>
                    <Text style={styles.rowSub}>아직 기록을 저장하지 않았어요</Text>
                  </View>
                )}
                <View style={styles.summary}>
                  <Text style={styles.summaryText}>
                    {summary ?? '친구가 기록을 저장하면 여기에서 비교할 수 있어요'}
                  </Text>
                </View>
                {!friendRecord ? (
                  <Button label="다시 확인하기" tone="outline" height={42} radius={12} fontSize={13} onPress={inviteQuery.reload} />
                ) : null}
              </View>
            ) : null}

            <View style={styles.stats}>
              <Stat label="거리" value={km.toFixed(2)} unit="km" />
              <Stat label="시간" value={duration(record.durationSec)} />
              <Stat label="평균 페이스" value={pace(record.avgPaceSec)} />
            </View>
            <View style={styles.stats}>
              <Stat label="칼로리" value={String(record.calories ?? 0)} unit="kcal" />
              <Stat
                label="목표 달성"
                value={record.completionRate != null ? `${Math.round(Number(record.completionRate))}` : '-'}
                unit={record.completionRate != null ? '%' : undefined}
              />
            </View>
          </SubScreen>
        );
      }}
    </QueryView>
  );
}

function Row({ letter, color, name, record }: { letter: string; color?: string; name: string; record: CourseRecordDto }) {
  return (
    <View style={styles.row}>
      <Avatar name={letter} size={28} color={color} />
      <Text style={styles.rowName}>{name}</Text>
      <View style={styles.rowRight}>
        <Text style={styles.rowTime}>{duration(record.durationSec)}</Text>
        <Text style={styles.rowSub}>
          {Number(record.distanceKm).toFixed(2)}km · {pace(record.avgPaceSec)}/km
        </Text>
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
  summary: { backgroundColor: Palette.accentSoft, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12 },
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
