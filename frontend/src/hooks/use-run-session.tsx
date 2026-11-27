/**
 * 러닝 한 번의 상태를 들고 있는 곳 (시간, 거리, 지나간 위치, 일시정지 여부)
 *
 * 러닝 중 화면과 결과 화면이 같은 기록을 봐야 해서, run/_layout.tsx에서
 * <RunSessionProvider>로 감싸고 두 화면이 useRunSession()으로 꺼내 써요.
 *
 * 동작 원리:
 * 1. start(): 폰 GPS를 켜서(watchPositionAsync) 1초마다 위치를 받아요.
 * 2. 위치가 올 때마다 바로 전 위치와의 거리를 계산해서 더해요. (하버사인 공식)
 *    - 정확도가 30m보다 나쁘면(GPS 약함) 그 위치는 버려요.
 *    - 1초에 12m 넘게 움직였으면(시속 43km) GPS가 튄 것으로 보고 버려요.
 * 3. 시간은 "지금까지 쌓인 시간 + 이번에 다시 달리기 시작한 뒤 흐른 시간"으로 계산해요.
 *    그래서 일시정지 동안은 시간이 늘지 않아요.
 * 4. 자동 일시정지(설정에서 켰을 때만): 10초 동안 거의 안 움직이면 멈추고, 다시 움직이면 이어서 기록해요.
 * 5. 목표 러닝: 목표 정하기 화면에서 setGoal로 목표(거리 · 시간)를 넣어 둬요. 바로 러닝은 목표가 없어요(null).
 *    목표 거리를 처음 넘은 순간의 시간(goalReachedSec)을 기억해서, 결과 화면에서 "목표보다 몇 초 빨랐는지" 계산해요.
 * 6. 코스 러닝: 코스 화면에서 setCourse로 코스를 넣고, 목표 거리 = 코스 길이로 setGoal 해요.
 *    (목표 시간을 정했으면 목표 시간도 같이) 바로 러닝 · 목표 러닝은 코스가 없어요(null).
 *
 * TODO(API): 끝나면 POST /api/runs 로 기록(routePoints 포함)을 서버에 저장해요. (로그인 연결 후)
 * TODO: 화면 꺼짐 방지 · 음성 안내 설정은 아직 반영하지 않았어요.
 */
import * as Location from 'expo-location';
import { createContext, use, useEffect, useRef, useState, type ReactNode } from 'react';

import type { Course } from '@/constants/courses';
import { useSettings } from '@/hooks/use-settings';

export type RunPoint = { lat: number; lng: number; at: number };

/** 목표: 거리(m)와 시간(초) 중 하나만 있거나 둘 다 있어요 */
export type RunGoal = { distanceM: number | null; timeSec: number | null };

/** running: 달리는 중, paused: 직접 멈춤, autoPaused: 안 움직여서 자동으로 멈춤, finished: 끝 */
export type RunStatus = 'idle' | 'running' | 'paused' | 'autoPaused' | 'finished';

const WEAK_ACCURACY_M = 30; // 정확도가 이보다 나쁘면 GPS 약함
const MAX_SPEED_MPS = 12; // 이보다 빠르면 GPS가 튄 것
const MIN_STEP_M = 2; // 이보다 짧게 움직이면 제자리에서 흔들린 것으로 보고 더하지 않아요
const AUTO_PAUSE_AFTER_MS = 10_000;
const NO_FIX_WEAK_AFTER_MS = 10_000; // 10초 동안 위치가 안 오면 GPS 약함

/**
 * 이번 주 러닝 (러닝 시작 화면 카드, 목표 달성 팝업에 써요)
 * TODO(API): GET /api/runs/weekly 로 바꿔요. 지금은 Figma 예시 값이에요.
 */
export const FAKE_WEEK = {
  doneKm: 8.4,
  goalKm: 15,
  runCount: 4,
  // 월~일 중 달린 날 (Figma 예시: 월, 수)
  ranDays: [true, false, true, false, false, false, false],
};

type RunSession = {
  status: RunStatus;
  startedAt: Date | null;
  elapsedSec: number;
  distanceM: number;
  points: RunPoint[];
  gpsWeak: boolean;
  goal: RunGoal | null; // 바로 러닝이면 null
  goalReachedSec: number | null; // 목표 거리를 처음 넘은 순간까지 달린 시간(초). 아직 못 넘었으면 null
  setGoal: (goal: RunGoal | null) => void;
  course: Course | null; // 코스 러닝이 아니면 null
  setCourse: (course: Course | null) => void;
  start: () => Promise<void>;
  pause: () => void;
  resume: () => void;
  finish: () => void;
  reset: () => void;
};

const RunSessionContext = createContext<RunSession | null>(null);

/** 두 위치 사이의 거리(m). 지구를 반지름 6371km 공으로 보고 계산해요 */
function distanceBetween(a: RunPoint, b: RunPoint) {
  const R = 6_371_000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function RunSessionProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings();

  const [status, setStatus] = useState<RunStatus>('idle');
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [distanceM, setDistanceM] = useState(0);
  const [points, setPoints] = useState<RunPoint[]>([]);
  const [gpsWeak, setGpsWeak] = useState(false);
  const [goal, setGoalState] = useState<RunGoal | null>(null);
  const [goalReachedSec, setGoalReachedSec] = useState<number | null>(null);
  const [course, setCourse] = useState<Course | null>(null); // reset()으로 지우지 않아요 (목표와 같은 이유)
  const [now, setNow] = useState(() => Date.now()); // 1초마다 바뀌어서 화면의 시간을 새로 그려요
  // 화면에 시간을 그릴 때 쓰는 값 (아래 ref와 같은 값을 화면용으로 한 번 더 들고 있어요)
  const [clock, setClock] = useState<{ savedMs: number; segmentStart: number | null }>({
    savedMs: 0,
    segmentStart: null,
  });

  // 화면을 다시 그리지 않아도 되는 값은 ref에 둬요 (GPS 콜백 안에서 최신 값을 읽기 위해서도)
  const statusRef = useRef<RunStatus>('idle');
  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const savedMsRef = useRef(0); // 일시정지 전까지 쌓인 시간
  const segmentStartRef = useRef<number | null>(null); // 이번에 달리기 시작한 시각
  const lastPointRef = useRef<RunPoint | null>(null);
  const lastMoveAtRef = useRef(0);
  const lastFixAtRef = useRef(0);
  const distanceRef = useRef(0); // 지금까지 거리 (GPS 콜백에서 목표 거리를 넘었는지 확인할 때 써요)
  const goalRef = useRef<RunGoal | null>(null);
  const goalReachedRef = useRef(false);

  const changeStatus = (next: RunStatus) => {
    statusRef.current = next;
    setStatus(next);
  };

  // 시간 흐름을 멈춰요: 지금까지 달린 시간을 savedMs에 더해 두기
  const stopClock = () => {
    if (segmentStartRef.current !== null) {
      savedMsRef.current += Date.now() - segmentStartRef.current;
      segmentStartRef.current = null;
    }
    setClock({ savedMs: savedMsRef.current, segmentStart: null });
  };
  const startClock = () => {
    segmentStartRef.current = Date.now();
    setClock({ savedMs: savedMsRef.current, segmentStart: segmentStartRef.current });
  };

  const stopGps = () => {
    watchRef.current?.remove();
    watchRef.current = null;
  };

  // GPS에서 새 위치가 올 때마다 불려요
  const onLocation = (loc: Location.LocationObject) => {
    const at = Date.now();
    lastFixAtRef.current = at;
    const accuracy = loc.coords.accuracy ?? 0;
    const weak = accuracy > WEAK_ACCURACY_M;
    setGpsWeak(weak);

    const current = statusRef.current;
    if (current !== 'running' && current !== 'autoPaused') return; // 직접 멈췄을 때는 거리를 더하지 않아요
    if (weak) return;

    const point: RunPoint = { lat: loc.coords.latitude, lng: loc.coords.longitude, at };
    const prev = lastPointRef.current;
    if (!prev) {
      // 첫 위치: 출발점으로 기억만 해요
      lastPointRef.current = point;
      lastMoveAtRef.current = at;
      setPoints([point]);
      return;
    }

    const step = distanceBetween(prev, point);
    const seconds = Math.max((at - prev.at) / 1000, 1);
    if (step < MIN_STEP_M) return; // 제자리 흔들림
    if (step / seconds > MAX_SPEED_MPS) return; // GPS 튐

    lastPointRef.current = point;
    lastMoveAtRef.current = at;
    distanceRef.current += step;
    setDistanceM(distanceRef.current);
    setPoints((list) => [...list, point]);

    // 목표 거리를 처음 넘은 순간: 그때까지 달린 시간을 기억해요
    const goalM = goalRef.current?.distanceM;
    if (goalM && !goalReachedRef.current && distanceRef.current >= goalM) {
      goalReachedRef.current = true;
      const runningMs = segmentStartRef.current === null ? 0 : at - segmentStartRef.current;
      setGoalReachedSec((savedMsRef.current + runningMs) / 1000);
    }

    // 자동 일시정지 중에 다시 움직이면 이어서 기록해요
    if (current === 'autoPaused') {
      startClock();
      changeStatus('running');
    }
  };

  // 1초마다: 화면 시간 갱신 + 자동 일시정지 · GPS 끊김 확인
  useEffect(() => {
    if (status !== 'running' && status !== 'autoPaused') return;
    const timer = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t - lastFixAtRef.current > NO_FIX_WEAK_AFTER_MS) setGpsWeak(true);
      if (
        settings.autoPause &&
        statusRef.current === 'running' &&
        lastPointRef.current &&
        t - lastMoveAtRef.current > AUTO_PAUSE_AFTER_MS
      ) {
        stopClock();
        changeStatus('autoPaused');
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [status, settings.autoPause]);

  // 러닝 화면들을 완전히 떠나면 GPS를 꺼요
  useEffect(() => () => stopGps(), []);

  const reset = () => {
    stopGps();
    savedMsRef.current = 0;
    segmentStartRef.current = null;
    setClock({ savedMs: 0, segmentStart: null });
    lastPointRef.current = null;
    lastMoveAtRef.current = 0;
    lastFixAtRef.current = 0;
    distanceRef.current = 0;
    goalReachedRef.current = false;
    setGoalReachedSec(null);
    setStartedAt(null);
    setDistanceM(0);
    setPoints([]);
    setGpsWeak(false);
    changeStatus('idle');
  };

  const start = async () => {
    reset();
    const t = Date.now();
    lastFixAtRef.current = t;
    setStartedAt(new Date(t));
    setNow(t);
    startClock();
    changeStatus('running');
    try {
      watchRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 1000, distanceInterval: 0 },
        onLocation,
      );
    } catch {
      // 러닝 도중 폰 위치가 꺼지는 등 GPS를 못 켜면, 앱이 멈추지 않게 "GPS 약함" 안내만 띄워요
      setGpsWeak(true);
    }
  };

  // 목표는 reset()으로 지우지 않아요 (목표를 정한 뒤 start()에서 reset()을 부르기 때문)
  const setGoal = (next: RunGoal | null) => {
    goalRef.current = next;
    setGoalState(next);
  };

  const pause = () => {
    stopClock();
    changeStatus('paused');
  };

  const resume = () => {
    // 멈춰 있던 동안 움직인 거리는 더하지 않도록 출발점을 새로 잡아요
    lastPointRef.current = null;
    startClock();
    setNow(Date.now());
    changeStatus('running');
  };

  const finish = () => {
    stopClock();
    stopGps();
    setNow(Date.now());
    changeStatus('finished');
  };

  // 화면에 보일 시간(초) = 쌓인 시간 + 지금 달리는 중이면 이번에 흐른 시간
  const runningMs = clock.segmentStart === null ? 0 : Math.max(0, now - clock.segmentStart);
  const elapsedSec = (clock.savedMs + runningMs) / 1000;

  return (
    <RunSessionContext
      value={{
        status,
        startedAt,
        elapsedSec,
        distanceM,
        points,
        gpsWeak,
        goal,
        goalReachedSec,
        setGoal,
        course,
        setCourse,
        start,
        pause,
        resume,
        finish,
        reset,
      }}>
      {children}
    </RunSessionContext>
  );
}

export function useRunSession() {
  const session = use(RunSessionContext);
  if (!session) throw new Error('useRunSession은 RunSessionProvider 안에서만 쓸 수 있어요');
  return session;
}
