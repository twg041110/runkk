import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

// 서버에서 데이터를 불러오는 공통 훅.
// - loading: 처음 불러오는 중 / error: 실패 문장 / data: 결과 / reload: 다시 불러오기
// - 저장·가입처럼 데이터를 바꾼 뒤에는 invalidate('courses') 처럼 부르면
//   그 이름으로 시작하는 화면들이 알아서 다시 불러온다.

import { errorMessage } from '@/lib/api';

const listeners = new Set<(key: string) => void>();

export function invalidate(...prefixes: string[]) {
  listeners.forEach((listener) => prefixes.forEach((prefix) => listener(prefix)));
}

export function useQuery<T>(key: string | null, fetcher: () => Promise<T>) {
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(key !== null);
  const fetcherRef = useRef(fetcher);
  // 화면이 다시 그려질 때마다 최신 fetcher 로 바꿔 둔다 (아래 불러오기 effect 보다 먼저 실행)
  useLayoutEffect(() => {
    fetcherRef.current = fetcher;
  });
  const seq = useRef(0);

  const load = useCallback(async () => {
    if (key === null) return;
    const mine = ++seq.current;
    setLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current();
      if (mine === seq.current) setData(result);
    } catch (e) {
      if (mine === seq.current) setError(errorMessage(e));
    } finally {
      if (mine === seq.current) setLoading(false);
    }
  }, [key]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (key === null) return;
    const listener = (prefix: string) => {
      if (key.startsWith(prefix)) load();
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, [key, load]);

  return { data, error, loading, reload: load, setData };
}

/** 버튼을 눌러 서버에 무언가를 보낼 때 (저장, 가입 등). 보내는 동안 busy 가 true */
export function useAction() {
  const [busy, setBusy] = useState(false);
  const run = useCallback(async <T,>(task: () => Promise<T>, onError?: (message: string) => void) => {
    setBusy(true);
    try {
      return await task();
    } catch (e) {
      onError?.(errorMessage(e));
      return undefined;
    } finally {
      setBusy(false);
    }
  }, []);
  return { busy, run };
}
