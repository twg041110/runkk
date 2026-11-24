package com.example.runkk.crew;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.runkk.common.ApiException;
import com.example.runkk.common.PageResponse;
import com.example.runkk.crew.CrewRepositories.CrewMeetupRepository;
import com.example.runkk.crew.CrewRepositories.CrewMemberRepository;
import com.example.runkk.crew.CrewRepositories.CrewNoticeRepository;
import com.example.runkk.crew.CrewRepositories.CrewRepository;
import com.example.runkk.crew.CrewRepositories.CrewTagRepository;
import com.example.runkk.crew.CrewRepositories.MeetupAttendanceRepository;
import com.example.runkk.member.Member;
import com.example.runkk.member.MemberDto;
import com.example.runkk.member.MemberService;
import com.example.runkk.notification.Notification;
import com.example.runkk.notification.NotificationService;
import com.example.runkk.run.RunRepositories.RunRecordRepository;

@Service
@Transactional(readOnly = true)
public class CrewService {

    /** 크루 가입 조건: 1km 이상 러닝 5회 */
    public static final int REQUIRED_RUNS = 5;
    private static final BigDecimal MIN_RUN_KM = BigDecimal.ONE;
    private static final List<CrewMember.JoinStatus> ACTIVE = List.of(CrewMember.JoinStatus.JOINED,
            CrewMember.JoinStatus.PENDING);

    private final CrewRepository crews;
    private final CrewMemberRepository crewMembers;
    private final CrewTagRepository tags;
    private final CrewMeetupRepository meetups;
    private final MeetupAttendanceRepository attendances;
    private final CrewNoticeRepository notices;
    private final RunRecordRepository runs;
    private final MemberService memberService;
    private final NotificationService notifications;

    public CrewService(CrewRepository crews, CrewMemberRepository crewMembers, CrewTagRepository tags,
            CrewMeetupRepository meetups, MeetupAttendanceRepository attendances, CrewNoticeRepository notices,
            RunRecordRepository runs, MemberService memberService, NotificationService notifications) {
        this.crews = crews;
        this.crewMembers = crewMembers;
        this.tags = tags;
        this.meetups = meetups;
        this.attendances = attendances;
        this.notices = notices;
        this.runs = runs;
        this.memberService = memberService;
        this.notifications = notifications;
    }

    // ===== 조회 =====

    public PageResponse<CrewDto.Summary> list(String region, String keyword, boolean recruitingOnly, int page,
            int size) {
        Page<Crew> result = crews.search(blankToNull(region), blankToNull(keyword), recruitingOnly,
                PageRequest.of(page, size));
        List<Long> ids = result.getContent().stream().map(Crew::getCrewId).toList();
        Map<Long, Long> counts = memberCounts(ids);
        Map<Long, List<String>> tagMap = tagMap(ids);
        return PageResponse.of(result, c -> toSummary(c, counts, tagMap));
    }

    public CrewDto.Detail detail(Long me, Long crewId) {
        return toDetail(me, get(crewId));
    }

    public CrewDto.MyCrew myCrew(Long me) {
        memberService.getActive(me);
        return crewMembers.findActiveOf(me, ACTIVE).stream().findFirst()
                .map(cm -> new CrewDto.MyCrew(toDetail(me, cm.getCrew()), cm.getJoinStatus()))
                .orElse(new CrewDto.MyCrew(null, null));
    }

    public CrewDto.Eligibility eligibility(Long me) {
        long count = runs.countByMemberMemberIdAndDistanceKmGreaterThanEqual(me, MIN_RUN_KM);
        return new CrewDto.Eligibility(count >= REQUIRED_RUNS, count, REQUIRED_RUNS);
    }

    /** 가입한 멤버 목록. status=PENDING 은 크루장만 볼 수 있다 (가입 신청 목록) */
    public List<CrewDto.MemberItem> members(Long me, Long crewId, CrewMember.JoinStatus status) {
        get(crewId);
        if (status == CrewMember.JoinStatus.PENDING) {
            requireLeader(me, crewId);
        } else {
            status = CrewMember.JoinStatus.JOINED;
        }
        return crewMembers.findByCrewAndStatus(crewId, status).stream().map(CrewDto.MemberItem::of).toList();
    }

    // ===== 만들기, 고치기, 해체 =====

    @Transactional
    public CrewDto.Detail create(Long me, CrewDto.CrewRequest req) {
        Member leader = memberService.getActive(me);
        if (!crewMembers.findActiveOf(me, ACTIVE).isEmpty()) {
            throw ApiException.conflict("이미 가입했거나 가입 신청한 크루가 있어요. 크루는 하나만 가입할 수 있어요.");
        }
        String name = req.name().trim();
        if (crews.existsByName(name)) {
            throw ApiException.conflict("같은 이름의 크루가 있어요.");
        }
        Crew c = new Crew();
        apply(c, req);
        c.setName(name);
        crews.save(c);
        saveTags(c, req.tags());

        CrewMember cm = new CrewMember();
        cm.setCrew(c);
        cm.setMember(leader);
        cm.setRole(CrewMember.Role.LEADER);
        cm.setJoinStatus(CrewMember.JoinStatus.JOINED);
        cm.setJoinedAt(LocalDateTime.now());
        crewMembers.save(cm);
        return toDetail(me, c);
    }

    @Transactional
    public CrewDto.Detail update(Long me, Long crewId, CrewDto.CrewRequest req) {
        Crew c = get(crewId);
        requireLeader(me, crewId);
        String name = req.name().trim();
        if (!name.equals(c.getName()) && crews.existsByName(name)) {
            throw ApiException.conflict("같은 이름의 크루가 있어요.");
        }
        long joined = crewMembers.countByCrewCrewIdAndJoinStatus(crewId, CrewMember.JoinStatus.JOINED);
        if (req.maxMembers() < joined) {
            throw ApiException.badRequest("최대 인원을 지금 멤버 수(" + joined + "명)보다 적게 정할 수 없어요.");
        }
        apply(c, req);
        c.setName(name);
        if (req.tags() != null) {
            tags.deleteByCrew(crewId);
            saveTags(c, req.tags());
        }
        return toDetail(me, c);
    }

    /** 크루 해체: 크루와 관련된 기록을 모두 지운다 (러닝 기록은 남기고 모임 연결만 끊는다) */
    @Transactional
    public void disband(Long me, Long crewId) {
        Crew c = get(crewId);
        requireLeader(me, crewId);
        List<Long> meetupIds = meetups.findIdsByCrew(crewId);
        if (!meetupIds.isEmpty()) {
            attendances.deleteByMeetups(meetupIds);
            runs.detachMeetups(meetupIds);
        }
        meetups.deleteByCrew(crewId);
        notices.deleteByCrew(crewId);
        tags.deleteByCrew(crewId);
        crewMembers.deleteByCrew(crewId);
        crews.delete(c);
    }

    // ===== 가입, 탈퇴, 승인 =====

    @Transactional
    public CrewDto.MyCrew join(Long me, Long crewId) {
        Member member = memberService.getActive(me);
        Crew c = get(crewId);

        Optional<CrewMember> existing = crewMembers.findByCrewCrewIdAndMemberMemberId(crewId, me);
        if (existing.isPresent() && ACTIVE.contains(existing.get().getJoinStatus())) {
            throw ApiException.conflict(existing.get().getJoinStatus() == CrewMember.JoinStatus.JOINED
                    ? "이미 가입한 크루예요."
                    : "가입 신청을 이미 보냈어요. 크루장의 승인을 기다려 주세요.");
        }
        if (!crewMembers.findActiveOf(me, ACTIVE).isEmpty()) {
            throw ApiException.conflict("이미 가입했거나 가입 신청한 크루가 있어요. 크루는 하나만 가입할 수 있어요.");
        }
        checkJoinRules(member, c);

        CrewMember cm = existing.orElseGet(CrewMember::new);
        cm.setCrew(c);
        cm.setMember(member);
        cm.setRole(CrewMember.Role.MEMBER);
        cm.setJoinedAt(LocalDateTime.now());
        Member leader = leaderOf(crewId);
        if (c.getJoinType() == Crew.JoinType.AUTO) {
            cm.setJoinStatus(CrewMember.JoinStatus.JOINED);
        } else {
            cm.setJoinStatus(CrewMember.JoinStatus.PENDING);
            notifications.send(leader, Notification.Type.CREW_JOIN_REQUEST, "크루 가입 신청",
                    member.getNickname() + "님이 " + c.getName() + "에 가입을 신청했어요.", crewId);
        }
        crewMembers.save(cm);
        return new CrewDto.MyCrew(toDetail(me, c), cm.getJoinStatus());
    }

    /** 크루 탈퇴, 또는 승인 대기 중인 신청 취소. 크루장은 탈퇴 대신 해체해야 한다 */
    @Transactional
    public void leave(Long me, Long crewId) {
        CrewMember cm = crewMembers.findByCrewCrewIdAndMemberMemberId(crewId, me)
                .filter(found -> ACTIVE.contains(found.getJoinStatus()))
                .orElseThrow(() -> ApiException.notFound("가입한 크루가 아니에요."));
        if (cm.getRole() == CrewMember.Role.LEADER) {
            throw ApiException.badRequest("크루장은 탈퇴할 수 없어요. 크루를 해체해 주세요.");
        }
        cm.setJoinStatus(CrewMember.JoinStatus.LEFT);
    }

    @Transactional
    public CrewDto.MemberItem approve(Long me, Long crewId, Long crewMemberId) {
        Crew c = get(crewId);
        requireLeader(me, crewId);
        CrewMember cm = pendingRequest(crewId, crewMemberId);
        long joined = crewMembers.countByCrewCrewIdAndJoinStatus(crewId, CrewMember.JoinStatus.JOINED);
        if (c.getMaxMembers() != null && joined >= c.getMaxMembers()) {
            throw ApiException.conflict("크루 인원이 가득 찼어요.");
        }
        cm.setJoinStatus(CrewMember.JoinStatus.JOINED);
        cm.setJoinedAt(LocalDateTime.now());
        notifications.send(cm.getMember(), Notification.Type.CREW_APPROVED, "크루 가입 승인",
                c.getName() + " 크루에 가입되었어요.", crewId);
        return CrewDto.MemberItem.of(cm);
    }

    @Transactional
    public void reject(Long me, Long crewId, Long crewMemberId) {
        get(crewId);
        requireLeader(me, crewId);
        pendingRequest(crewId, crewMemberId).setJoinStatus(CrewMember.JoinStatus.REJECTED);
    }

    // ===== 모임 일정 =====

    public List<CrewDto.Meetup> upcomingMeetups(Long me, Long crewId) {
        get(crewId);
        List<CrewMeetup> list = meetups.findByCrewCrewIdAndRunAtAfterOrderByRunAtAsc(crewId,
                LocalDateTime.now().minusHours(3));
        return toMeetups(me, list);
    }

    @Transactional
    public CrewDto.Meetup createMeetup(Long me, Long crewId, CrewDto.MeetupRequest req) {
        Crew c = get(crewId);
        requireLeader(me, crewId);
        CrewMeetup m = new CrewMeetup();
        m.setCrew(c);
        m.setRunAt(req.runAt());
        m.setMeetingPlace(req.meetingPlace() != null ? req.meetingPlace() : c.getMeetingPlace());
        m.setMeetingLat(req.meetingLat() != null ? req.meetingLat() : c.getMeetingLat());
        m.setMeetingLng(req.meetingLng() != null ? req.meetingLng() : c.getMeetingLng());
        m.setDescription(req.description());
        meetups.save(m);
        notifyMembers(crewId, me, Notification.Type.CREW_MEETUP, c.getName() + " 새 모임",
                "새 모임 일정이 올라왔어요. 참석 여부를 알려 주세요.", m.getMeetupId());
        return toMeetups(me, List.of(m)).get(0);
    }

    @Transactional
    public CrewDto.Meetup attend(Long me, Long meetupId, MeetupAttendance.Status status) {
        CrewMeetup m = meetups.findById(meetupId).orElseThrow(() -> ApiException.notFound("모임을 찾을 수 없어요."));
        requireJoined(me, m.getCrew().getCrewId());
        if (m.getRunAt().isBefore(LocalDateTime.now())) {
            throw ApiException.badRequest("이미 지난 모임이에요.");
        }
        MeetupAttendance a = attendances.findByMeetupMeetupIdAndMemberMemberId(meetupId, me).orElseGet(() -> {
            MeetupAttendance created = new MeetupAttendance();
            created.setMeetup(m);
            created.setMember(memberService.getActive(me));
            return created;
        });
        a.setStatus(status);
        attendances.save(a);
        return toMeetups(me, List.of(m)).get(0);
    }

    // ===== 공지 =====

    public PageResponse<CrewDto.Notice> notices(Long crewId, int page, int size) {
        get(crewId);
        return PageResponse.of(notices.findByCrew(crewId, PageRequest.of(page, size)), CrewDto.Notice::of);
    }

    @Transactional
    public CrewDto.Notice createNotice(Long me, Long crewId, CrewDto.NoticeRequest req) {
        Crew c = get(crewId);
        CrewMember leader = requireLeader(me, crewId);
        CrewNotice n = new CrewNotice();
        n.setCrew(c);
        n.setWriter(leader.getMember());
        n.setTitle(req.title().trim());
        n.setContent(req.content().trim());
        notices.save(n);
        notifyMembers(crewId, me, Notification.Type.CREW_NOTICE, c.getName() + " 공지", n.getTitle(), crewId);
        return CrewDto.Notice.of(n);
    }

    @Transactional
    public void deleteNotice(Long me, Long noticeId) {
        CrewNotice n = notices.findById(noticeId).orElseThrow(() -> ApiException.notFound("공지를 찾을 수 없어요."));
        requireLeader(me, n.getCrew().getCrewId());
        notices.delete(n);
    }

    // ===== 내부 도우미 =====

    public Crew get(Long crewId) {
        return crews.findById(crewId).orElseThrow(() -> ApiException.notFound("크루를 찾을 수 없어요."));
    }

    /** 러닝 기록을 크루 모임에 연결할 때 확인용 */
    public CrewMeetup meetupForMember(Long me, Long meetupId) {
        CrewMeetup m = meetups.findById(meetupId).orElseThrow(() -> ApiException.notFound("모임을 찾을 수 없어요."));
        requireJoined(me, m.getCrew().getCrewId());
        return m;
    }

    private void checkJoinRules(Member member, Crew c) {
        if (!c.isRecruiting()) {
            throw ApiException.badRequest("지금은 멤버를 모집하지 않는 크루예요.");
        }
        if (!eligibility(member.getMemberId()).eligible()) {
            throw ApiException.badRequest("크루에 가입하려면 1km 이상 러닝 기록이 " + REQUIRED_RUNS + "번 필요해요.");
        }
        if (c.getGenderLimit() != Crew.GenderLimit.NONE) {
            if (member.getGender() == null) {
                throw ApiException.badRequest("성별 제한이 있는 크루예요. 프로필에서 성별을 먼저 입력해 주세요.");
            }
            if (!c.getGenderLimit().name().equals(member.getGender().name())) {
                throw ApiException.badRequest("이 크루는 " + (c.getGenderLimit() == Crew.GenderLimit.FEMALE ? "여성" : "남성")
                        + "만 가입할 수 있어요.");
            }
        }
        if (c.getMinAge() != null || c.getMaxAge() != null) {
            Integer age = member.age();
            if (age == null) {
                throw ApiException.badRequest("나이 제한이 있는 크루예요. 프로필에서 출생연도를 먼저 입력해 주세요.");
            }
            if ((c.getMinAge() != null && age < c.getMinAge()) || (c.getMaxAge() != null && age > c.getMaxAge())) {
                throw ApiException.badRequest("이 크루의 나이 조건에 맞지 않아요.");
            }
        }
        long joined = crewMembers.countByCrewCrewIdAndJoinStatus(c.getCrewId(), CrewMember.JoinStatus.JOINED);
        if (c.getMaxMembers() != null && joined >= c.getMaxMembers()) {
            throw ApiException.conflict("크루 인원이 가득 찼어요.");
        }
    }

    private CrewMember requireLeader(Long me, Long crewId) {
        return crewMembers.findByCrewCrewIdAndMemberMemberId(crewId, me).filter(CrewMember::isLeader)
                .orElseThrow(() -> ApiException.forbidden("크루장만 할 수 있어요."));
    }

    private CrewMember requireJoined(Long me, Long crewId) {
        return crewMembers.findByCrewCrewIdAndMemberMemberId(crewId, me)
                .filter(cm -> cm.getJoinStatus() == CrewMember.JoinStatus.JOINED)
                .orElseThrow(() -> ApiException.forbidden("크루 멤버만 할 수 있어요."));
    }

    private CrewMember pendingRequest(Long crewId, Long crewMemberId) {
        CrewMember cm = crewMembers.findById(crewMemberId)
                .filter(found -> found.getCrew().getCrewId().equals(crewId))
                .orElseThrow(() -> ApiException.notFound("가입 신청을 찾을 수 없어요."));
        if (cm.getJoinStatus() != CrewMember.JoinStatus.PENDING) {
            throw ApiException.conflict("이미 처리한 신청이에요.");
        }
        return cm;
    }

    private Member leaderOf(Long crewId) {
        return crewMembers.findByRole(crewId, CrewMember.Role.LEADER).stream().findFirst()
                .map(CrewMember::getMember).orElse(null);
    }

    private void notifyMembers(Long crewId, Long except, Notification.Type type, String title, String content,
            Long targetId) {
        for (CrewMember cm : crewMembers.findByCrewAndStatus(crewId, CrewMember.JoinStatus.JOINED)) {
            if (!cm.getMember().getMemberId().equals(except)) {
                notifications.send(cm.getMember(), type, title, content, targetId);
            }
        }
    }

    private static void apply(Crew c, CrewDto.CrewRequest req) {
        if (req.minAge() != null && req.maxAge() != null && req.minAge() > req.maxAge()) {
            throw ApiException.badRequest("최소 나이가 최대 나이보다 클 수 없어요.");
        }
        c.setIntro(req.intro());
        c.setRegion(req.region());
        c.setMeetingPlace(req.meetingPlace());
        c.setMeetingLat(req.meetingLat());
        c.setMeetingLng(req.meetingLng());
        c.setAvgPaceSec(req.avgPaceSec());
        c.setMeetingDays(req.meetingDays());
        c.setMeetingTime(req.meetingTime());
        c.setMaxMembers(req.maxMembers());
        c.setJoinType(req.joinType());
        c.setGenderLimit(req.genderLimit() == null ? Crew.GenderLimit.NONE : req.genderLimit());
        c.setMinAge(req.minAge());
        c.setMaxAge(req.maxAge());
        if (req.recruiting() != null) {
            c.setRecruiting(req.recruiting());
        }
    }

    private void saveTags(Crew c, List<String> names) {
        if (names == null) {
            return;
        }
        names.stream().map(String::trim).filter(s -> !s.isEmpty()).distinct()
                .forEach(name -> tags.save(new CrewTag(c, name)));
    }

    private Map<Long, Long> memberCounts(Collection<Long> ids) {
        Map<Long, Long> counts = new HashMap<>();
        if (!ids.isEmpty()) {
            crewMembers.countByCrews(ids, CrewMember.JoinStatus.JOINED)
                    .forEach(row -> counts.put((Long) row[0], (Long) row[1]));
        }
        return counts;
    }

    private Map<Long, List<String>> tagMap(Collection<Long> ids) {
        if (ids.isEmpty()) {
            return Map.of();
        }
        return tags.findByCrewCrewIdIn(ids).stream().collect(Collectors.groupingBy(t -> t.getCrew().getCrewId(),
                Collectors.mapping(CrewTag::getTagName, Collectors.toList())));
    }

    private static CrewDto.Summary toSummary(Crew c, Map<Long, Long> counts, Map<Long, List<String>> tagMap) {
        return new CrewDto.Summary(c.getCrewId(), c.getName(), c.getIntro(), c.getRegion(), c.getMeetingPlace(),
                c.getAvgPaceSec(), c.getMeetingDays(), c.getMeetingTime(), counts.getOrDefault(c.getCrewId(), 0L),
                c.getMaxMembers(), c.getJoinType(), c.getGenderLimit(), c.getMinAge(), c.getMaxAge(),
                c.isRecruiting(), tagMap.getOrDefault(c.getCrewId(), List.of()));
    }

    private CrewDto.Detail toDetail(Long me, Crew c) {
        Long crewId = c.getCrewId();
        CrewDto.Summary summary = toSummary(c, memberCounts(List.of(crewId)), tagMap(List.of(crewId)));
        Optional<CrewMember> mine = me == null ? Optional.empty()
                : crewMembers.findByCrewCrewIdAndMemberMemberId(crewId, me);
        CrewDto.Meetup next = meetups.findFirstByCrewCrewIdAndRunAtAfterOrderByRunAtAsc(crewId, LocalDateTime.now())
                .map(m -> toMeetups(me, List.of(m)).get(0)).orElse(null);
        return new CrewDto.Detail(summary, c.getMeetingLat(), c.getMeetingLng(),
                MemberDto.Simple.of(leaderOf(crewId)), c.getCreatedAt(),
                mine.map(CrewMember::getJoinStatus).orElse(null), mine.map(CrewMember::isLeader).orElse(false),
                next);
    }

    private List<CrewDto.Meetup> toMeetups(Long me, List<CrewMeetup> list) {
        if (list.isEmpty()) {
            return List.of();
        }
        List<Long> ids = list.stream().map(CrewMeetup::getMeetupId).toList();
        Map<Long, List<MeetupAttendance>> byMeetup = attendances.findByMeetups(ids).stream()
                .collect(Collectors.groupingBy(a -> a.getMeetup().getMeetupId()));
        return list.stream().map(m -> {
            List<MeetupAttendance> as = byMeetup.getOrDefault(m.getMeetupId(), List.of());
            long attending = as.stream().filter(a -> a.getStatus() == MeetupAttendance.Status.ATTENDING).count();
            MeetupAttendance.Status mine = me == null ? null
                    : as.stream().filter(a -> a.getMember().getMemberId().equals(me)).map(MeetupAttendance::getStatus)
                            .findFirst().orElse(null);
            return new CrewDto.Meetup(m.getMeetupId(), m.getRunAt(), m.getMeetingPlace(), m.getMeetingLat(),
                    m.getMeetingLng(), m.getDescription(), attending, mine);
        }).toList();
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
