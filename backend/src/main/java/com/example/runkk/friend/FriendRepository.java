package com.example.runkk.friend;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FriendRepository extends JpaRepository<Friend, Long> {

    /** 두 사람 사이의 관계 (방향 상관없이) */
    @Query("""
            select f from Friend f
            where (f.requester.memberId = :a and f.receiver.memberId = :b)
               or (f.requester.memberId = :b and f.receiver.memberId = :a)
            """)
    List<Friend> findBetween(@Param("a") Long a, @Param("b") Long b);

    /** member 가 들어 있는 관계 중 특정 상태인 것 (양쪽 회원 정보를 같이 불러온다) */
    @Query("""
            select f from Friend f join fetch f.requester join fetch f.receiver
            where f.status = :status and (f.requester.memberId = :memberId or f.receiver.memberId = :memberId)
            """)
    List<Friend> findAllOf(@Param("memberId") Long memberId, @Param("status") Friend.Status status);

    @Query("""
            select f from Friend f join fetch f.requester
            where f.receiver.memberId = :memberId and f.status = :status order by f.requestedAt desc
            """)
    List<Friend> findReceived(@Param("memberId") Long memberId, @Param("status") Friend.Status status);

    @Query("""
            select f from Friend f join fetch f.receiver
            where f.requester.memberId = :memberId and f.status = :status order by f.requestedAt desc
            """)
    List<Friend> findSent(@Param("memberId") Long memberId, @Param("status") Friend.Status status);

    default boolean areFriends(Long a, Long b) {
        return findBetween(a, b).stream().anyMatch(f -> f.getStatus() == Friend.Status.ACCEPTED);
    }
}
