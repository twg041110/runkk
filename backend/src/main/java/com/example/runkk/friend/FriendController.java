package com.example.runkk.friend;

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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.example.runkk.auth.CurrentUser;

@RestController
@RequestMapping("/api/friends")
public class FriendController {

    private final FriendService service;

    public FriendController(FriendService service) {
        this.service = service;
    }

    @GetMapping
    public List<FriendService.FriendItem> list(@AuthenticationPrincipal Jwt jwt) {
        return service.list(CurrentUser.id(jwt));
    }

    /** 친구 랭킹. period = WEEK(기본) 또는 MONTH */
    @GetMapping("/ranking")
    public List<FriendService.RankItem> ranking(@AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "WEEK") String period) {
        return service.ranking(CurrentUser.id(jwt), period);
    }

    @GetMapping("/requests/received")
    public List<FriendService.RequestItem> received(@AuthenticationPrincipal Jwt jwt) {
        return service.received(CurrentUser.id(jwt));
    }

    @GetMapping("/requests/sent")
    public List<FriendService.RequestItem> sent(@AuthenticationPrincipal Jwt jwt) {
        return service.sent(CurrentUser.id(jwt));
    }

    @PostMapping("/requests")
    @ResponseStatus(HttpStatus.CREATED)
    public FriendService.RequestItem request(@AuthenticationPrincipal Jwt jwt,
            @RequestBody FriendService.SendRequest req) {
        return service.request(CurrentUser.id(jwt), req);
    }

    @PatchMapping("/requests/{friendshipId}/accept")
    public FriendService.RequestItem accept(@AuthenticationPrincipal Jwt jwt, @PathVariable Long friendshipId) {
        return service.accept(CurrentUser.id(jwt), friendshipId);
    }

    @PatchMapping("/requests/{friendshipId}/reject")
    public ResponseEntity<Void> reject(@AuthenticationPrincipal Jwt jwt, @PathVariable Long friendshipId) {
        service.reject(CurrentUser.id(jwt), friendshipId);
        return ResponseEntity.noContent().build();
    }

    /** 친구 끊기 / 보낸 요청 취소 */
    @DeleteMapping("/{friendshipId}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal Jwt jwt, @PathVariable Long friendshipId) {
        service.delete(CurrentUser.id(jwt), friendshipId);
        return ResponseEntity.noContent().build();
    }
}
