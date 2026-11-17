/**
 * 설정 값을 앱 전체에서 함께 쓰는 곳 (React Context)
 *
 * 왜 Context를 쓰나요?
 * - "거리 단위"를 마일로 바꾸면 설정 메인 화면의 "km" 글자도 같이 바뀌어야 해요.
 * - 화면마다 useState를 따로 쓰면 값이 서로 공유되지 않아서, 앱 맨 위(_layout)에 값을 하나 두고
 *   필요한 화면에서 useSettings()로 꺼내 쓰는 방식이에요.
 *
 * TODO: 지금은 가짜(초기) 값이라 앱을 껐다 켜면 처음 값으로 돌아가요.
 *       서버가 생기면 GET /api/me/settings로 받아오고, 바꿀 때 PATCH /api/me/settings로 저장해요.
 *       (알림 설정은 서버가 알림을 보낼지 판단할 때 써야 해서 꼭 DB에 저장해야 해요)
 */
import { createContext, use, useState, type ReactNode } from 'react';

// 알림 종류별 켜짐/꺼짐. 이름은 ERD의 '회원 설정' 컬럼과 맞춰서 백엔드와 정하면 돼요.
export type NotifyKey =
  | 'friendRequest' // 친구 요청
  | 'runInvite' // 같이 달리기 초대
  | 'crewSchedule' // 크루 모임 일정
  | 'crewNotice' // 크루 공지
  | 'crewMember' // 가입 승인 · 새 멤버
  | 'comment' // 댓글 · 답글
  | 'like' // 좋아요
  | 'hotPost' // HOT 게시글 선정
  | 'bestRecord' // 최고기록 갱신
  | 'weeklyGoal'; // 주간 목표 알림

// 시각은 24시간 기준 "시"와 "분"으로 저장해요. (예: 오후 10시 → { hour: 22, minute: 0 })
export type Time = { hour: number; minute: number };

export type BlockedFriend = { id: number; name: string; blockedAt: string };

type Settings = {
  pushEnabled: boolean; // 푸시 알림 받기 (전체 스위치)
  notify: Record<NotifyKey, boolean>;
  quietStart: Time; // 방해 금지 시작
  quietEnd: Time; // 방해 금지 종료
  distanceUnit: 'km' | 'mi';
  voiceGuide: boolean; // 음성 안내
  autoPause: boolean; // 자동 일시정지
  keepScreenOn: boolean; // 러닝 중 화면 켜짐 유지
  blockedFriends: BlockedFriend[]; // 차단한 친구 (원래는 친구 기능의 데이터)
  notice: string; // 다른 화면으로 돌아갔을 때 잠깐 보여줄 안내 문구 (예: "비밀번호를 바꿨어요")
};

// Figma 화면에 그려진 값을 초기값으로 썼어요.
const INITIAL: Settings = {
  pushEnabled: true,
  notify: {
    friendRequest: true,
    runInvite: true,
    crewSchedule: true,
    crewNotice: true,
    crewMember: false,
    comment: true,
    like: false,
    hotPost: true,
    bestRecord: true,
    weeklyGoal: true,
  },
  quietStart: { hour: 22, minute: 0 },
  quietEnd: { hour: 7, minute: 0 },
  distanceUnit: 'km',
  voiceGuide: true,
  autoPause: false,
  keepScreenOn: true,
  blockedFriends: [{ id: 1, name: '민수', blockedAt: '10월 23일' }],
  notice: '',
};

type SettingsContextValue = {
  settings: Settings;
  // 바꾸고 싶은 값만 넘기면 나머지는 그대로 두고 합쳐요. 예: update({ voiceGuide: false })
  update: (changes: Partial<Settings>) => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

// 앱 맨 위(_layout.tsx)에서 화면 전체를 이걸로 감싸요.
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState(INITIAL);
  const update = (changes: Partial<Settings>) => setSettings((prev) => ({ ...prev, ...changes }));
  return <SettingsContext value={{ settings, update }}>{children}</SettingsContext>;
}

// 화면에서 쓰는 법: const { settings, update } = useSettings();
export function useSettings() {
  const value = use(SettingsContext);
  if (!value) throw new Error('useSettings는 SettingsProvider 안에서만 쓸 수 있어요.');
  return value;
}

// 22:00 → "22:00" 처럼 두 자리로 맞춰서 보여줘요.
export function formatTime({ hour, minute }: Time) {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}
