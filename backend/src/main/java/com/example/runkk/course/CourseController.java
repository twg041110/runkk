package com.example.runkk.course;

import java.math.BigDecimal;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.example.runkk.auth.CurrentUser;
import com.example.runkk.common.PageResponse;
import com.example.runkk.member.Member;

import jakarta.validation.Valid;

/** 코스 둘러보기는 로그인 없이 되고, 저장·후기는 로그인해야 한다 */
@RestController
@RequestMapping("/api/courses")
public class CourseController {

    private final CourseService service;

    public CourseController(CourseService service) {
        this.service = service;
    }

    @GetMapping
    public PageResponse<CourseService.Summary> list(@AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) String region, @RequestParam(required = false) Member.Level difficulty,
            @RequestParam(required = false) BigDecimal maxKm, @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return service.list(CurrentUser.idOrNull(jwt), region, difficulty, maxKm, keyword, page, Math.min(size, 50));
    }

    /** 내가 저장한 코스 */
    @GetMapping("/saved")
    public PageResponse<CourseService.Summary> saved(@AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return service.savedCourses(CurrentUser.id(jwt), page, Math.min(size, 50));
    }

    @GetMapping("/{courseId}")
    public CourseService.Detail detail(@AuthenticationPrincipal Jwt jwt, @PathVariable Long courseId) {
        return service.detail(CurrentUser.idOrNull(jwt), courseId);
    }

    /** 이 코스에서 나와 친구들의 가장 빠른 기록 (기록 비교 화면) */
    @GetMapping("/{courseId}/records")
    public java.util.List<com.example.runkk.run.RunDto.RecordItem> records(@AuthenticationPrincipal Jwt jwt,
            @PathVariable Long courseId) {
        return service.records(CurrentUser.id(jwt), courseId);
    }

    @PostMapping("/{courseId}/save")
    public ResponseEntity<Void> save(@AuthenticationPrincipal Jwt jwt, @PathVariable Long courseId) {
        service.save(CurrentUser.id(jwt), courseId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{courseId}/save")
    public ResponseEntity<Void> unsave(@AuthenticationPrincipal Jwt jwt, @PathVariable Long courseId) {
        service.unsave(CurrentUser.id(jwt), courseId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{courseId}/reviews")
    public PageResponse<CourseService.Review> reviews(@AuthenticationPrincipal Jwt jwt, @PathVariable Long courseId,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return service.reviews(CurrentUser.idOrNull(jwt), courseId, page, Math.min(size, 50));
    }

    @PostMapping("/{courseId}/reviews")
    @ResponseStatus(HttpStatus.CREATED)
    public CourseService.Review addReview(@AuthenticationPrincipal Jwt jwt, @PathVariable Long courseId,
            @Valid @RequestBody CourseService.ReviewRequest req) {
        return service.addReview(CurrentUser.id(jwt), courseId, req);
    }

    @DeleteMapping("/reviews/{reviewId}")
    public ResponseEntity<Void> deleteReview(@AuthenticationPrincipal Jwt jwt, @PathVariable Long reviewId) {
        service.deleteReview(CurrentUser.id(jwt), reviewId);
        return ResponseEntity.noContent().build();
    }
}
