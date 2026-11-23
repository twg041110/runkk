package com.example.runkk.run;

import java.time.LocalDateTime;

import com.example.runkk.course.Course;
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
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** 친구와 함께 달리기 초대 (ERD: run_invite) */
@Entity
@Table(name = "run_invite")
@Getter
@Setter
@NoArgsConstructor
public class RunInvite {

    public enum Status {
        PENDING, ACCEPTED, REJECTED, CANCELED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long inviteId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "inviter_id")
    private Member inviter;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "invitee_id")
    private Member invitee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    private Course course;

    @Column(nullable = false)
    private LocalDateTime runAt;

    @Column(length = 100)
    private String meetingPlace;

    private Double meetingLat;

    private Double meetingLng;

    /** 목표 페이스 (1km 당 초) */
    private Integer targetPaceSec;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.PENDING;
}
