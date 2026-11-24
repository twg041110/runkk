/**
 * 러닝 지도 (러닝 중 · 결과 화면 위쪽 카드) — 폰 전용
 *
 * react-native-maps로 진짜 지도를 띄워요. 안드로이드는 구글 지도, 아이폰은 애플 지도예요.
 * - 노란 선(검은 테두리): 지나온 길
 * - 흰 점: 출발한 곳, 검은 점: 끝난 곳 (결과 화면)
 * - 파란 점: 지금 내 위치 (러닝 중, 지도 기본 기능 showsUserLocation)
 *
 * 러닝 중(live)에는 내 위치가 바뀔 때마다 지도가 따라 움직여요.
 * 결과 화면에서는 달린 경로 전체가 카드 안에 들어오게 맞춰요.
 *
 * 웹은 react-native-maps를 지원하지 않아서 run-map.web.tsx(격자 그림)가 대신 쓰여요.
 * TODO: 앱을 APK · 앱스토어용으로 빌드할 때는 구글 지도 API 키가 필요해요. (Expo Go에서는 필요 없음)
 */
import { useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

import { Palette } from '@/constants/theme';
import type { RunPoint } from '@/hooks/use-run-session';

const SEOUL = { latitude: 37.5665, longitude: 126.978 }; // 위치를 아직 모를 때 처음 보여줄 곳
const ZOOM_DELTA = 0.004; // 처음 보여줄 범위 (위도 0.004도 ≈ 450m)
const FIT_PADDING = { top: 40, right: 40, bottom: 40, left: 40 }; // 경로가 카드 가장자리에 붙지 않게

export function RunMap({ points, live }: { points: RunPoint[]; live: boolean }) {
  const mapRef = useRef<MapView>(null);
  const coords = points.map((p) => ({ latitude: p.lat, longitude: p.lng }));
  const first = coords[0];
  const last = coords[coords.length - 1];

  // 결과 화면: 지도가 준비되면 경로 전체가 보이게 확대/축소해요
  const fitRoute = () => {
    if (live || coords.length < 2) return;
    mapRef.current?.fitToCoordinates(coords, { edgePadding: FIT_PADDING, animated: false });
  };

  return (
    <View style={styles.card}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={{ ...(first ?? SEOUL), latitudeDelta: ZOOM_DELTA, longitudeDelta: ZOOM_DELTA }}
        onMapReady={fitRoute}
        showsUserLocation={live}
        showsMyLocationButton={false}
        // 러닝 중: 내 위치가 바뀔 때마다 지도 가운데를 내 위치로 옮겨요
        onUserLocationChange={
          live
            ? (e) => {
                const c = e.nativeEvent.coordinate;
                if (c) mapRef.current?.animateCamera({ center: { latitude: c.latitude, longitude: c.longitude } }, { duration: 500 });
              }
            : undefined
        }
        toolbarEnabled={false} // 안드로이드에서 마커를 누르면 뜨는 "길찾기" 버튼 숨김
        pitchEnabled={false}
        rotateEnabled={false}
        showsCompass={false}>
        {coords.length > 1 && (
          <>
            {/* 검은 굵은 선 위에 노란 얇은 선을 겹쳐서 테두리처럼 보이게 해요 */}
            <Polyline coordinates={coords} strokeColor={Palette.ink} strokeWidth={8} lineCap="round" lineJoin="round" />
            <Polyline coordinates={coords} strokeColor={Palette.accent} strokeWidth={5} lineCap="round" lineJoin="round" />
          </>
        )}
        {first && coords.length > 1 && (
          <Marker coordinate={first} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.startDot} />
          </Marker>
        )}
        {last && !live && coords.length > 1 && (
          <Marker coordinate={last} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.endDot} />
          </Marker>
        )}
      </MapView>

      {live && points.length === 0 && (
        <View style={styles.findingPill} pointerEvents="none">
          <Text style={styles.findingText}>위치를 찾는 중이에요…</Text>
        </View>
      )}
      {!live && points.length === 0 && (
        <View style={styles.empty} pointerEvents="none">
          <Text style={styles.emptyText}>기록된 경로가 없어요</Text>
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
  startDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 3,
    borderColor: Palette.ink,
    backgroundColor: Palette.surface,
  },
  endDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Palette.ink,
  },
  findingPill: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(28, 30, 34, 0.85)',
  },
  findingText: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.surface,
  },
  empty: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(240, 242, 245, 0.7)',
  },
  emptyText: {
    fontSize: 13,
    color: Palette.muted,
  },
});
