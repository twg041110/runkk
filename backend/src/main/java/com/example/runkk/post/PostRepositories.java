package com.example.runkk.post;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** 커뮤니티 관련 저장소 모음 */
public final class PostRepositories {

    private PostRepositories() {
    }

    public interface PostRepository extends JpaRepository<Post, Long> {

        String FILTER = """
                from Post p
                where (:board is null or p.boardType = :board)
                  and (:keyword is null or p.title like concat('%', :keyword, '%') or p.content like concat('%', :keyword, '%'))
                  and p.member.memberId not in :hidden
                """;

        @Query(value = "select p " + FILTER + " order by p.createdAt desc", countQuery = "select count(p) " + FILTER)
        Page<Post> latest(@Param("board") Post.BoardType board, @Param("keyword") String keyword,
                @Param("hidden") Collection<Long> hiddenMemberIds, Pageable pageable);

        /** 인기순: 좋아요 수가 많은 순, 같으면 최신순 */
        @Query(value = "select p " + FILTER
                + " order by (select count(l) from PostLike l where l.post = p) desc, p.createdAt desc",
                countQuery = "select count(p) " + FILTER)
        Page<Post> popular(@Param("board") Post.BoardType board, @Param("keyword") String keyword,
                @Param("hidden") Collection<Long> hiddenMemberIds, Pageable pageable);

        Page<Post> findByMemberMemberIdOrderByCreatedAtDesc(Long memberId, Pageable pageable);

        @Modifying
        @Query("update Post p set p.viewCount = p.viewCount + 1 where p.postId = :postId")
        void increaseView(@Param("postId") Long postId);

        @Modifying
        @Query("update Post p set p.record = null where p.record.recordId = :recordId")
        void detachRecord(@Param("recordId") Long recordId);
    }

    public interface CommentRepository extends JpaRepository<Comment, Long> {

        @Query("select c from Comment c left join fetch c.member left join fetch c.parent where c.post.postId = :postId order by c.createdAt asc")
        List<Comment> findByPost(@Param("postId") Long postId);

        /** [글번호, 댓글 수] (지운 댓글 제외) */
        @Query("select c.post.postId, count(c) from Comment c where c.post.postId in :ids and c.isDeleted = false group by c.post.postId")
        List<Object[]> countByPosts(@Param("ids") Collection<Long> postIds);

        @Modifying
        @Query("delete from Comment c where c.post.postId = :postId and c.parent is not null")
        void deleteRepliesOfPost(@Param("postId") Long postId);

        @Modifying
        @Query("delete from Comment c where c.post.postId = :postId")
        void deleteByPost(@Param("postId") Long postId);
    }

    public interface PostLikeRepository extends JpaRepository<PostLike, Long> {

        Optional<PostLike> findByPostPostIdAndMemberMemberId(Long postId, Long memberId);

        long countByPostPostId(Long postId);

        /** [글번호, 좋아요 수] */
        @Query("select l.post.postId, count(l) from PostLike l where l.post.postId in :ids group by l.post.postId")
        List<Object[]> countByPosts(@Param("ids") Collection<Long> postIds);

        @Query("select l.post.postId from PostLike l where l.member.memberId = :memberId and l.post.postId in :ids")
        List<Long> likedIds(@Param("memberId") Long memberId, @Param("ids") Collection<Long> postIds);

        @Modifying
        @Query("delete from PostLike l where l.post.postId = :postId")
        void deleteByPost(@Param("postId") Long postId);
    }

    public interface PostImageRepository extends JpaRepository<PostImage, Long> {

        @Query("select i from PostImage i where i.post.postId in :ids order by i.post.postId, i.sortOrder")
        List<PostImage> findByPosts(@Param("ids") Collection<Long> postIds);

        @Modifying
        @Query("delete from PostImage i where i.post.postId = :postId")
        void deleteByPost(@Param("postId") Long postId);
    }
}
