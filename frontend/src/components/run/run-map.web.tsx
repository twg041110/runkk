/**
 * 러닝 경로 그림 (러닝 중 · 결과 화면 위쪽 카드)
 *
 * 받은 GPS 좌표들을 카드 크기에 맞게 줄여서 선으로 그려요.
 * - 노란 선(검은 테두리): 지나온 길
 * - 흰 점: 출발한 곳, 파란 점: 지금 있는 곳 (live일 때만)
 *
 * 코스 러닝(course가 있을 때): 지나온 길 대신 코스를 그려요.
 * - 회색 선: 아직 안 달린 코스, 노란 선: 달린 만큼(doneM)의 코스
 * - 코스 상세 화면(아직 안 달림)에서는 출발점 옆에 "출발" 글자를 띄워요.
 *
 * 웹 전용 파일이에요. react-native-maps가 웹을 지원하지 않아서, 웹에서는 진짜 지도 대신
 * 연한 격자 바탕 위에 경로만 그려요. (폰에서는 run-map.tsx의 진짜 지도가 쓰여요)
 */
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Rect, Text as SvgText } from 'react-native-svg';

import { Palette } from '@/constants/theme';
import type { RunPoint } from '@/hooks/use-run-session';
import { routeLength, splitRoute, type LatLng } from '@/utils/geo';
import { projectRoute } from '@/utils/route-project';

const W = 320; // 그림 좌표계 크기 (실제 화면 크기에 맞춰 늘어나요)
const H = 220;
const PAD = 28; // 경로가 카드 가장자리에 붙지 않게 두는 여백
const COURSE_GRAY = '#A3A8B0'; // 아직 안 달린 코스

type Props = { points: RunPoint[]; live: boolean; course?: { route: LatLng[]; doneM: number } };

const toLine = (xy: { x: number; y: number }[]) => xy.map((p) => `${p.x},${p.y}`).join(' ');

export function RunMap({ points, live, course }: Props) {
  // 코스와 내 위치가 모두 그림 안에 들어오도록 함께 맞춰요
  const all: LatLng[] = [...(course?.route ?? []), ...points];
  const toXY = all.length > 0 ? projectRoute(all, W, H, PAD) : null;

  const split = course ? splitRoute(course.route, course.doneM) : null;
  const notStarted = course !== undefined && course.doneM <= 0;
  const finishedCourse = course !== undefined && course.doneM >= routeLength(course.route);

  // 코스 러닝이면 코스를, 아니면 지나온 길을 노란 선으로 그려요
  const yellow = toXY ? (split ? (notStarted ? [] : split.done) : points).map(toXY) : [];
  const gray = toXY && split ? split.rest.map(toXY) : [];
  const start = toXY ? (course ? toXY(course.route[0]) : points[0] && toXY(points[0])) : null;
  const me = live && toXY && points.length > 0 ? toXY(points[points.length - 1]) : null;
  // 끝난 곳 (결과 화면): 코스를 다 못 달렸으면 멈춘 곳, 바로 러닝이면 마지막 위치
  const end = live || !toXY ? null : split ? (notStarted || finishedCourse ? null : toXY(split.at)) : points.length > 1 ? toXY(points[points.length - 1]) : null;

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

        {gray.length > 1 && (
          <Polyline points={toLine(gray)} fill="none" stroke={COURSE_GRAY} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
        )}
        {yellow.length > 1 && (
          <>
            <Polyline points={toLine(yellow)} fill="none" stroke={Palette.ink} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
            <Polyline points={toLine(yellow)} fill="none" stroke={Palette.accent} strokeWidth={5.5} strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}
        {start && (course || points.length > 1) && (
          <Circle cx={start.x} cy={start.y} r={4.5} fill={Palette.surface} stroke={Palette.ink} strokeWidth={2.5} />
        )}
        {start && notStarted && !live && (
          // "출발" 글자표 (출발점 왼쪽 위)
          <>
            <Rect x={start.x - 40} y={start.y - 24} width={34} height={18} rx={9} fill={Palette.accent} />
            <SvgText x={start.x - 23} y={start.y - 11.5} fontSize={10} fontWeight="700" fill={Palette.ink} textAnchor="middle">
              출발
            </SvgText>
          </>
        )}
        {me && (
          <>
            <Circle cx={me.x} cy={me.y} r={22} fill="#5DD2FF" fillOpacity={0.2} />
            <Circle cx={me.x} cy={me.y} r={10} fill={Palette.surface} />
            <Circle cx={me.x} cy={me.y} r={7} fill="#008FFF" />
          </>
        )}
        {end && <Circle cx={end.x} cy={end.y} r={4.5} fill={Palette.ink} />}
      </Svg>

      {!course && points.length === 0 && (
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
