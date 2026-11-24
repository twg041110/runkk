import { invalidate, useQuery } from '@/hooks/use-query';
import {
  api,
  type CrewDetailDto,
  type CrewMemberDto,
  type CrewNoticeDto,
  type CrewRequestBody,
  type CrewSummaryDto,
  type EligibilityDto,
  type GenderLimit,
  type JoinStatus,
  type MeetupDto,
  type MyCrewDto,
  type Page,
} from '@/lib/api';
import { dday, initial, pace, parseDate } from '@/lib/format';

// 서버 크루 데이터를 화면에서 쓰는 모양(Crew)으로 바꾸고, 크루 관련 요청을 모아 둔다.

const CREW_COLORS = ['#EEFF4A', '#F4C6C6', '#BFD7F2', '#CDE8C7', '#F6D9B8', '#DCD2F0'];
const DAY_NAMES: Record<string, string> = { 월: '월요일', 화: '화요일', 수: '수요일', 목: '목요일', 금: '금요일', 토: '토요일', 일: '일요일' };

export const REQUIRED_RUNS = 5;

export type Crew = {
  id: string;
  crewId: number;
  name: string;
  letter: string;
  color: string;
  area: string;
  address: string;
  place: string;
  pace: string;
  members: number;
  capacity: number;
  /** 짧은 모임 시간 (예: 토 07:00) */
  meet: string;
  /** 긴 모임 시간 (예: 매주 토요일 07:00) */
  schedule: string;
  badge: string;
  tags: { label: string; color?: string }[];
  intro: string;
  join: string;
  gender: string;
  age: string;
  womenOnly: boolean;
  beginner: boolean;
  recruiting: boolean;
  dto: CrewSummaryDto;
};

export type CrewDetail = Crew & {
  leader: string | null;
  myStatus: JoinStatus | null;
  iAmLeader: boolean;
  nextMeetup: MeetupDto | null;
};

function genderLabel(limit: GenderLimit) {
  return limit === 'FEMALE' ? '여성만 가입 가능' : limit === 'MALE' ? '남성만 가입 가능' : '제한 없음';
}

function ageLabel(min: number | null, max: number | null) {
  if (min == null && max == null) return '제한 없음';
  if (min != null && max != null) return `${min}세 ~ ${max}세`;
  return min != null ? `${min}세 이상` : `${max}세 이하`;
}

function timeText(time: string | null) {
  return time ? time.slice(0, 5) : '';
}

export function toCrew(dto: CrewSummaryDto, nextMeetup?: MeetupDto | null): Crew {
  const days = (dto.meetingDays ?? '').split(',').map((d) => d.trim()).filter(Boolean);
  const time = timeText(dto.meetingTime);
  const region = dto.region ?? '';
  const tags: Crew['tags'] = dto.tags.map((label) => ({ label }));
  if (dto.genderLimit === 'FEMALE') tags.unshift({ label: '여성 전용', color: '#F4C6C6' });
  if (dto.genderLimit === 'MALE') tags.unshift({ label: '남성 전용', color: '#BFD7F2' });
  const capacity = dto.maxMembers ?? 0;
  return {
    id: String(dto.crewId),
    crewId: dto.crewId,
    name: dto.name,
    letter: initial(dto.name),
    color: CREW_COLORS[dto.crewId % CREW_COLORS.length],
    area: region.split(' ').pop() ?? region,
    address: region,
    place: dto.meetingPlace ?? region,
    pace: dto.avgPaceSec ? pace(dto.avgPaceSec) : `-'--"`,
    members: dto.memberCount,
    capacity,
    meet: [days.join('·'), time].filter(Boolean).join(' ') || '모임 미정',
    schedule: days.length ? `매주 ${days.map((d) => DAY_NAMES[d] ?? d).join('·')}${time ? ` ${time}` : ''}` : '정기 모임 미정',
    badge: nextMeetup ? dday(nextMeetup.runAt) : !dto.recruiting ? '모집 마감' : capacity && dto.memberCount >= capacity ? '정원 마감' : '모집 중',
    tags: tags.slice(0, 3),
    intro: dto.intro ?? '',
    join: dto.joinType === 'AUTO' ? '바로 가입' : '승인 후 가입',
    gender: genderLabel(dto.genderLimit),
    age: ageLabel(dto.minAge, dto.maxAge),
    womenOnly: dto.genderLimit === 'FEMALE',
    beginner: dto.tags.some((t) => t.includes('초보')),
    recruiting: dto.recruiting,
    dto,
  };
}

export function toCrewDetail(dto: CrewDetailDto): CrewDetail {
  return {
    ...toCrew(dto.crew, dto.nextMeetup),
    leader: dto.leader?.nickname ?? null,
    myStatus: dto.myStatus,
    iAmLeader: dto.iAmLeader,
    nextMeetup: dto.nextMeetup,
  };
}

// ---------- 불러오기 ----------

export function useCrews() {
  return useQuery('crews:all', async () => {
    const page = await api.get<Page<CrewSummaryDto>>('/api/crews', { size: 50 });
    return page.content.map((dto) => toCrew(dto));
  });
}

export function useCrew(id: string | undefined) {
  return useQuery(id ? `crews:detail:${id}` : null, async () => toCrewDetail(await api.get<CrewDetailDto>(`/api/crews/${id}`)));
}

export function useMyCrew(enabled: boolean) {
  return useQuery(enabled ? 'crews:me' : null, async () => {
    const res = await api.get<MyCrewDto>('/api/crews/me');
    return { crew: res.crew ? toCrewDetail(res.crew) : null, status: res.status };
  });
}

export function useEligibility(enabled: boolean) {
  return useQuery(enabled ? 'crews:eligibility' : null, () => api.get<EligibilityDto>('/api/crews/eligibility'));
}

export function useCrewMembers(id: string | undefined, status?: 'PENDING') {
  return useQuery(id ? `crews:members:${id}:${status ?? 'JOINED'}` : null, () =>
    api.get<CrewMemberDto[]>(`/api/crews/${id}/members`, { status }),
  );
}

export function useMeetups(id: string | undefined) {
  return useQuery(id ? `crews:meetups:${id}` : null, () => api.get<MeetupDto[]>(`/api/crews/${id}/meetups`));
}

export function useNotices(id: string | undefined) {
  return useQuery(id ? `crews:notices:${id}` : null, async () => {
    const page = await api.get<Page<CrewNoticeDto>>(`/api/crews/${id}/notices`, { size: 20 });
    return page.content;
  });
}

// ---------- 바꾸기 ----------

const done = () => invalidate('crews');

export async function joinCrew(crewId: number | string) {
  const res = await api.post<MyCrewDto>(`/api/crews/${crewId}/join`);
  done();
  return res.status;
}

/** 크루 탈퇴, 또는 가입 신청 취소 */
export async function leaveCrew(crewId: number | string) {
  await api.delete(`/api/crews/${crewId}/members/me`);
  done();
}

export async function createCrew(body: CrewRequestBody) {
  const res = await api.post<CrewDetailDto>('/api/crews', body);
  done();
  return toCrewDetail(res);
}

export async function updateCrew(crewId: number | string, body: CrewRequestBody) {
  const res = await api.put<CrewDetailDto>(`/api/crews/${crewId}`, body);
  done();
  return toCrewDetail(res);
}

export async function disbandCrew(crewId: number | string) {
  await api.delete(`/api/crews/${crewId}`);
  done();
}

export async function answerJoinRequest(crewId: number | string, crewMemberId: number, approve: boolean) {
  await api.patch(`/api/crews/${crewId}/members/${crewMemberId}/${approve ? 'approve' : 'reject'}`);
  done();
}

export async function createMeetup(
  crewId: number | string,
  body: { runAt: string; meetingPlace?: string | null; description?: string | null },
) {
  const res = await api.post<MeetupDto>(`/api/crews/${crewId}/meetups`, body);
  done();
  return res;
}

export async function setAttendance(meetupId: number, status: 'ATTENDING' | 'ABSENT') {
  const res = await api.put<MeetupDto>(`/api/crews/meetups/${meetupId}/attendance`, { status });
  done();
  return res;
}

export async function createNotice(crewId: number | string, title: string, content: string) {
  await api.post(`/api/crews/${crewId}/notices`, { title, content });
  done();
}

/** 모임 시각을 "토요일 07:00" 처럼 */
export function meetupDay(runAt: string) {
  const d = parseDate(runAt);
  const names = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${names[d.getDay()]} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
