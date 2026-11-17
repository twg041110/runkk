import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path, Rect, Text as SvgText } from 'react-native-svg';

import { Palette } from '@/constants/theme';

/**
 * 함께 달리기 지도 (피그마 그림을 따라 그린 것).
 * progress 0~1: 경로 위에서 나와 친구가 얼마나 왔는지.
 */
export function LiveMap({
  height = 150,
  me,
  friend,
  friendLetter,
}: {
  height?: number;
  me: number;
  friend: number;
  friendLetter: string;
}) {
  // 경로: 왼쪽 아래 → 오른쪽 위 곡선
  const point = (t: number) => {
    const x = 20 + 260 * t;
    const y = 110 - 90 * t + Math.sin(t * Math.PI) * 18;
    return { x, y };
  };
  const path = Array.from({ length: 41 }, (_, i) => point(i / 40));
  const d = path.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const meP = point(Math.min(me, 1));
  const frP = point(Math.min(friend, 1));
  const done = path.filter((_, i) => i / 40 <= Math.max(me, friend));
  const dDone = done.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

  return (
    <View style={[styles.box, { height }]}>
      <Svg width="100%" height="100%" viewBox="0 0 300 130" preserveAspectRatio="xMidYMid slice">
        <Rect x={0} y={0} width={300} height={130} fill="#F3F4F6" />
        <Path d="M0 0 H300 V40 C 200 48, 100 54, 0 58 Z" fill="#BFD7F2" />
        <Path d="M0 58 C 100 54, 200 48, 300 40 V54 C 200 62, 100 68, 0 72 Z" fill="#CDE8C7" />
        <Path d="M0 104 C 100 96, 200 90, 300 82" stroke="#FFFFFF" strokeWidth={8} fill="none" />
        <Path d="M180 0 L 196 56" stroke="#FFFFFF" strokeWidth={6} fill="none" />
        <Path d={d} stroke="#C9CBD1" strokeWidth={5} fill="none" strokeLinecap="round" />
        <Path d={dDone} stroke={Palette.ink} strokeWidth={7} fill="none" strokeLinecap="round" />
        <Path d={dDone} stroke="#FF8A3D" strokeWidth={4} fill="none" strokeLinecap="round" />
        <Circle cx={meP.x} cy={meP.y} r={8} fill={Palette.accent} stroke={Palette.ink} strokeWidth={2} />
        <Circle cx={frP.x} cy={frP.y} r={11} fill="#F6D9B8" stroke={Palette.ink} strokeWidth={2} />
        <SvgText x={frP.x} y={frP.y + 4} fontSize={11} fontWeight="700" fill={Palette.ink} textAnchor="middle">
          {friendLetter}
        </SvgText>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: 20, overflow: 'hidden', backgroundColor: '#F3F4F6' },
});
