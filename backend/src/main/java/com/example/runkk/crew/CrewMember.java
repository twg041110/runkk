package com.example.runkk.crew;

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

/** 크루 회원 (ERD: crew_member). 가입 신청부터 탈퇴까지 상태로 관리한다 */
@Entity
@Table(name = "crew_member", uniqueConstraints = @UniqueConstraint(columnNames = { "crew_id", "member_id" }))
@Getter
@Setter
@NoArgsConstructor
public class CrewMember {

    /** 크루장 / 멤버 */
    public enum Role {
        LEADER, MEMBER
    }

    public enum JoinStatus {
        PENDING, JOINED, REJECTED, LEFT
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long crewMemberId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "crew_id")
    private Crew crew;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id")
    private Member member;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role = Role.MEMBER;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private JoinStatus joinStatus = JoinStatus.PENDING;

    /** 신청한 시각. 승인되면 가입한 시각으로 바뀐다 */
    private LocalDateTime joinedAt;

    public boolean isLeader() {
        return role == Role.LEADER && joinStatus == JoinStatus.JOINED;
    }
}
