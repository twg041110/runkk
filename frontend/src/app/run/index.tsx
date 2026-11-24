import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PauseIcon, PlayIcon, StopIcon } from '@/components/common/icons';
import { Avatar, ConfirmDialog, useToast } from '@/components/common/ui';
import { LiveMap } from '@/components/friend/live-map';
import { Palette } from '@/constants/theme';
import { useRunTracker, type GpsState } from '@/hooks/use-run-tracker';
import { errorMessage } from '@/lib/api';
import { useCourse } from '@/lib/courses';
import { duration, pace, toServerDateTime } from '@/lib/format';
import { saveRun } from '@/lib/runs';

// 달리기 측정 화면. 어디서 들어왔는지에 따라 기록에 함께 저장된다.
//   courseId: 코스 달리기 (코스 거리가 목표) / inviteId + with: 친구와 함께 / meetupId: 크루 모임
const MIN_SAVE_KM = 0.05; // 50m 보다 짧으면 저장하지 않는다

const GPS_TEXT: Record<GpsState, string> = {
  asking: '위치 권한을 확인하는 중',
  searching: 'GPS 신호를 찾는 중',
  ok: '',
  denied: '위치 권한이 없어서 거리를 잴 수 없어요. 설정에서 위치 권한을 켜 주세요.',
  error: '위치를 받을 수 없어요. GPS 가 켜져 있는지 확인해 주세요.',
};

export default function RunScreen() {
  const params = useLocalSearchParams<{ courseId?: string; inviteId?: string; meetupId?: string; with?: string }>();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const course = useCourse(params.courseId).data;
  const run = useRunTracker();
  const [holding, setHolding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tooShort, setTooShort] = useState(false);

  const goal = course?.distanceKm ?? null;
  const calories = Math.round(run.km * 65 * 1.036);
  const runType = params.inviteId ? 'TOGETHER' : params.meetupId ? 'CREW' : params.courseId ? 'COURSE' : 'FREE';
  const title = params.with ? `${params.with} 님과 함께` : course ? course.name : params.meetupId ? '크루런' : '자유 러닝';

  const finish = async () => {
    if (saving) return;
    if (run.km < MIN_SAVE_KM) {
      setTooShort(true);
      return;
    }
    setSaving(true);
    try {
      const saved = await saveRun({
        runType,
        goalType: goal ? 'DISTANCE' : 'NONE',
        goalValue: goal,
        distanceKm: Math.round(run.km * 100) / 100,
        durationSec: Math.max(run.seconds, 1),
        startedAt: toServerDateTime(run.startedAt),
        endedAt: toServerDateTime(new Date()),
        courseId: course?.courseId ?? (params.courseId ? Number(params.courseId) : null),
        inviteId: params.inviteId ? Number(params.inviteId) : null,
        meetupId: params.meetupId ? Number(params.meetupId) : null,
        routePoints: run.getPoints(),
      });
      router.replace({
        pathname: '/run/result',
        params: { recordId: String(saved.record.recordId), inviteId: params.inviteId ?? '', with: params.with ?? '' },
      });
    } catch (e) {
      setSaving(false);
      toast.show(errorMessage(e));
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12, paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
      <View style={styles.head}>
        <View style={styles.headLeft}>
          <View style={[styles.dot, run.paused && { backgroundColor: Palette.hint }]} />
          <Text style={styles.headTitle}>{run.paused ? '일시정지' : '러닝 중'}</Text>
        </View>
        <View style={styles.withChip}>
          {params.with ? <Avatar name={params.with} size={22} /> : null}
          <Text style={styles.withText} numberOfLines={1}>
            {title}
          </Text>
        </View>
      </View>

      <LiveMap height={150} me={goal ? Math.min(run.km / goal, 1) : Math.min(run.km / 5, 1)} />

      {GPS_TEXT[run.gps] ? (
        <View style={[styles.gps, (run.gps === 'denied' || run.gps === 'error') && styles.gpsBad]}>
          <Text style={styles.gpsText}>{GPS_TEXT[run.gps]}</Text>
        </View>
      ) : null}

      <View style={styles.distanceRow}>
        <Text style={styles.distance}>{run.km.toFixed(2)}</Text>
        <Text style={styles.distanceUnit}>km</Text>
      </View>

      {goal ? (
        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Text style={styles.cardTitle}>목표까지 {Math.max(goal - run.km, 0).toFixed(2)}km</Text>
            <Text style={styles.cardGoal}>목표 {goal.toFixed(1)}km</Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${Math.min(run.km / goal, 1) * 100}%` }]} />
          </View>
          {params.with ? (
            <View style={styles.hint}>
              <Text style={styles.hintText}>
                {params.with} 님도 각자 기록을 저장하면 결과 화면에서 나란히 비교할 수 있어요
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={styles.stats}>
        <Stat label="시간" value={duration(run.seconds)} />
        <Stat label="평균 페이스" value={pace(run.paceSec)} />
        <Stat label="칼로리" value={String(calories)} unit="kcal" />
      </View>

      <View style={styles.controls}>
        <Control
          big
          label={run.paused ? '다시 시작' : '일시정지'}
          onPress={run.togglePause}
          icon={run.paused ? <PlayIcon color={Palette.ink} size={30} /> : <PauseIcon color={Palette.ink} size={30} />}
        />
        <Control
          label={saving ? '저장 중' : holding ? '계속 누르세요' : '종료'}
          onPress={() => toast.show('종료하려면 길게 눌러 주세요')}
          onLongPress={finish}
          onPressIn={() => setHolding(true)}
          onPressOut={() => setHolding(false)}
          icon={saving ? <ActivityIndicator color={Palette.ink} /> : <StopIcon color={holding ? Palette.alert : Palette.ink} size={22} />}
        />
      </View>
      {toast.node}
      <ConfirmDialog
        visible={tooShort}
        title="기록이 너무 짧아요"
        message="50m 보다 짧은 기록은 저장하지 않아요. 계속 달릴까요?"
        cancelLabel="그만두기"
        confirmLabel="계속 달리기"
        onCancel={() => {
          setTooShort(false);
          router.back();
        }}
        onConfirm={() => setTooShort(false)}
      />
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
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  headLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Palette.alert },
  headTitle: { fontSize: 15, fontWeight: '700', color: Palette.ink },
  withChip: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.white,
  },
  withText: { flexShrink: 1, fontSize: 12, fontWeight: '500', color: Palette.ink },
  gps: { backgroundColor: Palette.chip, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12 },
  gpsBad: { backgroundColor: '#FFE1E2' },
  gpsText: { fontSize: 12, fontWeight: '500', color: Palette.ink },
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
  track: { height: 7, borderRadius: 4, backgroundColor: Palette.divider, overflow: 'hidden' },
  fill: { height: 7, borderRadius: 4, backgroundColor: Palette.accent },
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
  controls: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-evenly' },
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
