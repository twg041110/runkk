package com.example.runkk.run;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** 러닝 관련 저장소 모음 */
public final class RunRepositories {

    private RunRepositories() {
    }

    public interface RunRecordRepository extends JpaRepository<RunRecord, Long> {

        Page<RunRecord> findByMemberMemberIdOrderByStartedAtDesc(Long memberId, Pageable pageable);

        List<RunRecord> findByMemberMemberIdAndStartedAtGreaterThanEqualOrderByStartedAtAsc(Long memberId,
                LocalDateTime from);

        /** 크루 가입 조건 확인: 일정 거리 이상 달린 횟수 */
        long countByMemberMemberIdAndDistanceKmGreaterThanEqual(Long memberId, BigDecimal minKm);

        /** [회원번호, 거리 합계, 횟수] — 친구 랭킹 */
        @Query("""
                select r.member.memberId, sum(r.distanceKm), count(r) from RunRecord r
                where r.member.memberId in :ids and r.startedAt >= :from
                group by r.member.memberId
                """)
        List<Object[]> sumByMembers(@Param("ids") Collection<Long> memberIds, @Param("from") LocalDateTime from);

        /** [코스번호, 이번 주 달린 사람 수] */
        @Query("""
                select r.course.courseId, count(distinct r.member.memberId) from RunRecord r
                where r.course.courseId in :ids and r.startedAt >= :from
                group by r.course.courseId
                """)
        List<Object[]> runnersByCourses(@Param("ids") Collection<Long> courseIds, @Param("from") LocalDateTime from);

        @Modifying
        @Query("update RunRecord r set r.meetup = null where r.meetup.meetupId in :ids")
        void detachMeetups(@Param("ids") Collection<Long> meetupIds);
    }

    public interface RoutePointRepository extends JpaRepository<RoutePoint, Long> {

        List<RoutePoint> findByRecordRecordIdOrderByRecordedAtAscPointIdAsc(Long recordId);

        @Modifying
        @Query("delete from RoutePoint p where p.record.recordId = :recordId")
        void deleteByRecord(@Param("recordId") Long recordId);
    }

    public interface RunInviteRepository extends JpaRepository<RunInvite, Long> {

        @Query("select i from RunInvite i join fetch i.inviter left join fetch i.course where i.invitee.memberId = :memberId and i.status in :statuses order by i.runAt asc")
        List<RunInvite> findReceived(@Param("memberId") Long memberId,
                @Param("statuses") Collection<RunInvite.Status> statuses);

        @Query("select i from RunInvite i join fetch i.invitee left join fetch i.course where i.inviter.memberId = :memberId and i.status in :statuses order by i.runAt asc")
        List<RunInvite> findSent(@Param("memberId") Long memberId,
                @Param("statuses") Collection<RunInvite.Status> statuses);
    }
}
