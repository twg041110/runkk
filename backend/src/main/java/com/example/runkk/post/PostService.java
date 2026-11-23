package com.example.runkk.post;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.runkk.common.ApiException;
import com.example.runkk.common.PageResponse;
import com.example.runkk.member.Member;
import com.example.runkk.member.MemberDto;
import com.example.runkk.member.MemberService;
import com.example.runkk.notification.Notification;
import com.example.runkk.notification.NotificationService;
import com.example.runkk.post.PostRepositories.CommentRepository;
import com.example.runkk.post.PostRepositories.PostImageRepository;
import com.example.runkk.post.PostRepositories.PostLikeRepository;
import com.example.runkk.post.PostRepositories.PostRepository;
import com.example.runkk.run.RunDto;
import com.example.runkk.run.RunRecord;
import com.example.runkk.run.RunRepositories.RunRecordRepository;
import com.example.runkk.safety.BlockRepository;

@Service
@Transactional(readOnly = true)
public class PostService {

    private static final int PREVIEW_LENGTH = 80;
    private static final String DELETED_COMMENT = "삭제된 댓글이에요.";

    private final PostRepository posts;
    private final CommentRepository comments;
    private final PostLikeRepository likes;
    private final PostImageRepository images;
    private final RunRecordRepository records;
    private final BlockRepository blocks;
    private final MemberService memberService;
    private final NotificationService notifications;

    public PostService(PostRepository posts, CommentRepository comments, PostLikeRepository likes,
            PostImageRepository images, RunRecordRepository records, BlockRepository blocks,
            MemberService memberService, NotificationService notifications) {
        this.posts = posts;
        this.comments = comments;
        this.likes = likes;
        this.images = images;
        this.records = records;
        this.blocks = blocks;
        this.memberService = memberService;
        this.notifications = notifications;
    }

    // ===== 글 =====

    /** sort = latest(최신순, 기본) 또는 popular(좋아요순). 내가 차단한 사람의 글은 빼고 보여 준다 */
    public PageResponse<PostDto.Summary> list(Long me, Post.BoardType board, String keyword, String sort, int page,
            int size) {
        String kw = keyword == null || keyword.isBlank() ? null : keyword.trim();
        Pageable pageable = PageRequest.of(page, size);
        List<Long> hidden = hiddenAuthors(me);
        Page<Post> result = "popular".equalsIgnoreCase(sort)
                ? posts.popular(board, kw, hidden, pageable)
                : posts.latest(board, kw, hidden, pageable);
        return toSummaries(me, result);
    }

    public PageResponse<PostDto.Summary> myPosts(Long me, int page, int size) {
        return toSummaries(me, posts.findByMemberMemberIdOrderByCreatedAtDesc(me, PageRequest.of(page, size)));
    }

    /** 글 보기. 볼 때마다 조회수가 1 오른다 */
    @Transactional
    public PostDto.Detail detail(Long me, Long postId) {
        Post p = get(postId);
        posts.increaseView(postId);
        p.setViewCount(p.getViewCount() + 1);
        return toDetail(me, p);
    }

    @Transactional
    public PostDto.Detail create(Long me, PostDto.PostRequest req) {
        Member author = memberService.getActive(me);
        Post p = new Post();
        p.setMember(author);
        apply(me, p, req);
        posts.save(p);
        saveImages(p, req.imageUrls());
        return toDetail(me, p);
    }

    @Transactional
    public PostDto.Detail update(Long me, Long postId, PostDto.PostRequest req) {
        Post p = mine(me, postId);
        apply(me, p, req);
        if (req.imageUrls() != null) {
            images.deleteByPost(postId);
            saveImages(p, req.imageUrls());
        }
        return toDetail(me, p);
    }

    @Transactional
    public void delete(Long me, Long postId) {
        mine(me, postId);
        likes.deleteByPost(postId);
        images.deleteByPost(postId);
        comments.deleteRepliesOfPost(postId);
        comments.deleteByPost(postId);
        posts.deleteById(postId);
    }

    // ===== 좋아요 =====

    @Transactional
    public PostDto.LikeResult like(Long me, Long postId) {
        Member member = memberService.getActive(me);
        Post p = get(postId);
        if (likes.findByPostPostIdAndMemberMemberId(postId, me).isEmpty()) {
            likes.save(new PostLike(p, member));
            if (!p.getMember().getMemberId().equals(me)) {
                notifications.send(p.getMember(), Notification.Type.LIKE, "좋아요",
                        member.getNickname() + "님이 내 글을 좋아해요: " + p.getTitle(), postId);
            }
        }
        return new PostDto.LikeResult(true, likes.countByPostPostId(postId));
    }

    @Transactional
    public PostDto.LikeResult unlike(Long me, Long postId) {
        get(postId);
        likes.findByPostPostIdAndMemberMemberId(postId, me).ifPresent(likes::delete);
        likes.flush();
        return new PostDto.LikeResult(false, likes.countByPostPostId(postId));
    }

    // ===== 댓글 =====

    public List<PostDto.CommentItem> comments(Long me, Long postId) {
        get(postId);
        Set<Long> hidden = new HashSet<>(hiddenAuthors(me));
        return comments.findByPost(postId).stream()
                .filter(c -> c.getMember() == null || !hidden.contains(c.getMember().getMemberId()))
                .map(c -> toComment(c, me)).toList();
    }

    @Transactional
    public PostDto.CommentItem addComment(Long me, Long postId, PostDto.CommentRequest req) {
        Member author = memberService.getActive(me);
        Post p = get(postId);
        Comment c = new Comment();
        c.setPost(p);
        c.setMember(author);
        c.setContent(req.content().trim());
        Member parentAuthor = null;
        if (req.parentId() != null) {
            Comment parent = comments.findById(req.parentId())
                    .filter(found -> found.getPost().getPostId().equals(postId))
                    .orElseThrow(() -> ApiException.notFound("답글을 달 댓글을 찾을 수 없어요."));
            if (parent.getParent() != null) {
                throw ApiException.badRequest("답글에는 다시 답글을 달 수 없어요.");
            }
            if (parent.isDeleted()) {
                throw ApiException.badRequest("삭제된 댓글에는 답글을 달 수 없어요.");
            }
            c.setParent(parent);
            parentAuthor = parent.getMember();
        }
        comments.save(c);

        String preview = c.getContent().length() > 40 ? c.getContent().substring(0, 40) + "…" : c.getContent();
        if (!p.getMember().getMemberId().equals(me)) {
            notifications.send(p.getMember(), Notification.Type.COMMENT, "새 댓글",
                    author.getNickname() + ": " + preview, postId);
        }
        if (parentAuthor != null && !parentAuthor.getMemberId().equals(me)
                && !parentAuthor.getMemberId().equals(p.getMember().getMemberId())) {
            notifications.send(parentAuthor, Notification.Type.COMMENT, "새 답글",
                    author.getNickname() + ": " + preview, postId);
        }
        return toComment(c, me);
    }

    /** 댓글 삭제: 내용만 숨기고 자리는 남긴다 (답글이 붙어 있을 수 있어서) */
    @Transactional
    public void deleteComment(Long me, Long commentId) {
        Comment c = comments.findById(commentId)
                .filter(found -> found.getMember() != null && found.getMember().getMemberId().equals(me))
                .orElseThrow(() -> ApiException.notFound("내가 쓴 댓글을 찾을 수 없어요."));
        c.setDeleted(true);
    }

    // ===== 내부 도우미 =====

    private Post get(Long postId) {
        return posts.findById(postId).orElseThrow(() -> ApiException.notFound("글을 찾을 수 없어요."));
    }

    private Post mine(Long me, Long postId) {
        Post p = get(postId);
        if (!p.getMember().getMemberId().equals(me)) {
            throw ApiException.forbidden("내가 쓴 글만 고치거나 지울 수 있어요.");
        }
        return p;
    }

    /** 'not in' 에 빈 목록을 넣으면 DB 마다 동작이 달라서, 없으면 존재하지 않는 번호 하나를 넣는다 */
    private List<Long> hiddenAuthors(Long me) {
        List<Long> ids = me == null ? new ArrayList<>() : new ArrayList<>(blocks.findBlockedIds(me));
        if (ids.isEmpty()) {
            ids.add(-1L);
        }
        return ids;
    }

    private void apply(Long me, Post p, PostDto.PostRequest req) {
        p.setBoardType(req.boardType());
        p.setTitle(req.title().trim());
        p.setContent(req.content().trim());
        p.setRunLocation(req.runLocation());
        if (req.recordId() != null) {
            RunRecord r = records.findById(req.recordId())
                    .filter(found -> found.getMember().getMemberId().equals(me))
                    .orElseThrow(() -> ApiException.notFound("내 러닝 기록만 붙일 수 있어요."));
            p.setRecord(r);
        } else {
            p.setRecord(null);
        }
    }

    private void saveImages(Post p, List<String> urls) {
        if (urls == null) {
            return;
        }
        for (int i = 0; i < urls.size(); i++) {
            images.save(new PostImage(p, urls.get(i).trim(), i));
        }
    }

    private PageResponse<PostDto.Summary> toSummaries(Long me, Page<Post> page) {
        List<Long> ids = page.getContent().stream().map(Post::getPostId).toList();
        Map<Long, Long> likeCounts = new HashMap<>();
        Map<Long, Long> commentCounts = new HashMap<>();
        Map<Long, String> thumbs = new HashMap<>();
        Set<Long> liked = new HashSet<>();
        if (!ids.isEmpty()) {
            likes.countByPosts(ids).forEach(row -> likeCounts.put((Long) row[0], (Long) row[1]));
            comments.countByPosts(ids).forEach(row -> commentCounts.put((Long) row[0], (Long) row[1]));
            images.findByPosts(ids).forEach(img -> thumbs.putIfAbsent(img.getPost().getPostId(), img.getImageUrl()));
            if (me != null) {
                liked.addAll(likes.likedIds(me, ids));
            }
        }
        return PageResponse.of(page, p -> new PostDto.Summary(p.getPostId(), p.getBoardType(), p.getTitle(),
                preview(p.getContent()), thumbs.get(p.getPostId()), p.getRunLocation(),
                MemberDto.Simple.of(p.getMember()), p.getViewCount(), likeCounts.getOrDefault(p.getPostId(), 0L),
                commentCounts.getOrDefault(p.getPostId(), 0L), liked.contains(p.getPostId()), p.getCreatedAt()));
    }

    private PostDto.Detail toDetail(Long me, Post p) {
        Long id = p.getPostId();
        List<String> urls = images.findByPosts(List.of(id)).stream().map(PostImage::getImageUrl)
                .collect(Collectors.toList());
        long likeCount = likes.countByPostPostId(id);
        long commentCount = comments.countByPosts(List.of(id)).stream().mapToLong(row -> (Long) row[1]).sum();
        boolean liked = me != null && likes.findByPostPostIdAndMemberMemberId(id, me).isPresent();
        return new PostDto.Detail(id, p.getBoardType(), p.getTitle(), p.getContent(), urls, p.getRunLocation(),
                MemberDto.Simple.of(p.getMember()), p.getRecord() == null ? null : RunDto.Summary.of(p.getRecord()),
                p.getViewCount(), likeCount, commentCount, liked,
                me != null && p.getMember().getMemberId().equals(me), p.getCreatedAt(), p.getUpdatedAt());
    }

    private static PostDto.CommentItem toComment(Comment c, Long me) {
        boolean mine = me != null && c.getMember() != null && c.getMember().getMemberId().equals(me);
        return new PostDto.CommentItem(c.getCommentId(), c.getParent() == null ? null : c.getParent().getCommentId(),
                c.isDeleted() ? null : MemberDto.Simple.of(c.getMember()),
                c.isDeleted() ? DELETED_COMMENT : c.getContent(), c.isAi(), c.isDeleted(), mine && !c.isDeleted(),
                c.getCreatedAt());
    }

    private static String preview(String content) {
        String oneLine = content.replaceAll("\\s+", " ").trim();
        return oneLine.length() > PREVIEW_LENGTH ? oneLine.substring(0, PREVIEW_LENGTH) + "…" : oneLine;
    }
}
