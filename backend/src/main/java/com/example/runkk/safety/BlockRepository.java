package com.example.runkk.safety;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BlockRepository extends JpaRepository<Block, Long> {

    boolean existsByBlockerMemberIdAndBlockedMemberId(Long blockerId, Long blockedId);

    Optional<Block> findByBlockerMemberIdAndBlockedMemberId(Long blockerId, Long blockedId);

    @Query("select b from Block b join fetch b.blocked where b.blocker.memberId = :memberId order by b.createdAt desc")
    List<Block> findMyBlocks(@Param("memberId") Long memberId);

    /** 내가 차단한 사람 번호 (게시글·댓글 목록에서 숨길 때 쓴다) */
    @Query("select b.blocked.memberId from Block b where b.blocker.memberId = :memberId")
    List<Long> findBlockedIds(@Param("memberId") Long memberId);

    /** 둘 중 한 명이라도 상대를 차단했는지 */
    default boolean blockedEitherWay(Long a, Long b) {
        return existsByBlockerMemberIdAndBlockedMemberId(a, b) || existsByBlockerMemberIdAndBlockedMemberId(b, a);
    }
}
