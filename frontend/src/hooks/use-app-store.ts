import { useSyncExternalStore } from 'react';

// 여러 화면이 같이 보는 상태 (코스 저장, 친구, 크루 가입 등).
// 서버가 생기기 전까지는 앱 안에서만 기억한다. 앱을 다시 켜면 처음 상태로 돌아간다.

export type CreatedCrew = { name: string; region: string; capacity: number; rule: string };

type AppState = {
  savedCourses: string[];
  invitedFriends: string[];
  cheeredFriends: string[];
  removedFriends: string[];
  acceptedRequests: string[];
  rejectedRequests: string[];
  addedRunners: string[];
  runInvite: 'pending' | 'accepted' | 'rejected';
  myCrew: string | null;
  pendingCrew: string | null;
  createdCrew: CreatedCrew | null;
  joinedMeeting: boolean;
  crewRequests: Record<string, 'accepted' | 'rejected'>;
};

const initial: AppState = {
  savedCourses: [],
  invitedFriends: [],
  cheeredFriends: [],
  removedFriends: [],
  acceptedRequests: [],
  rejectedRequests: [],
  addedRunners: [],
  runInvite: 'pending',
  myCrew: null,
  pendingCrew: null,
  createdCrew: null,
  joinedMeeting: false,
  crewRequests: {},
};

let state = initial;
const listeners = new Set<() => void>();

function set(patch: Partial<AppState> | ((s: AppState) => Partial<AppState>)) {
  const next = typeof patch === 'function' ? patch(state) : patch;
  state = { ...state, ...next };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const toggle = (list: string[], id: string) =>
  list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
const add = (list: string[], id: string) => (list.includes(id) ? list : [...list, id]);

export const actions = {
  toggleSavedCourse: (id: string) => set((s) => ({ savedCourses: toggle(s.savedCourses, id) })),
  inviteFriend: (id: string) => set((s) => ({ invitedFriends: add(s.invitedFriends, id) })),
  cheerFriend: (id: string) => set((s) => ({ cheeredFriends: add(s.cheeredFriends, id) })),
  removeFriend: (id: string) => set((s) => ({ removedFriends: add(s.removedFriends, id) })),
  restoreFriend: (id: string) => set((s) => ({ removedFriends: s.removedFriends.filter((x) => x !== id) })),
  acceptRequest: (id: string) => set((s) => ({ acceptedRequests: add(s.acceptedRequests, id) })),
  rejectRequest: (id: string) => set((s) => ({ rejectedRequests: add(s.rejectedRequests, id) })),
  addRunner: (id: string) => set((s) => ({ addedRunners: add(s.addedRunners, id) })),
  answerRunInvite: (answer: 'accepted' | 'rejected') => set({ runInvite: answer }),
  applyCrew: (id: string) => set({ pendingCrew: id }),
  cancelApply: () => set({ pendingCrew: null }),
  // 예시 흐름: 가입 신청 = 승인까지 끝난 것으로 보고 바로 내 크루가 된다
  joinCrew: (id: string) => set({ myCrew: id, pendingCrew: null }),
  leaveCrew: () => set({ myCrew: null, joinedMeeting: false, createdCrew: null, crewRequests: {} }),
  createCrew: (crew: CreatedCrew) => set({ createdCrew: crew, myCrew: 'created' }),
  setMeeting: (joined: boolean) => set({ joinedMeeting: joined }),
  answerCrewRequest: (id: string, answer: 'accepted' | 'rejected') =>
    set((s) => ({ crewRequests: { ...s.crewRequests, [id]: answer } })),
};

export function useAppStore<T>(select: (s: AppState) => T): T {
  return useSyncExternalStore(subscribe, () => select(state), () => select(initial));
}
