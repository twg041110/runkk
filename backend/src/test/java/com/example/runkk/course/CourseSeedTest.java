package com.example.runkk.course;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

import com.example.runkk.course.CourseRepositories.CourseRepository;

import tools.jackson.databind.json.JsonMapper;

/**
 * 코스 기본 데이터 (resources/courses.json)
 * 서버가 켜지면 courses.json의 코스가 DB에 들어가고, 다시 켜도 같은 코스가 두 번 들어가지 않는지 확인한다.
 * DB는 MySQL 대신 메모리 H2를 쓴다.
 */
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:coursetest;MODE=MySQL;DATABASE_TO_LOWER=TRUE;CASE_INSENSITIVE_IDENTIFIERS=TRUE",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.show-sql=false" })
@AutoConfigureMockMvc
class CourseSeedTest {

    private static final String NAME = "암사동 한강 편의점 왕복";

    @Autowired
    MockMvc mvc;

    @Autowired
    CourseRepository courses;

    @Autowired
    CourseSeedData seed;

    @Autowired
    JsonMapper json;

    private Course find() {
        return courses.findAll().stream().filter(c -> c.getName().equals(NAME)).findFirst().orElseThrow();
    }

    @Test
    @DisplayName("서버가 켜지면 courses.json의 코스가 목록 API에 나온다")
    void seededCourseAppearsInList() throws Exception {
        mvc.perform(get("/api/courses").param("keyword", "암사동"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].name").value(NAME))
                .andExpect(jsonPath("$.content[0].difficulty").value("BEGINNER"))
                .andExpect(jsonPath("$.content[0].distanceKm").value(3.18))
                .andExpect(jsonPath("$.content[0].loop").value(true))
                .andExpect(jsonPath("$.content[0].features[0].name").value("편의점"));
    }

    @Test
    @DisplayName("왕복 경로: 출발점에서 시작해 반환점을 찍고 출발점으로 돌아온다")
    void routeIsRoundTrip() throws Exception {
        Course c = find();
        List<List<Double>> route = json.readValue(c.getRouteData(),
                json.getTypeFactory().constructCollectionType(List.class,
                        json.getTypeFactory().constructCollectionType(List.class, Double.class)));
        List<Double> first = route.get(0);
        List<Double> last = route.get(route.size() - 1);
        assertThat(first).containsExactly(c.getStartLat(), c.getStartLng());
        assertThat(last).isEqualTo(first);
        assertThat(route).hasSize(11 * 2 - 1); // 가는 길 11점 + 돌아오는 길 10점 (반환점은 한 번만)
        assertThat(c.getStartLat()).isBetween(37.5, 37.6); // [위도, 경도] 순서 (GeoJSON의 [경도, 위도]가 아님)
    }

    @Test
    @DisplayName("다시 켜도(한 번 더 실행해도) 같은 코스가 두 번 들어가지 않는다")
    void seedingTwiceDoesNotDuplicate() throws Exception {
        seed.seed();
        assertThat(courses.findAll().stream().filter(c -> c.getName().equals(NAME))).hasSize(1);
    }
}
