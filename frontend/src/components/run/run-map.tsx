/**
 * 러닝 경로 그림 (러닝 중 · 결과 화면 위쪽 카드)
 *
 * 받은 GPS 좌표들을 카드 크기에 맞게 줄여서 선으로 그려요.
 * - 노란 선(검은 테두리): 지나온 길
 * - 흰 점: 출발한 곳, 파란 점: 지금 있는 곳 (live일 때만)
 *
 * TODO: 지금은 진짜 지도 대신 연한 바탕 위에 경로만 그려요.
 *       다음 단계에서 react-native-maps(구글 지도)를 깔고 그 위에 이 경로를 그릴 예정이에요.
 */
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';

import { Palette } from '@/constants/theme';
import type { RunPoint } from '@/hooks/use-run-session';

const W = 320; // 그림 좌표계 크기 (실제 화면 크기에 맞춰 늘어나요)
const H = 220;
const PAD = 28; // 경로가 카드 가장자리에 붙지 않게 두는 여백

/** 위도·경도 → 그림 좌표. 가장 넓게 퍼진 방향을 기준으로 한 번에 줄여서 모양이 찌그러지지 않게 해요 */
function project(points: RunPoint[]) {
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
  const scale = Math.min((W - PAD * 2) / spanX, (H - PAD * 2) / spanY);
  const offsetX = (W - spanX * scale) / 2;
  const offsetY = (H - spanY * scale) / 2;
  return points.map((p) => ({
    x: offsetX + (p.lng - minLng) * lngScale * scale,
    y: offsetY + (maxLat - p.lat) * scale, // 북쪽이 위로 가도록 뒤집어요
  }));
}

export function RunMap({ points, live }: { points: RunPoint[]; live: boolean }) {
  const xy = points.length > 0 ? project(points) : [];
  const line = xy.map((p) => `${p.x},${p.y}`).join(' ');
  const first = xy[0];
  const last = xy[xy.length - 1];

  return (
    <View style={styles.card}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
        {/* 바탕의 옅은 격자 (지도 대신) */}
        {[1, 2, 3].map((i) => (
          <Line key={`h${i}`} x1={0} y1={(H / 4) * i} x2={W} y2={(H / 4) * i} stroke="#E4E7EC" strokeWidth={1} />
        ))}
        {[1, 2, 3, 4, 5].map((i) => (
          <Line key={`v${i}`} x1={(W / 6) * i} y1={0} x2={(W / 6) * i} y2={H} stroke="#E4E7EC" strokeWidth={1} />
        ))}

        {xy.length > 1 && (
          <>
            <Polyline points={line} fill="none" stroke={Palette.ink} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
            <Polyline points={line} fill="none" stroke={Palette.accent} strokeWidth={5.5} strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}
        {first && xy.length > 1 && (
          <Circle cx={first.x} cy={first.y} r={4.5} fill={Palette.surface} stroke={Palette.ink} strokeWidth={2.5} />
        )}
        {last && live && (
          <>
            <Circle cx={last.x} cy={last.y} r={22} fill="#5DD2FF" fillOpacity={0.2} />
            <Circle cx={last.x} cy={last.y} r={10} fill={Palette.surface} />
            <Circle cx={last.x} cy={last.y} r={7} fill="#008FFF" />
          </>
        )}
        {last && !live && xy.length > 1 && <Circle cx={last.x} cy={last.y} r={4.5} fill={Palette.ink} />}
      </Svg>

      {points.length === 0 && (
        <View style={styles.empty} pointerEvents="none">
          <Text style={styles.emptyText}>{live ? '위치를 찾는 중이에요…' : '기록된 경로가 없어요'}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 230,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#EEF0F3',
  },
  empty: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: Palette.hint,
  },
});
