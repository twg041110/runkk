import * as Linking from 'expo-linking';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';

import { BellIcon, LocationOffIcon, ProfileIcon, SunIcon } from '@/components/common/icons';
import { Palette } from '@/constants/theme';

// 예시 값: 나중에 백엔드에서 받아온 기록으로 바꾸면 된다
const WEEKLY_KM = 8.4;
const GOAL_KM = 15;
const BEST_WEEK_KM = 12; // 챌린지: 나의 주간 최고기록
const TEMPERATURE = 15; // 날씨 (예시)
const WEEK = ['월', '화', '수', '목', '금', '토', '일'];
const RUN_DAYS = ['월', '수'];
const TODAY = '금';

// 어두운 카드 안에서 쓰는 색
const DARK_TRACK = '#2E3137'; // 진행 막대 바탕, 안 달린 날
const DARK_TEXT = '#C9CBD1'; // 작은 회색 글자

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const leftKm = Math.max(GOAL_KM - WEEKLY_KM, 0);

  // 위치 권한 확인 (권한을 묻지는 않고, 지금 상태만 봐요)
  const [permission, requestPermission, getPermission] = Location.useForegroundPermissions();
  const locationOff = permission !== null && !permission.granted;

  // 폰 설정에서 권한을 켜고 앱으로 돌아오면 다시 확인해요
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') getPermission();
    });
    return () => sub.remove();
  }, [getPermission]);

  // "설정에서 켜기": 아직 물어볼 수 있으면 권한 창을 띄우고, 이미 거절해서 못 물으면 폰 설정 화면을 열어요
  const turnOnLocation = () => {
    if (permission?.canAskAgain) requestPermission();
    else Linking.openSettings();
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.title}>런크크</Text>
        <View style={styles.headerButtons}>
          <Pressable style={styles.iconButton} accessibilityRole="button" accessibilityLabel="알림">
            <BellIcon color={Palette.ink} size={24} />
            <View style={styles.badge} />
          </Pressable>
          <Pressable
            style={styles.iconButton}
            onPress={() => router.push('/profile')}
            accessibilityRole="button"
            accessibilityLabel="내 정보">
            <ProfileIcon color={Palette.ink} size={24} />
          </Pressable>
        </View>
      </View>

      <View style={styles.content}>
        {/* 이번 주 러닝 요약 */}
        <View style={styles.weekCard}>
          <Text style={styles.weekLabel}>이번 주 러닝</Text>
          <View style={styles.weather}>
            <SunIcon color={Palette.surface} size={28} />
            <Text style={styles.weatherText}>{TEMPERATURE}°C</Text>
          </View>

          <View style={styles.progress}>
            <View style={styles.distanceRow}>
              <View style={styles.distanceValue}>
                <Text style={styles.distance}>
                  {WEEKLY_KM} / {GOAL_KM}
                </Text>
                <Text style={styles.distanceUnit}>km</Text>
              </View>
              <Text style={styles.leftText}>{leftKm.toFixed(1)}km 남았어요</Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.trackFill, { width: `${Math.min(WEEKLY_KM / GOAL_KM, 1) * 100}%` }]} />
            </View>
          </View>

          <View style={styles.week}>
            {WEEK.map((day) => (
              <View key={day} style={styles.day}>
                <View
                  style={[
                    styles.dayDot,
                    RUN_DAYS.includes(day) && styles.dayDotDone,
                    day === TODAY && styles.dayDotToday,
                  ]}
                />
                <Text style={[styles.dayLabel, day === TODAY && styles.dayLabelToday]}>{day}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 챌린지: 이번 주 거리를 나의 주간 최고기록과 비교 */}
        <View style={styles.challenge}>
          <Text style={styles.challengeLabel}>챌린지</Text>
          <View style={styles.challengeTrack}>
            <View style={[styles.trackFill, { width: `${Math.min(WEEKLY_KM / BEST_WEEK_KM, 1) * 100}%` }]} />
          </View>
          <Text style={styles.challengeText}>나의 주간 최고기록 {BEST_WEEK_KM.toFixed(1)}km</Text>
        </View>

        <View style={styles.mapCard}>
          <YeouidoMap />
          {locationOff ? (
            // 위치 권한이 없으면 지도를 흐리게 덮고 안내를 보여 줘요 (Figma: 홈 화면 - 위치 권한 꺼짐)
            <View style={styles.permissionCover}>
              <View style={styles.permissionIcon}>
                <LocationOffIcon color={Palette.muted} size={26} />
              </View>
              <Text style={styles.permissionTitle}>위치 권한이 꺼져 있어요</Text>
              <Text style={styles.permissionText}>{'권한을 켜면 내 위치와 주변 코스를\n지도에서 볼 수 있어요'}</Text>
              <Pressable style={styles.permissionButton} onPress={turnOnLocation} accessibilityRole="button">
                <Text style={styles.permissionButtonText}>설정에서 켜기</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={styles.locationChip}>
                <Text style={styles.locationChipText}>내 위치</Text>
              </View>
              <View style={styles.placeCard}>
                <Text style={styles.placeName}>여의도한강공원</Text>
                <Text style={styles.placeAddress}>서울 영등포구 여의도동</Text>
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

function YeouidoMap() {
  return (
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 320 360"
      preserveAspectRatio="xMidYMid slice"
      style={StyleSheet.absoluteFill}>
      <Path d="M0 95 C 100 85, 220 65, 320 55 L320 135 C 220 145, 100 165, 0 178 Z" fill="#BFD7F2" />
      <Path d="M0 178 C 100 165, 220 145, 320 135 L320 215 C 240 250, 120 285, 0 300 Z" fill="#F3F4F6" />
      <Path d="M0 178 C 100 165, 220 145, 320 135 L320 168 C 220 178, 100 198, 0 212 Z" fill="#CDE8C7" />
      <Path d="M0 300 C 120 285, 240 250, 320 215 L320 231 C 240 266, 120 301, 0 316 Z" fill="#BFD7F2" />
      <Path
        d="M0 252 C 120 237, 220 212, 320 192"
        fill="none"
        stroke="#FFFFFF"
        strokeOpacity={0.9}
        strokeWidth={5}
        strokeLinecap="round"
      />
      <Path
        d="M118 205 L146 292"
        fill="none"
        stroke="#FFFFFF"
        strokeOpacity={0.9}
        strokeWidth={4}
        strokeLinecap="round"
      />
      <Path
        d="M232 185 L252 262"
        fill="none"
        stroke="#FFFFFF"
        strokeOpacity={0.9}
        strokeWidth={4}
        strokeLinecap="round"
      />
      <Path d="M206 152 L196 64" fill="none" stroke="#C3C8D0" strokeWidth={8} strokeLinecap="round" />
      <Path d="M206 152 L196 64" fill="none" stroke="#F8F9FA" strokeWidth={5} strokeLinecap="round" />
      <SvgText x={44} y={138} fill="#3E6690" fontSize={12} fontWeight="600" letterSpacing={6}>
        한강
      </SvgText>
      <SvgText x={214} y={98} fill={Palette.muted} fontSize={10} fontWeight="500">
        마포대교
      </SvgText>
      <SvgText
        x={40}
        y={201}
        fill="#3B6B35"
        fontSize={10}
        fontWeight="600"
        transform="rotate(-6 40 201)">
        여의도한강공원
      </SvgText>
      <Circle cx={190} cy={166} r={28} fill="#5DD2FF" fillOpacity={0.18} />
      <Circle cx={190} cy={166} r={11} fill={Palette.surface} />
      <Circle cx={190} cy={166} r={7.5} fill="#008FFF" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  title: {
    paddingLeft: 3,
    fontSize: 28,
    fontWeight: '900',
    color: Palette.ink,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 9,
    left: 21,
    width: 11,
    height: 11,
    borderRadius: 5.5,
    borderWidth: 2,
    borderColor: Palette.surface,
    backgroundColor: Palette.alert,
  },
  content: {
    flex: 1,
    gap: 10,
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 44,
  },
  weekCard: {
    gap: 16,
    paddingTop: 18,
    paddingBottom: 16,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: Palette.ink,
  },
  weekLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Palette.surface,
  },
  // 날씨는 카드 오른쪽 위에 붙여요 (아래 줄 배치에 영향 없게)
  weather: {
    position: 'absolute',
    top: 18,
    right: 18,
    alignItems: 'center',
    gap: 2,
  },
  weatherText: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.surface,
  },
  progress: {
    gap: 10,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  distanceValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  distance: {
    fontSize: 32,
    fontWeight: '700',
    color: Palette.surface,
  },
  distanceUnit: {
    fontSize: 15,
    fontWeight: '700',
    color: Palette.surface,
  },
  leftText: {
    fontSize: 13,
    fontWeight: '500',
    color: DARK_TEXT,
  },
  track: {
    height: 10,
    borderRadius: 999,
    backgroundColor: DARK_TRACK,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: Palette.accent,
  },
  week: {
    flexDirection: 'row',
    gap: 4,
  },
  day: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  dayDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: DARK_TRACK,
  },
  dayDotDone: {
    backgroundColor: Palette.accent,
  },
  dayDotToday: {
    backgroundColor: Palette.surface,
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: DARK_TEXT,
  },
  dayLabelToday: {
    fontWeight: '700',
    color: Palette.surface,
  },
  challenge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: Palette.ink,
  },
  challengeLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Palette.surface,
  },
  challengeTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: DARK_TRACK,
    overflow: 'hidden',
  },
  challengeText: {
    fontSize: 12,
    fontWeight: '500',
    color: DARK_TEXT,
  },
  mapCard: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: '#ECEEF1',
    overflow: 'hidden',
  },
  locationChip: {
    position: 'absolute',
    top: 13,
    left: 13,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
  },
  locationChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.ink,
  },
  placeCard: {
    position: 'absolute',
    left: 11,
    right: 11,
    bottom: 11,
    gap: 2,
    paddingVertical: 10,
    paddingLeft: 16,
    paddingRight: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
  },
  placeName: {
    fontSize: 15,
    fontWeight: '700',
    color: Palette.ink,
  },
  placeAddress: {
    fontSize: 12,
    color: Palette.muted,
  },
  permissionCover: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(236, 238, 241, 0.9)',
  },
  permissionIcon: {
    width: 56,
    height: 56,
    marginBottom: 2,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.ink,
  },
  permissionText: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    color: Palette.muted,
  },
  permissionButton: {
    marginTop: 4,
    paddingVertical: 11,
    paddingHorizontal: 20,
    borderRadius: 999,
    backgroundColor: Palette.ink,
  },
  permissionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Palette.surface,
  },
});
