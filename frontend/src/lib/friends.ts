import { invalidate, useQuery } from '@/hooks/use-query';
import {
  api,
  type FriendItemDto,
  type FriendRequestDto,
  type FriendStatsDto,
  type InviteDto,
  type InviteRecordsDto,
  type Profile,
  type RankItemDto,
} from '@/lib/api';

// 친구·랭킹·함께 달리기 초대에 쓰는 요청 모음. 친구 관련 데이터를 바꾸면 invalidate('friends') 로 다시 불러온다.

export type Friend = {
  /** 회원 번호 (주소에 쓰는 id) */
  id: string;
  memberId: number;
  friendshipId: number;
  name: string;
  code: string;
  region: string | null;
  bio: string | null;
  weeklyKm: number;
  weeklyRuns: number;
  since: string;
};

/** 친구 목록 + 이번 주 달린 거리 (이번 주 많이 달린 친구가 위로) */
export function useFriends(enabled = true) {
  return useQuery(enabled ? 'friends:list' : null, async () => {
    const [list, ranking] = await Promise.all([
      api.get<FriendItemDto[]>('/api/friends'),
      api.get<RankItemDto[]>('/api/friends/ranking', { period: 'WEEK' }),
    ]);
    const byId = new Map(ranking.map((r) => [r.member.memberId, r]));
    return list
      .map<Friend>((item) => {
        const rank = byId.get(item.friend.memberId);
        return {
          id: String(item.friend.memberId),
          memberId: item.friend.memberId,
          friendshipId: item.friendshipId,
          name: item.friend.nickname,
          code: item.friend.friendCode,
          region: item.friend.region,
          bio: item.friend.bio,
          weeklyKm: Number(rank?.distanceKm ?? 0),
          weeklyRuns: rank?.runCount ?? 0,
          since: item.since,
        };
      })
      .sort((a, b) => b.weeklyKm - a.weeklyKm || a.name.localeCompare(b.name));
  });
}

export function useFriendRequests(enabled = true) {
  return useQuery(enabled ? 'friends:requests' : null, async () => {
    const [received, sent] = await Promise.all([
      api.get<FriendRequestDto[]>('/api/friends/requests/received'),
      api.get<FriendRequestDto[]>('/api/friends/requests/sent'),
    ]);
    return { received, sent };
  });
}

export function useRanking(period: 'WEEK' | 'MONTH', enabled = true) {
  return useQuery(enabled ? `friends:ranking:${period}` : null, () =>
    api.get<RankItemDto[]>('/api/friends/ranking', { period }),
  );
}

export function useFriendStats(memberId: string | undefined) {
  return useQuery(memberId ? `friends:stats:${memberId}` : null, () =>
    api.get<FriendStatsDto>(`/api/friends/${memberId}/stats`),
  );
}

export function useMemberSearch(nickname: string) {
  const q = nickname.trim();
  return useQuery(q.length >= 1 ? `friends:search:${q}` : null, () =>
    api.get<Profile[]>('/api/members/search', { nickname: q }),
  );
}

/** 받은·보낸 함께 달리기 초대 (대기 중 + 수락한 것) */
export function useInvites(enabled = true) {
  return useQuery(enabled ? 'friends:invites' : null, async () => {
    const [received, sent] = await Promise.all([
      api.get<InviteDto[]>('/api/run-invites/received'),
      api.get<InviteDto[]>('/api/run-invites/sent'),
    ]);
    return { received, sent };
  });
}

export function useInvite(inviteId: string | undefined) {
  return useQuery(inviteId ? `friends:invite:${inviteId}` : null, () =>
    api.get<InviteRecordsDto>(`/api/run-invites/${inviteId}`),
  );
}

// ---------- 바꾸기 ----------

const done = () => invalidate('friends');

export async function sendFriendRequest(target: { memberId?: number; friendCode?: string }) {
  const result = await api.post<FriendRequestDto>('/api/friends/requests', target);
  done();
  return result;
}

export async function answerFriendRequest(friendshipId: number, accept: boolean) {
  await api.patch(`/api/friends/requests/${friendshipId}/${accept ? 'accept' : 'reject'}`);
  done();
}

/** 친구 끊기, 또는 내가 보낸 요청 취소 */
export async function removeFriend(friendshipId: number) {
  await api.delete(`/api/friends/${friendshipId}`);
  done();
}

export async function sendRunInvite(body: {
  inviteeId: number;
  courseId?: number | null;
  runAt: string;
  meetingPlace?: string | null;
  meetingLat?: number | null;
  meetingLng?: number | null;
  targetPaceSec?: number | null;
}) {
  const result = await api.post<InviteDto>('/api/run-invites', body);
  done();
  return result;
}

export async function answerRunInvite(inviteId: number, answer: 'accept' | 'reject' | 'cancel') {
  await api.patch(`/api/run-invites/${inviteId}/${answer}`);
  done();
}
