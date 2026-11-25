/**
 * 러닝 숫자를 화면에 보여 줄 모양으로 바꾸는 함수들
 *
 * 저장은 항상 미터(m) · 초(s) 단위로 하고, 화면에 보일 때만 km/mi, 분:초로 바꿔요.
 * 거리 단위(km/mi)는 설정 → 거리 단위에서 고른 값을 따라요.
 */
const KM_PER_MILE = 1.609344;

export type DistanceUnit = 'km' | 'mi';

/** 미터 → 고른 단위의 거리 숫자 (예: 2120m → "2.12") */
export function formatDistance(meters: number, unit: DistanceUnit) {
  const km = meters / 1000;
  return (unit === 'mi' ? km / KM_PER_MILE : km).toFixed(2);
}

/** 초 → "12:43" (1시간이 넘으면 "1:02:03") */
export function formatDuration(totalSec: number) {
  const sec = Math.floor(totalSec);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/**
 * 평균 페이스 → 6'00" (1km 또는 1mi를 가는 데 걸린 시간)
 * 너무 조금 달렸으면(10m 미만) 숫자가 튀어서 -'--"로 보여 줘요.
 */
export function formatPace(meters: number, totalSec: number, unit: DistanceUnit) {
  if (meters < 10 || totalSec <= 0) return `-'--"`;
  const unitMeters = unit === 'mi' ? KM_PER_MILE * 1000 : 1000;
  const secPerUnit = Math.round(totalSec / (meters / unitMeters));
  if (secPerUnit >= 100 * 60) return `-'--"`; // 100분이 넘는 페이스는 걷기보다 느려서 표시하지 않아요
  const m = Math.floor(secPerUnit / 60);
  const s = String(secPerUnit % 60).padStart(2, '0');
  return `${m}'${s}"`;
}

/**
 * 소모 칼로리 (대략값): 1km 달릴 때마다 몸무게(kg) × 1.036 kcal
 * TODO: 지금은 몸무게를 65kg으로 가정해요. 서버 내 정보(weightKg)를 받으면 그 값으로 바꿔요.
 */
export function estimateCalories(meters: number, weightKg = 65) {
  return Math.round((meters / 1000) * weightKg * 1.036);
}
