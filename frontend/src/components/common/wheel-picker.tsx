/**
 * 아이폰 알람처럼 위아래로 굴려서 고르는 휠
 *
 * 모양:
 *     9        ← 위아래 숫자는 흐리게
 *   ┌────┐
 *   │ 10 │     ← 가운데 회색 띠는 고정. 띠에 걸린 값이 "선택된 값"
 *   └────┘
 *     11
 *
 * 동작 원리 (WheelColumn):
 * 1. 숫자들을 세로 ScrollView에 늘어놓고, 위아래에 빈 공간(2칸씩)을 줘서
 *    맨 처음/맨 끝 숫자도 가운데 띠까지 올 수 있게 해요.
 * 2. snapToInterval: 손을 떼면 한 칸(ITEM_HEIGHT) 단위로 딱 맞춰 멈춰요.
 * 3. 스크롤 위치(y) ÷ 한 칸 높이 = 지금 가운데 있는 칸 번호예요.
 *    숫자 크기 · 진하기는 스크롤 위치에 맞춰 계속 바뀌어서(가운데일수록 크고 진하게) 부드럽게 굴러가요.
 * 4. 움직임이 멈추고 0.15초 지나면 그 칸을 "선택"으로 확정해요(onSelect).
 *
 * 사용 예 (러닝 목표 시간·거리 휠에서도 그대로 쓸 수 있어요):
 *   <WheelPicker columns={[
 *     { items: ['오전', '오후'], selected: '오후', onSelect: (v) => ... },
 *     { items: ['1', '2', ..., '12'], selected: '10', onSelect: (v) => ... },
 *   ]} />
 */
import { useEffect, useRef, type ComponentRef } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { Palette } from '@/constants/theme';

const ITEM_HEIGHT = 40; // 한 칸 높이
const VISIBLE_ROWS = 5; // 한 번에 보이는 칸 수 (가운데 1칸 + 위아래 2칸씩)
const SIDE_ROWS = (VISIBLE_ROWS - 1) / 2; // 가운데 위(또는 아래)에 보이는 칸 수 = 2

type Column = {
  items: string[];
  selected: string;
  onSelect: (value: string) => void;
  unit?: string; // 칸 오른쪽에 붙는 단위 글자 (예: "km", "분"). 없으면 안 붙어요
};

export function WheelPicker({ columns }: { columns: Column[] }) {
  return (
    <View style={styles.wrap}>
      {/* 가운데 고정 회색 띠. 숫자들 뒤에 깔려 있고 움직이지 않아요 */}
      <View style={styles.band} pointerEvents="none" />
      {columns.map((column, index) =>
        column.unit ? (
          <View key={index} style={styles.unitColumn}>
            <WheelColumn {...column} />
            <Text style={styles.unit}>{column.unit}</Text>
          </View>
        ) : (
          <WheelColumn key={index} {...column} />
        ),
      )}
    </View>
  );
}

function WheelColumn({ items, selected, onSelect }: Column) {
  // ScrollView를 코드로 움직이려고 잡아 두는 손잡이
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  // "멈추고 0.15초 뒤 확정"에 쓰는 타이머
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedIndex = Math.max(0, items.indexOf(selected));
  // 지금 스크롤 위치(y). 숫자마다 이 값을 보고 크기 · 진하기를 계속 바꿔서,
  // 굴리는 동안 숫자가 "칸마다 뚝뚝" 바뀌지 않고 부드럽게 커지고 작아져요.
  const scrollY = useRef(new Animated.Value(selectedIndex * ITEM_HEIGHT)).current;

  // index번째 칸을 가운데로 보내기. 위에 빈 공간이 있어서 y = index × 칸 높이면 딱 가운데예요.
  const scrollToIndex = (index: number, animated: boolean) =>
    scrollRef.current?.scrollTo({ y: index * ITEM_HEIGHT, animated });

  // 바깥에서 선택값이 바뀌면(예: 시작 → 종료 칸으로 바꿈, 칩을 누름) 휠도 그 값으로 굴려요.
  useEffect(() => {
    scrollToIndex(selectedIndex, true);
  }, [selectedIndex]);

  // 화면을 떠날 때 남은 타이머를 정리해요.
  useEffect(() => () => {
    if (settleTimer.current) clearTimeout(settleTimer.current);
  }, []);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    // 반올림해서 가장 가까운 칸, 그리고 0 ~ 마지막 칸 사이로 제한
    const index = Math.min(items.length - 1, Math.max(0, Math.round(y / ITEM_HEIGHT)));

    // 스크롤이 계속되는 동안은 타이머를 다시 걸어서, 진짜 멈췄을 때만 확정돼요.
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      scrollToIndex(index, true); // 칸 사이에 어중간하게 멈췄으면 딱 맞춰요
      onSelect(items[index]);
    }, 150);
  };

  return (
    <Animated.ScrollView
      ref={scrollRef}
      style={styles.column}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      snapToInterval={ITEM_HEIGHT}
      decelerationRate="fast"
      scrollEventThrottle={16} // 굴리는 동안 1초에 약 60번 위치를 알려줘요
      nestedScrollEnabled // 스크롤되는 화면 안에 들어가도 안드로이드에서 휠이 굴러가요
      // 스크롤 위치를 scrollY에 바로 넣고(useNativeDriver: 화면 쪽에서 계산해서 끊김 없음), 확정 타이머도 같이 돌려요
      onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: true,
        listener: handleScroll,
      })}
      onLayout={() => scrollToIndex(selectedIndex, false)} // 처음 열릴 때 선택값을 가운데로
    >
      {items.map((item, index) => {
        // 이 숫자가 가운데에 올 때의 스크롤 위치를 기준으로, 위아래로 멀어질수록 작고 흐리게
        const center = index * ITEM_HEIGHT;
        const inputRange = [center - 2 * ITEM_HEIGHT, center - ITEM_HEIGHT, center, center + ITEM_HEIGHT, center + 2 * ITEM_HEIGHT];
        const scale = scrollY.interpolate({ inputRange, outputRange: [0.78, 0.88, 1.1, 0.88, 0.78], extrapolate: 'clamp' });
        const opacity = scrollY.interpolate({ inputRange, outputRange: [0.25, 0.5, 1, 0.5, 0.25], extrapolate: 'clamp' });
        return (
          // 숫자를 눌러도 그 값으로 굴러가요
          <Pressable
            key={item}
            style={styles.item}
            onPress={() => scrollToIndex(index, true)}
            accessibilityRole="button"
            accessibilityState={{ selected: item === selected }}>
            <Animated.Text style={[styles.text, { opacity, transform: [{ scale }] }]}>{item}</Animated.Text>
          </Pressable>
        );
      })}
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    gap: 8,
    height: ITEM_HEIGHT * VISIBLE_ROWS,
  },
  band: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: ITEM_HEIGHT * SIDE_ROWS,
    height: ITEM_HEIGHT,
    borderRadius: 12,
    backgroundColor: '#E9EBF0',
  },
  column: {
    flex: 1,
  },
  // 휠 높이는 그대로 두고(늘어나면 숫자가 넘쳐요) 단위 글자만 가운데 줄에 맞춰요
  unitColumn: {
    flex: 1,
    flexDirection: 'row',
  },
  unit: {
    alignSelf: 'center',
    marginRight: 12,
    fontSize: 15,
    color: Palette.muted,
  },
  // 위아래에 2칸씩 빈 공간 → 첫 칸과 마지막 칸도 가운데 띠까지 올 수 있어요
  content: {
    paddingVertical: ITEM_HEIGHT * SIDE_ROWS,
  },
  item: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 20,
    fontWeight: '700',
    color: Palette.ink,
  },
});
