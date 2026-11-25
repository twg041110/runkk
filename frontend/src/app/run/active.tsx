/**
 * 러닝 중 (Figma: 러닝 중, 일시정지, 잠금, 종료 누르는 중, GPS 약함, 자동 일시정지)
 *
 * 아래 버튼
 * - 달리는 중:  [잠금]  [일시정지(노랑)]  [종료]
 *     · 종료는 1.5초 동안 길게 눌러야 끝나요. 누르는 동안 버튼 둘레에 링이 차올라요.
 *     · 잠금을 누르면 화면이 어두워지고 다른 버튼이 안 눌려요. 잠금 버튼을 길게 누르면 풀려요.
 * - 일시정지:   [다시 시작(노랑)]  [종료]   ← 여기서는 종료를 한 번만 눌러도 끝나요.
 *
 * 위쪽 안내
 * - GPS 약함: 위치 정확도가 나쁘거나 10초 넘게 위치가 안 오면 어두운 안내가 떠요.
 * - 자동 일시정지: 설정에서 켜 두면, 10초 동안 안 움직일 때 기록을 멈추고 안내가 떠요.
 *
 * 안드로이드 뒤로 가기 버튼은 막아 뒀어요 (실수로 러닝이 끊기지 않게).
 */
import { router } from 'expo-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { LockIcon, PauseIcon, PlayIcon, StopIcon } from '@/components/common/icons';
import { Toast } from '@/components/common/toast';
import { RunMap } from '@/components/run/run-map';
import { RunStats } from '@/components/run/run-stats';
import { Palette } from '@/constants/theme';
import { useRunSession } from '@/hooks/use-run-session';

const HOLD_TO_STOP_MS = 1500; // 종료 버튼을 이만큼 눌러야 끝나요
const STATUS_LABEL = {
  running: '러닝 중',
  paused: '일시정지',
  autoPaused: '자동 일시정지',
} as const;

export default function RunActiveScreen() {
  const insets = useSafeAreaInsets();
  const { status, elapsedSec, distanceM, points, gpsWeak, pause, resume, finish } = useRunSession();
  const [locked, setLocked] = useState(false);
  const [notice, setNotice] = useState('');

  // 안드로이드 뒤로 가기 막기 (true를 돌려주면 "내가 처리했어요"라는 뜻이라 화면이 안 닫혀요)
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  const end = () => {
    finish();
    router.replace('/run/result');
  };

  const label = status === 'paused' || status === 'autoPaused' ? STATUS_LABEL[status] : STATUS_LABEL.running;
  const paused = status === 'paused';

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.header}>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, status !== 'running' && styles.statusDotPaused]} />
          <Text style={styles.statusText}>{label}</Text>
        </View>
        <Text style={styles.mode}>바로 러닝</Text>
      </View>

      <View style={styles.body}>
        <View>
          <RunMap points={points} live />
          {/* 지도 위에 겹쳐 뜨는 안내. 자동 일시정지가 GPS 약함보다 먼저 보여요 */}
          {status === 'autoPaused' ? (
            <Banner title="멈춰서 기록도 잠시 멈췄어요" description="다시 달리면 자동으로 이어서 기록해요" />
          ) : gpsWeak ? (
            <Banner title="GPS 신호가 약해요" description="하늘이 트인 곳으로 가면 거리가 정확해져요" />
          ) : null}
        </View>
        <RunStats distanceM={distanceM} elapsedSec={elapsedSec} />
      </View>

      {paused ? (
        <View style={styles.controls}>
          <LabeledButton label="다시 시작" onPress={resume} primary>
            <PlayIcon color={Palette.ink} size={34} />
          </LabeledButton>
          <LabeledButton label="종료" onPress={end}>
            <StopIcon color={Palette.ink} size={30} />
          </LabeledButton>
        </View>
      ) : (
        // 잠겼을 때는 아래 버튼들을 화면 낭독기에서도 숨겨요 (덮개 위 잠금 버튼만 보이게)
        <View
          style={styles.controls}
          accessibilityElementsHidden={locked}
          importantForAccessibility={locked ? 'no-hide-descendants' : 'auto'}>
          <LockButton
            locked={locked}
            onLock={() => {
              setLocked(true);
              setNotice('잠금 버튼을 길게 누르면 풀려요');
            }}
            onUnlock={() => setLocked(false)}
          />
          <Pressable style={[styles.bigButton, styles.primary]} onPress={pause} accessibilityRole="button" accessibilityLabel="일시정지">
            <PauseIcon color={Palette.ink} size={40} />
          </Pressable>
          <HoldToStopButton onDone={end} onTap={() => setNotice('종료하려면 길게 눌러 주세요')} />
        </View>
      )}

      {/* 잠금: 화면 전체를 덮어서 아무것도 안 눌리게 하고, 잠금 버튼만 위로 다시 그려요.
          아래 버튼 줄과 똑같은 모양이 되도록 일시정지 · 종료 자리에 같은 크기의 빈 칸을 둬요
          (빈 칸이 없으면 줄 높이가 달라져서 잠금 버튼이 아래로 밀려요) */}
      {locked && (
        <Pressable style={styles.lockOverlay} onPress={() => setNotice('잠금 버튼을 길게 누르면 풀려요')}>
          <View style={[styles.controls, styles.lockOnly, { bottom: insets.bottom + 24 }]}>
            <LockButton locked onLock={() => {}} onUnlock={() => setLocked(false)} />
            <View style={styles.bigButton} />
            <View style={styles.holdWrap} />
          </View>
        </Pressable>
      )}

      {/* 아래 버튼(92) + 버튼 글자 위로 띄워서 버튼을 가리지 않게 해요 */}
      <Toast message={notice} onHide={() => setNotice('')} bottom={24 + 92 + 50} />
    </View>
  );
}

/** 지도 아래쪽에 겹쳐 뜨는 어두운 안내 */
function Banner({ title, description }: { title: string; description: string }) {
  return (
    <View style={styles.banner} accessibilityLiveRegion="polite">
      <Text style={styles.bannerTitle}>{title}</Text>
      <Text style={styles.bannerDescription}>{description}</Text>
    </View>
  );
}

/** 잠금 버튼: 잠그기는 한 번 누르기, 풀기는 길게 누르기 */
function LockButton({ locked, onLock, onUnlock }: { locked: boolean; onLock: () => void; onUnlock: () => void }) {
  return (
    <Pressable
      style={[styles.smallButton, locked && styles.primary]}
      onPress={locked ? undefined : onLock}
      onLongPress={locked ? onUnlock : undefined}
      delayLongPress={800}
      accessibilityRole="button"
      accessibilityLabel={locked ? '잠금 풀기 (길게 누르기)' : '화면 잠금'}>
      <LockIcon color={Palette.ink} size={24} />
    </Pressable>
  );
}

/**
 * 길게 눌러 종료하는 버튼
 * 누르기 시작하면 0.03초마다 진행률(0~1)을 올려서 둘레 링을 채우고, 1이 되면 onDone을 불러요.
 * 중간에 손을 떼면 진행률을 0으로 되돌려요.
 */
function HoldToStopButton({ onDone, onTap }: { onDone: () => void; onTap: () => void }) {
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const onPressIn = () => {
    const startAt = Date.now();
    stopTimer();
    timerRef.current = setInterval(() => {
      const p = Math.min((Date.now() - startAt) / HOLD_TO_STOP_MS, 1);
      setProgress(p);
      if (p >= 1) {
        stopTimer();
        onDone();
      }
    }, 30);
  };

  const onPressOut = () => {
    stopTimer();
    setProgress(0);
  };

  // 화면을 떠날 때 타이머 정리
  useEffect(() => stopTimer, []);

  const size = 64;
  const ring = 4;
  const r = (size + ring * 2 + 4) / 2 - ring / 2; // 버튼 바깥쪽에 링을 그려요
  const box = size + ring * 2 + 4;
  const length = 2 * Math.PI * r;
  const holding = progress > 0;

  return (
    <View style={styles.holdWrap}>
      {holding && (
        <Svg width={box} height={box} style={styles.ring} pointerEvents="none">
          <Circle cx={box / 2} cy={box / 2} r={r} stroke={Palette.border} strokeWidth={ring} fill="none" />
          <Circle
            cx={box / 2}
            cy={box / 2}
            r={r}
            stroke={Palette.ink}
            strokeWidth={ring}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${length} ${length}`}
            strokeDashoffset={length * (1 - progress)}
            transform={`rotate(-90 ${box / 2} ${box / 2})`} // 12시 방향부터 시계 방향으로 채워요
          />
        </Svg>
      )}
      <Pressable
        style={[styles.smallButton, holding && styles.holding]}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={onTap} // 끝까지 누르기 전에 손을 떼면 "길게 눌러 주세요" 안내
        accessibilityRole="button"
        accessibilityLabel="종료 (길게 누르기)">
        <StopIcon color={holding ? Palette.surface : Palette.ink} size={26} />
      </Pressable>
    </View>
  );
}

/** 일시정지 화면의 큰 버튼 + 아래 글자 */
function LabeledButton({
  label,
  primary,
  onPress,
  children,
}: {
  label: string;
  primary?: boolean;
  onPress: () => void;
  children: ReactNode;
}) {
  return (
    // 동그라미와 아래 글자를 한 버튼으로 묶어서, 글자를 눌러도 동작해요
    <Pressable style={styles.labeled} onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      <View style={[styles.bigButton, primary ? styles.primary : styles.white]}>{children}</View>
      <Text style={styles.labeledText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: Palette.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Palette.alert,
  },
  statusDotPaused: {
    backgroundColor: Palette.hint,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '800',
    color: Palette.ink,
  },
  mode: {
    fontSize: 14,
    fontWeight: '600',
    color: Palette.muted,
  },
  body: {
    flex: 1,
    gap: 20,
  },
  banner: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    gap: 2,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(28, 30, 34, 0.92)',
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Palette.surface,
  },
  bannerDescription: {
    fontSize: 12,
    color: '#C9CBD1',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
  },
  smallButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
  },
  bigButton: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    borderColor: Palette.accent,
    backgroundColor: Palette.accent,
  },
  white: {
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
  },
  holding: {
    borderColor: Palette.ink,
    backgroundColor: Palette.ink,
  },
  holdWrap: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
  },
  labeled: {
    alignItems: 'center',
    gap: 10,
  },
  labeledText: {
    fontSize: 14,
    fontWeight: '700',
    color: Palette.ink,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  lockOnly: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
});
