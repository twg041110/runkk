package com.example.runkk.course;

import java.math.BigDecimal;

import com.example.runkk.member.Member;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** 러닝 코스 (ERD: course). 운영자가 넣어 두는 데이터 */
@Entity
@Table(name = "course")
@Getter
@Setter
@NoArgsConstructor
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long courseId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 1000)
    private String description;

    @Column(length = 50)
    private String region;

    @Column(length = 100)
    private String startPlace;

    private Double startLat;

    private Double startLng;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Member.Level difficulty;

    @Column(precision = 5, scale = 2)
    private BigDecimal distanceKm;

    private Integer expectedMinutes;

    /** 누적 오르막 높이(m) */
    private Integer elevationM;

    /** 출발점으로 돌아오는 순환 코스인지 */
    private boolean isLoop;

    @Column(length = 500)
    private String beginnerTip;

    /** 지도에 그릴 경로. [[위도,경도],...] 모양의 JSON 글자 */
    @Lob
    private String routeData;

    /** 추천 달 (예: "4,5,10") */
    @Column(length = 50)
    private String recommendedMonth;
}
