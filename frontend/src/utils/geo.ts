/**
 * 위치(위도 · 경도) 계산 모음 — 코스 러닝에서 써요
 *
 * - distanceBetween: 두 위치 사이 거리(m)
 * - routeLength: 경로 전체 길이(m)
 * - splitRoute: 경로를 "처음부터 몇 m까지(달린 부분)"와 "나머지"로 나눠요 (지도에서 노란 선 / 회색 선)
 * - distanceToRoute: 지금 위치가 경로에서 몇 m 떨어져 있는지 (코스 이탈 안내)
 */
export type LatLng = { lat: number; lng: number };

const EARTH_R = 6_371_000;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** 두 위치 사이 거리(m). 지구를 반지름 6371km 공으로 보고 계산해요 (하버사인 공식) */
export function distanceBetween(a: LatLng, b: LatLng) {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_R * Math.asin(Math.sqrt(h));
}

/** 경로 전체 길이(m) = 이웃한 점 사이 거리를 모두 더한 값 */
export function routeLength(route: LatLng[]) {
  let sum = 0;
  for (let i = 1; i < route.length; i++) sum += distanceBetween(route[i - 1], route[i]);
  return sum;
}

/**
 * 경로를 처음부터 doneM 미터 지점에서 둘로 나눠요.
 * done: 출발점 ~ 나눈 지점, rest: 나눈 지점 ~ 끝, at: 나눈 지점 (두 선이 이어지도록 양쪽에 다 들어가요)
 */
export function splitRoute(route: LatLng[], doneM: number) {
  let walked = 0;
  for (let i = 1; i < route.length; i++) {
    const step = distanceBetween(route[i - 1], route[i]);
    if (walked + step >= doneM) {
      // 이 구간 안에서 남은 만큼만 가요 (짧은 구간이라 직선으로 나눠도 충분해요)
      const t = step === 0 ? 0 : Math.max(0, doneM - walked) / step;
      const a = route[i - 1];
      const b = route[i];
      const at = { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t };
      return { done: [...route.slice(0, i), at], rest: [at, ...route.slice(i)], at };
    }
    walked += step;
  }
  const end = route[route.length - 1];
  return { done: route, rest: [end], at: end };
}

/**
 * 지금 위치가 경로(선)에서 가장 가까운 곳까지 몇 m인지.
 * 가까운 거리만 보면 되니까, 지금 위치 근처를 평평한 종이로 보고 각 구간(선분)까지의 거리를 재요.
 */
export function distanceToRoute(point: LatLng, route: LatLng[]) {
  const mPerLat = (Math.PI / 180) * EARTH_R; // 위도 1도 ≈ 111km
  const mPerLng = mPerLat * Math.cos(toRad(point.lat)); // 경도 1도는 위도가 높을수록 짧아져요
  const xy = (p: LatLng) => ({ x: (p.lng - point.lng) * mPerLng, y: (p.lat - point.lat) * mPerLat });

  let best = Infinity;
  for (let i = 1; i < route.length; i++) {
    const a = xy(route[i - 1]);
    const b = xy(route[i]);
    // 지금 위치(원점)에서 선분 a-b에 내린 가장 가까운 점
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len2 = dx * dx + dy * dy;
    const t = len2 === 0 ? 0 : Math.min(1, Math.max(0, -(a.x * dx + a.y * dy) / len2));
    best = Math.min(best, Math.hypot(a.x + dx * t, a.y + dy * t));
  }
  return best;
}
