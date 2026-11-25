/**
 * 목표 러닝 계산 (러닝 중 진행 막대 · 결과 화면이 같이 써요)
 *
 * 목표 종류
 * - 거리만: 목표 거리까지 몇 % 왔는지
 * - 시간만: 목표 시간까지 몇 % 달렸는지
 * - 거리 + 시간: 진행률은 거리 기준. 목표 페이스(시간 ÷ 거리)로 지금쯤 와 있어야 할 시간과 비교해서
 *   "목표보다 12초 앞서는 중 / 뒤처지는 중"을 알려 줘요.
 *   성공 = 목표 거리를 목표 시간 안에 달림 (목표 거리를 넘은 순간의 시간 goalReachedSec로 판단)
 */
import type { RunGoal } from '@/hooks/use-run-session';
import {
  formatDistance,
  formatDuration,
  formatGoalKm,
  formatGoalKmShort,
  formatKoreanDuration,
  formatPaceSec,
} from '@/utils/run-format';

type Run = { distanceM: number; elapsedSec: number; goalReachedSec: number | null };

/** 진행률 0 ~ 1 (거리 목표가 있으면 거리 기준) */
function progressRatio(goal: RunGoal, run: Run) {
  if (goal.distanceM) return Math.min(run.distanceM / goal.distanceM, 1);
  if (goal.timeSec) return Math.min(run.elapsedSec / goal.timeSec, 1);
  return 0;
}

/** 목표를 다 채웠는지 (거리 목표는 거리만 보고, 시간 목표만 있으면 시간을 봐요) */
export function isGoalReached(goal: RunGoal, run: Run) {
  if (goal.distanceM) return run.goalReachedSec !== null;
  if (goal.timeSec) return run.elapsedSec >= goal.timeSec;
  return false;
}

/** 퍼센트 숫자. 아직 못 채웠으면 반올림해도 100%가 되지 않게 99%까지만 보여 줘요 */
function percent(ratio: number, reached: boolean) {
  return reached ? 100 : Math.min(99, Math.round(ratio * 100));
}

/** 러닝 중 화면: 진행 막대 아래에 보여 줄 글자들 */
export function getGoalProgress(goal: RunGoal, run: Run) {
  const reached = isGoalReached(goal, run);
  const ratio = reached ? 1 : progressRatio(goal, run);
  const pct = percent(ratio, reached);

  // 거리 + 시간: 왼쪽엔 목표 요약, 아래 알약엔 앞섬/뒤처짐
  if (goal.distanceM && goal.timeSec) {
    const secPerM = goal.timeSec / goal.distanceM; // 목표 페이스 (1m당 초)
    const caption = `목표 ${formatGoalKm(goal.distanceM)} · ${formatKoreanDuration(goal.timeSec)} · ${formatPaceSec(secPerM * 1000)}/km`;
    let pace: { text: string; ahead: boolean } | null = null;
    if (reached && run.goalReachedSec !== null) {
      const diff = goal.timeSec - run.goalReachedSec;
      pace = { text: diff >= 0 ? `목표 거리 도착! ${formatKoreanDuration(diff)} 빨라요` : `목표 거리 도착! ${formatKoreanDuration(-diff)} 늦었어요`, ahead: diff >= 0 };
    } else if (run.distanceM >= 100) {
      // 100m는 달려야 비교해요 (처음엔 GPS가 흔들려서 숫자가 튀어요)
      const diff = Math.round(secPerM * run.distanceM - run.elapsedSec); // +면 앞섬
      pace =
        Math.abs(diff) < 1
          ? { text: '목표 페이스와 딱 맞아요', ahead: true }
          : { text: `목표보다 ${formatKoreanDuration(Math.abs(diff))} ${diff > 0 ? '앞서는' : '뒤처지는'} 중`, ahead: diff > 0 };
    }
    return { ratio, pct, caption, pace };
  }

  // 거리만 / 시간만: 왼쪽엔 남은 양
  let caption = '목표 달성! 계속 달려도 돼요';
  if (!reached && goal.distanceM) caption = `${((goal.distanceM - run.distanceM) / 1000).toFixed(2)}km 남았어요`;
  if (!reached && !goal.distanceM && goal.timeSec) caption = `${formatDuration(goal.timeSec - run.elapsedSec)} 남았어요`;
  return { ratio, pct, caption, pace: null };
}

/** 결과 화면: 배지 · 제목 · 큰 숫자 · 오른쪽 비교 글자 */
export function getGoalResult(goal: RunGoal, run: Run) {
  const reached = isGoalReached(goal, run);
  const pct = percent(progressRatio(goal, run), reached);
  const ranKm = `${formatDistance(run.distanceM, 'km')}km`;

  // 거리 + 시간
  if (goal.distanceM && goal.timeSec) {
    if (run.goalReachedSec === null) {
      return {
        success: false,
        title: `${ranKm} 달렸어요`,
        label: '기록',
        primary: 'time' as const,
        bigTimeSec: run.elapsedSec,
        asideSmall: `목표 ${formatGoalKm(goal.distanceM)}`,
        asideMain: `거리 ${pct}% 달성`,
        asideAlert: true,
      };
    }
    const diff = goal.timeSec - run.goalReachedSec; // +면 목표보다 빨리 도착
    const success = diff >= 0;
    return {
      success,
      title: success
        ? `${formatGoalKmShort(goal.distanceM)} ${formatKoreanDuration(goal.timeSec)} 도전 성공!`
        : `${formatGoalKmShort(goal.distanceM)} 완주!`,
      label: '기록',
      primary: 'time' as const,
      bigTimeSec: run.goalReachedSec, // 목표 거리에 도착한 순간의 기록
      asideSmall: `목표 ${formatDuration(goal.timeSec)}`,
      asideMain: diff === 0 ? '딱 맞췄어요' : `${formatKoreanDuration(Math.abs(diff))} ${success ? '빨라요' : '늦었어요'}`,
      asideAlert: !success,
    };
  }

  // 거리만
  if (goal.distanceM) {
    return {
      success: reached,
      title: reached ? `${formatGoalKmShort(goal.distanceM)} 달리기 완료!` : `${ranKm} 달렸어요`,
      label: '기록',
      primary: 'time' as const,
      bigTimeSec: run.goalReachedSec ?? run.elapsedSec,
      asideSmall: reached ? null : `목표 ${formatGoalKm(goal.distanceM)}`,
      asideMain: `${pct}% 달성`,
      asideAlert: !reached,
    };
  }

  // 시간만
  const goalSec = goal.timeSec ?? 0;
  return {
    success: reached,
    title: reached ? `${formatKoreanDuration(goalSec)} 달리기 완료!` : `${formatKoreanDuration(run.elapsedSec)} 달렸어요`,
    label: '달린 거리',
    primary: 'distance' as const,
    bigTimeSec: undefined,
    asideSmall: reached ? null : `목표 ${formatKoreanDuration(goalSec)}`,
    asideMain: `${pct}% 달성`,
    asideAlert: !reached,
  };
}
