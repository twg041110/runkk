/**
 * 러닝 시작 (Figma: 러닝 시작, 러닝 시작 - 위치 권한 필요)
 *
 * - 위쪽 카드: 이번 주 러닝 (지금은 예시 값, TODO(API): GET /api/runs/weekly)
 * - 바로 러닝: 위치 권한 + 폰 위치(GPS) 켜짐을 확인하고(use-location-check) → 카운트다운으로 가요.
 * - 목표 정하고 달리기: 목표 정하기 화면(/run/goal)으로 가요.
 * - 코스 정하기: 코스 목록 화면(/run/course)으로 가요.
 * - 홈 가운데 버튼으로 열면 버튼의 검은 원 자리(rx, ry)에서부터 원이 커지고, 그다음 내용이 위에서부터 차례로 나타나요
 *   (CircleReveal · RevealItem). 원이 바탕이 되므로 이 화면 바탕은 투명해요.
 */
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChevronRightIcon, CloseIcon, PlayIcon } from '@/components/common/icons';
import { CircleReveal, RevealItem } from '@/components/run/circle-reveal';
import { Palette } from '@/constants/theme';
import { useLocationCheck } from '@/hooks/use-location-check';
import { FAKE_WEEK, useRunSession } from '@/hooks/use-run-session';

const DAYS = ['월', '화', '수', '목', '금', '토', '일'];

export default function RunStartScreen() {
  const insets = useSafeAreaInsets();
  const { setGoal, setCourse } = useRunSession();
  // 홈 버튼의 검은 원 가운데 위치 (홈 버튼으로 열었을 때만 있어요)
  const { rx, ry } = useLocalSearchParams<{ rx?: string; ry?: string }>();
  const origin = rx && ry ? { x: Number(rx), y: Number(ry) } : null;
  const reveal = origin !== null; // 원 효과로 열렸으면 내용이 차례로 나타나요
  // 바로 러닝: 목표 없이(null) 시작해요
  const { check: startQuickRun, dialogs } = useLocationCheck(() => {
    setGoal(null);
    setCourse(null);
    router.push('/run/countdown');
  });

  return (
    <CircleReveal origin={origin}>
      <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
          <RevealItem index={0} active={reveal}>
            {/* 홈 위에 펼쳐지는 화면이라 "뒤로" 대신 "닫기"(X)로 둬요. 누르면 홈으로 돌아가요 */}
            <Pressable style={styles.back} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="닫기">
              <CloseIcon color={Palette.ink} size={22} />
            </Pressable>
          </RevealItem>

          <RevealItem index={0} active={reveal}>
            <View style={styles.titleBox}>
              <Text style={styles.title}>어떻게 달릴까요?</Text>
              <Text style={styles.subtitle}>오늘의 러닝 방식을 골라주세요</Text>
            </View>
          </RevealItem>

          <RevealItem index={1} active={reveal}>
            <WeekCard />
          </RevealItem>

          <View style={styles.options}>
            <RevealItem index={2} active={reveal}>
              <OptionCard title="바로 러닝" description="코스 없이 원하는 만큼 달려요" play onPress={startQuickRun} />
            </RevealItem>
            <RevealItem index={3} active={reveal}>
              <OptionCard
                title="목표 정하고 달리기"
                description="거리나 시간 목표를 정해서 달려요"
                onPress={() => router.push('/run/goal')}
              />
            </RevealItem>
            <RevealItem index={4} active={reveal}>
              <OptionCard
                title="코스 정하기"
                description="추천 코스를 따라 달려요"
                onPress={() => router.push('/run/course')}
              />
            </RevealItem>
          </View>
        </ScrollView>

        {dialogs}
      </View>
    </CircleReveal>
  );
}

/** 이번 주 러닝 카드 (어두운 카드) */
function WeekCard() {
  const { doneKm, goalKm, ranDays } = FAKE_WEEK;
  const leftKm = Math.max(goalKm - doneKm, 0);
  const today = (new Date().getDay() + 6) % 7; // 월요일 = 0
  const daysLeft = 7 - today; // 오늘 포함 남은 날
  const perDay = leftKm / daysLeft;

  return (
    <View style={styles.weekCard}>
      <Text style={styles.weekLabel}>이번 주 러닝</Text>
      <View style={styles.weekRow}>
        <Text style={styles.weekValue}>
          {doneKm} / {goalKm}
          <Text style={styles.weekUnit}> km</Text>
        </Text>
        <Text style={styles.weekLeft}>{leftKm.toFixed(1)}km 남았어요</Text>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.min(doneKm / goalKm, 1) * 100}%` }]} />
      </View>

      <View style={styles.days}>
        {DAYS.map((day, i) => (
          <View key={day} style={styles.day}>
            <View style={[styles.dayDot, ranDays[i] && styles.dayDotDone, i === today && !ranDays[i] && styles.dayDotToday]} />
            <Text style={[styles.dayLabel, i === today && styles.dayLabelToday]}>{day}</Text>
          </View>
        ))}
      </View>

      {leftKm > 0 && (
        <View style={styles.recommend}>
          <Text style={styles.recommendTag}>오늘 추천</Text>
          <Text style={styles.recommendText}>
            <Text style={styles.recommendStrong}>하루 {perDay.toFixed(1)}km씩</Text> {daysLeft}일이면 목표 달성
          </Text>
        </View>
      )}
    </View>
  );
}

function OptionCard({
  title,
  description,
  play,
  onPress,
}: {
  title: string;
  description: string;
  play?: boolean; // 바로 러닝만 ▶ 아이콘
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.option} onPress={onPress} accessibilityRole="button">
      <View style={styles.optionTexts}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionDescription}>{description}</Text>
      </View>
      <View style={styles.optionIcon}>
        {play ? <PlayIcon color={Palette.ink} size={16} /> : <ChevronRightIcon color={Palette.ink} size={18} />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // 바탕색은 CircleReveal이 칠해요 (원 효과일 때는 커지는 원이 바탕)
  screen: {
    flex: 1,
  },
  content: {
    gap: 20,
    paddingHorizontal: 24,
  },
  back: {
    width: 40,
    height: 40,
    marginLeft: -8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBox: {
    gap: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.6,
    color: Palette.ink,
  },
  subtitle: {
    fontSize: 14,
    color: Palette.muted,
  },
  weekCard: {
    gap: 14,
    padding: 20,
    borderRadius: 20,
    backgroundColor: Palette.ink,
  },
  weekLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#C9CBD1',
  },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  weekValue: {
    fontSize: 30,
    fontWeight: '800',
    color: Palette.surface,
  },
  weekUnit: {
    fontSize: 16,
    fontWeight: '600',
  },
  weekLeft: {
    marginBottom: 4,
    fontSize: 13,
    color: '#C9CBD1',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3A3D44',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: Palette.accent,
  },
  days: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  day: {
    alignItems: 'center',
    gap: 6,
  },
  dayDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#3A3D44',
  },
  dayDotDone: {
    backgroundColor: Palette.accent,
  },
  dayDotToday: {
    backgroundColor: Palette.surface,
  },
  dayLabel: {
    fontSize: 11,
    color: '#9AA0AA',
  },
  dayLabelToday: {
    fontWeight: '700',
    color: Palette.surface,
  },
  recommend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#3A3D44',
  },
  recommendTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: 'hidden',
    fontSize: 11,
    fontWeight: '700',
    color: Palette.surface,
    backgroundColor: '#008FFF',
  },
  recommendText: {
    fontSize: 13,
    color: '#C9CBD1',
  },
  recommendStrong: {
    fontWeight: '700',
    color: Palette.surface,
  },
  options: {
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
  },
  optionTexts: {
    flex: 1,
    gap: 4,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Palette.ink,
  },
  optionDescription: {
    fontSize: 13,
    color: Palette.muted,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E9EBF0',
  },
});
