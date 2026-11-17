// 예시 데이터: 나중에 백엔드 친구 API 로 바꾸면 된다 (피그마 화면의 값 그대로)

export const ME = { name: '진환', code: 'RKK-4821', weeklyKm: 8.4 };

export type FriendStatus = 'running' | 'online' | 'offline';

export type Friend = {
  id: string;
  name: string;
  status: FriendStatus;
  lastSeen?: string;
  totalKm: number;
  weeklyKm: number;
  monthlyKm: number;
  runs: number;
  avgPace: string;
  region: string;
  days: number;
  live?: { course: string; km: number; pace: string; elapsed: string; goalKm: number };
  together: { km: number; count: number; last: string };
  recent: { course: string; date: string; km: number; pace: string }[];
};

export const FRIENDS: Friend[] = [
  {
    id: 'minsu',
    name: '민수',
    status: 'running',
    totalKm: 512.8,
    weeklyKm: 15.0,
    monthlyKm: 42.1,
    runs: 86,
    avgPace: `5'41"`,
    region: '서울 영등포구',
    days: 84,
    live: { course: '여의도 한바퀴', km: 3.2, pace: `5'32"`, elapsed: '17:42', goalKm: 5 },
    together: { km: 38.4, count: 7, last: '10월 20일 반포 달빛무지개 코스' },
    recent: [
      { course: '망원-합정 한강 왕복', date: '10월 22일 (목)', km: 8.4, pace: `5'38"` },
      { course: '반포 달빛무지개 코스', date: '10월 20일 (화)', km: 3.0, pace: `6'02"` },
      { course: '자유 러닝', date: '10월 19일 (월)', km: 3.6, pace: `5'50"` },
      { course: '여의도 한바퀴', date: '10월 17일 (토)', km: 4.8, pace: `5'44"` },
      { course: '서울숲 순환', date: '10월 15일 (목)', km: 3.1, pace: `5'58"` },
    ],
  },
  {
    id: 'jihyun',
    name: '지현',
    status: 'running',
    totalKm: 684.2,
    weeklyKm: 24.3,
    monthlyKm: 71.6,
    runs: 112,
    avgPace: `5'28"`,
    region: '서울 마포구',
    days: 140,
    live: { course: '반포 달빛무지개', km: 1.4, pace: `6'05"`, elapsed: '08:31', goalKm: 3 },
    together: { km: 21.0, count: 4, last: '10월 12일 여의도 한바퀴' },
    recent: [
      { course: '여의도 한바퀴', date: '10월 21일 (수)', km: 4.8, pace: `5'46"` },
      { course: '망원-합정 한강 왕복', date: '10월 19일 (월)', km: 8.4, pace: `5'31"` },
    ],
  },
  {
    id: 'seoyeon',
    name: '서연',
    status: 'online',
    totalKm: 231.5,
    weeklyKm: 7.9,
    monthlyKm: 28.3,
    runs: 41,
    avgPace: `6'15"`,
    region: '서울 영등포구',
    days: 60,
    together: { km: 9.6, count: 2, last: '10월 9일 여의도 한바퀴' },
    recent: [{ course: '여의도 한바퀴', date: '10월 21일 (수)', km: 4.8, pace: `6'15"` }],
  },
  {
    id: 'doyun',
    name: '도윤',
    status: 'online',
    totalKm: 98.7,
    weeklyKm: 6.2,
    monthlyKm: 18.2,
    runs: 22,
    avgPace: `6'02"`,
    region: '서울 용산구',
    days: 31,
    together: { km: 0, count: 0, last: '' },
    recent: [{ course: '반포 한강 야경 코스', date: '10월 20일 (화)', km: 6.8, pace: `6'02"` }],
  },
  {
    id: 'haeun',
    name: '하은',
    status: 'offline',
    lastSeen: '2시간 전 접속',
    totalKm: 342.0,
    weeklyKm: 4.5,
    monthlyKm: 19.0,
    runs: 64,
    avgPace: `6'33"`,
    region: '서울 성동구',
    days: 102,
    together: { km: 12.4, count: 3, last: '10월 3일 서울숲 순환' },
    recent: [{ course: '서울숲 순환', date: '10월 20일 (화)', km: 3.1, pace: `6'30"` }],
  },
  {
    id: 'junho',
    name: '준호',
    status: 'offline',
    lastSeen: '어제 접속',
    totalKm: 57.3,
    weeklyKm: 0,
    monthlyKm: 6.1,
    runs: 12,
    avgPace: `6'48"`,
    region: '서울 강서구',
    days: 12,
    together: { km: 0, count: 0, last: '' },
    recent: [],
  },
];

export const getFriend = (id: string) => FRIENDS.find((friend) => friend.id === id) ?? FRIENDS[0];

export const RUN_INVITE = { from: 'seoyeon', when: '10.27 (화) 오후 7:00', course: '여의도 한바퀴 4.8km' };

export type Person = { id: string; name: string; detail: string; note?: string };

export const FRIEND_REQUESTS: Person[] = [
  { id: 'yujin', name: '유진', detail: '누적 131.7km · 마포구' },
  { id: 'taemin', name: '태민', detail: '누적 405.9km · 영등포구' },
];

export const SUGGESTED_RUNNERS: Person[] = [
  { id: 'sohee', name: '소희', detail: '누적 212.6km', note: '여의도 한바퀴 자주 달림' },
  { id: 'hyunwoo', name: '현우', detail: '누적 389.1km', note: '함께 아는 친구 3명' },
  { id: 'yerin', name: '예린', detail: '누적 147.3km', note: '같은 크루 · 여의도 새벽런' },
];

// 이번 달 랭킹 (이번 주는 Friend.weeklyKm 을 쓴다)
export const MONTHLY_ME_KM = 31.2;
