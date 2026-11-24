package com.example.runkk.notification;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import com.example.runkk.member.Member;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** 알림 (ERD: notification). targetId 는 type 에 따라 친구요청/초대/크루/게시글 번호를 가리킨다 */
@Entity
@Table(name = "notification", indexes = @Index(columnList = "member_id,createdAt"))
@Getter
@Setter
@NoArgsConstructor
public class Notification {

    public enum Type {
        FRIEND_REQUEST, FRIEND_ACCEPTED,
        RUN_INVITE, RUN_INVITE_ACCEPTED,
        CREW_JOIN_REQUEST, CREW_APPROVED, CREW_NOTICE, CREW_MEETUP,
        COMMENT, LIKE
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long notificationId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id")
    private Member member;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private Type type;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(length = 300)
    private String content;

    private Long targetId;

    private boolean isRead;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
