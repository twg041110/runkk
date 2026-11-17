import { Redirect } from 'expo-router';

// '저장한 코스 보기' 안내에서 들어오는 주소. 목록 화면의 저장한 코스 모드로 보낸다
export default function SavedCoursesScreen() {
  return <Redirect href={{ pathname: '/courses/list', params: { kind: 'saved' } }} />;
}
