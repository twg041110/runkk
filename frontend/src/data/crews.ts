// 예시 데이터: 나중에 백엔드 크루 API 로 바꾸면 된다 (피그마 화면의 값 그대로)

export type Crew = {
  id: string;
  name: string;
  letter: string;
  color: string;
  area: string;
  address: string;
  place: string;
  pace: string;
  members: number;
  capacity: number;
  meet: string;
  schedule: string;
  badge: string;
  tags: { label: string; color?: string }[];
  intro: string;
  join: string;
  gender: string;
  age: string;
  womenOnly?: boolean;
  beginner?: boolean;
  nearby?: boolean;
  createdAt: number;
};

export const CREWS: Crew[] = [
  {
    id: 'hangang-dawn',
    name: '한강 새벽런',
    letter: '한',
    color: '#EEFF4A',
    area: '여의도',
    address: '여의도 · 서울 영등포구',
    place: '여의도한강공원',
    pace: `6'00"`,
    members: 12,
    capacity: 20,
    meet: '토 07:00',
    schedule: '매주 토요일 07:00',
    badge: 'D-3',
    tags: [{ label: '초보 환영' }, { label: '새벽' }],
    intro: '매주 토요일 새벽에 여의도한강공원에서 함께 뛰는 크루예요. 초보도 환영하고, 끝나고 같이 아침을 먹어요.',
    join: '승인 후 가입',
    gender: '제한 없음',
    age: '20대 ~ 30대',
    beginner: true,
    nearby: true,
    createdAt: 4,
  },
  {
    id: 'women-runners',
    name: '여성 러너 크루',
    letter: '여',
    color: '#F4C6C6',
    area: '마포',
    address: '마포 · 서울 마포구',
    place: '상암 월드컵공원',
    pace: `6'20"`,
    members: 9,
    capacity: 15,
    meet: '토 09:00',
    schedule: '매주 토요일 09:00',
    badge: '모집 중',
    tags: [{ label: '여성 전용', color: '#F4C6C6' }, { label: '20~40대' }],
    intro: '매주 토요일 오전, 마포에서 여성 러너끼리 안전하게 함께 뛰는 크루예요.',
    join: '승인 후 가입',
    gender: '여성만 가입 가능',
    age: '20대 ~ 40대',
    womenOnly: true,
    nearby: true,
    createdAt: 3,
  },
  {
    id: 'tancheon',
    name: '탄천 퇴근런',
    letter: '탄',
    color: '#BFD7F2',
    area: '분당',
    address: '분당 · 경기 성남시',
    place: '탄천 정자교',
    pace: `5'40"`,
    members: 8,
    capacity: 15,
    meet: '화·목 20:00',
    schedule: '매주 화·목요일 20:00',
    badge: '모집 중',
    tags: [{ label: '직장인' }, { label: '평일 저녁' }],
    intro: '퇴근하고 탄천에서 가볍게 뛰는 직장인 크루예요. 끝나고 바로 귀가해요.',
    join: '승인 후 가입',
    gender: '제한 없음',
    age: '20대 ~ 40대',
    createdAt: 2,
  },
  {
    id: 'seoulforest-weekend',
    name: '서울숲 주말런',
    letter: '서',
    color: '#CDE8C7',
    area: '성동',
    address: '성동 · 서울 성동구',
    place: '서울숲 거울연못',
    pace: `6'30"`,
    members: 15,
    capacity: 20,
    meet: '일 08:00',
    schedule: '매주 일요일 08:00',
    badge: 'D-1',
    tags: [{ label: '초보 환영' }, { label: '주말' }],
    intro: '일요일 아침 서울숲을 천천히 도는 크루예요. 처음 달리는 분도 편하게 오세요.',
    join: '바로 가입',
    gender: '제한 없음',
    age: '제한 없음',
    beginner: true,
    createdAt: 1,
  },
];

export const getCrew = (id: string) => CREWS.find((crew) => crew.id === id) ?? CREWS[0];

export const CREW_MEMBERS = ['지', '수', '민', '하', '도'];
export const MEMBER_COLORS = ['#EEFF4A', '#BFD7F2', '#F6D9B8', '#CDE8C7', '#DCD2F0'];

// 가입한 크루의 다음 정기 모임 (예시: 크루 정보에서 만든다)
export function meetingOf(crew: Crew) {
  const day = crew.schedule.replace('매주 ', '');
  return {
    title: `${crew.name} 정기런`,
    day,
    dday: 'D-2',
    summary: `${crew.place} · 5km 러닝`,
    gather: crew.place,
    course: '공원 순환 5km',
    pace: `${crew.pace}/km`,
    bring: '러닝화 · 물',
    joined: Math.max(crew.members - 3, 2),
  };
}

// 가입 자격: 1km 이상 러닝 5회
export const REQUIRED_RUNS = 5;
export type RunLog = { date: string; km: number };
// 피그마 '가입 자격 확인 (충족)' 화면 값. 1km 미만 기록을 넣으면 '미충족' 화면이 나온다
export const MY_RUNS: RunLog[] = [
  { date: '10월 12일', km: 3.2 },
  { date: '10월 10일', km: 5.1 },
  { date: '10월 8일', km: 2.4 },
  { date: '10월 6일', km: 0.8 },
  { date: '10월 5일', km: 1.8 },
  { date: '10월 3일', km: 4.0 },
];

export const PACE_OPTIONS = [`5'00" 이하`, `5'~6'`, `6'~7'`, `7' 이상`];
export const DAYS = ['월', '화', '수', '목', '금', '토', '일'];
export const REGIONS = ['영등포구', '마포구', '강남구', '송파구', '성동구', '용산구'];

export const JOIN_REQUESTS = [
  { id: 'jihoon', name: '지훈', detail: `1km 이상 러닝 5회 · 평균 6'10"/km` },
  { id: 'seoyun', name: '서윤', detail: `5km 완주 경험 · 평균 6'30"/km` },
  { id: 'minjae', name: '민재', detail: '초보 · 주 2회 러닝 희망' },
];

// 가입 조건 (크루 만들기 · 크루 관리)
export const GENDERS = ['제한 없음', '여성 전용', '남성 전용'];
export const AGES = ['20대', '30대', '40대', '50대'];

export function ruleText(gender: string, ages: string[]) {
  const genderText = gender === '제한 없음' ? '성별 제한 없음' : gender;
  if (ages.length === 0) return `${genderText} · 나이 제한 없음`;
  const sorted = AGES.filter((a) => ages.includes(a));
  const range = sorted.length === 1 ? sorted[0] : `${sorted[0].replace('대', '')}~${sorted[sorted.length - 1]}`;
  return `${genderText} · 나이 ${range}`;
}
