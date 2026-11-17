import { StyleSheet, Text, View } from 'react-native';

import { CardHeading, InfoRows } from '@/components/common/ui';
import { Palette } from '@/constants/theme';
import { CREW_MEMBERS, MEMBER_COLORS, type Crew } from '@/data/crews';

/** 크루 상세 위쪽 검은 카드 (아바타 · 이름 · 멤버/페이스/모임) */
export function CrewHero({ crew, restricted }: { crew: Crew; restricted?: string }) {
  return (
    <View style={styles.hero}>
      <View style={styles.heroRow}>
        <View style={[styles.avatar, { backgroundColor: crew.color }]}>
          <Text style={styles.avatarText}>{crew.letter}</Text>
        </View>
        <View style={styles.flex}>
          {restricted ? (
            <View style={styles.restrict}>
              <Text style={styles.restrictText}>{restricted}</Text>
            </View>
          ) : null}
          <Text style={styles.name}>{crew.name}</Text>
          <Text style={styles.address}>{crew.address}</Text>
        </View>
      </View>
      <View style={styles.stats}>
        <HeroStat value={`${crew.members} / ${crew.capacity}명`} label="멤버" lime />
        <HeroStat value={crew.pace} label="평균 페이스" />
        <HeroStat value={crew.meet} label="모임" />
      </View>
    </View>
  );
}

function HeroStat({ value, label, lime }: { value: string; label: string; lime?: boolean }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, lime && { color: Palette.accent }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

/** 흰 카드 틀 (크루 화면은 둥글기 22) */
export function CrewCard({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function CrewAbout({ crew }: { crew: Crew }) {
  return (
    <CrewCard style={styles.about}>
      <CardHeading>크루 소개</CardHeading>
      <Text style={styles.aboutText}>{crew.intro}</Text>
    </CrewCard>
  );
}

export function CrewInfo({ crew, full }: { crew: Crew; full?: boolean }) {
  const rows = [
    { label: '활동 지역', value: crew.place },
    { label: '모임 일정', value: crew.schedule },
    { label: '모집 인원', value: `${crew.capacity - crew.members}명 남음 (${crew.members} / ${crew.capacity}명)` },
  ];
  if (full) {
    rows.push(
      { label: '가입 방식', value: crew.join },
      { label: '성별 제한', value: crew.gender },
      { label: '나이 제한', value: crew.age },
    );
  }
  return (
    <CrewCard style={styles.info}>
      <CardHeading>모임 정보</CardHeading>
      <InfoRows rows={rows} />
    </CrewCard>
  );
}

export function CrewMembers({ crew }: { crew: Crew }) {
  return (
    <CrewCard style={styles.about}>
      <CardHeading>멤버</CardHeading>
      <MemberAvatars extra={crew.members - CREW_MEMBERS.length} />
    </CrewCard>
  );
}

export function MemberAvatars({ extra }: { extra: number }) {
  return (
    <View style={styles.avatars}>
      {CREW_MEMBERS.map((name, index) => (
        <View key={name} style={[styles.member, { backgroundColor: MEMBER_COLORS[index] }]}>
          <Text style={styles.memberText}>{name}</Text>
        </View>
      ))}
      {extra > 0 ? (
        <View style={[styles.member, styles.more]}>
          <Text style={styles.moreText}>+{extra}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 4 },
  hero: { backgroundColor: Palette.darkCard, borderRadius: 24, padding: 18, gap: 16 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 22.4, fontWeight: '900', color: Palette.ink },
  restrict: { alignSelf: 'flex-start', backgroundColor: '#F4C6C6', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  restrictText: { fontSize: 11, fontWeight: '700', color: Palette.ink },
  name: { fontSize: 20, fontWeight: '700', color: Palette.white },
  address: { fontSize: 12, color: '#C9CBD1' },
  stats: { flexDirection: 'row' },
  stat: { flex: 1, gap: 4 },
  statValue: { fontSize: 18, fontWeight: '900', color: Palette.white },
  statLabel: { fontSize: 12, color: '#C9CBD1' },
  card: {
    backgroundColor: Palette.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingHorizontal: 16,
  },
  about: { paddingTop: 12, paddingBottom: 14, gap: 4 },
  aboutText: { fontSize: 14, lineHeight: 21, color: Palette.ink },
  info: { paddingTop: 12, paddingBottom: 4 },
  avatars: { flexDirection: 'row', alignItems: 'center' },
  member: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: Palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -8,
  },
  memberText: { fontSize: 14.4, fontWeight: '900', color: Palette.ink },
  more: { backgroundColor: '#E6E8EE', borderWidth: 0, marginRight: 0, marginLeft: 8 },
  moreText: { fontSize: 12, fontWeight: '700', color: Palette.ink },
});
