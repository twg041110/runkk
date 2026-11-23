package com.example.runkk.crew;

import java.time.LocalDateTime;
import java.time.LocalTime;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** 크루 (ERD: crew) */
@Entity
@Table(name = "crew")
@Getter
@Setter
@NoArgsConstructor
public class Crew {

    /** 가입 방식: 크루장 승인 / 바로 가입 */
    public enum JoinType {
        APPROVAL, AUTO
    }

    public enum GenderLimit {
        NONE, FEMALE, MALE
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long crewId;

    @Column(nullable = false, unique = true, length = 30)
    private String name;

    @Column(length = 500)
    private String intro;

    @Column(length = 50)
    private String region;

    @Column(length = 100)
    private String meetingPlace;

    private Double meetingLat;

    private Double meetingLng;

    /** 평균 페이스 (1km 당 초). 예: 360 = 6'00" */
    private Integer avgPaceSec;

    /** 정기 모임 요일 (예: "화,목") */
    @Column(length = 30)
    private String meetingDays;

    private LocalTime meetingTime;

    private Integer maxMembers;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private JoinType joinType = JoinType.APPROVAL;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private GenderLimit genderLimit = GenderLimit.NONE;

    private Integer minAge;

    private Integer maxAge;

    private boolean isRecruiting = true;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
