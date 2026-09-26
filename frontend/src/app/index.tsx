import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Link } from 'expo-router';
import Constants from 'expo-constants';

export default function Index() {
  const [dbResult, setDbResult] = useState('불러오는 중...');

  useEffect(() => {
    const hostIp = Constants.expoConfig?.hostUri?.split(':')[0];
    fetch(`http://${hostIp}:8080/api/test-db`)
      .then((res) => res.json())
      .then((data) => setDbResult(JSON.stringify(data)))
      .catch((err) => setDbResult('연결 실패: ' + err.message));
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold' }}>런크크 첫 화면입니다!</Text>

      <Text style={{ marginTop: 20 }}>DB 테스트 결과: {dbResult}</Text>

      <Link href="/explore" style={{ marginTop: 20, color: 'blue', fontSize: 16 }}>
        Explore 화면으로 이동하기
      </Link>
    </View>
  );
}