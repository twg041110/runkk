import { useState } from 'react';
import { Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';

import { ChatIcon, CopyIcon, LinkIcon, PlusIcon, QrIcon, SearchIcon } from '@/components/common/icons';
import { Avatar, Button, Card, EmptyState, Sheet, SubScreen, Tag, TopBar, shared, useToast } from '@/components/common/ui';
import { Palette } from '@/constants/theme';
import { FRIEND_REQUESTS, ME, SUGGESTED_RUNNERS, type Person } from '@/data/friends';
import { actions, useAppStore } from '@/hooks/use-app-store';

// 검색으로 찾을 수 있는 예시 러너
const SEARCHABLE: Person[] = [
  { id: 'jiwoo', name: '지우', detail: '누적 88.2km · 강남구' },
  { id: 'jiyoon', name: '지윤', detail: '누적 260.4km · 영등포구' },
  ...SUGGESTED_RUNNERS,
];

export default function AddFriendScreen() {
  const toast = useToast();
  const accepted = useAppStore((s) => s.acceptedRequests);
  const rejected = useAppStore((s) => s.rejectedRequests);
  const added = useAppStore((s) => s.addedRunners);
  const [query, setQuery] = useState('');
  const [qrOpen, setQrOpen] = useState(false);

  const q = query.trim();
  const results = q ? SEARCHABLE.filter((p) => p.name.includes(q) || q.toUpperCase() === ME.code) : [];
  const requests = FRIEND_REQUESTS.filter((r) => !rejected.includes(r.id));
  const waiting = requests.filter((r) => !accepted.includes(r.id)).length;

  const copyCode = () => toast.show(`내 친구 코드 ${ME.code}를 복사했어요`);
  const share = (via: string) =>
    Share.share({ message: `런크크에서 같이 달려요! 친구 코드: ${ME.code}` }).catch(() =>
      toast.show(`${via} 공유를 열 수 없어요`),
    );

  return (
    <SubScreen header={<TopBar title="친구 추가" />} overlay={toast.node}>
      <View style={styles.search}>
        <SearchIcon color={Palette.hint} size={20} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="닉네임 또는 친구 코드로 검색"
          placeholderTextColor={Palette.hint}
          autoCapitalize="characters"
          returnKeyType="search"
        />
      </View>

      {q ? (
        results.length > 0 ? (
          <Card style={styles.list}>
            {results.map((person, index) => (
              <PersonRow
                key={person.id}
                person={person}
                last={index === results.length - 1}
                done={added.includes(person.id)}
                onAdd={() => {
                  actions.addRunner(person.id);
                  toast.show(`${person.name}님에게 친구 요청을 보냈어요`);
                }}
              />
            ))}
          </Card>
        ) : (
          <EmptyState title="찾는 러너가 없어요" message={'닉네임이나 친구 코드를\n다시 확인해 주세요'} />
        )
      ) : (
        <>
          <View style={styles.code}>
            <Text style={styles.codeLabel}>내 친구 코드</Text>
            <Text style={styles.codeValue}>{ME.code}</Text>
            <View style={styles.codeButtons}>
              <DarkButton label="코드 복사" icon={<CopyIcon color={Palette.white} size={16} />} onPress={copyCode} />
              <DarkButton label="QR 코드" icon={<QrIcon color={Palette.white} size={16} />} onPress={() => setQrOpen(true)} />
            </View>
          </View>

          <View style={styles.shareRow}>
            <Button
              label="카카오톡으로 초대"
              tone="lime"
              height={48}
              radius={14}
              flex
              fontSize={14}
              icon={(color) => <ChatIcon color={color} size={16} />}
              onPress={() => share('카카오톡')}
              style={{ backgroundColor: '#FEE500' }}
            />
            <Button
              label="링크 공유"
              tone="outline"
              height={48}
              radius={14}
              flex
              fontSize={14}
              icon={(color) => <LinkIcon color={color} size={16} />}
              onPress={() => share('링크')}
            />
          </View>

          <Card style={styles.list}>
            <View style={styles.headRow}>
              <Text style={styles.cardTitle}>받은 친구 요청</Text>
              {waiting > 0 ? (
                <View style={styles.redBadge}>
                  <Text style={styles.redBadgeText}>{waiting}</Text>
                </View>
              ) : null}
            </View>
            {requests.length === 0 ? <Text style={styles.empty}>받은 친구 요청이 없어요</Text> : null}
            {requests.map((person, index) => {
              const isAccepted = accepted.includes(person.id);
              return (
                <View key={person.id} style={[styles.row, index < requests.length - 1 && styles.border]}>
                  <Avatar name={person.name} size={42} />
                  <View style={styles.flex}>
                    <Text style={styles.name}>{person.name}</Text>
                    <Text style={styles.sub}>{person.detail}</Text>
                  </View>
                  {isAccepted ? (
                    <Text style={styles.doneText}>친구가 됐어요</Text>
                  ) : (
                    <>
                      <SmallButton
                        label="거절"
                        tone="gray"
                        onPress={() => {
                          actions.rejectRequest(person.id);
                          toast.show(`${person.name}님의 요청을 거절했어요`);
                        }}
                      />
                      <SmallButton
                        label="수락"
                        tone="lime"
                        onPress={() => {
                          actions.acceptRequest(person.id);
                          toast.show(`${person.name}님과 친구가 됐어요`);
                        }}
                      />
                    </>
                  )}
                </View>
              );
            })}
          </Card>

          <Card style={styles.list}>
            <View>
              <Text style={styles.cardTitle}>추천 러너</Text>
              <Text style={styles.sub}>나와 비슷한 곳에서, 비슷한 페이스로 달려요</Text>
            </View>
            {SUGGESTED_RUNNERS.map((person, index) => (
              <PersonRow
                key={person.id}
                person={person}
                last={index === SUGGESTED_RUNNERS.length - 1}
                done={added.includes(person.id)}
                onAdd={() => {
                  actions.addRunner(person.id);
                  toast.show(`${person.name}님에게 친구 요청을 보냈어요`);
                }}
              />
            ))}
          </Card>
        </>
      )}

      <Sheet visible={qrOpen} onClose={() => setQrOpen(false)}>
        <View>
          <Text style={shared.sheetTitle}>내 QR 코드</Text>
          <Text style={shared.sheetCaption}>친구가 런크크 앱으로 찍으면 바로 친구 요청이 가요</Text>
        </View>
        <View style={styles.qrBox}>
          <QrIcon color={Palette.ink} size={160} />
          <Text style={styles.qrCode}>{ME.code}</Text>
        </View>
        <Button label="확인" tone="dark" onPress={() => setQrOpen(false)} />
      </Sheet>
    </SubScreen>
  );
}

function PersonRow({ person, last, done, onAdd }: { person: Person; last: boolean; done: boolean; onAdd: () => void }) {
  return (
    <View style={[styles.row, !last && styles.border]}>
      <Avatar name={person.name} size={42} />
      <View style={styles.flex}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{person.name}</Text>
          <Text style={styles.sub}>{person.detail}</Text>
        </View>
        {person.note ? <Tag label={person.note} size={11} /> : null}
      </View>
      {done ? (
        <SmallButton label="요청함" tone="gray" />
      ) : (
        <Pressable onPress={onAdd} style={styles.addButton} accessibilityRole="button" accessibilityLabel={`${person.name} 친구 추가`}>
          <PlusIcon color={Palette.white} size={14} strokeWidth={2.6} />
          <Text style={styles.addText}>추가</Text>
        </Pressable>
      )}
    </View>
  );
}

function SmallButton({ label, tone, onPress }: { label: string; tone: 'gray' | 'lime'; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={[styles.small, { backgroundColor: tone === 'lime' ? Palette.accent : Palette.chip }]}
      accessibilityRole="button">
      <Text style={styles.smallText}>{label}</Text>
    </Pressable>
  );
}

function DarkButton({ label, icon, onPress }: { label: string; icon: React.ReactNode; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.darkButton} accessibilityRole="button">
      {icon}
      <Text style={styles.darkButtonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 4 },
  search: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.white,
  },
  searchInput: { flex: 1, fontSize: 15, color: Palette.ink },
  code: { backgroundColor: Palette.darkCard, borderRadius: 20, padding: 20, gap: 6 },
  codeLabel: { fontSize: 13, fontWeight: '500', color: Palette.darkText },
  codeValue: { fontSize: 24, fontWeight: '900', color: Palette.white },
  codeButtons: { flexDirection: 'row', gap: 8, marginTop: 10 },
  darkButton: {
    flex: 1,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    backgroundColor: Palette.darkLine,
  },
  darkButtonText: { fontSize: 13, fontWeight: '700', color: Palette.white },
  shareRow: { flexDirection: 'row', gap: 8 },
  list: { gap: 4, paddingBottom: 8 },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Palette.ink },
  redBadge: { backgroundColor: Palette.alert, borderRadius: 9, paddingHorizontal: 6, paddingVertical: 1 },
  redBadgeText: { fontSize: 11, fontWeight: '700', color: Palette.white },
  empty: { fontSize: 13, color: Palette.muted, paddingVertical: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  border: { borderBottomWidth: 1, borderBottomColor: Palette.chip },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 15, fontWeight: '700', color: Palette.ink },
  sub: { fontSize: 12, color: Palette.muted },
  doneText: { fontSize: 12, fontWeight: '700', color: Palette.online },
  small: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  smallText: { fontSize: 12, fontWeight: '700', color: Palette.ink },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Palette.ink,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  addText: { fontSize: 12, fontWeight: '700', color: Palette.white },
  qrBox: { alignItems: 'center', gap: 10, padding: 24, backgroundColor: Palette.white, borderRadius: 20 },
  qrCode: { fontSize: 16, fontWeight: '900', color: Palette.ink },
});
