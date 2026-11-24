import { API_URL } from '@/constants/api';
import { getToken } from '@/lib/session';

// 백엔드 API 를 부르는 공통 함수. 주소와 주고받는 모양은 backend/API.md 참고.

/** 서버가 돌려주는 오류. message 는 화면에 그대로 보여 줘도 되는 한국어 문장 */
export class ApiError extends Error {
  status: number;
  fields?: Record<string, string>;
  constructor(status: number, message: string, fields?: Record<string, string>) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

/** 로그인이 풀렸을 때(401) 할 일. 루트 화면(_layout)이 등록한다 */
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

type Query = Record<string, string | number | boolean | null | undefined>;

function buildUrl(path: string, query?: Query) {
  const params = Object.entries(query ?? {})
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return `${API_URL ?? ''}${path}${params ? `?${params}` : ''}`;
}

export async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  options: { body?: unknown; query?: Query } = {},
): Promise<T> {
  if (!API_URL) {
    throw new ApiError(0, '서버 주소가 없어요. frontend/.env.local 의 EXPO_PUBLIC_API_URL 을 확인해 주세요.');
  }
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(buildUrl(path, options.query), {
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError(0, '서버에 연결할 수 없어요. 인터넷 연결이나 서버가 켜져 있는지 확인해 주세요.');
  }

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  if (!res.ok) {
    const body = (data ?? {}) as { message?: string; fields?: Record<string, string> };
    if (res.status === 401 && token) onUnauthorized?.();
    throw new ApiError(res.status, body.message ?? '요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.', body.fields);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string, query?: Query) => request<T>('GET', path, { query }),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, { body }),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, { body }),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, { body }),
  delete: <T>(path: string, body?: unknown) => request<T>('DELETE', path, { body }),
};

/** 오류를 화면에 보여 줄 문장으로 */
export function errorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  return '문제가 생겼어요. 잠시 후 다시 시도해 주세요.';
}

// ---------- 서버가 돌려주는 모양 (backend 의 *Dto 와 같다) ----------

export type Page<T> = { content: T[]; page: number; size: number; totalElements: number; hasNext: boolean };

export type Level = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type Gender = 'MALE' | 'FEMALE';

export type MemberSimple = { memberId: number; nickname: string; profileImageUrl: string | null };

export type Me = {
  memberId: number;
  email: string;
  nickname: string;
  profileImageUrl: string | null;
  bio: string | null;
  region: string | null;
  gender: Gender | null;
  birthYear: number | null;
  heightCm: number | null;
  weightKg: number | null;
  level: Level;
  friendCode: string;
  weeklyGoalKm: number | null;
  createdAt: string;
};

export type Profile = {
  memberId: number;
  nickname: string;
  profileImageUrl: string | null;
  bio: string | null;
  region: string | null;
  level: Level;
  friendCode: string;
};

export type TokenResponse = { accessToken: string; tokenType: string; expiresIn: number; member: Me };

export type CourseFeatureDto = { type: string; name: string };

export type CourseSummaryDto = {
  courseId: number;
  name: string;
  region: string | null;
  startPlace: string | null;
  startLat: number | null;
  startLng: number | null;
  difficulty: Level | null;
  distanceKm: number;
  expectedMinutes: number | null;
  elevationM: number | null;
  loop: boolean;
  features: CourseFeatureDto[];
  avgRating: number;
  reviewCount: number;
  weeklyRunners: number;
  saved: boolean;
};

export type CourseDetailDto = CourseSummaryDto & {
  description: string | null;
  beginnerTip: string | null;
  routeData: string | null;
  recommendedMonth: string | null;
};

export type CourseReviewDto = {
  reviewId: number;
  member: MemberSimple;
  rating: number;
  content: string | null;
  createdAt: string;
  mine: boolean;
};

export type CourseRecordDto = {
  member: MemberSimple;
  me: boolean;
  recordId: number;
  durationSec: number;
  distanceKm: number;
  avgPaceSec: number | null;
  startedAt: string;
};

export type RunSummaryDto = {
  recordId: number;
  runType: 'FREE' | 'GOAL' | 'COURSE' | 'TOGETHER' | 'CREW';
  distanceKm: number;
  durationSec: number;
  avgPaceSec: number | null;
  calories: number | null;
  goalType: string;
  goalValue: number | null;
  completionRate: number | null;
  goalAchieved: boolean | null;
  startedAt: string;
  endedAt: string | null;
  courseId: number | null;
  courseName: string | null;
  courseRegion: string | null;
};

export type RunPoint = { lat: number; lng: number; recordedAt?: string };

export type RunDetailDto = { record: RunSummaryDto; inviteId: number | null; meetupId: number | null; routePoints: RunPoint[] };

export type FriendItemDto = { friendshipId: number; friend: Profile; since: string };
export type FriendRequestDto = { friendshipId: number; member: Profile; requestedAt: string };
export type RankItemDto = { rank: number; member: MemberSimple; distanceKm: number; runCount: number; me: boolean };

export type FriendStatsDto = {
  member: Profile;
  friend: boolean;
  totalKm: number;
  weeklyKm: number;
  monthlyKm: number;
  runCount: number;
  avgPaceSec: number | null;
  firstRunAt: string | null;
  recentRuns: RunSummaryDto[];
  togetherCount: number;
  togetherKm: number;
  lastTogether: string | null;
};

export type InviteStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELED';

export type InviteDto = {
  inviteId: number;
  inviter: MemberSimple;
  invitee: MemberSimple;
  courseId: number | null;
  courseName: string | null;
  runAt: string;
  meetingPlace: string | null;
  meetingLat: number | null;
  meetingLng: number | null;
  targetPaceSec: number | null;
  status: InviteStatus;
};

export type InviteRecordsDto = { invite: InviteDto; records: CourseRecordDto[] };

export type JoinType = 'APPROVAL' | 'AUTO';
export type GenderLimit = 'NONE' | 'FEMALE' | 'MALE';
export type JoinStatus = 'PENDING' | 'JOINED' | 'REJECTED' | 'LEFT';

export type MeetupDto = {
  meetupId: number;
  runAt: string;
  meetingPlace: string | null;
  meetingLat: number | null;
  meetingLng: number | null;
  description: string | null;
  attendingCount: number;
  myAttendance: 'ATTENDING' | 'ABSENT' | null;
};

export type CrewSummaryDto = {
  crewId: number;
  name: string;
  intro: string | null;
  region: string | null;
  meetingPlace: string | null;
  avgPaceSec: number | null;
  meetingDays: string | null;
  meetingTime: string | null;
  memberCount: number;
  maxMembers: number | null;
  joinType: JoinType;
  genderLimit: GenderLimit;
  minAge: number | null;
  maxAge: number | null;
  recruiting: boolean;
  tags: string[];
};

export type CrewDetailDto = {
  crew: CrewSummaryDto;
  meetingLat: number | null;
  meetingLng: number | null;
  leader: MemberSimple | null;
  createdAt: string;
  myStatus: JoinStatus | null;
  iAmLeader: boolean;
  nextMeetup: MeetupDto | null;
};

export type MyCrewDto = { crew: CrewDetailDto | null; status: JoinStatus | null };
export type EligibilityDto = { eligible: boolean; runCount: number; required: number };

export type CrewMemberDto = {
  crewMemberId: number;
  member: MemberSimple;
  role: 'LEADER' | 'MEMBER';
  status: JoinStatus;
  joinedAt: string | null;
};

export type CrewNoticeDto = { noticeId: number; title: string; content: string; writer: MemberSimple; createdAt: string };

export type CrewRequestBody = {
  name: string;
  intro?: string | null;
  region?: string | null;
  meetingPlace?: string | null;
  avgPaceSec?: number | null;
  meetingDays?: string | null;
  meetingTime?: string | null;
  maxMembers: number;
  joinType: JoinType;
  genderLimit?: GenderLimit;
  minAge?: number | null;
  maxAge?: number | null;
  recruiting?: boolean;
  tags?: string[];
};

export type WeeklyDto = {
  weekStart: string;
  totalKm: number;
  runCount: number;
  totalSec: number;
  avgPaceSec: number | null;
  weeklyGoalKm: number | null;
  goalPercent: number | null;
  days: { date: string; distanceKm: number }[];
};
