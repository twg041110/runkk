package com.example.runkk.auth;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

/** 회원가입, 로그인 (로그인 없이 부를 수 있다) */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService service;

    public AuthController(AuthService service) {
        this.service = service;
    }

    @PostMapping("/signup")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthDto.TokenResponse signup(@Valid @RequestBody AuthDto.SignupRequest req) {
        return service.signup(req);
    }

    @PostMapping("/login")
    public AuthDto.TokenResponse login(@Valid @RequestBody AuthDto.LoginRequest req) {
        return service.login(req);
    }

    @GetMapping("/check-email")
    public AuthDto.AvailableResponse checkEmail(@RequestParam String email) {
        return new AuthDto.AvailableResponse(service.emailAvailable(email));
    }

    @GetMapping("/check-nickname")
    public AuthDto.AvailableResponse checkNickname(@RequestParam String nickname) {
        return new AuthDto.AvailableResponse(service.nicknameAvailable(nickname));
    }
}
