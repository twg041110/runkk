package com.example.runkk.post;

import java.time.LocalDateTime;
import java.util.List;

import com.example.runkk.member.MemberDto;
import com.example.runkk.run.RunDto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class PostDto {

    private PostDto() {
    }

    /** 목록 카드. 본문은 앞부분만 (preview) */
    public record Summary(Long postId, Post.BoardType boardType, String title, String preview, String thumbnailUrl,
            String runLocation, MemberDto.Simple author, int viewCount, long likeCount, long commentCount,
            boolean liked, LocalDateTime createdAt) {
    }

    public record Detail(Long postId, Post.BoardType boardType, String title, String content, List<String> imageUrls,
            String runLocation, MemberDto.Simple author, RunDto.Summary record, int viewCount, long likeCount,
            long commentCount, boolean liked, boolean mine, LocalDateTime createdAt, LocalDateTime updatedAt) {
    }

    public record PostRequest(
            @NotNull(message = "게시판을 골라 주세요.") Post.BoardType boardType,
            @NotBlank(message = "제목을 입력해 주세요.") @Size(max = 100, message = "제목은 100자까지예요.") String title,
            @NotBlank(message = "내용을 입력해 주세요.") @Size(max = 10000, message = "내용은 10000자까지예요.") String content,
            @Size(max = 100) String runLocation,
            /** 붙일 내 러닝 기록 번호 (없어도 됨) */
            Long recordId,
            @Size(max = 10, message = "사진은 10장까지 올릴 수 있어요.") List<@NotBlank @Size(max = 500) String> imageUrls) {
    }

    /** 댓글은 작성 순서대로 한 줄로 내려준다. parentId 가 있으면 답글이므로 앱에서 그 밑에 붙인다 */
    public record CommentItem(Long commentId, Long parentId, MemberDto.Simple author, String content, boolean ai,
            boolean deleted, boolean mine, LocalDateTime createdAt) {
    }

    public record CommentRequest(
            @NotBlank(message = "댓글 내용을 입력해 주세요.") @Size(max = 1000, message = "댓글은 1000자까지예요.") String content,
            Long parentId) {
    }

    public record LikeResult(boolean liked, long likeCount) {
    }
}
