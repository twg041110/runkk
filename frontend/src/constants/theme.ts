// 색 값은 피그마 '런크크' 파일 기준 (2026-11)
export const Palette = {
  background: '#F0F1F5',
  surface: '#F8F9FB',
  white: '#FFFFFF',
  border: '#DFE1E7',
  divider: '#E6E8EE',
  ink: '#1E1F22',
  inkSoft: '#3A3F4A',
  muted: '#5F646D',
  hint: '#9AA0AA',
  accent: '#EEFF4A',
  accentSoft: '#F3FFB0',
  alert: '#FF383C',
  // 검은 카드 안에서 쓰는 색
  darkCard: '#1E1F22',
  darkLine: '#2E3137',
  darkText: '#B8BCC6',
  // 회색 칩·배지 배경
  chip: '#ECEEF1',
  // 친구 상태
  online: '#15803D',
  running: '#4D5600',
  offline: '#8A8F98',
} as const;

// 난이도 배지
export const LevelColors = {
  초급: { bg: '#D8EFCD', text: '#2F6B1E' },
  중급: { bg: '#F9DFC3', text: '#8A4A10' },
  상급: { bg: '#F4C6C6', text: '#8A1F1F' },
} as const;

// 이름 첫 글자 아바타 배경 (피그마의 사람별 색)
export const AvatarColors: Record<string, string> = {
  나: '#DCD2F0',
  민: '#F6D9B8',
  지: '#EEFF4A',
  서: '#BFD7F2',
  하: '#CDE8C7',
  도: '#DCD2F0',
  준: '#E6E8EE',
  유: '#F6D9B8',
  태: '#BFD7F2',
  소: '#CDE8C7',
  현: '#DCD2F0',
  예: '#F4C6C6',
  수: '#BFD7F2',
};
