package com.example.runkk.common;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

import com.example.runkk.member.MemberRepository;

/**
 * 개발용 예시 데이터 (runkk.seed=true, local 프로필)
 * 예시 계정 · 크루 · 게시글은 들어가고, 코스는 실제로 그린 courses.json 코스만 있어야 한다 (가짜 예시 코스 없음).
 * DB는 MySQL 대신 메모리 H2를 쓴다.
 */
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:seedtest;MODE=MySQL;DATABASE_TO_LOWER=TRUE;CASE_INSENSITIVE_IDENTIFIERS=TRUE",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.show-sql=false",
        "runkk.seed=true" })
@AutoConfigureMockMvc
class LocalSeedDataTest {

    @Autowired
    MockMvc mvc;

    @Autowired
    MemberRepository members;

    @Test
    @DisplayName("예시 데이터를 켜도 코스는 courses.json 코스만 있다")
    void onlyRealCourses() throws Exception {
        mvc.perform(get("/api/courses"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].name").value("암사동 한강 편의점 왕복"));
    }

    @Test
    @DisplayName("예시 계정은 그대로 들어간다")
    void demoMemberSeeded() {
        assertThat(members.existsByEmail("demo@runkk.app")).isTrue();
    }
}
