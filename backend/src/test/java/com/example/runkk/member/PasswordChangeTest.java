package com.example.runkk.member;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

/**
 * 비밀번호 변경 API (PATCH /api/members/me/password)
 * 실제 서버처럼 회원가입 → 토큰 받기 → 비밀번호 변경 → 다시 로그인 순서로 확인한다.
 * DB는 MySQL 대신 메모리 H2를 쓴다.
 */
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:pwtest;MODE=MySQL;DATABASE_TO_LOWER=TRUE;CASE_INSENSITIVE_IDENTIFIERS=TRUE",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.show-sql=false" })
@AutoConfigureMockMvc
class PasswordChangeTest {

    private static final Pattern TOKEN = Pattern.compile("\"accessToken\":\"([^\"]+)\"");

    @Autowired
    MockMvc mvc;

    /** 회원가입하고 받은 토큰을 돌려준다 */
    private String signup(String email, String password) throws Exception {
        String body = """
                {"email":"%s","password":"%s","nickname":"%s","agreedTerms":["SERVICE","PRIVACY","LOCATION","AGE14"]}
                """.formatted(email, password, email.substring(0, email.indexOf('@')));
        String res = mvc.perform(post("/api/auth/signup").contentType(MediaType.APPLICATION_JSON).content(body))
                .andReturn().getResponse().getContentAsString();
        Matcher m = TOKEN.matcher(res);
        assertThat(m.find()).as("회원가입 응답에 토큰이 있어야 함: " + res).isTrue();
        return m.group(1);
    }

    private int login(String email, String password) throws Exception {
        String body = """
                {"email":"%s","password":"%s"}
                """.formatted(email, password);
        return mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(body))
                .andReturn().getResponse().getStatus();
    }

    private static String change(String current, String next) {
        return """
                {"currentPassword":"%s","newPassword":"%s"}
                """.formatted(current, next);
    }

    @Test
    @DisplayName("현재 비밀번호가 맞으면 바뀌고, 새 비밀번호로만 로그인된다")
    void changesPasswordWhenCurrentMatches() throws Exception {
        String token = signup("pwuser1@runkk.app", "oldpass123");

        mvc.perform(patch("/api/members/me/password").header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON).content(change("oldpass123", "newpass456")))
                .andExpect(status().isNoContent());

        assertThat(login("pwuser1@runkk.app", "newpass456")).isEqualTo(200);
        assertThat(login("pwuser1@runkk.app", "oldpass123")).isEqualTo(401);
    }

    @Test
    @DisplayName("현재 비밀번호가 틀리면 400이고 바뀌지 않는다")
    void rejectsWrongCurrentPassword() throws Exception {
        String token = signup("pwuser2@runkk.app", "oldpass123");

        mvc.perform(patch("/api/members/me/password").header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON).content(change("wrongpass1", "newpass456")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("현재 비밀번호가 맞지 않아요."));

        assertThat(login("pwuser2@runkk.app", "oldpass123")).isEqualTo(200);
    }

    @Test
    @DisplayName("새 비밀번호가 규칙(영문+숫자 8자 이상)에 안 맞으면 400")
    void rejectsWeakNewPassword() throws Exception {
        String token = signup("pwuser3@runkk.app", "oldpass123");

        mvc.perform(patch("/api/members/me/password").header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON).content(change("oldpass123", "short1")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.newPassword").exists());
    }

    @Test
    @DisplayName("로그인 없이 부르면 401")
    void requiresLogin() throws Exception {
        mvc.perform(patch("/api/members/me/password")
                .contentType(MediaType.APPLICATION_JSON).content(change("oldpass123", "newpass456")))
                .andExpect(status().isUnauthorized());
    }
}
