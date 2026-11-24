import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect, Text as SvgText } from 'react-native-svg';

import type { MapShape } from '@/lib/courses';

// 코스 썸네일 지도 (피그마 'map' 그림을 따라 그린 것).
// 실제 지도 연동 전까지 쓰는 그림이며, shape 에 따라 경로 모양만 바뀐다.

const ROUTES: Record<MapShape, { d: string; start: [number, number]; end?: [number, number] }> = {
  loop: {
    d: 'M18 64 C 18 44, 46 30, 70 30 C 88 30, 94 40, 92 50 C 90 62, 66 72, 44 72 C 28 72, 18 70, 18 64 Z',
    start: [18, 64],
  },
  line: { d: 'M14 70 L 84 40', start: [14, 70], end: [84, 40] },
  river: { d: 'M12 58 C 30 48, 48 62, 66 50 S 88 36, 92 34', start: [12, 58], end: [92, 34] },
  wave: { d: 'M14 74 C 26 54, 38 70, 50 50 S 74 40, 86 24', start: [14, 74], end: [86, 24] },
};

export function CourseMap({
  shape,
  size = 84,
  width,
  height,
  label,
  checkpoints,
}: {
  shape: MapShape;
  size?: number;
  width?: number | `${number}%`;
  height?: number;
  label?: string;
  checkpoints?: boolean;
}) {
  const route = ROUTES[shape];
  const w = width ?? size;
  const h = height ?? size;
  const big = height !== undefined && height > 120;
  return (
    <View style={[styles.box, { width: w, height: h, borderRadius: big ? 20 : 14 }]}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        <Rect x={0} y={0} width={100} height={100} fill="#F3F4F6" />
        <Path d="M0 0 H100 V34 C 70 40, 30 44, 0 46 Z" fill="#BFD7F2" />
        <Path d="M0 46 C 30 44, 70 40, 100 34 V46 C 70 52, 30 56, 0 58 Z" fill="#CDE8C7" />
        <Path d="M0 90 C 40 82, 70 78, 100 72 V100 H0 Z" fill="#BFD7F2" />
        <Path d="M0 80 C 36 72, 66 66, 100 58" stroke="#FFFFFF" strokeWidth={4} fill="none" />
        <Path d="M60 0 L 68 34" stroke="#FFFFFF" strokeWidth={3.5} fill="none" />
        <Path d="M40 60 L 48 100" stroke="#FFFFFF" strokeWidth={3} fill="none" />
        <Path d={route.d} stroke="#1E1F22" strokeWidth={big ? 5 : 6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <Path d={route.d} stroke="#EEFF4A" strokeWidth={big ? 3 : 3.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {checkpoints ? (
          <>
            <Checkpoint x={62} y={30} n={1} />
            <Checkpoint x={91} y={50} n={2} />
            <Checkpoint x={46} y={72} n={3} />
          </>
        ) : null}
        <Circle cx={route.start[0]} cy={route.start[1]} r={big ? 3 : 4} fill="#FFFFFF" stroke="#1E1F22" strokeWidth={1.6} />
        {route.end ? <Circle cx={route.end[0]} cy={route.end[1]} r={big ? 3 : 4} fill="#1E1F22" /> : null}
      </Svg>
      {label ? (
        <View style={styles.label}>
          <Text style={styles.labelText}>{label}</Text>
        </View>
      ) : null}
    </View>
  );
}

/** 코스 상세 지도의 번호 표시 (1, 2, 3 구간 지점) */
function Checkpoint({ x, y, n }: { x: number; y: number; n: number }) {
  return (
    <>
      <Circle cx={x} cy={y} r={4.6} fill="#FFFFFF" stroke="#1E1F22" strokeWidth={1.2} />
      <SvgText x={x} y={y + 1.9} fontSize={5.2} fontWeight="700" fill="#1E1F22" textAnchor="middle">
        {n}
      </SvgText>
    </>
  );
}

const styles = StyleSheet.create({
  box: { overflow: 'hidden', backgroundColor: '#F3F4F6' },
  label: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  labelText: { fontSize: 11, fontWeight: '700', color: '#1E1F22' },
});
