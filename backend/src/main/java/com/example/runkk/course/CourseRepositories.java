package com.example.runkk.course;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.runkk.member.Member;

/** 코스 관련 저장소 모음 */
public final class CourseRepositories {

    private CourseRepositories() {
    }

    public interface CourseRepository extends JpaRepository<Course, Long> {

        /** 비어 있는(null) 조건은 무시하고 찾는다 */
        @Query("""
                select c from Course c
                where (:region is null or c.region = :region)
                  and (:difficulty is null or c.difficulty = :difficulty)
                  and (:maxKm is null or c.distanceKm <= :maxKm)
                  and (:keyword is null or c.name like concat('%', :keyword, '%') or c.startPlace like concat('%', :keyword, '%'))
                order by c.courseId
                """)
        Page<Course> search(@Param("region") String region, @Param("difficulty") Member.Level difficulty,
                @Param("maxKm") BigDecimal maxKm, @Param("keyword") String keyword, Pageable pageable);
    }

    public interface CourseFeatureRepository extends JpaRepository<CourseFeature, Long> {

        List<CourseFeature> findByCourseCourseIdIn(Collection<Long> courseIds);
    }

    public interface CourseReviewRepository extends JpaRepository<CourseReview, Long> {

        @Query(value = "select r from CourseReview r join fetch r.member where r.course.courseId = :courseId order by r.createdAt desc",
                countQuery = "select count(r) from CourseReview r where r.course.courseId = :courseId")
        Page<CourseReview> findByCourse(@Param("courseId") Long courseId, Pageable pageable);

        /** [코스번호, 평균별점, 후기수] */
        @Query("select r.course.courseId, avg(r.rating), count(r) from CourseReview r where r.course.courseId in :ids group by r.course.courseId")
        List<Object[]> stats(@Param("ids") Collection<Long> courseIds);
    }

    public interface SavedCourseRepository extends JpaRepository<SavedCourse, Long> {

        Optional<SavedCourse> findByMemberMemberIdAndCourseCourseId(Long memberId, Long courseId);

        @Query("select s.course.courseId from SavedCourse s where s.member.memberId = :memberId and s.course.courseId in :ids")
        List<Long> savedIds(@Param("memberId") Long memberId, @Param("ids") Collection<Long> courseIds);

        @Query(value = "select s from SavedCourse s join fetch s.course where s.member.memberId = :memberId order by s.savedAt desc",
                countQuery = "select count(s) from SavedCourse s where s.member.memberId = :memberId")
        Page<SavedCourse> findMine(@Param("memberId") Long memberId, Pageable pageable);

        @Modifying
        @Query("delete from SavedCourse s where s.member.memberId = :memberId and s.course.courseId = :courseId")
        int deleteMine(@Param("memberId") Long memberId, @Param("courseId") Long courseId);
    }
}
