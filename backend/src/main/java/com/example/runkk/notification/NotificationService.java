package com.example.runkk.notification;

import java.time.LocalDateTime;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.runkk.common.ApiException;
import com.example.runkk.common.PageResponse;
import com.example.runkk.member.Member;
import com.example.runkk.member.MemberService;
import com.example.runkk.member.MemberSettings;

@Service
@Transactional(readOnly = true)
public class NotificationService {

    private final NotificationRepository repo;
    private final MemberService memberService;

    public NotificationService(NotificationRepository repo, MemberService memberService) {
        this.repo = repo;
        this.memberService = memberService;
    }

    public record Item(Long notificationId, Notification.Type type, String title, String content, Long targetId,
            boolean read, LocalDateTime createdAt) {

        static Item of(Notification n) {
            return new Item(n.getNotificationId(), n.getType(), n.getTitle(), n.getContent(), n.getTargetId(),
                    n.isRead(), n.getCreatedAt());
        }
    }

    /**
     * 알림 만들기. 받는 사람이 그 종류의 알림을 꺼 두었으면 만들지 않는다.
     * 다른 기능(친구 요청, 댓글 등)의 저장과 같은 트랜잭션 안에서 불린다.
     */
    @Transactional
    public void send(Member receiver, Notification.Type type, String title, String content, Long targetId) {
        if (receiver == null || !receiver.isActive() || !wants(memberService.settingsOf(receiver), type)) {
            return;
        }
        Notification n = new Notification();
        n.setMember(receiver);
        n.setType(type);
        n.setTitle(title);
        n.setContent(content);
        n.setTargetId(targetId);
        repo.save(n);
    }

    private static boolean wants(MemberSettings s, Notification.Type type) {
        return switch (type) {
            case FRIEND_REQUEST, FRIEND_ACCEPTED -> s.isNotifyFriendRequest();
            case RUN_INVITE, RUN_INVITE_ACCEPTED -> s.isNotifyRunInvite();
            case CREW_JOIN_REQUEST, CREW_APPROVED -> s.isNotifyCrewMember();
            case CREW_NOTICE -> s.isNotifyCrewNotice();
            case CREW_MEETUP -> s.isNotifyCrewSchedule();
            case COMMENT -> s.isNotifyComment();
            case LIKE -> s.isNotifyLike();
        };
    }

    public PageResponse<Item> list(Long memberId, int page, int size) {
        return PageResponse.of(repo.findByMemberMemberIdOrderByCreatedAtDesc(memberId, PageRequest.of(page, size)),
                Item::of);
    }

    public long unreadCount(Long memberId) {
        return repo.countByMemberMemberIdAndIsReadFalse(memberId);
    }

    @Transactional
    public void read(Long memberId, Long notificationId) {
        Notification n = repo.findById(notificationId)
                .filter(found -> found.getMember().getMemberId().equals(memberId))
                .orElseThrow(() -> ApiException.notFound("알림을 찾을 수 없어요."));
        n.setRead(true);
    }

    @Transactional
    public void readAll(Long memberId) {
        repo.markAllRead(memberId);
    }
}
