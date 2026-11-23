package com.example.runkk.crew;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** 크루 관련 저장소 모음 */
public final class CrewRepositories {

    private CrewRepositories() {
    }

    public interface CrewRepository extends JpaRepository<Crew, Long> {

        boolean existsByName(String name);

        @Query("""
                select c from Crew c
                where (:region is null or c.region = :region)
                  and (:keyword is null or c.name like concat('%', :keyword, '%') or c.intro like concat('%', :keyword, '%'))
                  and (:recruitingOnly = false or c.isRecruiting = true)
                order by c.createdAt desc
                """)
        Page<Crew> search(@Param("region") String region, @Param("keyword") String keyword,
                @Param("recruitingOnly") boolean recruitingOnly, Pageable pageable);
    }

    public interface CrewMemberRepository extends JpaRepository<CrewMember, Long> {

        Optional<CrewMember> findByCrewCrewIdAndMemberMemberId(Long crewId, Long memberId);

        /** 회원이 가입했거나 가입 신청 중인 크루 (한 사람은 크루 하나만) */
        @Query("select cm from CrewMember cm join fetch cm.crew where cm.member.memberId = :memberId and cm.joinStatus in :statuses")
        List<CrewMember> findActiveOf(@Param("memberId") Long memberId,
                @Param("statuses") Collection<CrewMember.JoinStatus> statuses);

        @Query("select cm from CrewMember cm join fetch cm.member where cm.crew.crewId = :crewId and cm.joinStatus = :status order by cm.role, cm.joinedAt")
        List<CrewMember> findByCrewAndStatus(@Param("crewId") Long crewId,
                @Param("status") CrewMember.JoinStatus status);

        long countByCrewCrewIdAndJoinStatus(Long crewId, CrewMember.JoinStatus status);

        /** [크루번호, 가입 인원] */
        @Query("select cm.crew.crewId, count(cm) from CrewMember cm where cm.crew.crewId in :ids and cm.joinStatus = :status group by cm.crew.crewId")
        List<Object[]> countByCrews(@Param("ids") Collection<Long> crewIds,
                @Param("status") CrewMember.JoinStatus status);

        @Query("select cm from CrewMember cm join fetch cm.member where cm.crew.crewId = :crewId and cm.role = :role")
        List<CrewMember> findByRole(@Param("crewId") Long crewId, @Param("role") CrewMember.Role role);

        @Modifying(flushAutomatically = true, clearAutomatically = true)
        @Query("delete from CrewMember cm where cm.crew.crewId = :crewId")
        void deleteByCrew(@Param("crewId") Long crewId);
    }

    public interface CrewTagRepository extends JpaRepository<CrewTag, Long> {

        List<CrewTag> findByCrewCrewIdIn(Collection<Long> crewIds);

        @Modifying(flushAutomatically = true, clearAutomatically = true)
        @Query("delete from CrewTag t where t.crew.crewId = :crewId")
        void deleteByCrew(@Param("crewId") Long crewId);
    }

    public interface CrewMeetupRepository extends JpaRepository<CrewMeetup, Long> {

        List<CrewMeetup> findByCrewCrewIdAndRunAtAfterOrderByRunAtAsc(Long crewId, LocalDateTime after);

        Optional<CrewMeetup> findFirstByCrewCrewIdAndRunAtAfterOrderByRunAtAsc(Long crewId, LocalDateTime after);

        @Query("select m.meetupId from CrewMeetup m where m.crew.crewId = :crewId")
        List<Long> findIdsByCrew(@Param("crewId") Long crewId);

        @Modifying(flushAutomatically = true, clearAutomatically = true)
        @Query("delete from CrewMeetup m where m.crew.crewId = :crewId")
        void deleteByCrew(@Param("crewId") Long crewId);
    }

    public interface MeetupAttendanceRepository extends JpaRepository<MeetupAttendance, Long> {

        Optional<MeetupAttendance> findByMeetupMeetupIdAndMemberMemberId(Long meetupId, Long memberId);

        @Query("select a from MeetupAttendance a join fetch a.member where a.meetup.meetupId in :ids")
        List<MeetupAttendance> findByMeetups(@Param("ids") Collection<Long> meetupIds);

        @Modifying(flushAutomatically = true, clearAutomatically = true)
        @Query("delete from MeetupAttendance a where a.meetup.meetupId in :ids")
        void deleteByMeetups(@Param("ids") Collection<Long> meetupIds);
    }

    public interface CrewNoticeRepository extends JpaRepository<CrewNotice, Long> {

        @Query(value = "select n from CrewNotice n join fetch n.writer where n.crew.crewId = :crewId order by n.createdAt desc",
                countQuery = "select count(n) from CrewNotice n where n.crew.crewId = :crewId")
        Page<CrewNotice> findByCrew(@Param("crewId") Long crewId, Pageable pageable);

        @Modifying(flushAutomatically = true, clearAutomatically = true)
        @Query("delete from CrewNotice n where n.crew.crewId = :crewId")
        void deleteByCrew(@Param("crewId") Long crewId);
    }
}
