import { createContext, use } from 'react';

import type { Me, TokenResponse } from '@/lib/api';

// 로그인 상태를 화면 어디서나 쓰게 한다. 토큰은 기기에 저장돼서 앱을 다시 켜도 로그인이 유지된다.
// - signIn(결과): 로그인·회원가입 성공 후 호출 → 탭 화면이 열림. 인자 없이 부르면 '계정 없이 둘러보기'
// - signOut: 로그아웃·회원 탈퇴에서 호출 → 저장된 토큰을 지우고 로그인 화면으로
// - me: 로그인한 내 정보 (둘러보기 중이면 null)
// - requireLogin: 로그인이 필요한 버튼에서 호출. 로그인 안 했으면 로그인 화면으로 보내고 false
export type AuthValue = {
  signIn: (result?: TokenResponse) => void;
  signOut: () => void;
  me: Me | null;
  refreshMe: () => Promise<void>;
  requireLogin: () => boolean;
};

export const AuthContext = createContext<AuthValue>({
  signIn: () => {},
  signOut: () => {},
  me: null,
  refreshMe: async () => {},
  requireLogin: () => false,
});

export function useAuth() {
  return use(AuthContext);
}
