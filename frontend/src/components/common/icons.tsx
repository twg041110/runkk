import type { ReactNode } from 'react';
import Svg, { Circle, G, Path } from 'react-native-svg';

type IconProps = { color: string; size?: number };

function LineIcon({ color, size = 22, children }: IconProps & { children: ReactNode }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <G fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        {children}
      </G>
    </Svg>
  );
}

export function BellIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <Path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15L6 16Z" />
      <Path d="M10 20.5a2 2 0 0 0 4 0" />
    </LineIcon>
  );
}

export function LocateIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <Circle cx={12} cy={12} r={4} />
      <Path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </LineIcon>
  );
}

export function CommunityIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <Path d="M4 12a7 7 0 0 1 7-7h2a7 7 0 0 1 0 14h-6l-4 3 1-4.2A6.98 6.98 0 0 1 4 12Z" />
    </LineIcon>
  );
}

export function CourseIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <Path d="M9 4 4 6v14l5-2 6 2 5-2V4l-5 2-6-2Z" />
      <Path d="M9 4v14M15 6v14" />
    </LineIcon>
  );
}

export function FriendsIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <Circle cx={9} cy={8} r={3} />
      <Path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
      <Circle cx={17} cy={9} r={2.3} />
      <Path d="M14.5 19c.3-2.2 1.8-3.8 3.7-4" />
    </LineIcon>
  );
}

export function ProfileIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <Circle cx={12} cy={8} r={3.4} />
      <Path d="M5 20c0-3.9 3.1-6.5 7-6.5s7 2.6 7 6.5" />
    </LineIcon>
  );
}

export function EyeIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <Path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <Circle cx={12} cy={12} r={3} />
    </LineIcon>
  );
}

// 화면 왼쪽 위 뒤로가기 화살표 (<)
export function ChevronLeftIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <Path d="M15 5l-7 7 7 7" />
    </LineIcon>
  );
}

// 목록 줄 오른쪽의 "더 들어갈 수 있음" 화살표 (>)
export function ChevronRightIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <Path d="M9 5l7 7-7 7" />
    </LineIcon>
  );
}

// 체크 표시 (조건 충족, 체크박스, 완료 화면)
export function CheckIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <Path d="M5 12.5l4.5 4.5L19 7.5" />
    </LineIcon>
  );
}

export function PlayIcon({ color, size = 18 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z"
        fill={color}
      />
    </Svg>
  );
}