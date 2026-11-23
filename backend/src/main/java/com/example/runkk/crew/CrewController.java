package com.example.runkk.crew;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
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

@RestController
@RequestMapping("/api/crews")
public class CrewController {

    private final CrewService service;

    public CrewController(CrewService service) {
        this.service = service;
    }

    @GetMapping
    public PageResponse<CrewDto.Summary> list(@RequestParam(required = false) String region,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "false") boolean recruitingOnly,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return service.list(region, keyword, recruitingOnly, page, Math.min(size, 50));
    }

    /** 내 크루 (없으면 crew: null) */
    @GetMapping("/me")
    public CrewDto.MyCrew myCrew(@AuthenticationPrincipal Jwt jwt) {
        return service.myCrew(CurrentUser.id(jwt));
    }

    /** 크루 가입 조건(러닝 5회)을 채웠는지 */
    @GetMapping("/eligibility")
    public CrewDto.Eligibility eligibility(@AuthenticationPrincipal Jwt jwt) {
        return service.eligibility(CurrentUser.id(jwt));
    }

    @GetMapping("/{crewId}")
    public CrewDto.Detail detail(@AuthenticationPrincipal Jwt jwt, @PathVariable Long crewId) {
        return service.detail(CurrentUser.idOrNull(jwt), crewId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CrewDto.Detail create(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody CrewDto.CrewRequest req) {
        return service.create(CurrentUser.id(jwt), req);
    }

    @PutMapping("/{crewId}")
    public CrewDto.Detail update(@AuthenticationPrincipal Jwt jwt, @PathVariable Long crewId,
            @Valid @RequestBody CrewDto.CrewRequest req) {
        return service.update(CurrentUser.id(jwt), crewId, req);
    }

    /** 크루 해체 (크루장) */
    @DeleteMapping("/{crewId}")
    public ResponseEntity<Void> disband(@AuthenticationPrincipal Jwt jwt, @PathVariable Long crewId) {
        service.disband(CurrentUser.id(jwt), crewId);
        return ResponseEntity.noContent().build();
    }

    // ---- 멤버 ----

    /** status=PENDING 이면 가입 신청 목록 (크루장만) */
    @GetMapping("/{crewId}/members")
    public List<CrewDto.MemberItem> members(@AuthenticationPrincipal Jwt jwt, @PathVariable Long crewId,
            @RequestParam(required = false) CrewMember.JoinStatus status) {
        return service.members(CurrentUser.idOrNull(jwt), crewId, status);
    }

    @PostMapping("/{crewId}/join")
    public CrewDto.MyCrew join(@AuthenticationPrincipal Jwt jwt, @PathVariable Long crewId) {
        return service.join(CurrentUser.id(jwt), crewId);
    }

    /** 크루 탈퇴 / 가입 신청 취소 */
    @DeleteMapping("/{crewId}/members/me")
    public ResponseEntity<Void> leave(@AuthenticationPrincipal Jwt jwt, @PathVariable Long crewId) {
        service.leave(CurrentUser.id(jwt), crewId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{crewId}/members/{crewMemberId}/approve")
    public CrewDto.MemberItem approve(@AuthenticationPrincipal Jwt jwt, @PathVariable Long crewId,
            @PathVariable Long crewMemberId) {
        return service.approve(CurrentUser.id(jwt), crewId, crewMemberId);
    }

    @PatchMapping("/{crewId}/members/{crewMemberId}/reject")
    public ResponseEntity<Void> reject(@AuthenticationPrincipal Jwt jwt, @PathVariable Long crewId,
            @PathVariable Long crewMemberId) {
        service.reject(CurrentUser.id(jwt), crewId, crewMemberId);
        return ResponseEntity.noContent().build();
    }

    // ---- 모임 일정 ----

    @GetMapping("/{crewId}/meetups")
    public List<CrewDto.Meetup> meetups(@AuthenticationPrincipal Jwt jwt, @PathVariable Long crewId) {
        return service.upcomingMeetups(CurrentUser.idOrNull(jwt), crewId);
    }

    @PostMapping("/{crewId}/meetups")
    @ResponseStatus(HttpStatus.CREATED)
    public CrewDto.Meetup createMeetup(@AuthenticationPrincipal Jwt jwt, @PathVariable Long crewId,
            @Valid @RequestBody CrewDto.MeetupRequest req) {
        return service.createMeetup(CurrentUser.id(jwt), crewId, req);
    }

    /** 참석 / 불참 표시 */
    @PutMapping("/meetups/{meetupId}/attendance")
    public CrewDto.Meetup attend(@AuthenticationPrincipal Jwt jwt, @PathVariable Long meetupId,
            @Valid @RequestBody CrewDto.AttendanceRequest req) {
        return service.attend(CurrentUser.id(jwt), meetupId, req.status());
    }

    // ---- 공지 ----

    @GetMapping("/{crewId}/notices")
    public PageResponse<CrewDto.Notice> notices(@PathVariable Long crewId,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return service.notices(crewId, page, Math.min(size, 50));
    }

    @PostMapping("/{crewId}/notices")
    @ResponseStatus(HttpStatus.CREATED)
    public CrewDto.Notice createNotice(@AuthenticationPrincipal Jwt jwt, @PathVariable Long crewId,
            @Valid @RequestBody CrewDto.NoticeRequest req) {
        return service.createNotice(CurrentUser.id(jwt), crewId, req);
    }

    @DeleteMapping("/notices/{noticeId}")
    public ResponseEntity<Void> deleteNotice(@AuthenticationPrincipal Jwt jwt, @PathVariable Long noticeId) {
        service.deleteNotice(CurrentUser.id(jwt), noticeId);
        return ResponseEntity.noContent().build();
    }
}
