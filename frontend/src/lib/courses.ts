import { invalidate, useQuery } from '@/hooks/use-query';
import {
  api,
  type CourseDetailDto,
  type CourseRecordDto,
  type CourseReviewDto,
  type CourseSummaryDto,
  type Level as ApiLevel,
  type Page,
  type RunSummaryDto,
} from '@/lib/api';
import { ago } from '@/lib/format';

// 서버 코스 데이터를 화면에서 쓰는 모양(Course)으로 바꾸고, 코스 관련 요청을 모아 둔다.

export type Level = '초급' | '중급' | '상급';
export type MapShape = 'loop' | 'line' | 'river' | 'wave';
export type Terrain = '평지 위주' | '완만한 언덕' | '업힐 포함';
export type Purpose = '초보 추천' | '거리 늘리기' | '풍경 좋은';
export const PURPOSES: Purpose[] = ['초보 추천', '거리 늘리기', '풍경 좋은'];

export type Course = {
  id: string;
  courseId: number;
  name: string;
  summary: string;
  description: string;
  level: Level;
  tag: string;
  distanceKm: number;
  minutes: number;
  elevation: number;
  rating: number;
  reviewCount: number;
  weeklyRunners: number;
  town: string;
  start: string;
  loop: boolean;
  /** 코스 특징 (지형 + 서버의 특징 목록) */
  features: string[];
  tip: string;
  purposes: Purpose[];
  shape: MapShape;
  terrain: Terrain;
  /** 편의시설 (서버 특징 중 FACILITY) */
  amenities: string[];
  saved: boolean;
};

export const LEVEL_LABEL: Record<ApiLevel, Level> = { BEGINNER: '초급', INTERMEDIATE: '중급', ADVANCED: '상급' };

function terrainOf(elevation: number): Terrain {
  if (elevation <= 15) return '평지 위주';
  if (elevation <= 50) return '완만한 언덕';
  return '업힐 포함';
}

/** 지도 썸네일 모양: 실제 경로 그림이 생기기 전까지 코스 성격에 맞는 모양을 고른다 */
function shapeOf(dto: CourseSummaryDto): MapShape {
  if (dto.loop) return 'loop';
  if ((dto.elevationM ?? 0) > 40) return 'wave';
  if (/한강|강|천|호수/.test(`${dto.name} ${dto.startPlace ?? ''}`)) return 'river';
  return 'line';
}

export function toCourse(dto: CourseSummaryDto | CourseDetailDto): Course {
  const elevation = dto.elevationM ?? 0;
  const terrain = terrainOf(elevation);
  const level = LEVEL_LABEL[dto.difficulty ?? 'BEGINNER'];
  const scenery = dto.features.filter((f) => f.type === 'SCENERY').map((f) => f.name);
  const amenities = dto.features.filter((f) => f.type === 'FACILITY').map((f) => f.name);
  const purposes: Purpose[] = [];
  if (level === '초급') purposes.push('초보 추천');
  if (dto.distanceKm >= 5) purposes.push('거리 늘리기');
  if (scenery.length > 0) purposes.push('풍경 좋은');
  const description = 'description' in dto ? (dto.description ?? '') : '';
  const tip = 'beginnerTip' in dto ? (dto.beginnerTip ?? '') : '';
  return {
    id: String(dto.courseId),
    courseId: dto.courseId,
    name: dto.name,
    summary: description.split(/(?<=[.!?요])\s/)[0] || `${dto.region ?? ''} ${terrain} 코스`.trim(),
    description,
    level,
    tag: scenery[0] ?? (dto.loop ? '순환' : '편도'),
    distanceKm: Number(dto.distanceKm),
    minutes: dto.expectedMinutes ?? Math.round(Number(dto.distanceKm) * 6.5),
    elevation,
    rating: dto.avgRating,
    reviewCount: dto.reviewCount,
    weeklyRunners: dto.weeklyRunners,
    town: dto.region ?? '',
    start: [dto.region, dto.startPlace ? `${dto.startPlace} 출발` : null].filter(Boolean).join(' · '),
    loop: dto.loop,
    features: [terrain, ...dto.features.map((f) => f.name)],
    tip: tip ? `초보 팁 · ${tip}` : '',
    purposes,
    shape: shapeOf(dto),
    terrain,
    amenities,
    saved: dto.saved,
  };
}

// ---------- 불러오기 ----------

/** 전체 코스 목록. 코스는 운영자가 넣는 데이터라 수가 적어서 한 번에 받아 화면에서 거른다 */
export function useCourses() {
  return useQuery('courses:all', async () => {
    const page = await api.get<Page<CourseSummaryDto>>('/api/courses', { size: 50 });
    return page.content.map(toCourse);
  });
}

export function useCourse(id: string | undefined) {
  return useQuery(id ? `courses:detail:${id}` : null, async () =>
    toCourse(await api.get<CourseDetailDto>(`/api/courses/${id}`)),
  );
}

export function useSavedCourses(enabled: boolean) {
  return useQuery(enabled ? 'courses:saved' : null, async () => {
    const page = await api.get<Page<CourseSummaryDto>>('/api/courses/saved', { size: 50 });
    return page.content.map(toCourse);
  });
}

export type Review = { id: number; name: string; badge: string; when: string; text: string; rating: number; mine: boolean };

export function toReview(dto: CourseReviewDto): Review {
  return {
    id: dto.reviewId,
    name: dto.member.nickname,
    badge: `별점 ${dto.rating}`,
    when: ago(dto.createdAt),
    text: dto.content ?? '',
    rating: dto.rating,
    mine: dto.mine,
  };
}

/** 후기 (최신순 최대 100개. 별점 분포도 여기서 센다) */
export function useReviews(id: string | undefined) {
  return useQuery(id ? `courses:reviews:${id}` : null, async () => {
    const page = await api.get<Page<CourseReviewDto>>(`/api/courses/${id}/reviews`, { size: 50 });
    return { reviews: page.content.map(toReview), total: page.totalElements };
  });
}

/** 이 코스에서 나와 친구들의 가장 빠른 기록 */
export function useCourseRecords(id: string | undefined, enabled: boolean) {
  return useQuery(enabled && id ? `courses:records:${id}` : null, () =>
    api.get<CourseRecordDto[]>(`/api/courses/${id}/records`),
  );
}

// ---------- 바꾸기 ----------

export async function setCourseSaved(courseId: number | string, save: boolean) {
  if (save) await api.post(`/api/courses/${courseId}/save`);
  else await api.delete(`/api/courses/${courseId}/save`);
  invalidate('courses');
}

export async function addReview(courseId: number | string, rating: number, content: string) {
  await api.post(`/api/courses/${courseId}/reviews`, { rating, content });
  invalidate('courses');
}

export async function deleteReview(reviewId: number) {
  await api.delete(`/api/courses/reviews/${reviewId}`);
  invalidate('courses');
}

// ---------- 내 기록으로 계산하는 것 ----------

/** 내 최근 러닝 기록 (레벨·동네 기록 계산용) */
export function useMyRuns(enabled: boolean) {
  return useQuery(enabled ? 'runs:mine' : null, async () => {
    const page = await api.get<Page<RunSummaryDto>>('/api/runs', { size: 50 });
    return page.content;
  });
}

/** 내 레벨: 최근 4주 동안 1회 평균 거리 (5km 미만 초급, 10km 미만 중급, 그 이상 숙련자) */
export function levelFromRuns(runs: RunSummaryDto[] | undefined) {
  const since = Date.now() - 28 * 86400000;
  const recent = (runs ?? []).filter((r) => new Date(r.startedAt).getTime() >= since);
  const averageKm = recent.length ? recent.reduce((s, r) => s + Number(r.distanceKm), 0) / recent.length : 0;
  const level: '초급' | '중급' | '숙련자' = averageKm >= 10 ? '숙련자' : averageKm >= 5 ? '중급' : '초급';
  return { level, averageKm: Math.round(averageKm * 10) / 10, runCount: recent.length };
}

export type Town = { name: string; runs: number; km: number; course: string; shape: MapShape };

/** 이번 달 내가 달린 동네 (코스를 골라 달린 기록의 코스 지역 기준), 많이 달린 순 */
export function townsFromRuns(runs: RunSummaryDto[] | undefined): Town[] {
  const now = new Date();
  const map = new Map<string, { runs: number; km: number; courses: Map<string, number> }>();
  for (const r of runs ?? []) {
    const d = new Date(r.startedAt);
    if (!r.courseRegion || d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) continue;
    const t = map.get(r.courseRegion) ?? { runs: 0, km: 0, courses: new Map() };
    t.runs += 1;
    t.km += Number(r.distanceKm);
    if (r.courseName) t.courses.set(r.courseName, (t.courses.get(r.courseName) ?? 0) + 1);
    map.set(r.courseRegion, t);
  }
  const shapes: MapShape[] = ['loop', 'line', 'river', 'wave'];
  return [...map.entries()]
    .sort((a, b) => b[1].runs - a[1].runs || b[1].km - a[1].km)
    .map(([name, t], index) => ({
      name,
      runs: t.runs,
      km: Math.round(t.km * 10) / 10,
      course: [...t.courses.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '자유 러닝',
      shape: shapes[index % shapes.length],
    }));
}
