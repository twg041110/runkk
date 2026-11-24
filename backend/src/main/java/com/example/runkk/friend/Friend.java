package com.example.runkk.friend;

import java.time.LocalDateTime;

import com.example.runkk.member.Member;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** 친구 관계 (ERD: friend). 두 사람 사이에는 한 줄만 둔다 (요청한 사람 → 받은 사람) */
@Entity
@Table(name = "friend", uniqueConstraints = @UniqueConstraint(columnNames = { "requester_id", "receiver_id" }))
@Getter
@Setter
@NoArgsConstructor
public class Friend {

    public enum Status {
        PENDING, ACCEPTED, REJECTED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long friendshipId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "requester_id")
    private Member requester;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "receiver_id")
    private Member receiver;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.PENDING;

    private LocalDateTime requestedAt;

    /** 이 관계에서 me 가 아닌 쪽 */
    public Member other(Long me) {
        return requester.getMemberId().equals(me) ? receiver : requester;
    }

    public boolean involves(Long memberId) {
        return requester.getMemberId().equals(memberId) || receiver.getMemberId().equals(memberId);
    }
}
