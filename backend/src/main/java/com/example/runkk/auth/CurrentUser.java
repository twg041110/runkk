package com.example.runkk.auth;

import org.springframework.security.oauth2.jwt.Jwt;

import com.example.runkk.common.ApiException;

/** 컨트롤러에서 받은 토큰(@AuthenticationPrincipal Jwt)으로 지금 로그인한 회원 번호를 꺼낸다 */
public final class CurrentUser {

    private CurrentUser() {
    }

    /** 로그인이 꼭 필요한 기능 */
    public static Long id(Jwt jwt) {
        if (jwt == null) {
            throw ApiException.unauthorized("로그인이 필요해요.");
        }
        return Long.valueOf(jwt.getSubject());
    }

    /** 로그인 안 해도 되는 기능 (로그인했으면 '저장함', '좋아요함' 표시에 쓴다) */
    public static Long idOrNull(Jwt jwt) {
        return jwt == null ? null : Long.valueOf(jwt.getSubject());
    }
}
