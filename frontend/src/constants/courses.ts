/**
 * 코스 정하고 달리기에 쓰는 코스 목록 (예시 3개)
 *
 * TODO(API): GET /api/courses (목록) · GET /api/courses/{id} (경로 routeData) 로 바꿔요.
 * - 암사동 한강 편의점 왕복: 서버(backend/src/main/resources/courses.json)에 넣은 것과 같은 실제 경로예요.
 * - 나머지 2개는 화면을 만들려고 대충 찍은 예시 경로라, 실제 길과 조금 어긋날 수 있어요.
 *
 * 경로(route)는 [위도, 경도]를 순서대로 적어요. 거리와 예상 시간은 경로로 자동 계산해요.
 */
import { routeLength, type LatLng } from '@/utils/geo';

export type Course = {
  id: string;
  name: string;
  place: string; // 출발하는 곳 (상세 화면 이름 아래)
  terrain: string; // 지형 (평지, 언덕 등)
  shape: '순환' | '왕복'; // 순환: 한 바퀴 돌아 출발점으로, 왕복: 반환점을 찍고 같은 길로 돌아와요 (상세 지도 배지)
  recommended: boolean; // "추천" 배지
  route: LatLng[];
  distanceM: number; // 경로 길이 (자동 계산)
  minutes: number; // 예상 시간 (1km에 6분 페이스로 계산)
};

const EASY_PACE_SEC_PER_KM = 6 * 60;

/** [위도, 경도] 목록으로 코스를 만들어요. 왕복이면 반환점까지만 적으면 돌아오는 길을 붙여 줘요 */
function course(info: Omit<Course, 'route' | 'distanceM' | 'minutes'>, points: [number, number][]): Course {
  const way = points.map(([lat, lng]) => ({ lat, lng }));
  const route = info.shape === '왕복' ? [...way, ...way.slice(0, -1).reverse()] : way;
  const distanceM = routeLength(route);
  return { ...info, route, distanceM, minutes: Math.round(((distanceM / 1000) * EASY_PACE_SEC_PER_KM) / 60) };
}

export const COURSES: Course[] = [
  course({ id: 'amsa', name: '암사동 한강 편의점 왕복', place: '암사동 한강공원', terrain: '평지', shape: '왕복', recommended: true }, [
    [37.554192, 127.123119],
    [37.551933, 127.122073],
    [37.54846, 127.120827],
    [37.54632, 127.120075],
    [37.544405, 127.119317],
    [37.543245, 127.118728],
    [37.542549, 127.118285],
    [37.541811, 127.117581],
    [37.541795, 127.117097],
    [37.541934, 127.11643],
    [37.541928, 127.116242],
  ]),
  // 예시 경로: 여의나루역 앞 한강공원에서 원효대교 쪽으로 갔다가 돌아와요
  course({ id: 'yeouido', name: '여의도 한강공원 왕복', place: '여의도한강공원', terrain: '평지', shape: '왕복', recommended: false }, [
    [37.5291, 126.9336],
    [37.528, 126.936],
    [37.5268, 126.9385],
    [37.5256, 126.941],
    [37.5243, 126.9436],
    [37.5233, 126.9458],
  ]),
  // 예시 경로: 석촌호수 서호를 한 바퀴 돌아요
  course({ id: 'seokchon', name: '석촌호수 서호 한 바퀴', place: '석촌호수', terrain: '평지', shape: '순환', recommended: false }, [
    [37.5121, 127.0971],
    [37.5124, 127.0992],
    [37.5121, 127.1013],
    [37.5112, 127.1024],
    [37.5101, 127.1022],
    [37.5093, 127.1008],
    [37.5091, 127.0987],
    [37.5096, 127.0969],
    [37.5108, 127.0963],
    [37.5121, 127.0971],
  ]),
];

export function findCourse(id: string | undefined) {
  return COURSES.find((c) => c.id === id) ?? null;
}
