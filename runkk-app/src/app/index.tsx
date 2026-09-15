import { Text, View } from 'react-native';
import { Link } from 'expo-router';

export default function Index() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold' }}>런크크 첫 화면입니다!</Text>
      
      {/* explore 화면으로 이동하는 링크 */}
      <Link href="/explore" style={{ marginTop: 20, color: 'blue', fontSize: 16 }}>
        Explore 화면으로 이동하기
      </Link>
    </View>
  );
}