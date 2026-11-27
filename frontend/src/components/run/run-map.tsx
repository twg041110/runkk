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
 * 코스 러닝(course가 있을 때): 지나온 길 대신 코스를 그려요.
 * - 회색 선: 아직 안 달린 코스, 노란 선: 달린 만큼(doneM)의 코스
 * - 코스 상세 화면(아직 안 달림)에서는 출발점 옆에 "출발" 글자를 띄우고, 코스 전체가 보이게 맞춰요.
 *
 * 웹은 react-native-maps를 지원하지 않아서 run-map.web.tsx(격자 그림)가 대신 쓰여요.
 * TODO: 앱을 APK · 앱스토어용으로 빌드할 때는 구글 지도 API 키가 필요해요. (Expo Go에서는 필요 없음)
 */
import { useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

import { Palette } from '@/constants/theme';
import type { RunPoint } from '@/hooks/use-run-session';
import { routeLength, splitRoute, type LatLng } from '@/utils/geo';

const SEOUL = { latitude: 37.5665, longitude: 126.978 }; // 위치를 아직 모를 때 처음 보여줄 곳
const ZOOM_DELTA = 0.004; // 처음 보여줄 범위 (위도 0.004도 ≈ 450m)
const FIT_PADDING = { top: 40, right: 40, bottom: 40, left: 40 }; // 경로가 카드 가장자리에 붙지 않게
const COURSE_GRAY = '#A3A8B0'; // 아직 안 달린 코스

type Props = { points: RunPoint[]; live: boolean; course?: { route: LatLng[]; doneM: number } };

const toCoord = (p: LatLng) => ({ latitude: p.lat, longitude: p.lng });

export function RunMap({ points, live, course }: Props) {
  const mapRef = useRef<MapView>(null);
  const coords = points.map(toCoord);
  const first = coords[0];
  const last = coords[coords.length - 1];

  // 코스 러닝: 코스를 달린 부분(노랑)과 남은 부분(회색)으로 나눠요
  const split = course ? splitRoute(course.route, course.doneM) : null;
  const notStarted = course !== undefined && course.doneM <= 0;
  const finishedCourse = course !== undefined && course.doneM >= routeLength(course.route);
  const courseStart = course ? toCoord(course.route[0]) : null;
  const yellow = split ? (notStarted ? [] : split.done.map(toCoord)) : coords;

  // 결과 · 코스 상세 화면: 지도가 준비되면 경로(코스) 전체가 보이게 확대/축소해요
  const fitRoute = () => {
    const all = [...(course?.route.map(toCoord) ?? []), ...coords];
    if (live || all.length < 2) return;
    mapRef.current?.fitToCoordinates(all, { edgePadding: FIT_PADDING, animated: false });
  };

  return (
    <View style={styles.card}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={{ ...(first ?? courseStart ?? SEOUL), latitudeDelta: ZOOM_DELTA, longitudeDelta: ZOOM_DELTA }}
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
        {split && split.rest.length > 1 && (
          <Polyline coordinates={split.rest.map(toCoord)} strokeColor={COURSE_GRAY} strokeWidth={5} lineCap="round" lineJoin="round" />
        )}
        {yellow.length > 1 && (
          <>
            {/* 검은 굵은 선 위에 노란 얇은 선을 겹쳐서 테두리처럼 보이게 해요 */}
            <Polyline coordinates={yellow} strokeColor={Palette.ink} strokeWidth={8} lineCap="round" lineJoin="round" />
            <Polyline coordinates={yellow} strokeColor={Palette.accent} strokeWidth={5} lineCap="round" lineJoin="round" />
          </>
        )}
        {courseStart ? (
          // 코스 출발점. 아직 안 달린 코스 상세 화면에서는 "출발" 글자표를 붙여요
          <Marker coordinate={courseStart} anchor={notStarted && !live ? { x: 0.85, y: 0.5 } : { x: 0.5, y: 0.5 }}>
            <View style={styles.startRow}>
              {notStarted && !live && <Text style={styles.startTag}>출발</Text>}
              <View style={styles.startDot} />
            </View>
          </Marker>
        ) : (
          first &&
          coords.length > 1 && (
            <Marker coordinate={first} anchor={{ x: 0.5, y: 0.5 }}>
              <View style={styles.startDot} />
            </Marker>
          )
        )}
        {!live && split && !notStarted && !finishedCourse && (
          // 코스를 다 못 달렸으면 멈춘 곳
          <Marker coordinate={toCoord(split.at)} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.endDot} />
          </Marker>
        )}
        {!course && last && !live && coords.length > 1 && (
          <Marker coordinate={last} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.endDot} />
          </Marker>
        )}
      </MapView>

      {live && !course && points.length === 0 && (
        <View style={styles.findingPill} pointerEvents="none">
          <Text style={styles.findingText}>위치를 찾는 중이에요…</Text>
        </View>
      )}
      {!live && !course && points.length === 0 && (
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
  startRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  startTag: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 999,
    overflow: 'hidden',
    fontSize: 11,
    fontWeight: '700',
    color: Palette.ink,
    backgroundColor: Palette.accent,
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
