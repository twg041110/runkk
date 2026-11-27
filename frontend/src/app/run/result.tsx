/**
 * 러닝 결과 (Figma: 러닝 결과, 러닝 결과 - 이번 주 목표 달성)
 *
 * - 지나온 경로, 날짜, 거리 · 시간 · 페이스 · 칼로리를 보여줘요.
 * - 공유하기: 폰의 공유 창(카카오톡, 메시지 등)을 열어요.
 * - 완료: 기록을 비우고 홈으로 가요.
 * - 이번 러닝으로 이번 주 목표를 넘기면 "이번 주 목표 달성!" 팝업이 떠요.
 * - 목표 러닝이면 (Figma: 목표 정하고 달리기 - 러닝 결과 성공/실패/중간 종료)
 *   "목표 달성 / 목표 미달성" 배지, 결과 제목(예: "5km 30분 도전 성공!"), 큰 기록 옆에 달성률이나
 *   "12초 빨라요 / 14초 늦었어요"를 보여 줘요. 계산은 utils/run-goal.ts에 있어요.
 *
 * - 코스 러닝이면 (Figma: 코스 정하기 - 러닝 결과 성공/실패/중간 종료) 지도에 코스를 그리고,
 *   "여의도 한바퀴 완주!" 또는 "코스 미완주"와 몇 % 완주했는지 보여 줘요. (utils/run-goal.ts의 getCourseResult)
 *
 * TODO(API): 완료를 누를 때 POST /api/runs 로 기록을 저장해요. (지금은 저장하지 않아요)
 * TODO(API): 이번 주 기록은 FAKE_WEEK(예시 값) 대신 GET /api/runs/weekly 로 받아요.
 */
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { BackHandler, Modal, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CheckIcon, ShareIcon, TrophyIcon } from '@/components/common/icons';
import { Toast } from '@/components/common/toast';
import { RunMap } from '@/components/run/run-map';
import { RunStats } from '@/components/run/run-stats';
import { Palette } from '@/constants/theme';
import { FAKE_WEEK, useRunSession } from '@/hooks/use-run-session';
import { useSettings } from '@/hooks/use-settings';
import { formatDistance, formatDuration, formatGoalLabel } from '@/utils/run-format';
import { getCourseResult, getGoalResult } from '@/utils/run-goal';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/** 2026년 10월 2일 (금) 오전 7:12 */
function formatRunDate(date: Date) {
  const h = date.getHours();
  const ampm = h < 12 ? '오전' : '오후';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${WEEKDAYS[date.getDay()]}) ${ampm} ${h12}:${mm}`;
}

export default function RunResultScreen() {
  const insets = useSafeAreaInsets();
  const { startedAt, elapsedSec, distanceM, points, goal, goalReachedSec, course, reset } = useRunSession();
  // 목표 · 코스 러닝 결과 (바로 러닝이면 null). badge: 제목 위 작은 배지 글자 (없으면 안 보여요)
  const run = { distanceM, elapsedSec, goalReachedSec };
  const goalResult = !goal
    ? null
    : course
      ? getCourseResult(course.name, goal, run)
      : { ...getGoalResult(goal, run), badge: null as string | null };
  const badge = goalResult && (course ? goalResult.badge : goalResult.success ? '목표 달성' : '목표 미달성');
  const { settings } = useSettings();
  const [notice, setNotice] = useState('');

  // 이번 주 목표: 이번 러닝 전에는 못 넘었는데, 이번 러닝으로 넘었으면 팝업을 띄워요
  const weekKm = FAKE_WEEK.doneKm + distanceM / 1000;
  const reachedNow = FAKE_WEEK.doneKm < FAKE_WEEK.goalKm && weekKm >= FAKE_WEEK.goalKm;
  const [showGoal, setShowGoal] = useState(reachedNow);

  // 안드로이드 뒤로 가기로 러닝 중 화면에 돌아가지 않게 막아요
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  const done = () => {
    reset();
    router.dismissTo('/'); // 러닝 화면들을 모두 닫고 홈으로
  };

  const share = async () => {
    const unit = settings.distanceUnit;
    try {
      await Share.share({
        message: `런크크로 ${formatDistance(distanceM, unit)}${unit}를 ${formatDuration(elapsedSec)} 동안 달렸어요!`,
      });
    } catch {
      setNotice('이 기기에서는 공유할 수 없어요');
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
      <View style={styles.header}>
        <View style={styles.statusRow}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>러닝 결과</Text>
        </View>
        <Text style={styles.mode}>
          {course
            ? `${course.name}${goal?.timeSec ? ` · 목표 ${formatDuration(goal.timeSec)}` : ''}`
            : goal
              ? formatGoalLabel(goal)
              : '바로 러닝'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <RunMap points={points} live={false} course={course ? { route: course.route, doneM: distanceM } : undefined} />

        <View style={styles.titleBox}>
          {goalResult && badge && (
            <View style={[styles.badge, goalResult.success ? styles.badgeOk : styles.badgeFail]}>
              {goalResult.success && <CheckIcon color={Palette.ink} size={13} />}
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          )}
          <Text style={styles.title}>{goalResult ? goalResult.title : '오늘의 러닝 완료!'}</Text>
          {startedAt && <Text style={styles.date}>{formatRunDate(startedAt)}</Text>}
        </View>

        {goalResult ? (
          <RunStats
            distanceM={distanceM}
            elapsedSec={elapsedSec}
            label={goalResult.label}
            primary={goalResult.primary}
            bigTimeSec={goalResult.bigTimeSec}
            aside={
              <View style={styles.aside}>
                {goalResult.asideSmall && <Text style={styles.asideSmall}>{goalResult.asideSmall}</Text>}
                {goalResult.asideMain && (
                  <Text style={[styles.asideMain, goalResult.asideAlert && styles.asideAlert]}>{goalResult.asideMain}</Text>
                )}
              </View>
            }
          />
        ) : (
          <RunStats distanceM={distanceM} elapsedSec={elapsedSec} label="달린 거리" />
        )}
      </ScrollView>

      <View style={[styles.buttons, { paddingBottom: insets.bottom + 20 }]}>
        <Pressable style={[styles.button, styles.outline]} onPress={share} accessibilityRole="button">
          <ShareIcon color={Palette.ink} size={18} />
          <Text style={styles.outlineLabel}>공유하기</Text>
        </Pressable>
        <Pressable style={[styles.button, styles.solid]} onPress={done} accessibilityRole="button">
          <CheckIcon color={Palette.surface} size={18} />
          <Text style={styles.solidLabel}>완료</Text>
        </Pressable>
      </View>

      <GoalModal
        visible={showGoal}
        weekKm={weekKm}
        onClose={() => setShowGoal(false)}
        onWeekly={() => {
          setShowGoal(false);
          setNotice('주간 러닝 화면은 곧 만들 예정이에요');
        }}
      />
      <Toast message={notice} onHide={() => setNotice('')} />
    </View>
  );
}

/** 이번 주 목표 달성 팝업 */
function GoalModal({
  visible,
  weekKm,
  onClose,
  onWeekly,
}: {
  visible: boolean;
  weekKm: number;
  onClose: () => void;
  onWeekly: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.dim} onPress={onClose}>
        <Pressable style={styles.modal} onPress={() => {}}>
          <View style={styles.trophy}>
            <TrophyIcon color={Palette.ink} size={30} />
          </View>
          <Text style={styles.modalTitle}>이번 주 목표 달성!</Text>
          <Text style={styles.modalMessage}>
            {weekKm.toFixed(1)} / {FAKE_WEEK.goalKm}km · 이번 주 {FAKE_WEEK.runCount + 1}번 달렸어요
          </Text>
          {/* TODO: Figma의 "주간 최고기록 갱신" 칩은 서버에 최고기록이 생기면 추가해요 */}
          <View style={styles.modalButtons}>
            <Pressable style={[styles.modalButton, styles.modalCancel]} onPress={onWeekly} accessibilityRole="button">
              <Text style={styles.modalCancelLabel}>주간 러닝 보기</Text>
            </Pressable>
            <Pressable style={[styles.modalButton, styles.solid]} onPress={onClose} accessibilityRole="button">
              <Text style={styles.solidLabel}>확인</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
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
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Palette.ink,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '800',
    color: Palette.ink,
  },
  mode: {
    fontSize: 14,
    fontWeight: '600',
    color: Palette.muted,
  },
  content: {
    gap: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  titleBox: {
    gap: 4,
  },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  badgeOk: {
    backgroundColor: Palette.accent,
  },
  badgeFail: {
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.ink,
  },
  aside: {
    alignItems: 'flex-end',
    gap: 2,
    marginBottom: 12,
  },
  asideSmall: {
    fontSize: 12,
    color: Palette.hint,
  },
  asideMain: {
    fontSize: 18,
    fontWeight: '800',
    color: Palette.ink,
  },
  asideAlert: {
    color: Palette.alert,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Palette.ink,
  },
  date: {
    fontSize: 13,
    color: Palette.muted,
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 12,
    paddingHorizontal: 20,
  },
  button: {
    flex: 1,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 999,
  },
  outline: {
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
  },
  outlineLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.ink,
  },
  solid: {
    backgroundColor: Palette.ink,
  },
  solidLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.surface,
  },
  dim: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  modal: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: 8,
    padding: 24,
    borderRadius: 24,
    backgroundColor: Palette.surface,
  },
  trophy: {
    width: 64,
    height: 64,
    marginBottom: 8,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.accent,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Palette.ink,
  },
  modalMessage: {
    fontSize: 14,
    color: Palette.muted,
  },
  modalButtons: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    height: 50,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancel: {
    backgroundColor: '#E4E6EB',
  },
  modalCancelLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Palette.ink,
  },
});
