/**
 * 러닝을 시작하기 전에 위치를 쓸 수 있는지 확인해요 (바로 러닝 · 목표 러닝이 같이 써요)
 *
 * 1. 폰에 "위치 권한을 허용할까요?"를 물어봐요. 이미 허용했으면 바로 통과해요.
 *    거절하면 "위치 권한이 필요해요" 팝업 → "설정 열기"로 폰 설정 화면을 열어요.
 * 2. 권한이 있어도 폰의 위치(GPS) 스위치가 꺼져 있으면 기록할 수 없어요.
 *    안드로이드는 "위치를 켜시겠어요?" 창을 띄워 주고, 거절하면 "위치가 꺼져 있어요" 팝업이 떠요.
 *
 * 사용법:
 *   const { check, dialogs } = useLocationCheck(() => router.push('/run/countdown'));
 *   <Button onPress={check} />  ...  {dialogs}   ← 팝업은 화면 맨 아래에 넣어 주세요
 */
import * as Linking from 'expo-linking';
import * as Location from 'expo-location';
import { useState } from 'react';
import { Platform } from 'react-native';

import { ConfirmDialog } from '@/components/common/confirm-dialog';

export function useLocationCheck(onReady: () => void) {
  const [askPermission, setAskPermission] = useState(false); // 위치 권한 팝업
  const [locationOff, setLocationOff] = useState(false); // 폰 위치(GPS) 꺼짐 팝업

  const check = async () => {
    const { granted } = await Location.requestForegroundPermissionsAsync();
    if (!granted) {
      setAskPermission(true);
      return;
    }
    try {
      if (Platform.OS === 'android') await Location.enableNetworkProviderAsync();
      if (!(await Location.hasServicesEnabledAsync())) throw new Error('위치 꺼짐');
    } catch {
      setLocationOff(true);
      return;
    }
    onReady();
  };

  const dialogs = (
    <>
      <ConfirmDialog
        visible={askPermission}
        title="위치 권한이 필요해요"
        message={'달린 거리와 경로를 기록하려면\n위치 권한을 "앱 사용 중 허용"으로 켜 주세요.'}
        confirmLabel="설정 열기"
        onCancel={() => setAskPermission(false)}
        onConfirm={() => {
          setAskPermission(false);
          Linking.openSettings(); // 폰 설정 → 이 앱 화면이 열려요
        }}
      />
      <ConfirmDialog
        visible={locationOff}
        title="위치가 꺼져 있어요"
        message={'폰의 위치(GPS)를 켜야 달린 거리를 기록할 수 있어요.\n빠른 설정에서 위치를 켠 뒤 다시 시도해 주세요.'}
        confirmLabel="다시 시도"
        onCancel={() => setLocationOff(false)}
        onConfirm={() => {
          setLocationOff(false);
          check();
        }}
      />
    </>
  );

  return { check, dialogs };
}
