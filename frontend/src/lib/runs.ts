import { invalidate, useQuery } from '@/hooks/use-query';
import { api, type RunDetailDto, type RunPoint, type WeeklyDto } from '@/lib/api';

// 러닝 기록 저장·조회. 기록이 생기면 코스(이번 주 러너), 친구 랭킹, 크루 가입 조건이 바뀌므로 함께 다시 불러온다.

export type SaveRunBody = {
  runType: 'FREE' | 'GOAL' | 'COURSE' | 'TOGETHER' | 'CREW';
  goalType?: 'NONE' | 'DISTANCE' | 'TIME';
  goalValue?: number | null;
  distanceKm: number;
  durationSec: number;
  startedAt: string;
  endedAt?: string;
  courseId?: number | null;
  inviteId?: number | null;
  meetupId?: number | null;
  routePoints?: RunPoint[];
};

export async function saveRun(body: SaveRunBody) {
  const result = await api.post<RunDetailDto>('/api/runs', body);
  invalidate('runs', 'courses', 'friends', 'crews');
  return result;
}

export function useRun(recordId: string | undefined) {
  return useQuery(recordId ? `runs:detail:${recordId}` : null, () => api.get<RunDetailDto>(`/api/runs/${recordId}`));
}

export function useWeekly(enabled: boolean) {
  return useQuery(enabled ? 'runs:weekly' : null, () => api.get<WeeklyDto>('/api/runs/weekly'));
}
