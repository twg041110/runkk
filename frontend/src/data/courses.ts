// 예시 데이터: 나중에 백엔드 코스 API 로 바꾸면 된다 (피그마 화면의 값 그대로)

export type Level = '초급' | '중급' | '상급';
export type MapShape = 'loop' | 'line' | 'river' | 'wave';

export type Course = {
  id: string;
  name: string;
  summary: string;
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
  features: string[];
  tip: string;
  purposes: Purpose[];
  hot?: boolean;
  shape: MapShape;
  terrain: '평지 위주' | '완만한 언덕' | '업힐 포함';
  amenities: string[];
};

export type Purpose = '초보 추천' | '거리 늘리기' | '풍경 좋은';
export const PURPOSES: Purpose[] = ['초보 추천', '거리 늘리기', '풍경 좋은'];

export const COURSES: Course[] = [
  {
    id: 'yeouido',
    name: '여의도 한바퀴',
    summary: '가을 바람 맞으며 달리기 좋은 평지 루프',
    level: '초급',
    tag: '평지',
    distanceKm: 4.8,
    minutes: 29,
    elevation: 4,
    rating: 4.8,
    reviewCount: 213,
    weeklyRunners: 128,
    town: '여의도동',
    start: '서울 영등포구 여의도동 · 여의나루역 2번 출구 출발',
    loop: true,
    features: ['평지 위주', '화장실 2곳', '가로등 많음', '급수대 있음', '야경 명소', '자전거 도로 분리'],
    tip: '초보 팁 · 3km 지점 마포대교 아래에서 쉬어가기 좋아요',
    purposes: ['초보 추천'],
    shape: 'loop',
    terrain: '평지 위주',
    amenities: ['화장실', '급수대', '가로등 많음'],
  },
  {
    id: 'seoulforest',
    name: '서울숲 순환',
    summary: '숲길 그늘이 많아 낮에도 시원한 순환 코스',
    level: '초급',
    tag: '공원',
    distanceKm: 3.1,
    minutes: 20,
    elevation: 3,
    rating: 4.6,
    reviewCount: 98,
    weeklyRunners: 84,
    town: '성수동',
    start: '서울 성동구 성수동 · 서울숲역 3번 출구 출발',
    loop: true,
    features: ['평지 위주', '화장실 3곳', '그늘 많음', '급수대 있음'],
    tip: '초보 팁 · 중간 거울연못에서 한 번 쉬어가세요',
    purposes: ['초보 추천'],
    shape: 'line',
    terrain: '평지 위주',
    amenities: ['화장실', '급수대'],
  },
  {
    id: 'banpo-rainbow',
    name: '반포 달빛무지개 코스',
    summary: '분수 쇼를 보며 가볍게 도는 짧은 코스',
    level: '초급',
    tag: '야경',
    distanceKm: 3.0,
    minutes: 20,
    elevation: 2,
    rating: 4.7,
    reviewCount: 76,
    weeklyRunners: 96,
    town: '반포동',
    start: '서울 서초구 반포동 · 반포한강공원 출발',
    loop: false,
    features: ['평지 위주', '야경 명소', '가로등 많음'],
    tip: '초보 팁 · 분수 쇼 시간에는 사람이 많아요',
    purposes: ['초보 추천', '풍경 좋은'],
    shape: 'river',
    terrain: '평지 위주',
    amenities: ['화장실', '가로등 많음'],
  },
  {
    id: 'saetgang',
    name: '샛강 생태공원',
    summary: '물길 따라 조용히 달리는 생태 산책로',
    level: '초급',
    tag: '생태공원',
    distanceKm: 3.2,
    minutes: 19,
    elevation: 1,
    rating: 4.5,
    reviewCount: 41,
    weeklyRunners: 52,
    town: '여의도동',
    start: '서울 영등포구 여의도동 · 샛강역 출발',
    loop: false,
    features: ['평지 위주', '그늘 많음', '흙길 일부'],
    tip: '초보 팁 · 비 온 다음 날은 흙길이 미끄러워요',
    purposes: ['초보 추천', '풍경 좋은'],
    shape: 'wave',
    terrain: '평지 위주',
    amenities: ['화장실'],
  },
  {
    id: 'banpo-night',
    name: '반포 한강 야경 코스',
    summary: '세빛섬과 다리 조명을 따라 달리는 야경 코스',
    level: '중급',
    tag: '야경',
    distanceKm: 6.8,
    minutes: 45,
    elevation: 3,
    rating: 4.8,
    reviewCount: 187,
    weeklyRunners: 312,
    town: '반포동',
    start: '서울 서초구 반포동 · 고속터미널역 8-1번 출구 출발',
    loop: false,
    features: ['평지 위주', '야경 명소', '화장실 2곳', '가로등 많음'],
    tip: '팁 · 반포대교 남단 계단은 천천히 내려가세요',
    purposes: ['거리 늘리기', '풍경 좋은'],
    hot: true,
    shape: 'river',
    terrain: '평지 위주',
    amenities: ['화장실', '가로등 많음', '주차장'],
  },
  {
    id: 'mangwon',
    name: '망원-합정 한강 왕복',
    summary: '양화대교를 바라보며 왕복하는 한강 코스',
    level: '중급',
    tag: '왕복',
    distanceKm: 8.4,
    minutes: 50,
    elevation: 18,
    rating: 4.6,
    reviewCount: 152,
    weeklyRunners: 274,
    town: '망원동',
    start: '서울 마포구 망원동 · 망원한강공원 출발',
    loop: false,
    features: ['완만한 언덕', '화장실 3곳', '급수대 있음'],
    tip: '팁 · 반환점은 합정 쪽 화장실 앞이에요',
    purposes: ['거리 늘리기'],
    hot: true,
    shape: 'line',
    terrain: '완만한 언덕',
    amenities: ['화장실', '급수대', '주차장'],
  },
  {
    id: 'namsan',
    name: '남산 순환로 업힐',
    summary: '꾸준한 오르막으로 심폐를 키우는 코스',
    level: '상급',
    tag: '업힐',
    distanceKm: 7.2,
    minutes: 48,
    elevation: 152,
    rating: 4.7,
    reviewCount: 120,
    weeklyRunners: 141,
    town: '중구',
    start: '서울 중구 · 국립극장 출발',
    loop: true,
    features: ['업힐 포함', '화장실 2곳', '그늘 많음'],
    tip: '팁 · 첫 2km 오르막은 페이스를 낮추세요',
    purposes: ['거리 늘리기'],
    hot: true,
    shape: 'wave',
    terrain: '업힐 포함',
    amenities: ['화장실', '급수대'],
  },
];

export const getCourse = (id: string) => COURSES.find((course) => course.id === id) ?? COURSES[0];

export const RECENT_SEARCHES = ['여의도', '반포 야경', '남산 업힐'];
export const POPULAR_SEARCH = ['yeouido', 'banpo-night', 'mangwon', 'seoulforest', 'namsan'];

export type Review = { name: string; badge: string; when: string; text: string; rating: number };

export const REVIEWS: Review[] = [
  { name: '하은', badge: '초급 러너', when: '4일 전', rating: 5, text: '저녁 7시쯤 뛰었는데 가로등이 많아서 안심됐어요. 처음 5km 도전하기 딱 좋아요!' },
  { name: '도윤', badge: '중급 러너', when: '1주 전', rating: 4, text: '주말 오전엔 자전거가 많아서 평일 추천합니다. 화장실 위치 표시 정확해요.' },
  { name: '지현', badge: '친구', when: '1주 전', rating: 5, text: '바람 없는 날 기록 내기 좋아요. 27분대 찍었어요!' },
  { name: '서준', badge: '초급 러너', when: '2주 전', rating: 5, text: '평지라 페이스 유지 연습하기 좋아요. 급수대가 2곳 있어서 여름에도 괜찮았어요.' },
  { name: '민지', badge: '상급 러너', when: '3주 전', rating: 3, text: '인터벌 훈련 코스로 자주 써요. 마포대교 아래 구간은 사람이 많으니 조심하세요.' },
];

// 별점 분포 (5점 → 1점)
export const RATING_COUNTS = [172, 31, 7, 2, 1];

// 기록 비교: 친구별 이 코스 기록 (null = 기록 없음)
export type CompareRecord = { total: string; pace: string; splits: string[] };
export const MY_RECORD: CompareRecord | null = {
  total: '28:41',
  pace: `5'59"`,
  splits: [`6'05"`, `5'58"`, `6'02"`, `5'55"`, `4'41"`],
};
export const FRIEND_RECORDS: Record<string, CompareRecord> = {
  지현: { total: '27:40', pace: `5'46"`, splits: [`5'50"`, `5'45"`, `5'48"`, `5'44"`, `4'33"`] },
  민수: { total: '28:10', pace: `5'52"`, splits: [`5'55"`, `5'50"`, `5'52"`, `5'49"`, `4'38"`] },
  서연: { total: '30:02', pace: `6'15"`, splits: [`6'20"`, `6'12"`, `6'18"`, `6'10"`, `4'58"`] },
  하은: { total: '31:25', pace: `6'33"`, splits: [`6'40"`, `6'30"`, `6'35"`, `6'28"`, `5'10"`] },
};
export const SPLIT_LABELS = ['1km', '2km', '3km', '4km', '0.8km'];

export const TOWNS = [
  { name: '여의도동', runs: 6, km: 17.4, course: '여의도 한바퀴', shape: 'loop' as MapShape },
  { name: '망원동', runs: 3, km: 8.0, course: '망원-합정 한강 왕복', shape: 'line' as MapShape },
  { name: '반포동', runs: 1, km: 5.0, course: '반포 한강 야경 코스', shape: 'river' as MapShape },
  { name: '성수동', runs: 1, km: 2.2, course: '서울숲 순환', shape: 'line' as MapShape },
];

// 내 레벨: 최근 4주 1회 평균 거리
export const MY_LEVEL = { level: '초급' as Level, averageKm: 3.5 };
