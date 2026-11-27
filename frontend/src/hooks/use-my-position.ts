/**
 * 지금 내 위치 (코스 목록 · 상세의 "내 위치에서 1.2km"에 써요)
 *
 * 위치 권한을 이미 허용했을 때만 위치를 가져와요. 여기서는 권한을 새로 묻지 않아요.
 * (권한은 러닝을 시작할 때 use-location-check에서 물어봐요) 권한이 없으면 null이에요.
 */
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

import { distanceBetween, type LatLng } from '@/utils/geo';

export function useMyPosition() {
  const [position, setPosition] = useState<LatLng | null>(null);

  useEffect(() => {
    let alive = true; // 화면을 떠난 뒤에 위치가 도착하면 무시해요
    (async () => {
      try {
        const { granted } = await Location.getForegroundPermissionsAsync();
        if (!granted) return;
        // 최근에 받은 위치가 있으면 바로 쓰고, 없으면 새로 받아요
        const loc =
          (await Location.getLastKnownPositionAsync()) ??
          (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
        if (alive) setPosition({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      } catch {
        // 폰 위치가 꺼져 있는 등 위치를 못 받으면 거리만 안 보여 줘요
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return position;
}

/** 내 위치 → 출발점 거리 글자 ("내 위치에서 1.2km", 1km 안이면 "내 위치에서 350m"). 위치를 모르면 null */
export function formatFromMe(me: LatLng | null, start: LatLng) {
  if (!me) return null;
  const m = distanceBetween(me, start);
  return m < 1000 ? `내 위치에서 ${Math.round(m / 10) * 10}m` : `내 위치에서 ${(m / 1000).toFixed(1)}km`;
}
