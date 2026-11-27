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
 * 개발용 기본 데이터. runkk.seed=true 일 때(local 프로필)만, 예시 계정이 아직 없을 때 한 번 넣는다.
 * 앱을 처음 켰을 때 크루·게시글 목록이 텅 비어 보이지 않게 하려는 것.
 * 코스는 여기서 넣지 않는다. 실제로 그린 코스만 resources/courses.json으로 넣는다 (course/CourseSeedData).
 * 예시 계정: demo@runkk.app / runkk1234 (크루장 역할)
 */
@Component
@ConditionalOnProperty(name = "runkk.seed", havingValue = "true")
public class LocalSeedData implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(LocalSeedData.class);

    private final MemberRepository members;
    private final MemberSettingsRepository settings;
    private final CrewRepository crews;
    private final CrewMemberRepository crewMembers;
    private final CrewTagRepository crewTags;
    private final PostRepository posts;
    private final PasswordEncoder passwordEncoder;

    public LocalSeedData(MemberRepository members,
            MemberSettingsRepository settings, CrewRepository crews, CrewMemberRepository crewMembers,
            CrewTagRepository crewTags, PostRepository posts, PasswordEncoder passwordEncoder) {
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
        if (members.existsByEmail("demo@runkk.app")) {
            return;
        }
        Member demo = seedDemoMember();
        seedCrews(demo);
        seedPosts(demo);
        log.info("기본 데이터를 넣었습니다: 크루 {}개, 게시글 {}개", crews.count(), posts.count());
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
