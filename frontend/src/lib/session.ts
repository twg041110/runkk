import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// 로그인 토큰 보관. 휴대폰에서는 암호화 저장소(SecureStore), 웹에서는 브라우저 저장소를 쓴다.
// 앱을 다시 켜도 로그인이 유지되게 하려는 것.

const KEY = 'runkk.accessToken';

let token: string | null = null;

export function getToken() {
  return token;
}

export async function loadToken() {
  try {
    token = Platform.OS === 'web' ? globalThis.localStorage?.getItem(KEY) ?? null : await SecureStore.getItemAsync(KEY);
  } catch {
    token = null;
  }
  return token;
}

export async function saveToken(value: string | null) {
  token = value;
  try {
    if (Platform.OS === 'web') {
      if (value) globalThis.localStorage?.setItem(KEY, value);
      else globalThis.localStorage?.removeItem(KEY);
    } else if (value) {
      await SecureStore.setItemAsync(KEY, value);
    } else {
      await SecureStore.deleteItemAsync(KEY);
    }
  } catch {
    // 저장에 실패해도 이번 실행 동안은 메모리에 있는 토큰으로 계속 쓸 수 있다
  }
}
