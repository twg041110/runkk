package com.example.runkk.member;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.runkk.auth.CurrentUser;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/members")
public class MemberController {

    private final MemberService service;

    public MemberController(MemberService service) {
        this.service = service;
    }

    @GetMapping("/me")
    public MemberDto.Me me(@AuthenticationPrincipal Jwt jwt) {
        return service.me(CurrentUser.id(jwt));
    }

    @PatchMapping("/me")
    public MemberDto.Me update(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody MemberDto.UpdateRequest req) {
        return service.update(CurrentUser.id(jwt), req);
    }

    /** 회원 탈퇴 */
    @DeleteMapping("/me")
    public ResponseEntity<Void> withdraw(@AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody(required = false) MemberDto.WithdrawRequest req) {
        service.withdraw(CurrentUser.id(jwt), req == null ? null : req.reason());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me/settings")
    public MemberDto.Settings settings(@AuthenticationPrincipal Jwt jwt) {
        return service.settings(CurrentUser.id(jwt));
    }

    @PatchMapping("/me/settings")
    public MemberDto.Settings updateSettings(@AuthenticationPrincipal Jwt jwt,
            @RequestBody MemberDto.SettingsUpdate req) {
        return service.updateSettings(CurrentUser.id(jwt), req);
    }

    /** 닉네임으로 회원 찾기 (친구 추가 화면) */
    @GetMapping("/search")
    public List<MemberDto.Profile> search(@AuthenticationPrincipal Jwt jwt, @RequestParam String nickname) {
        CurrentUser.id(jwt);
        return service.search(nickname);
    }

    @GetMapping("/{memberId}")
    public MemberDto.Profile profile(@PathVariable Long memberId) {
        return service.profile(memberId);
    }
}
