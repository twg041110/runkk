package com.example.runkk.course;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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

/** 코스 특징 (ERD: course_feature). 예: FACILITY/화장실, SCENERY/야경, SURFACE/우레탄 */
@Entity
@Table(name = "course_feature")
@Getter
@Setter
@NoArgsConstructor
public class CourseFeature {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long featureId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_id")
    private Course course;

    @Column(nullable = false, length = 30)
    private String featureType;

    @Column(nullable = false, length = 50)
    private String featureName;

    public CourseFeature(Course course, String featureType, String featureName) {
        this.course = course;
        this.featureType = featureType;
        this.featureName = featureName;
    }
}
