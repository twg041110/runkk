import type { CrewRequestBody, CrewSummaryDto, GenderLimit, JoinType } from '@/lib/api';

// 크루 만들기·관리 화면의 선택지와, 선택값을 서버에 보낼 모양으로 바꾸는 함수

export const DAYS = ['월', '화', '수', '목', '금', '토', '일'];
export const REGIONS = [
  '서울 강남구', '서울 강동구', '서울 강서구', '서울 관악구', '서울 광진구', '서울 마포구', '서울 서초구',
  '서울 성동구', '서울 송파구', '서울 영등포구', '서울 용산구', '서울 종로구', '서울 중구', '경기 성남시',
];

/** 평균 페이스 선택지 → 서버 값(1km 당 초) */
export const PACE_OPTIONS: { label: string; sec: number }[] = [
  { label: `5'00" 이하`, sec: 300 },
  { label: `5'~6'`, sec: 330 },
  { label: `6'~7'`, sec: 390 },
  { label: `7' 이상`, sec: 450 },
];

export const GENDERS: { label: string; value: GenderLimit }[] = [
  { label: '제한 없음', value: 'NONE' },
  { label: '여성 전용', value: 'FEMALE' },
  { label: '남성 전용', value: 'MALE' },
];

export const JOIN_TYPES: { label: string; value: JoinType }[] = [
  { label: '승인 후 가입', value: 'APPROVAL' },
  { label: '바로 가입', value: 'AUTO' },
];

export const AGES = ['20대', '30대', '40대', '50대'];

/** 고른 나이대 → 최소·최대 나이 (예: 20대·30대 → 20 ~ 39) */
export function ageRange(ages: string[]) {
  const decades = AGES.filter((a) => ages.includes(a)).map((a) => parseInt(a, 10));
  if (decades.length === 0) return { minAge: null, maxAge: null };
  return { minAge: Math.min(...decades), maxAge: Math.max(...decades) + 9 };
}

/** 서버의 최소·최대 나이 → 나이대 선택값 */
export function agesFrom(min: number | null, max: number | null) {
  if (min == null && max == null) return [];
  return AGES.filter((a) => {
    const d = parseInt(a, 10);
    return (min == null || d + 9 >= min) && (max == null || d <= max);
  });
}

export function paceLabel(sec: number | null) {
  if (!sec) return PACE_OPTIONS[2].label;
  return PACE_OPTIONS.reduce((best, o) => (Math.abs(o.sec - sec) < Math.abs(best.sec - sec) ? o : best)).label;
}

export function ruleText(gender: GenderLimit, ages: string[], joinType?: JoinType) {
  const genderText = GENDERS.find((g) => g.value === gender)?.label ?? '제한 없음';
  const sorted = AGES.filter((a) => ages.includes(a));
  const ageText =
    sorted.length === 0
      ? '나이 제한 없음'
      : `나이 ${sorted.length === 1 ? sorted[0] : `${sorted[0].replace('대', '')}~${sorted[sorted.length - 1]}`}`;
  return [gender === 'NONE' ? '성별 제한 없음' : genderText, ageText, joinType ? JOIN_TYPES.find((j) => j.value === joinType)?.label : null]
    .filter(Boolean)
    .join(' · ');
}

/** 이미 있는 크루 정보에 바꿀 값만 덮어서 수정 요청 본문을 만든다 (서버는 전체 값을 받는다) */
export function requestFrom(dto: CrewSummaryDto, patch: Partial<CrewRequestBody>): CrewRequestBody {
  return {
    name: dto.name,
    intro: dto.intro,
    region: dto.region,
    meetingPlace: dto.meetingPlace,
    avgPaceSec: dto.avgPaceSec,
    meetingDays: dto.meetingDays,
    meetingTime: dto.meetingTime,
    maxMembers: dto.maxMembers ?? 20,
    joinType: dto.joinType,
    genderLimit: dto.genderLimit,
    minAge: dto.minAge,
    maxAge: dto.maxAge,
    recruiting: dto.recruiting,
    tags: dto.tags,
    ...patch,
  };
}
