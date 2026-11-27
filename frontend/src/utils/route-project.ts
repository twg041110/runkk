/**
 * 위도·경도 → 그림(SVG) 좌표
 * 웹 러닝 지도(run-map.web.tsx)와 코스 목록의 작은 경로 그림(route-thumb.tsx)이 같이 써요.
 *
 * 가장 넓게 퍼진 방향을 기준으로 한 번에 줄여서 모양이 찌그러지지 않게 하고, 그림 가운데에 놓아요.
 */
import type { LatLng } from '@/utils/geo';

export function projectRoute(points: LatLng[], width: number, height: number, pad: number) {
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  // 경도 1도의 길이는 위도에 따라 짧아져서 cos(위도)를 곱해 가로세로 비율을 맞춰요
  const lngScale = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180);
  const spanX = Math.max((maxLng - minLng) * lngScale, 1e-6);
  const spanY = Math.max(maxLat - minLat, 1e-6);
  const scale = Math.min((width - pad * 2) / spanX, (height - pad * 2) / spanY);
  const offsetX = (width - spanX * scale) / 2;
  const offsetY = (height - spanY * scale) / 2;
  return (p: LatLng) => ({
    x: offsetX + (p.lng - minLng) * lngScale * scale,
    y: offsetY + (maxLat - p.lat) * scale, // 북쪽이 위로 가도록 뒤집어요
  });
}
