package com.example.runkk.member;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.Year;

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

/** 회원 (ERD: member) */
@Entity
@Table(name = "member")
@Getter
@Setter
@NoArgsConstructor
public class Member {

    public enum Gender {
        MALE, FEMALE
    }

    /** 러닝 레벨. 코스 난이도에도 같이 쓴다 */
    public enum Level {
        BEGINNER, INTERMEDIATE, ADVANCED
    }

    public enum Status {
        ACTIVE, WITHDRAWN
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long memberId;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    /** BCrypt 로 바꾼 비밀번호. 원래 비밀번호는 어디에도 저장하지 않는다 */
    @Column(nullable = false, length = 100)
    private String password;

    @Column(nullable = false, length = 30)
    private String nickname;

    @Column(length = 500)
    private String profileImageUrl;

    @Column(length = 200)
    private String bio;

    @Column(length = 50)
    private String region;

    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    private Gender gender;

    private Integer birthYear;

    @Column(precision = 5, scale = 1)
    private BigDecimal heightCm;

    @Column(precision = 5, scale = 1)
    private BigDecimal weightKg;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Level level = Level.BEGINNER;

    /** 친구 추가용 코드 (예: RKK-7Q2M) */
    @Column(nullable = false, unique = true, length = 20)
    private String friendCode;

    @Column(precision = 5, scale = 1)
    private BigDecimal weeklyGoalKm;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.ACTIVE;

    @Column(length = 300)
    private String withdrawReason;

    private LocalDateTime withdrawnAt;

    private LocalDateTime lastLoginAt;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    public boolean isActive() {
        return status == Status.ACTIVE;
    }

    /** 연 나이 (크루 나이 제한 확인용). 출생연도가 없으면 null */
    public Integer age() {
        return birthYear == null ? null : Year.now().getValue() - birthYear + 1;
    }
}
