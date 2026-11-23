package com.example.runkk.post;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.example.runkk.auth.CurrentUser;
import com.example.runkk.common.PageResponse;

import jakarta.validation.Valid;

/** 커뮤니티. 글 읽기는 로그인 없이, 쓰기·좋아요·댓글은 로그인해야 한다 */
@RestController
@RequestMapping("/api/posts")
public class PostController {

    private final PostService service;

    public PostController(PostService service) {
        this.service = service;
    }

    @GetMapping
    public PageResponse<PostDto.Summary> list(@AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) Post.BoardType board, @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "latest") String sort, @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return service.list(CurrentUser.idOrNull(jwt), board, keyword, sort, page, Math.min(size, 50));
    }

    /** 내가 쓴 글 */
    @GetMapping("/me")
    public PageResponse<PostDto.Summary> myPosts(@AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return service.myPosts(CurrentUser.id(jwt), page, Math.min(size, 50));
    }

    @GetMapping("/{postId}")
    public PostDto.Detail detail(@AuthenticationPrincipal Jwt jwt, @PathVariable Long postId) {
        return service.detail(CurrentUser.idOrNull(jwt), postId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PostDto.Detail create(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody PostDto.PostRequest req) {
        return service.create(CurrentUser.id(jwt), req);
    }

    @PutMapping("/{postId}")
    public PostDto.Detail update(@AuthenticationPrincipal Jwt jwt, @PathVariable Long postId,
            @Valid @RequestBody PostDto.PostRequest req) {
        return service.update(CurrentUser.id(jwt), postId, req);
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal Jwt jwt, @PathVariable Long postId) {
        service.delete(CurrentUser.id(jwt), postId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{postId}/like")
    public PostDto.LikeResult like(@AuthenticationPrincipal Jwt jwt, @PathVariable Long postId) {
        return service.like(CurrentUser.id(jwt), postId);
    }

    @DeleteMapping("/{postId}/like")
    public PostDto.LikeResult unlike(@AuthenticationPrincipal Jwt jwt, @PathVariable Long postId) {
        return service.unlike(CurrentUser.id(jwt), postId);
    }

    @GetMapping("/{postId}/comments")
    public List<PostDto.CommentItem> comments(@AuthenticationPrincipal Jwt jwt, @PathVariable Long postId) {
        return service.comments(CurrentUser.idOrNull(jwt), postId);
    }

    @PostMapping("/{postId}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public PostDto.CommentItem addComment(@AuthenticationPrincipal Jwt jwt, @PathVariable Long postId,
            @Valid @RequestBody PostDto.CommentRequest req) {
        return service.addComment(CurrentUser.id(jwt), postId, req);
    }

    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(@AuthenticationPrincipal Jwt jwt, @PathVariable Long commentId) {
        service.deleteComment(CurrentUser.id(jwt), commentId);
        return ResponseEntity.noContent().build();
    }
}
