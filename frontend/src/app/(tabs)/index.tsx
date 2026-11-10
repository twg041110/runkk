import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';

import { BellIcon, LocateIcon } from '@/components/common/icons';
import { Palette } from '@/constants/theme';

// 예시 값: 나중에 백엔드에서 받아온 기록으로 바꾸면 된다
const WEEKLY_KM = 8.4;
const GOAL_KM = 15;
const WEEK = ['월', '화', '수', '목', '금', '토', '일'];
const RUN_DAYS = ['월', '수'];
const TODAY = '금';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.titleBox}>
          <Text style={styles.title}>런크크</Text>
          <Text style={styles.subtitle}>오늘도 좋은 페이스로 달려볼까요?</Text>
        </View>
        <Pressable style={styles.bellButton} accessibilityRole="button" accessibilityLabel="알림">
          <BellIcon color={Palette.ink} size={20} />
          <View style={styles.badge} />
        </Pressable>
      </View>

      <View style={styles.content}>
        <View style={styles.weekCard}>
          <View style={styles.rowBetween}>
            <Text style={styles.weekLabel}>이번 주 러닝</Text>
            <View style={styles.goalChip}>
              <Text style={styles.goalText}>목표 {GOAL_KM} km</Text>
            </View>
          </View>

          <View style={styles.distanceRow}>
            <Text style={styles.distance}>{WEEKLY_KM}</Text>
            <Text style={styles.distanceGoal}>/ {GOAL_KM} km</Text>
          </View>

          <View style={styles.track}>
            <View style={[styles.trackFill, { width: `${(WEEKLY_KM / GOAL_KM) * 100}%` }]} />
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

        <View style={styles.mapCard}>
          <YeouidoMap />
          <View style={styles.locationChip}>
            <Text style={styles.locationChipText}>내 위치</Text>
          </View>
          <View style={styles.placeCard}>
            <View style={styles.placeText}>
              <Text style={styles.placeName}>여의도한강공원</Text>
              <Text style={styles.placeAddress}>서울 영등포구 여의도동</Text>
            </View>
            <Pressable
              style={styles.locateButton}
              accessibilityRole="button"
              accessibilityLabel="내 위치로 이동">
              <LocateIcon color={Palette.background} size={20} />
            </Pressable>
          </View>
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
    paddingHorizontal: 24,
  },
  titleBox: {
    gap: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.48,
    color: Palette.ink,
  },
  subtitle: {
    fontSize: 14,
    color: Palette.muted,
  },
  bellButton: {
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
    right: 10,
    width: 11,
    height: 11,
    borderRadius: 5.5,
    borderWidth: 2,
    borderColor: Palette.surface,
    backgroundColor: Palette.alert,
  },
  content: {
    flex: 1,
    gap: 14,
    paddingTop: 18,
    paddingHorizontal: 24,
    paddingBottom: 44,
  },
  weekCard: {
    gap: 14,
    paddingTop: 20,
    paddingBottom: 18,
    paddingHorizontal: 20,
    borderRadius: 24,
    backgroundColor: Palette.ink,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weekLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#B8BDC6',
  },
  goalChip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: Palette.accent,
  },
  goalText: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.ink,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  distance: {
    fontSize: 42,
    lineHeight: 42,
    fontWeight: '700',
    letterSpacing: -1.26,
    color: Palette.background,
  },
  distanceGoal: {
    fontSize: 15,
    fontWeight: '500',
    color: '#9AA0AA',
  },
  track: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#2E3137',
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: Palette.accent,
  },
  week: {
    flexDirection: 'row',
    gap: 6,
  },
  day: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  dayDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#2E3137',
  },
  dayDotDone: {
    backgroundColor: Palette.accent,
  },
  dayDotToday: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Palette.accent,
  },
  dayLabel: {
    fontSize: 11,
    color: '#B8BDC6',
  },
  dayLabelToday: {
    fontWeight: '700',
    color: Palette.background,
  },
  mapCard: {
    flex: 1,
    borderRadius: 24,
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
    fontWeight: '600',
    color: Palette.ink,
  },
  placeCard: {
    position: 'absolute',
    left: 11,
    right: 11,
    bottom: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingLeft: 16,
    paddingRight: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
  },
  placeText: {
    gap: 2,
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
  locateButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Palette.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
});