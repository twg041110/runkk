import type { Course, Terrain } from '@/lib/courses';

// 코스 필터 (거리·시간·지형·편의시설). 코스 목록은 서버에서 받고, 거르는 건 화면에서 한다.

export type CourseFilter = {
  distance: '전체' | '3km 이하' | '3~5km' | '5~10km' | '10km 이상';
  time: '30분 이하' | '30분~1시간' | '1시간 이상' | null;
  terrain: Terrain | null;
  amenities: string[];
};

export const emptyFilter: CourseFilter = { distance: '전체', time: null, terrain: null, amenities: [] };

const inDistance = (km: number, d: CourseFilter['distance']) =>
  d === '전체' ||
  (d === '3km 이하' && km <= 3) ||
  (d === '3~5km' && km > 3 && km <= 5) ||
  (d === '5~10km' && km > 5 && km <= 10) ||
  (d === '10km 이상' && km > 10);

const inTime = (min: number, t: CourseFilter['time']) =>
  t === null ||
  (t === '30분 이하' && min <= 30) ||
  (t === '30분~1시간' && min > 30 && min <= 60) ||
  (t === '1시간 이상' && min > 60);

export function filterCourses(courses: Course[], filter: CourseFilter): Course[] {
  return courses.filter(
    (course) =>
      inDistance(course.distanceKm, filter.distance) &&
      inTime(course.minutes, filter.time) &&
      (filter.terrain === null || course.terrain === filter.terrain) &&
      filter.amenities.every((a) => course.amenities.includes(a)),
  );
}

// 목록 화면으로 넘길 때 주소 값(params)으로 바꾼다
export function filterToParams(filter: CourseFilter) {
  return {
    distance: filter.distance,
    time: filter.time ?? '',
    terrain: filter.terrain ?? '',
    amenities: filter.amenities.join(','),
  };
}

export function filterFromParams(params: Record<string, string | string[] | undefined>): CourseFilter {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';
  return {
    distance: (one(params.distance) || '전체') as CourseFilter['distance'],
    time: (one(params.time) || null) as CourseFilter['time'],
    terrain: (one(params.terrain) || null) as CourseFilter['terrain'],
    amenities: one(params.amenities) ? one(params.amenities).split(',') : [],
  };
}

export function describeFilter(filter: CourseFilter) {
  return [
    filter.distance === '전체' ? null : filter.distance,
    filter.time,
    filter.terrain,
    ...filter.amenities,
  ].filter(Boolean) as string[];
}
