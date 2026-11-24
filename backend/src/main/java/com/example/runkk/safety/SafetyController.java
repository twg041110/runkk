package com.example.runkk.safety;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.example.runkk.auth.CurrentUser;
import com.example.runkk.member.MemberDto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** 차단과 신고 */
@RestController
public class SafetyController {

    private final SafetyService service;

    public SafetyController(SafetyService service) {
        this.service = service;
    }

    public record BlockItem(Long blockId, MemberDto.Simple member, LocalDateTime createdAt) {
    }

    public record ReportRequest(@NotNull Report.TargetType targetType, @NotNull Long targetId,
            @NotBlank(message = "신고 이유를 적어 주세요.") @Size(max = 500) String reason) {
    }

    @GetMapping("/api/blocks")
    public List<BlockItem> blocks(@AuthenticationPrincipal Jwt jwt) {
        return service.blocks(CurrentUser.id(jwt));
    }

    @PostMapping("/api/blocks/{memberId}")
    @ResponseStatus(HttpStatus.CREATED)
    public BlockItem block(@AuthenticationPrincipal Jwt jwt, @PathVariable Long memberId) {
        return service.block(CurrentUser.id(jwt), memberId);
    }

    @DeleteMapping("/api/blocks/{memberId}")
    public ResponseEntity<Void> unblock(@AuthenticationPrincipal Jwt jwt, @PathVariable Long memberId) {
        service.unblock(CurrentUser.id(jwt), memberId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/api/reports")
    @ResponseStatus(HttpStatus.CREATED)
    public void report(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody ReportRequest req) {
        service.report(CurrentUser.id(jwt), req);
    }
}
