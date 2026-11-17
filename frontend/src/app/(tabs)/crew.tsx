import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CloseIcon, FlagIcon, PlusIcon, SearchBoldIcon, SortIcon } from '@/components/common/icons';
import { Button, Chip, DarkPill, EmptyState, IconButton, Sheet, TabHeader, Tag, shared } from '@/components/common/ui';
import { Palette } from '@/constants/theme';
import { CREWS, getCrew, meetingOf, type Crew } from '@/data/crews';
import { useAppStore } from '@/hooks/use-app-store';

type Category = 'all' | 'nearby' | 'beginner';
type Sort = '최신순' | '인원 많은순' | '자리 많은순';

export default function CrewScreen() {
  const insets = useSafeAreaInsets();
  const myCrew = useAppStore((s) => s.myCrew);
  const pending = useAppStore((s) => s.pendingCrew);
  const created = useAppStore((s) => s.createdCrew);
  const [category, setCategory] = useState<Category>('all');
  const [sort, setSort] = useState<Sort>('최신순');
  const [sortOpen, setSortOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');

  let crews = CREWS.filter((crew) =>
    category === 'nearby' ? crew.nearby : category === 'beginner' ? crew.beginner : true,
  ).filter((crew) => crew.id !== myCrew);
  const q = query.trim();
  if (q) crews = crews.filter((crew) => `${crew.name} ${crew.area} ${crew.address}`.includes(q));
  crews = [...crews].sort((a, b) =>
    sort === '인원 많은순'
      ? b.members - a.members
      : sort === '자리 많은순'
        ? b.capacity - b.members - (a.capacity - a.members)
        : b.createdAt - a.createdAt,
  );

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[shared.tabContent, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {searching ? (
          <View style={styles.searchBar}>
            <SearchBoldIcon color={Palette.hint} size={20} />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="크루 이름이나 동네로 검색"
              placeholderTextColor={Palette.hint}
              autoFocus
              returnKeyType="search"
            />
            <Pressable
              onPress={() => {
                setSearching(false);
                setQuery('');
              }}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="검색 닫기">
              <CloseIcon color={Palette.ink} size={20} />
            </Pressable>
          </View>
        ) : (
          <TabHeader
            title="크루"
            caption="함께 달릴 크루를 찾아보세요"
            right={
              <IconButton label="크루 검색" onPress={() => setSearching(true)}>
                <SearchBoldIcon color={Palette.ink} />
              </IconButton>
            }
          />
        )}

        <View style={styles.filters}>
          <Chip label="전체" selected={category === 'all'} onPress={() => setCategory('all')} selectedTextColor={Palette.accent} />
          <Chip label="내 근처" selected={category === 'nearby'} onPress={() => setCategory('nearby')} selectedTextColor={Palette.accent} />
          <Chip
            label="초보 환영"
            selected={category === 'beginner'}
            onPress={() => setCategory('beginner')}
            selectedTextColor={Palette.accent}
          />
          <Pressable onPress={() => setSortOpen(true)} style={styles.detailChip} accessibilityRole="button">
            <SortIcon color={Palette.ink} />
            <Text style={styles.detailText}>상세</Text>
          </Pressable>
        </View>

        {/* 내 크루 / 가입 대기 / 크루 없음 */}
        {myCrew ? (
          <Pressable
            onPress={() => router.push(myCrew === 'created' ? '/crews/manage' : `/crews/${myCrew}`)}
            style={styles.myCrew}
            accessibilityRole="button">
            <View style={shared.rowBetween}>
              <Text style={styles.myLabel}>내 크루</Text>
              <Text style={styles.myDday}>
                {myCrew === 'created' ? '크루장' : `다음 모임 ${meetingOf(getCrew(myCrew)).dday}`}
              </Text>
            </View>
            <Text style={styles.myName}>{myCrew === 'created' ? created?.name : `${getCrew(myCrew).name} 크루`}</Text>
            <Text style={styles.mySub}>
              {myCrew === 'created'
                ? `${created?.region} · 멤버 1 / ${created?.capacity}명 · 모임 예정 없음`
                : `${meetingOf(getCrew(myCrew)).day} · ${getCrew(myCrew).place} · ${getCrew(myCrew).members}명 참여`}
            </Text>
          </Pressable>
        ) : pending ? (
          <Pressable onPress={() => router.push(`/crews/${pending}`)} style={styles.noCrew} accessibilityRole="button">
            <View style={styles.noCrewTop}>
              <View style={[styles.flag, { backgroundColor: getCrew(pending).color }]}>
                <Text style={styles.flagLetter}>{getCrew(pending).letter}</Text>
              </View>
              <View style={styles.flex}>
                <Text style={styles.noCrewTitle}>{getCrew(pending).name}</Text>
                <Text style={styles.noCrewSub}>크루장이 승인하면 알려드릴게요</Text>
              </View>
              <DarkPill label="승인 대기 중" />
            </View>
          </Pressable>
        ) : (
          <Pressable onPress={() => router.push('/crews/eligibility')} style={styles.noCrew} accessibilityRole="button">
            <View style={styles.noCrewTop}>
              <View style={styles.flag}>
                <FlagIcon color={Palette.ink} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.noCrewTitle}>아직 가입한 크루가 없어요</Text>
                <Text style={styles.noCrewSub}>1km 이상 러닝 5회를 채우면 가입할 수 있어요</Text>
              </View>
            </View>
            <View style={styles.checkButton}>
              <Text style={styles.checkText}>가입 자격 확인하기</Text>
            </View>
          </Pressable>
        )}

        <View style={shared.rowBetween}>
          <Text style={styles.sectionTitle}>{q ? `'${q}' 검색 결과` : '모집 중인 크루'}</Text>
          <Text style={styles.sortText}>{sort}</Text>
        </View>

        {crews.length === 0 ? (
          <EmptyState
            title={q ? '찾는 크루가 없어요' : '조건에 맞는 크루가 없어요'}
            message={'직접 크루를 만들어\n함께 달릴 사람을 모아보세요'}
          />
        ) : null}
        {crews.map((crew) => (
          <CrewCard key={crew.id} crew={crew} />
        ))}
      </ScrollView>

      <Pressable
        onPress={() => router.push(myCrew ? { pathname: '/crews/done', params: { type: 'limit' } } : '/crews/new')}
        style={[styles.fab, { bottom: insets.bottom + 108 }]}
        accessibilityRole="button"
        accessibilityLabel="크루 만들기">
        <PlusIcon color={Palette.ink} />
      </Pressable>

      <Sheet visible={sortOpen} onClose={() => setSortOpen(false)}>
        <Text style={shared.sheetTitle}>정렬</Text>
        <View style={styles.sortList}>
          {(['최신순', '인원 많은순', '자리 많은순'] as const).map((item) => (
            <Chip
              key={item}
              label={item}
              selected={sort === item}
              selectedTextColor={Palette.accent}
              onPress={() => setSort(item)}
            />
          ))}
        </View>
        <Button label="적용" tone="darkLime" height={52} radius={26} onPress={() => setSortOpen(false)} />
      </Sheet>
    </View>
  );
}

function CrewCard({ crew }: { crew: Crew }) {
  return (
    <Pressable
      onPress={() => router.push(`/crews/${crew.id}`)}
      style={({ pressed }) => [styles.crewCard, pressed && { opacity: 0.8 }]}
      accessibilityRole="button"
      accessibilityLabel={`${crew.name}, 멤버 ${crew.members}명`}>
      <View style={styles.crewTop}>
        <View style={[styles.crewAvatar, { backgroundColor: crew.color }]}>
          <Text style={styles.crewLetter}>{crew.letter}</Text>
        </View>
        <View style={styles.flex}>
          <Text style={styles.crewName}>{crew.name}</Text>
          <Text style={styles.crewSub}>
            {crew.area} · {crew.pace}/km
          </Text>
        </View>
        <DarkPill label={crew.badge} />
      </View>
      <View style={styles.tags}>
        {crew.tags.map((tag) => (
          <Tag
            key={tag.label}
            label={tag.label}
            bg={tag.color ?? '#E6E8EE'}
            color={Palette.ink}
            bold
            style={styles.tagPill}
          />
        ))}
      </View>
      <View style={shared.rowBetween}>
        <Text style={styles.crewMeta}>
          멤버 {crew.members} / {crew.capacity}명
        </Text>
        <Text style={styles.crewMeta}>{crew.meet}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Palette.background },
  flex: { flex: 1, gap: 3 },
  searchBar: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.white,
  },
  searchInput: { flex: 1, fontSize: 15, color: Palette.ink },
  filters: { flexDirection: 'row', gap: 8 },
  detailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
  },
  detailText: { fontSize: 13, fontWeight: '500', color: Palette.ink },
  myCrew: { backgroundColor: Palette.darkCard, borderRadius: 24, padding: 18, gap: 6 },
  myLabel: { fontSize: 12, fontWeight: '700', color: Palette.accent },
  myDday: { fontSize: 12, fontWeight: '700', color: Palette.darkText },
  myName: { fontSize: 19, fontWeight: '900', color: Palette.white },
  mySub: { fontSize: 12, color: Palette.darkText },
  noCrew: {
    backgroundColor: Palette.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: 14,
    paddingHorizontal: 18,
    gap: 12,
  },
  noCrewTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flag: { width: 44, height: 44, borderRadius: 22, backgroundColor: Palette.accent, alignItems: 'center', justifyContent: 'center' },
  flagLetter: { fontSize: 17, fontWeight: '900', color: Palette.ink },
  noCrewTitle: { fontSize: 16, fontWeight: '700', color: Palette.ink },
  noCrewSub: { fontSize: 12, color: Palette.muted },
  checkButton: { backgroundColor: Palette.ink, borderRadius: 20, paddingVertical: 10, alignItems: 'center' },
  checkText: { fontSize: 14, fontWeight: '700', color: Palette.accent },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: Palette.ink },
  sortText: { fontSize: 12, color: Palette.muted },
  crewCard: {
    backgroundColor: Palette.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  crewTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  crewAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  crewLetter: { fontSize: 17.6, fontWeight: '900', color: Palette.ink },
  crewName: { fontSize: 15, fontWeight: '700', color: Palette.ink },
  crewSub: { fontSize: 12, color: Palette.muted },
  tags: { flexDirection: 'row', gap: 6 },
  tagPill: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  crewMeta: { fontSize: 12, fontWeight: '500', color: Palette.muted },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 6px 8px rgba(31, 31, 33, 0.18)',
  },
  sortList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
