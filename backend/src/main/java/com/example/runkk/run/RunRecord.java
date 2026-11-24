package com.example.runkk.run;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.example.runkk.course.Course;
import com.example.runkk.crew.CrewMeetup;
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

/** 러닝 기록 (ERD: run_record) */
@Entity
@Table(name = "run_record", indexes = @Index(columnList = "member_id,startedAt"))
@Getter
@Setter
@NoArgsConstructor
public class RunRecord {

    /** 자유 / 목표 / 코스 / 친구와 / 크루 모임 */
    public enum RunType {
        FREE, GOAL, COURSE, TOGETHER, CREW
    }

    /** 목표 없음 / 거리(km) / 시간(분) / 거리+시간 */
    public enum GoalType {
        NONE, DISTANCE, TIME, DISTANCE_TIME
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long recordId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id")
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    private Course course;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invite_id")
    private RunInvite invite;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meetup_id")
    private CrewMeetup meetup;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RunType runType = RunType.FREE;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private GoalType goalType = GoalType.NONE;

    /** DISTANCE 면 km, TIME 이면 분 */
    @Column(precision = 6, scale = 2)
    private BigDecimal goalValue;

    @Column(nullable = false, precision = 6, scale = 2)
    private BigDecimal distanceKm;

    @Column(nullable = false)
    private Integer durationSec;

    /** 평균 페이스 (1km 당 초) */
    private Integer avgPaceSec;

    private Integer calories;

    /** 목표 달성률 (%) */
    @Column(precision = 5, scale = 1)
    private BigDecimal completionRate;

    private Boolean goalAchieved;

    @Column(nullable = false)
    private LocalDateTime startedAt;

    private LocalDateTime endedAt;
}
