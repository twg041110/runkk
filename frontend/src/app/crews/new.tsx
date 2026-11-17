import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ChevronDownIcon, ChevronRightIcon } from '@/components/common/icons';
import { Button, Chip, Sheet, Stepper, SubScreen, TopBar, shared } from '@/components/common/ui';
import { Palette } from '@/constants/theme';
import { AGES, DAYS, GENDERS, PACE_OPTIONS, REGIONS, ruleText } from '@/data/crews';
import { actions } from '@/hooks/use-app-store';

export default function NewCrewScreen() {
  const [name, setName] = useState('');
  const [region, setRegion] = useState<string | null>(null);
  const [pace, setPace] = useState(PACE_OPTIONS[2]);
  const [days, setDays] = useState<string[]>(['토']);
  const [capacity, setCapacity] = useState(20);
  const [gender, setGender] = useState('제한 없음');
  const [ages, setAges] = useState<string[]>(['20대', '30대']);
  const [intro, setIntro] = useState('');
  const [regionOpen, setRegionOpen] = useState(false);
  const [ruleOpen, setRuleOpen] = useState(false);

  const ready = name.trim().length > 0 && region !== null && days.length > 0;
  const rule = ruleText(gender, ages);

  return (
    <SubScreen
      header={<TopBar variant="plain" close title="크루 만들기" />}
      bottom={
        <Button
          label="크루 만들기"
          tone="darkLime"
          height={56}
          radius={28}
          fontSize={16}
          flex
          disabled={!ready}
          onPress={() => {
            actions.createCrew({ name: name.trim(), region: region ?? '', capacity, rule });
            router.replace({ pathname: '/crews/done', params: { type: 'created' } });
          }}
        />
      }
      overlay={
        <>
          <Sheet visible={regionOpen} onClose={() => setRegionOpen(false)}>
            <Text style={shared.sheetTitle}>활동 지역 선택</Text>
            {REGIONS.map((item) => (
              <Pressable
                key={item}
                onPress={() => {
                  setRegion(item);
                  setRegionOpen(false);
                }}
                style={styles.regionRow}
                accessibilityRole="button"
                accessibilityState={{ selected: region === item }}>
                <Text style={[styles.regionText, region === item && styles.regionOn]}>서울 {item}</Text>
                {region === item ? <Text style={styles.regionCheck}>선택됨</Text> : null}
              </Pressable>
            ))}
          </Sheet>
          <Sheet visible={ruleOpen} onClose={() => setRuleOpen(false)}>
            <Text style={shared.sheetTitle}>가입 조건</Text>
            <Text style={shared.fieldLabel}>성별</Text>
            <View style={styles.chips}>
              {GENDERS.map((item) => (
                <Chip key={item} label={item} selected={gender === item} onPress={() => setGender(item)} selectedTextColor={Palette.accent} />
              ))}
            </View>
            <Text style={shared.fieldLabel}>나이</Text>
            <View style={styles.chips}>
              {AGES.map((item) => (
                <Chip
                  key={item}
                  label={item}
                  selected={ages.includes(item)}
                  selectedTextColor={Palette.accent}
                  onPress={() => setAges((list) => (list.includes(item) ? list.filter((a) => a !== item) : [...list, item]))}
                />
              ))}
            </View>
            <Text style={shared.label12}>선택한 조건에 맞는 사람만 가입 신청할 수 있어요</Text>
            <Button label="저장" tone="darkLime" height={52} radius={26} onPress={() => setRuleOpen(false)} />
          </Sheet>
        </>
      }>
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>크루 이름</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="미라클 모닝런"
          placeholderTextColor={Palette.hint}
          maxLength={20}
        />
      </View>

      <Pressable onPress={() => setRegionOpen(true)} style={styles.field} accessibilityRole="button">
        <Text style={styles.fieldLabel}>활동 지역</Text>
        <View style={styles.row}>
          <Text style={[styles.value, !region && { color: Palette.hint }]}>{region ? `서울 ${region}` : '지역을 선택하세요'}</Text>
          <ChevronDownIcon color={Palette.ink} size={18} />
        </View>
      </Pressable>

      <View style={styles.group}>
        <Text style={shared.fieldLabel}>평균 페이스</Text>
        <View style={styles.chips}>
          {PACE_OPTIONS.map((item) => (
            <Chip key={item} label={item} size="sm" selected={pace === item} onPress={() => setPace(item)} selectedTextColor={Palette.accent} />
          ))}
        </View>
      </View>

      <View style={styles.group}>
        <Text style={shared.fieldLabel}>모임 요일</Text>
        <View style={styles.days}>
          {DAYS.map((day) => {
            const on = days.includes(day);
            return (
              <Pressable
                key={day}
                onPress={() => setDays((list) => (on ? list.filter((d) => d !== day) : [...list, day]))}
                style={[styles.day, on && styles.dayOn]}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}>
                <Text style={[styles.dayText, on && styles.dayTextOn]}>{day}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={[styles.field, styles.rowField]}>
        <Text style={styles.rowLabel}>모집 인원</Text>
        <Stepper
          value={`${capacity}명`}
          tone="gray"
          onMinus={() => setCapacity((c) => Math.max(2, c - 1))}
          onPlus={() => setCapacity((c) => Math.min(50, c + 1))}
        />
      </View>

      <Pressable onPress={() => setRuleOpen(true)} style={[styles.field, styles.rowField]} accessibilityRole="button">
        <View style={styles.flex}>
          <Text style={styles.fieldLabel}>가입 조건</Text>
          <Text style={styles.value}>{rule}</Text>
        </View>
        <ChevronRightIcon color={Palette.ink} size={18} />
      </Pressable>

      <TextInput
        style={[styles.field, styles.intro]}
        value={intro}
        onChangeText={setIntro}
        placeholder="크루를 소개해주세요. 활동 방식과 분위기를 적으면 가입 신청이 늘어요."
        placeholderTextColor={Palette.hint}
        multiline
        maxLength={300}
        textAlignVertical="top"
      />
    </SubScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 4 },
  field: {
    backgroundColor: Palette.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 4,
  },
  fieldLabel: { fontSize: 12, fontWeight: '500', color: Palette.muted },
  input: { fontSize: 16, fontWeight: '700', color: Palette.ink, paddingVertical: 2 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  value: { fontSize: 15, fontWeight: '700', color: Palette.ink },
  group: { gap: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  days: { flexDirection: 'row', justifyContent: 'space-between' },
  day: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayOn: { backgroundColor: Palette.ink, borderColor: Palette.ink },
  dayText: { fontSize: 13, fontWeight: '500', color: Palette.ink },
  dayTextOn: { color: Palette.accent, fontWeight: '700' },
  rowField: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 },
  rowLabel: { fontSize: 14, fontWeight: '500', color: Palette.ink },
  intro: { minHeight: 96, fontSize: 14, lineHeight: 21, color: Palette.ink, paddingTop: 14 },
  regionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Palette.divider,
  },
  regionText: { fontSize: 16, color: Palette.ink },
  regionOn: { fontWeight: '700' },
  regionCheck: { fontSize: 13, fontWeight: '700', color: Palette.online },
});
