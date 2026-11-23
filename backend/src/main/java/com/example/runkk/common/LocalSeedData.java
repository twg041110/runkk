package com.example.runkk.common;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.example.runkk.course.Course;
import com.example.runkk.course.CourseFeature;
import com.example.runkk.course.CourseRepositories.CourseFeatureRepository;
import com.example.runkk.course.CourseRepositories.CourseRepository;
import com.example.runkk.crew.Crew;
import com.example.runkk.crew.CrewMember;
import com.example.runkk.crew.CrewRepositories.CrewMemberRepository;
import com.example.runkk.crew.CrewRepositories.CrewRepository;
import com.example.runkk.crew.CrewRepositories.CrewTagRepository;
import com.example.runkk.crew.CrewTag;
import com.example.runkk.member.Member;
import com.example.runkk.member.MemberRepository;
import com.example.runkk.member.MemberSettings;
import com.example.runkk.member.MemberSettingsRepository;
import com.example.runkk.post.Post;
import com.example.runkk.post.PostRepositories.PostRepository;

/**
 * 개발용 기본 데이터. runkk.seed=true 일 때(local 프로필)만, DB 가 비어 있을 때 한 번 넣는다.
 * 앱을 처음 켰을 때 코스·크루·게시글 목록이 텅 비어 보이지 않게 하려는 것.
 * 예시 계정: demo@runkk.app / runkk1234 (크루장 역할)
 */
@Component
@ConditionalOnProperty(name = "runkk.seed", havingValue = "true")
public class LocalSeedData implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(LocalSeedData.class);

    private final CourseRepository courses;
    private final CourseFeatureRepository features;
    private final MemberRepository members;
    private final MemberSettingsRepository settings;
    private final CrewRepository crews;
    private final CrewMemberRepository crewMembers;
    private final CrewTagRepository crewTags;
    private final PostRepository posts;
    private final PasswordEncoder passwordEncoder;

    public LocalSeedData(CourseRepository courses, CourseFeatureRepository features, MemberRepository members,
            MemberSettingsRepository settings, CrewRepository crews, CrewMemberRepository crewMembers,
            CrewTagRepository crewTags, PostRepository posts, PasswordEncoder passwordEncoder) {
        this.courses = courses;
        this.features = features;
        this.members = members;
        this.settings = settings;
        this.crews = crews;
        this.crewMembers = crewMembers;
        this.crewTags = crewTags;
        this.posts = posts;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (courses.count() > 0) {
            return;
        }
        seedCourses();
        Member demo = seedDemoMember();
        seedCrews(demo);
        seedPosts(demo);
        log.info("기본 데이터를 넣었습니다: 코스 {}개, 크루 {}개, 게시글 {}개", courses.count(), crews.count(), posts.count());
    }

    private void seedCourses() {
        course("여의도 한강공원 한 바퀴", "여의도를 한 바퀴 도는 평지 코스. 강바람이 시원하고 편의점과 화장실이 곳곳에 있어요.", "서울 영등포구",
                "여의나루역 2번 출구", 37.5271, 126.9326, Member.Level.BEGINNER, "8.40", 55, 5, true,
                "처음엔 절반(4km)만 돌고 지하철로 돌아와도 충분해요.", "4,5,9,10",
                List.of(f("FACILITY", "화장실"), f("FACILITY", "편의점"), f("SCENERY", "한강뷰"), f("SURFACE", "우레탄")));
        course("반포 달빛무지개 코스", "반포대교 분수를 보며 달리는 저녁 코스. 해 질 무렵이 가장 예뻐요.", "서울 서초구", "반포한강공원 세빛섬",
                37.5112, 126.9960, Member.Level.BEGINNER, "5.00", 35, 3, true,
                "분수 쇼 시간(저녁)엔 사람이 많으니 바깥쪽 길로 달리세요.", "5,6,7,8,9",
                List.of(f("SCENERY", "야경"), f("FACILITY", "화장실"), f("SURFACE", "우레탄")));
        course("서울숲 순환로", "나무 그늘이 많은 공원 안쪽 순환 코스. 여름에도 덜 더워요.", "서울 성동구", "서울숲역 3번 출구", 37.5444,
                127.0374, Member.Level.BEGINNER, "3.20", 22, 8, true,
                "주말 오후엔 산책객이 많아 아침 시간이 달리기 좋아요.", "4,5,6,10",
                List.of(f("SCENERY", "숲길"), f("FACILITY", "급수대"), f("SURFACE", "흙길")));
        course("석촌호수 둘레길", "호수를 따라 도는 짧은 순환 코스. 인터벌 연습에 좋아요.", "서울 송파구", "잠실역 2번 출구", 37.5097, 127.1025,
                Member.Level.BEGINNER, "2.56", 17, 2, true, "한 바퀴씩 페이스를 바꿔 가며 달려 보세요.", "3,4,10,11",
                List.of(f("SCENERY", "호수"), f("FACILITY", "화장실"), f("SURFACE", "우레탄")));
        course("남산 북측순환로", "차가 다니지 않는 남산 둘레길. 완만한 오르막이 이어져요.", "서울 중구", "국립극장 앞", 37.5527, 126.9997,
                Member.Level.INTERMEDIATE, "3.50", 25, 60, false,
                "오르막에서는 보폭을 줄이고 팔을 더 흔들어 주세요.", "4,5,10,11",
                List.of(f("SCENERY", "숲길"), f("FACILITY", "급수대"), f("SURFACE", "아스팔트")));
        course("청계천 따라 달리기", "도심 한가운데 물길을 따라 달리는 코스. 다리 밑 그늘이 많아요.", "서울 종로구", "청계광장", 37.5694, 126.9780,
                Member.Level.INTERMEDIATE, "5.80", 40, 10, false,
                "산책로 폭이 좁으니 이어폰 소리는 작게 해 주세요.", "4,5,9,10",
                List.of(f("SCENERY", "도심"), f("FACILITY", "화장실"), f("SURFACE", "보도블록")));
        course("올림픽공원 평화의 문 순환", "넓은 잔디와 언덕을 지나는 코스. 오르내림이 조금 있어요.", "서울 송파구", "몽촌토성역 1번 출구",
                37.5206, 127.1215, Member.Level.ADVANCED, "6.30", 42, 45, true,
                "몽촌토성 언덕 구간은 걷는 사람이 많아 추월할 때 조심하세요.", "4,5,10",
                List.of(f("SCENERY", "공원"), f("FACILITY", "화장실"), f("FACILITY", "급수대")));
    }

    private record F(String type, String name) {
    }

    private static F f(String type, String name) {
        return new F(type, name);
    }

    private void course(String name, String description, String region, String startPlace, double lat, double lng,
            Member.Level difficulty, String km, int minutes, int elevation, boolean loop, String tip, String months,
            List<F> fs) {
        Course c = new Course();
        c.setName(name);
        c.setDescription(description);
        c.setRegion(region);
        c.setStartPlace(startPlace);
        c.setStartLat(lat);
        c.setStartLng(lng);
        c.setDifficulty(difficulty);
        c.setDistanceKm(new BigDecimal(km));
        c.setExpectedMinutes(minutes);
        c.setElevationM(elevation);
        c.setLoop(loop);
        c.setBeginnerTip(tip);
        c.setRecommendedMonth(months);
        c.setRouteData("[[" + lat + "," + lng + "]]");
        courses.save(c);
        fs.forEach(x -> features.save(new CourseFeature(c, x.type(), x.name())));
    }

    private Member seedDemoMember() {
        Member m = new Member();
        m.setEmail("demo@runkk.app");
        m.setPassword(passwordEncoder.encode("runkk1234"));
        m.setNickname("런크크운영진");
        m.setRegion("서울 영등포구");
        m.setLevel(Member.Level.INTERMEDIATE);
        m.setFriendCode("RKK-DEMO");
        m.setWeeklyGoalKm(new BigDecimal("20"));
        members.save(m);
        settings.save(new MemberSettings(m));
        return m;
    }

    private void seedCrews(Member leader) {
        Crew c = new Crew();
        c.setName("여의도 새벽런");
        c.setIntro("출근 전 한강에서 5km. 처음 오시는 분도 천천히 같이 달려요.");
        c.setRegion("서울 영등포구");
        c.setMeetingPlace("여의나루역 2번 출구");
        c.setMeetingLat(37.5271);
        c.setMeetingLng(126.9326);
        c.setAvgPaceSec(390);
        c.setMeetingDays("화,목");
        c.setMeetingTime(LocalTime.of(6, 30));
        c.setMaxMembers(30);
        c.setJoinType(Crew.JoinType.AUTO);
        crews.save(c);
        crewTags.save(new CrewTag(c, "초보환영"));
        crewTags.save(new CrewTag(c, "새벽런"));

        CrewMember cm = new CrewMember();
        cm.setCrew(c);
        cm.setMember(leader);
        cm.setRole(CrewMember.Role.LEADER);
        cm.setJoinStatus(CrewMember.JoinStatus.JOINED);
        cm.setJoinedAt(LocalDateTime.now());
        crewMembers.save(cm);
    }

    private void seedPosts(Member author) {
        post(author, Post.BoardType.TIP, "처음 5km 완주할 때 지킨 세 가지",
                "숨이 차면 걸어도 괜찮아요. 대화할 수 있는 속도로, 일주일에 세 번, 거리보다 시간을 먼저 늘려 보세요.");
        post(author, Post.BoardType.COURSE_REVIEW, "반포 달빛무지개 코스 다녀왔어요",
                "저녁 8시쯤 갔는데 분수가 켜져 있어서 지루할 틈이 없었어요. 세빛섬 쪽 화장실 이용하기 편해요.");
        post(author, Post.BoardType.FREE, "런크크 시작했어요", "같이 달릴 친구 찾아요. 친구 코드는 RKK-DEMO 입니다.");
    }

    private void post(Member author, Post.BoardType board, String title, String content) {
        Post p = new Post();
        p.setMember(author);
        p.setBoardType(board);
        p.setTitle(title);
        p.setContent(content);
        posts.save(p);
    }
}
