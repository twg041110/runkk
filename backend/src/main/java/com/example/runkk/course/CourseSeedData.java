package com.example.runkk.course;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.example.runkk.course.CourseRepositories.CourseFeatureRepository;
import com.example.runkk.course.CourseRepositories.CourseRepository;
import com.example.runkk.member.Member;

import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.json.JsonMapper;

/**
 * 코스 기본 데이터 넣기 (resources/courses.json)
 *
 * 서버가 다 켜진 뒤 courses.json을 읽어서, DB에 같은 이름의 코스가 없으면 넣는다. (AWS 서버 · 내 PC 모두)
 * - 이미 있는 이름은 건너뛰어서, 서버를 다시 켜도 두 번 들어가지 않는다.
 *   그래서 courses.json에서 이미 들어간 코스의 내용을 고쳐도 DB는 바뀌지 않는다.
 * - 새 코스를 넣으려면 courses.json에 한 칸을 더 쓰고 main에 합치면 된다 (서버에 자동 배포되면서 들어감).
 * - 경로(route)는 [[위도, 경도], ...] 순서. 출발 위치(startLat, startLng)는 경로의 첫 점으로 정한다.
 * - local 프로필의 예시 데이터(LocalSeedData)가 먼저 다 들어간 뒤에 실행된다.
 */
@Component
public class CourseSeedData {

    private static final Logger log = LoggerFactory.getLogger(CourseSeedData.class);

    /** courses.json 한 칸의 모양 */
    record SeedCourse(String name, String description, String region, String startPlace, Member.Level difficulty,
            BigDecimal distanceKm, Integer expectedMinutes, Integer elevationM, boolean loop, String beginnerTip,
            String recommendedMonth, List<SeedFeature> features, List<List<Double>> route) {
    }

    record SeedFeature(String type, String name) {
    }

    private final CourseRepository courses;
    private final CourseFeatureRepository features;
    private final JsonMapper json;

    public CourseSeedData(CourseRepository courses, CourseFeatureRepository features, JsonMapper json) {
        this.courses = courses;
        this.features = features;
        this.json = json;
    }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void seed() throws IOException {
        List<SeedCourse> list;
        try (InputStream in = new ClassPathResource("courses.json").getInputStream()) {
            list = json.readValue(in, new TypeReference<List<SeedCourse>>() {
            });
        }

        int added = 0;
        for (SeedCourse s : list) {
            if (courses.existsByName(s.name())) {
                continue;
            }
            Course c = new Course();
            c.setName(s.name());
            c.setDescription(s.description());
            c.setRegion(s.region());
            c.setStartPlace(s.startPlace());
            c.setStartLat(s.route().get(0).get(0));
            c.setStartLng(s.route().get(0).get(1));
            c.setDifficulty(s.difficulty());
            c.setDistanceKm(s.distanceKm());
            c.setExpectedMinutes(s.expectedMinutes());
            c.setElevationM(s.elevationM());
            c.setLoop(s.loop());
            c.setBeginnerTip(s.beginnerTip());
            c.setRecommendedMonth(s.recommendedMonth());
            c.setRouteData(json.writeValueAsString(s.route()));
            courses.save(c);
            s.features().forEach(f -> features.save(new CourseFeature(c, f.type(), f.name())));
            added++;
        }
        if (added > 0) {
            log.info("courses.json에서 코스 {}개를 넣었습니다.", added);
        }
    }
}
