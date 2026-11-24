package com.example.runkk.course;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import com.example.runkk.member.Member;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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

/** 저장한 코스 (ERD: saved_course) */
@Entity
@Table(name = "saved_course", uniqueConstraints = @UniqueConstraint(columnNames = { "member_id", "course_id" }))
@Getter
@Setter
@NoArgsConstructor
public class SavedCourse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long savedId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id")
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_id")
    private Course course;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime savedAt;

    public SavedCourse(Member member, Course course) {
        this.member = member;
        this.course = course;
    }
}
