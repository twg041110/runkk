/**
 * 코스 목록 카드 왼쪽의 작은 경로 그림 (Figma: 코스 정하기)
 * 검은 선이 코스 모양이고, 검은 점이 출발점이에요.
 */
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';

import { Palette } from '@/constants/theme';
import type { LatLng } from '@/utils/geo';
import { projectRoute } from '@/utils/route-project';

const SIZE = 64;

export function RouteThumb({ route }: { route: LatLng[] }) {
  const toXY = projectRoute(route, SIZE, SIZE, 12);
  const xy = route.map(toXY);
  return (
    <View style={styles.box}>
      <Svg width={SIZE} height={SIZE}>
        <Polyline
          points={xy.map((p) => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke={Palette.ink}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle cx={xy[0].x} cy={xy[0].y} r={4} fill={Palette.ink} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: SIZE,
    height: SIZE,
    borderRadius: 14,
    backgroundColor: '#ECEEF1',
  },
});
