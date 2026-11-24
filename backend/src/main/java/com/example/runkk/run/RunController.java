package com.example.runkk.run;

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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.example.runkk.auth.CurrentUser;
import com.example.runkk.common.PageResponse;

import jakarta.validation.Valid;

/** 러닝 기록과 함께 달리기 초대 (모두 로그인 필요) */
@RestController
public class RunController {

    private final RunService service;

    public RunController(RunService service) {
        this.service = service;
    }

    @PostMapping("/api/runs")
    @ResponseStatus(HttpStatus.CREATED)
    public RunDto.Detail save(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody RunDto.SaveRequest req) {
        return service.save(CurrentUser.id(jwt), req);
    }

    @GetMapping("/api/runs")
    public PageResponse<RunDto.Summary> myRuns(@AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return service.myRuns(CurrentUser.id(jwt), page, Math.min(size, 50));
    }

    /** 이번 주 요약 (요일별 거리, 주간 목표 달성률) */
    @GetMapping("/api/runs/weekly")
    public RunDto.WeeklySummary weekly(@AuthenticationPrincipal Jwt jwt) {
        return service.weekly(CurrentUser.id(jwt));
    }

    @GetMapping("/api/runs/{recordId}")
    public RunDto.Detail detail(@AuthenticationPrincipal Jwt jwt, @PathVariable Long recordId) {
        return service.detail(CurrentUser.id(jwt), recordId);
    }

    @DeleteMapping("/api/runs/{recordId}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal Jwt jwt, @PathVariable Long recordId) {
        service.delete(CurrentUser.id(jwt), recordId);
        return ResponseEntity.noContent().build();
    }

    // ---- 함께 달리기 초대 ----

    @PostMapping("/api/run-invites")
    @ResponseStatus(HttpStatus.CREATED)
    public RunDto.Invite invite(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody RunDto.InviteRequest req) {
        return service.invite(CurrentUser.id(jwt), req);
    }

    @GetMapping("/api/run-invites/received")
    public List<RunDto.Invite> received(@AuthenticationPrincipal Jwt jwt) {
        return service.receivedInvites(CurrentUser.id(jwt));
    }

    @GetMapping("/api/run-invites/sent")
    public List<RunDto.Invite> sent(@AuthenticationPrincipal Jwt jwt) {
        return service.sentInvites(CurrentUser.id(jwt));
    }

    @PatchMapping("/api/run-invites/{inviteId}/accept")
    public RunDto.Invite accept(@AuthenticationPrincipal Jwt jwt, @PathVariable Long inviteId) {
        return service.respond(CurrentUser.id(jwt), inviteId, true);
    }

    @PatchMapping("/api/run-invites/{inviteId}/reject")
    public RunDto.Invite reject(@AuthenticationPrincipal Jwt jwt, @PathVariable Long inviteId) {
        return service.respond(CurrentUser.id(jwt), inviteId, false);
    }

    @PatchMapping("/api/run-invites/{inviteId}/cancel")
    public ResponseEntity<Void> cancel(@AuthenticationPrincipal Jwt jwt, @PathVariable Long inviteId) {
        service.cancelInvite(CurrentUser.id(jwt), inviteId);
        return ResponseEntity.noContent().build();
    }
}
