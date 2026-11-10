import { createContext, use } from 'react';

// 로그인 상태를 바꾸는 함수를 화면 어디서나 쓰게 한다 (지금은 앱을 다시 켜면 로그아웃 상태로 돌아감)
export const AuthContext = createContext({ signIn: () => {} });

export function useAuth() {
  return use(AuthContext);
}
