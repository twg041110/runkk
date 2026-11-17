/**
 * settings 폴더 안의 화면들을 묶는 "스택"
 *
 * Stack: 화면을 카드처럼 쌓는 방식이에요. 새 화면은 오른쪽에서 밀려 들어오고,
 * 뒤로가기를 하면 맨 위 카드가 빠지면서 바로 아래(들어오기 전) 화면이 다시 보여요.
 * 각 화면은 직접 만든 ScreenHeader를 쓰기 때문에 기본 헤더는 숨겨요(headerShown: false).
 *
 * 이 폴더의 파일 = 화면 주소예요.
 *   index.tsx            → /settings                 설정 메인
 *   notifications.tsx    → /settings/notifications   알림 설정
 *   distance-unit.tsx    → /settings/distance-unit   거리 단위
 *   terms/[type].tsx     → /settings/terms/service   약관 3종 (한 파일로 같이 씀)
 *   account.tsx          → /settings/account         계정 관리
 *   password.tsx         → /settings/password        비밀번호 변경
 *   withdraw.tsx         → /settings/withdraw        회원 탈퇴
 *   withdraw-done.tsx    → /settings/withdraw-done   탈퇴 완료
 *   blocked-friends.tsx  → /settings/blocked-friends 차단한 친구
 */
import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
