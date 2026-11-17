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

// 피그마에서 받은 아이콘 경로를 원래 칸(box) 안 같은 자리에 그린다.
// x, y 는 피그마 아이콘 프레임 안에서 그림이 시작하는 위치.
function FigmaIcon({
  color,
  size,
  box,
  x,
  y,
  strokeWidth,
  children,
}: IconProps & { box: number; x: number; y: number; strokeWidth: number; children: ReactNode }) {
  return (
    <Svg width={size ?? box} height={size ?? box} viewBox={`0 0 ${box} ${box}`}>
      <G
        transform={`translate(${x} ${y})`}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round">
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

// ---------- 아래부터 피그마 아이콘 ----------

/** 크루 탭 깃발 (icon/크루) */
export function CrewIcon({ color, size = 22 }: IconProps) {
  return (
    <FigmaIcon color={color} size={size} box={22} x={0} y={0} strokeWidth={1.83}>
      <Path d="M5.5 19.25V3.667M5.5 4.583H16.5L13.75 8.25L16.5 11.917H5.5" />
    </FigmaIcon>
  );
}

/** 홈 (탭 가운데 버튼, 다른 탭에 있을 때) */
export function HomeIcon({ color, size = 18 }: IconProps) {
  return (
    <FigmaIcon color={color} size={size} box={18} x={1.54} y={2.29} strokeWidth={1.43}>
      <Path d="M0.7125 5.9625L7.4625 0.7125L14.2125 5.9625V12.7125H9.3375V8.5875H5.5875V12.7125H0.7125V5.9625Z" />
    </FigmaIcon>
  );
}

export function FilterIcon({ color, size = 24 }: IconProps) {
  return (
    <FigmaIcon color={color} size={size} box={24} x={3.05} y={4.05} strokeWidth={1.9}>
      <Path d="M0.95 2.94858H9.95M13.95 2.94858H16.95M0.95 12.9486H3.95M7.95 12.9486H16.95" />
      <Circle cx={11.95} cy={2.95} r={2} />
      <Circle cx={5.95} cy={12.95} r={2} />
    </FigmaIcon>
  );
}

export function SearchIcon({ color, size = 24 }: IconProps) {
  return (
    <FigmaIcon color={color} size={size} box={24} x={3.55} y={3.55} strokeWidth={1.9}>
      <Circle cx={7.45} cy={7.45} r={6.5} />
      <Path d="M16.4501 16.4511L12.2501 12.2511" />
    </FigmaIcon>
  );
}

/** 굵은 돋보기 (크루 화면) */
export function SearchBoldIcon({ color, size = 24 }: IconProps) {
  return (
    <FigmaIcon color={color} size={size} box={24} x={0} y={0} strokeWidth={2.4}>
      <Circle cx={10.2} cy={10.2} r={6.6} />
      <Path d="M16.8 16.8L21.6 21.6" />
    </FigmaIcon>
  );
}

/** 상세 필터 (줄 세 개) */
export function SortIcon({ color, size = 16 }: IconProps) {
  return (
    <FigmaIcon color={color} size={size} box={16} x={0} y={0} strokeWidth={2}>
      <Path d="M2.667 4H13.333M4.667 8H11.333M6.667 12H9.333" />
    </FigmaIcon>
  );
}

export function ChevronRightIcon({ color, size = 16 }: IconProps) {
  return (
    <FigmaIcon color={color} size={size} box={16} x={5.37} y={3.37} strokeWidth={1.27}>
      <Path d="M0.633 0.633L4.633 4.633L0.633 8.633" />
    </FigmaIcon>
  );
}

/** 상단 왼쪽 뒤로 (icon/left, 테두리 버튼 안) */
export function ChevronLeftIcon({ color, size = 22 }: IconProps) {
  return (
    <FigmaIcon color={color} size={size} box={22} x={7.38} y={4.63} strokeWidth={1.74}>
      <Path d="M6.371 0.871L0.871 6.371L6.371 11.871" />
    </FigmaIcon>
  );
}

/** 테두리 없는 뒤로 (icon/back) */
export function BackIcon({ color, size = 20 }: IconProps) {
  return (
    <FigmaIcon color={color} size={size} box={20} x={0} y={0} strokeWidth={2}>
      <Path d="M13 4L7 10L13 16" />
    </FigmaIcon>
  );
}

export function BookmarkIcon({ color, size = 22, filled }: IconProps & { filled?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22">
      <G transform="translate(5.09 2.8)">
        <Path
          d="M0.870833 0.870833H10.9542V15.5375L5.9125 11.8708L0.870833 15.5375V0.870833Z"
          fill={filled ? color : 'none'}
          stroke={color}
          strokeWidth={1.74}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </G>
    </Svg>
  );
}

/** 노란 별 (평점) */
export function StarIcon({ size = 14 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 14 14">
      <G transform="translate(2.16 1.93)">
        <Path
          d="M4.84168 0.408333L6.18335 3.26667L9.27502 3.61667L6.94168 5.71667L7.58335 8.80833L4.84168 7.23333L2.10002 8.80833L2.74168 5.71667L0.408348 3.61667L3.50001 3.26667L4.84168 0.408333Z"
          fill="#EEFF4A"
          stroke="#1E1F22"
          strokeWidth={0.82}
          strokeLinejoin="round"
        />
      </G>
    </Svg>
  );
}

/** 작은 재생 삼각형 (이 코스로 달리기 버튼) */
export function PlaySmallIcon({ color, size = 16 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16">
      <Path d="M4.67 3L12.67 8L4.67 13V3Z" fill={color} />
    </Svg>
  );
}

export function AddUserIcon({ color, size = 24 }: IconProps) {
  return (
    <FigmaIcon color={color} size={size} box={24} x={2.05} y={3.55} strokeWidth={1.9}>
      <Circle cx={6.95} cy={4.45} r={3.5} />
      <Path d="M0.95 16.4514C0.95 12.9514 3.65 10.9514 6.95 10.9514C10.25 10.9514 12.95 12.9514 12.95 16.4514" />
      <Path d="M16.4496 4.44858V10.4486M13.4496 7.44858H19.4496" />
    </FigmaIcon>
  );
}

export function CalendarIcon({ color, size = 14 }: IconProps) {
  return (
    <FigmaIcon color={color} size={size} box={14} x={1.78} y={1.2} strokeWidth={1.11}>
      <Path d="M1.72083 1.72083H8.72083C9.36517 1.72083 9.8875 2.24317 9.8875 2.8875V9.30417C9.8875 9.9485 9.36517 10.4708 8.72083 10.4708H1.72083C1.0765 10.4708 0.554167 9.9485 0.554167 9.30417V2.8875C0.554167 2.24317 1.0765 1.72083 1.72083 1.72083Z" />
      <Path d="M0.554167 4.6375H9.8875M2.8875 0.554167V2.8875M7.55417 0.554167V2.8875" />
    </FigmaIcon>
  );
}

export function PeopleIcon({ color, size = 20 }: IconProps) {
  return (
    <FigmaIcon color={color} size={size} box={20} x={1.71} y={3.37} strokeWidth={1.58}>
      <Circle cx={5.79} cy={3.29} r={2.5} />
      <Path d="M0.791667 13.2917C0.791667 9.95833 3.29167 8.29167 5.79167 8.29167C8.29167 8.29167 10.7917 9.95833 10.7917 13.2917" />
      <Circle cx={12.46} cy={4.13} r={2.08} />
      <Path d="M12.0417 8.29167C14.125 8.29167 15.7917 9.54167 15.7917 12.4583" />
    </FigmaIcon>
  );
}

/** 굵은 깃발 (크루 없음 카드) */
export function FlagIcon({ color, size = 24 }: IconProps) {
  return (
    <FigmaIcon color={color} size={size} box={24} x={0} y={0} strokeWidth={2}>
      <Path d="M6 21V4M6 5H18L15 9L18 13H6" />
    </FigmaIcon>
  );
}

export function PlusIcon({ color, size = 24, strokeWidth = 2.4 }: IconProps & { strokeWidth?: number }) {
  return (
    <FigmaIcon color={color} size={size} box={24} x={0} y={0} strokeWidth={strokeWidth}>
      <Path d="M12 5V19M5 12H19" />
    </FigmaIcon>
  );
}

export function MinusIcon({ color, size = 16 }: IconProps) {
  return (
    <FigmaIcon color={color} size={size} box={24} x={0} y={0} strokeWidth={2.4}>
      <Path d="M5 12H19" />
    </FigmaIcon>
  );
}

export function CheckIcon({ color, size = 16, strokeWidth = 2.2 }: IconProps & { strokeWidth?: number }) {
  return (
    <FigmaIcon color={color} size={size} box={24} x={0} y={0} strokeWidth={strokeWidth}>
      <Path d="M5 12.5L10 17.5L19 7" />
    </FigmaIcon>
  );
}

export function CloseIcon({ color, size = 20 }: IconProps) {
  return (
    <LineIcon color={color} size={size}>
      <Path d="M6 6l12 12M18 6 6 18" />
    </LineIcon>
  );
}

export function MoreIcon({ color, size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={5} cy={12} r={1.8} fill={color} />
      <Circle cx={12} cy={12} r={1.8} fill={color} />
      <Circle cx={19} cy={12} r={1.8} fill={color} />
    </Svg>
  );
}

export function CopyIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <Path d="M9 9h10v11H9z" />
      <Path d="M5 15V4h10" />
    </LineIcon>
  );
}

export function QrIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <Path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z" />
      <Path d="M14 14h2v2h-2zM18 18h2v2h-2zM14 18h2M18 14h2" />
    </LineIcon>
  );
}

export function ChatIcon({ color, size = 18 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4 5h16v11H9l-5 4V5Z" fill={color} />
    </Svg>
  );
}

export function LinkIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <Path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1" />
      <Path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1" />
    </LineIcon>
  );
}

export function MegaphoneIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <Path d="M4 10v4h3l6 4V6L7 10H4Z" />
      <Path d="M16.5 9.5a3.5 3.5 0 0 1 0 5" />
    </LineIcon>
  );
}

export function PauseIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M8 5v14M16 5v14" stroke={color} strokeWidth={2.6} strokeLinecap="round" />
    </Svg>
  );
}

export function StopIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M7 7h10v10H7z" fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
    </Svg>
  );
}

export function ShareIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <Path d="M12 15V4M8 8l4-4 4 4" />
      <Path d="M5 13v6h14v-6" />
    </LineIcon>
  );
}

export function GlobeIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <Circle cx={12} cy={12} r={8.5} />
      <Path d="M3.5 12h17M12 3.5c2.5 2.6 2.5 14.4 0 17M12 3.5c-2.5 2.6-2.5 14.4 0 17" />
    </LineIcon>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <Path d="m6 9 6 6 6-6" />
    </LineIcon>
  );
}

export function RefreshIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <Path d="M4 12a8 8 0 1 0 2.4-5.7" />
      <Path d="M4 4v4h4" />
    </LineIcon>
  );
}
