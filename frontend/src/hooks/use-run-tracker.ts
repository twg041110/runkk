import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { RunPoint } from '@/lib/api';
import { toServerDateTime } from '@/lib/format';

// 달리기 측정: 휴대폰 GPS 로 위치를 받아 거리·시간·경로를 잰다.
// - 일시정지 중에는 시간과 거리가 늘지 않는다.
// - GPS 가 크게 튀는 점(정확도가 나쁘거나 사람이 달릴 수 없는 속도)은 거리에 넣지 않는다.

export type GpsState = 'asking' | 'searching' | 'ok' | 'denied' | 'error';

const MAX_ACCURACY_M = 40; // 이보다 오차가 크면 버린다
const MAX_SPEED_MS = 9; // 초속 9m(1km 1분 50초)보다 빠르면 GPS 튐으로 본다
const MIN_STEP_M = 3; // 제자리에서 흔들리는 작은 움직임은 무시

function distanceM(a: RunPoint, b: RunPoint) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function useRunTracker() {
  const [gps, setGps] = useState<GpsState>('asking');
  const [paused, setPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [meters, setMeters] = useState(0);
  const [startedAt] = useState(() => new Date());
  const points = useRef<RunPoint[]>([]);
  const last = useRef<{ point: RunPoint; time: number } | null>(null);
  const pausedRef = useRef(false);

  // 시간: 1초마다 (일시정지 중에는 멈춤)
  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [paused]);

  // 위치: 권한을 받고 계속 받아 온다
  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;
    let cancelled = false;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (cancelled) return;
        if (status !== 'granted') {
          setGps('denied');
          return;
        }
        setGps('searching');
        sub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 2000, distanceInterval: 3 },
          (loc) => {
            const { latitude, longitude, accuracy } = loc.coords;
            if (accuracy != null && accuracy > MAX_ACCURACY_M) return;
            setGps('ok');
            if (pausedRef.current) {
              // 쉬는 동안 움직인 거리는 빼고, 다시 시작하면 그 자리부터 잰다
              last.current = null;
              return;
            }
            const point: RunPoint = { lat: latitude, lng: longitude, recordedAt: toServerDateTime(new Date(loc.timestamp)) };
            const prev = last.current;
            if (prev) {
              const step = distanceM(prev.point, point);
              const dt = Math.max((loc.timestamp - prev.time) / 1000, 0.5);
              if (step < MIN_STEP_M || step / dt > MAX_SPEED_MS) return;
              setMeters((m) => m + step);
            }
            last.current = { point, time: loc.timestamp };
            points.current.push(point);
          },
        );
        if (cancelled) sub.remove();
      } catch {
        if (!cancelled) setGps('error');
      }
    })();
    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, []);

  const togglePause = useCallback(() => {
    setPaused((p) => {
      pausedRef.current = !p;
      return !p;
    });
  }, []);

  const km = meters / 1000;
  return {
    gps,
    paused,
    togglePause,
    seconds,
    km,
    /** 1km 당 초 (200m 이상 달린 뒤부터 계산) */
    paceSec: km >= 0.2 ? Math.round(seconds / km) : null,
    startedAt,
    /** 지금까지 지나온 위치 목록 (저장할 때 부른다) */
    getPoints: () => points.current,
  };
}
