package com.example.runkk.friend;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.runkk.common.ApiException;
import com.example.runkk.member.Member;
import com.example.runkk.member.MemberDto;
import com.example.runkk.member.MemberRepository;
import com.example.runkk.member.MemberService;
import com.example.runkk.notification.Notification;
import com.example.runkk.notification.NotificationService;
import com.example.runkk.run.RunRepositories.RunRecordRepository;
import com.example.runkk.safety.BlockRepository;

@Service
@Transactional(readOnly = true)
public class FriendService {

    private final FriendRepository friends;
    private final MemberRepository members;
    private final MemberService memberService;
    private final BlockRepository blocks;
    private final RunRecordRepository runs;
    private final NotificationService notifications;

    public FriendService(FriendRepository friends, MemberRepository members, MemberService memberService,
            BlockRepository blocks, RunRecordRepository runs, NotificationService notifications) {
        this.friends = friends;
        this.members = members;
        this.memberService = memberService;
        this.blocks = blocks;
        this.runs = runs;
        this.notifications = notifications;
    }

    public record FriendItem(Long friendshipId, MemberDto.Profile friend, LocalDateTime since) {
    }

    public record RequestItem(Long friendshipId, MemberDto.Profile member, LocalDateTime requestedAt) {
    }

    /** 친구 요청 보내기: 회원 번호나 친구 코드 중 하나 */
    public record SendRequest(Long memberId, String friendCode) {
    }

    public record RankItem(int rank, MemberDto.Simple member, BigDecimal distanceKm, long runCount, boolean me) {
    }

    public List<FriendItem> list(Long me) {
        memberService.getActive(me);
        return friends.findAllOf(me, Friend.Status.ACCEPTED).stream()
                .filter(f -> f.other(me).isActive())
                .map(f -> new FriendItem(f.getFriendshipId(), MemberDto.Profile.of(f.other(me)), f.getRequestedAt()))
                .sorted(Comparator.comparing(i -> i.friend().nickname()))
                .toList();
    }

    public List<RequestItem> received(Long me) {
        return friends.findReceived(me, Friend.Status.PENDING).stream()
                .filter(f -> f.getRequester().isActive())
                .map(f -> new RequestItem(f.getFriendshipId(), MemberDto.Profile.of(f.getRequester()),
                        f.getRequestedAt()))
                .toList();
    }

    public List<RequestItem> sent(Long me) {
        return friends.findSent(me, Friend.Status.PENDING).stream()
                .map(f -> new RequestItem(f.getFriendshipId(), MemberDto.Profile.of(f.getReceiver()),
                        f.getRequestedAt()))
                .toList();
    }

    @Transactional
    public RequestItem request(Long me, SendRequest req) {
        Member requester = memberService.getActive(me);
        Member target;
        if (req.memberId() != null) {
            target = memberService.getOther(req.memberId());
        } else if (req.friendCode() != null && !req.friendCode().isBlank()) {
            target = members.findByFriendCode(req.friendCode().trim().toUpperCase())
                    .filter(Member::isActive)
                    .orElseThrow(() -> ApiException.notFound("친구 코드를 다시 확인해 주세요."));
        } else {
            throw ApiException.badRequest("친구로 추가할 사람을 골라 주세요.");
        }
        if (target.getMemberId().equals(me)) {
            throw ApiException.badRequest("나에게는 친구 요청을 보낼 수 없어요.");
        }
        if (blocks.blockedEitherWay(me, target.getMemberId())) {
            throw ApiException.forbidden("친구 요청을 보낼 수 없는 회원이에요.");
        }

        Friend f = friends.findBetween(me, target.getMemberId()).stream().findFirst().orElse(null);
        if (f != null) {
            if (f.getStatus() == Friend.Status.ACCEPTED) {
                throw ApiException.conflict("이미 친구예요.");
            }
            if (f.getStatus() == Friend.Status.PENDING) {
                if (f.getRequester().getMemberId().equals(me)) {
                    throw ApiException.conflict("이미 친구 요청을 보냈어요.");
                }
                // 상대도 나에게 요청을 보낸 상태라면 바로 친구가 된다
                return accept(me, f.getFriendshipId());
            }
            // 예전에 거절된 요청이면 새 요청으로 다시 쓴다
            f.setRequester(requester);
            f.setReceiver(target);
            f.setStatus(Friend.Status.PENDING);
            f.setRequestedAt(LocalDateTime.now());
        } else {
            f = new Friend();
            f.setRequester(requester);
            f.setReceiver(target);
            f.setRequestedAt(LocalDateTime.now());
            friends.save(f);
        }
        notifications.send(target, Notification.Type.FRIEND_REQUEST, "새 친구 요청",
                requester.getNickname() + "님이 친구 요청을 보냈어요.", f.getFriendshipId());
        return new RequestItem(f.getFriendshipId(), MemberDto.Profile.of(target), f.getRequestedAt());
    }

    @Transactional
    public RequestItem accept(Long me, Long friendshipId) {
        Friend f = receivedPending(me, friendshipId);
        f.setStatus(Friend.Status.ACCEPTED);
        Member receiver = f.getReceiver();
        notifications.send(f.getRequester(), Notification.Type.FRIEND_ACCEPTED, "친구 요청 수락",
                receiver.getNickname() + "님과 친구가 되었어요.", f.getFriendshipId());
        return new RequestItem(f.getFriendshipId(), MemberDto.Profile.of(f.getRequester()), f.getRequestedAt());
    }

    @Transactional
    public void reject(Long me, Long friendshipId) {
        receivedPending(me, friendshipId).setStatus(Friend.Status.REJECTED);
    }

    /** 친구 끊기, 또는 내가 보낸 요청 취소 */
    @Transactional
    public void delete(Long me, Long friendshipId) {
        Friend f = friends.findById(friendshipId).filter(found -> found.involves(me))
                .orElseThrow(() -> ApiException.notFound("친구 정보를 찾을 수 없어요."));
        boolean myPendingRequest = f.getStatus() == Friend.Status.PENDING && f.getRequester().getMemberId().equals(me);
        if (f.getStatus() != Friend.Status.ACCEPTED && !myPendingRequest) {
            throw ApiException.badRequest("지울 수 없는 상태예요.");
        }
        friends.delete(f);
    }

    /** 이번 주(월요일부터) 또는 이번 달 친구 랭킹. 나도 포함한다 */
    public List<RankItem> ranking(Long me, String period) {
        Member self = memberService.getActive(me);
        LocalDate today = LocalDate.now();
        LocalDateTime from = "MONTH".equalsIgnoreCase(period)
                ? today.withDayOfMonth(1).atStartOfDay()
                : today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)).atStartOfDay();

        Map<Long, Member> people = new HashMap<>();
        people.put(me, self);
        friends.findAllOf(me, Friend.Status.ACCEPTED).stream().map(f -> f.other(me)).filter(Member::isActive)
                .forEach(m -> people.put(m.getMemberId(), m));

        Map<Long, Object[]> sums = new HashMap<>();
        for (Object[] row : runs.sumByMembers(people.keySet(), from)) {
            sums.put((Long) row[0], row);
        }

        record Row(Member member, BigDecimal km, long count) {
        }
        List<Row> rows = new ArrayList<>();
        for (Member m : people.values()) {
            Object[] s = sums.get(m.getMemberId());
            rows.add(new Row(m, s == null ? BigDecimal.ZERO : (BigDecimal) s[1], s == null ? 0 : (Long) s[2]));
        }
        rows.sort(Comparator.comparing(Row::km).reversed().thenComparing(r -> r.member().getNickname()));

        List<RankItem> result = new ArrayList<>();
        for (int i = 0; i < rows.size(); i++) {
            Row r = rows.get(i);
            result.add(new RankItem(i + 1, MemberDto.Simple.of(r.member()), r.km(), r.count(),
                    r.member().getMemberId().equals(me)));
        }
        return result;
    }

    private Friend receivedPending(Long me, Long friendshipId) {
        Friend f = friends.findById(friendshipId)
                .filter(found -> found.getReceiver().getMemberId().equals(me))
                .orElseThrow(() -> ApiException.notFound("친구 요청을 찾을 수 없어요."));
        if (f.getStatus() != Friend.Status.PENDING) {
            throw ApiException.conflict("이미 처리한 요청이에요.");
        }
        return f;
    }
}
