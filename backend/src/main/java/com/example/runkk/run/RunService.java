package com.example.runkk.run;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.runkk.common.ApiException;
import com.example.runkk.common.PageResponse;
import com.example.runkk.course.CourseService;
import com.example.runkk.crew.CrewService;
import com.example.runkk.friend.FriendRepository;
import com.example.runkk.member.Member;
import com.example.runkk.member.MemberService;
import com.example.runkk.notification.Notification;
import com.example.runkk.notification.NotificationService;
import com.example.runkk.post.PostRepositories.PostRepository;
import com.example.runkk.run.RunRepositories.RoutePointRepository;
import com.example.runkk.run.RunRepositories.RunInviteRepository;
import com.example.runkk.run.RunRepositories.RunRecordRepository;

@Service
@Transactional(readOnly = true)
public class RunService {

    /** 몸무게를 모를 때 칼로리 계산에 쓰는 값 */
    private static final BigDecimal DEFAULT_WEIGHT_KG = BigDecimal.valueOf(65);
    private static final List<RunInvite.Status> OPEN_INVITES = List.of(RunInvite.Status.PENDING,
            RunInvite.Status.ACCEPTED);

    private final RunRecordRepository records;
    private final RoutePointRepository points;
    private final RunInviteRepository invites;
    private final FriendRepository friends;
    private final PostRepository posts;
    private final MemberService memberService;
    private final CourseService courseService;
    private final CrewService crewService;
    private final NotificationService notifications;

    public RunService(RunRecordRepository records, RoutePointRepository points, RunInviteRepository invites,
            FriendRepository friends, PostRepository posts, MemberService memberService, CourseService courseService,
            CrewService crewService, NotificationService notifications) {
        this.records = records;
        this.points = points;
        this.invites = invites;
        this.friends = friends;
        this.posts = posts;
        this.memberService = memberService;
        this.courseService = courseService;
        this.crewService = crewService;
        this.notifications = notifications;
    }

    // ===== 러닝 기록 =====

    @Transactional
    public RunDto.Detail save(Long me, RunDto.SaveRequest req) {
        Member member = memberService.getActive(me);
        RunRecord r = new RunRecord();
        r.setMember(member);
        r.setRunType(req.runType() == null ? RunRecord.RunType.FREE : req.runType());
        r.setGoalType(req.goalType() == null ? RunRecord.GoalType.NONE : req.goalType());
        r.setGoalValue(req.goalValue());
        r.setDistanceKm(req.distanceKm().setScale(2, RoundingMode.HALF_UP));
        r.setDurationSec(req.durationSec());
        r.setStartedAt(req.startedAt());
        r.setEndedAt(req.endedAt() != null ? req.endedAt() : req.startedAt().plusSeconds(req.durationSec()));

        if (req.courseId() != null) {
            r.setCourse(courseService.get(req.courseId()));
        }
        if (req.inviteId() != null) {
            RunInvite invite = invites.findById(req.inviteId())
                    .filter(i -> i.getInviter().getMemberId().equals(me) || i.getInvitee().getMemberId().equals(me))
                    .orElseThrow(() -> ApiException.notFound("함께 달리기 초대를 찾을 수 없어요."));
            r.setInvite(invite);
            if (r.getCourse() == null) {
                r.setCourse(invite.getCourse());
            }
        }
        if (req.meetupId() != null) {
            r.setMeetup(crewService.meetupForMember(me, req.meetupId()));
        }

        // 평균 페이스 = 걸린 시간 ÷ 거리
        if (req.avgPaceSec() != null) {
            r.setAvgPaceSec(req.avgPaceSec());
        } else if (r.getDistanceKm().signum() > 0) {
            r.setAvgPaceSec(BigDecimal.valueOf(req.durationSec())
                    .divide(r.getDistanceKm(), 0, RoundingMode.HALF_UP).intValue());
        }
        // 칼로리는 대략 몸무게(kg) × 거리(km) × 1.036
        if (req.calories() != null) {
            r.setCalories(req.calories());
        } else {
            BigDecimal weight = member.getWeightKg() != null ? member.getWeightKg() : DEFAULT_WEIGHT_KG;
            r.setCalories(weight.multiply(r.getDistanceKm()).multiply(new BigDecimal("1.036"))
                    .setScale(0, RoundingMode.HALF_UP).intValue());
        }
        applyGoal(r);
        records.save(r);

        List<RoutePoint> saved = new ArrayList<>();
        if (req.routePoints() != null) {
            for (RunDto.Point p : req.routePoints()) {
                RoutePoint rp = new RoutePoint();
                rp.setRecord(r);
                rp.setLat(p.lat());
                rp.setLng(p.lng());
                rp.setRecordedAt(p.recordedAt());
                saved.add(rp);
            }
            points.saveAll(saved);
        }
        return toDetail(r, saved);
    }

    public PageResponse<RunDto.Summary> myRuns(Long me, int page, int size) {
        return PageResponse.of(records.findByMemberMemberIdOrderByStartedAtDesc(me, PageRequest.of(page, size)),
                RunDto.Summary::of);
    }

    public RunDto.Detail detail(Long me, Long recordId) {
        RunRecord r = mine(me, recordId);
        return toDetail(r, points.findByRecordRecordIdOrderByRecordedAtAscPointIdAsc(recordId));
    }

    @Transactional
    public void delete(Long me, Long recordId) {
        RunRecord r = mine(me, recordId);
        points.deleteByRecord(recordId);
        posts.detachRecord(recordId);
        records.delete(r);
    }

    public RunDto.WeeklySummary weekly(Long me) {
        Member member = memberService.getActive(me);
        LocalDate weekStart = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        List<RunRecord> list = records.findByMemberMemberIdAndStartedAtGreaterThanEqualOrderByStartedAtAsc(me,
                weekStart.atStartOfDay());

        BigDecimal[] perDay = new BigDecimal[7];
        java.util.Arrays.fill(perDay, BigDecimal.ZERO);
        BigDecimal total = BigDecimal.ZERO;
        int totalSec = 0;
        for (RunRecord r : list) {
            int day = r.getStartedAt().getDayOfWeek().getValue() - 1;
            perDay[day] = perDay[day].add(r.getDistanceKm());
            total = total.add(r.getDistanceKm());
            totalSec += r.getDurationSec();
        }
        List<RunDto.DayKm> days = new ArrayList<>();
        for (int i = 0; i < 7; i++) {
            days.add(new RunDto.DayKm(weekStart.plusDays(i), perDay[i]));
        }
        Integer avgPace = total.signum() > 0
                ? BigDecimal.valueOf(totalSec).divide(total, 0, RoundingMode.HALF_UP).intValue()
                : null;
        BigDecimal goal = member.getWeeklyGoalKm();
        Integer goalPercent = goal != null && goal.signum() > 0
                ? total.multiply(BigDecimal.valueOf(100)).divide(goal, 0, RoundingMode.DOWN).intValue()
                : null;
        return new RunDto.WeeklySummary(weekStart, total, list.size(), totalSec, avgPace, goal, goalPercent, days);
    }

    // ===== 함께 달리기 초대 =====

    @Transactional
    public RunDto.Invite invite(Long me, RunDto.InviteRequest req) {
        Member inviter = memberService.getActive(me);
        Member invitee = memberService.getOther(req.inviteeId());
        if (!friends.areFriends(me, invitee.getMemberId())) {
            throw ApiException.forbidden("친구에게만 함께 달리기를 신청할 수 있어요.");
        }
        RunInvite i = new RunInvite();
        i.setInviter(inviter);
        i.setInvitee(invitee);
        if (req.courseId() != null) {
            i.setCourse(courseService.get(req.courseId()));
        }
        i.setRunAt(req.runAt());
        i.setMeetingPlace(req.meetingPlace());
        i.setMeetingLat(req.meetingLat());
        i.setMeetingLng(req.meetingLng());
        i.setTargetPaceSec(req.targetPaceSec());
        invites.save(i);
        notifications.send(invitee, Notification.Type.RUN_INVITE, "함께 달리기 신청",
                inviter.getNickname() + "님이 함께 달리자고 해요.", i.getInviteId());
        return RunDto.Invite.of(i);
    }

    /** 받은 초대 (대기 중 + 수락한 것) */
    public List<RunDto.Invite> receivedInvites(Long me) {
        return invites.findReceived(me, OPEN_INVITES).stream().map(RunDto.Invite::of).toList();
    }

    public List<RunDto.Invite> sentInvites(Long me) {
        return invites.findSent(me, OPEN_INVITES).stream().map(RunDto.Invite::of).toList();
    }

    @Transactional
    public RunDto.Invite respond(Long me, Long inviteId, boolean accept) {
        RunInvite i = invites.findById(inviteId).filter(found -> found.getInvitee().getMemberId().equals(me))
                .orElseThrow(() -> ApiException.notFound("초대를 찾을 수 없어요."));
        if (i.getStatus() != RunInvite.Status.PENDING) {
            throw ApiException.conflict("이미 처리한 초대예요.");
        }
        i.setStatus(accept ? RunInvite.Status.ACCEPTED : RunInvite.Status.REJECTED);
        if (accept) {
            notifications.send(i.getInviter(), Notification.Type.RUN_INVITE_ACCEPTED, "함께 달리기 수락",
                    i.getInvitee().getNickname() + "님이 함께 달리기를 수락했어요.", i.getInviteId());
        }
        return RunDto.Invite.of(i);
    }

    @Transactional
    public void cancelInvite(Long me, Long inviteId) {
        RunInvite i = invites.findById(inviteId).filter(found -> found.getInviter().getMemberId().equals(me))
                .orElseThrow(() -> ApiException.notFound("초대를 찾을 수 없어요."));
        if (!OPEN_INVITES.contains(i.getStatus())) {
            throw ApiException.conflict("이미 끝난 초대예요.");
        }
        i.setStatus(RunInvite.Status.CANCELED);
    }

    /**
     * 회원의 러닝 통계. 나 자신이나 친구일 때만 기록을 보여 주고,
     * 친구가 아니면 프로필만 보여 준다 (friend=false, 숫자는 0).
     */
    public RunDto.FriendStats stats(Long me, Long memberId) {
        memberService.getActive(me);
        Member target = memberService.getOther(memberId);
        boolean self = me.equals(memberId);
        boolean friend = self || friends.areFriends(me, memberId);
        if (!friend) {
            return new RunDto.FriendStats(com.example.runkk.member.MemberDto.Profile.of(target), false,
                    BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, 0, null, null, List.of(), 0, BigDecimal.ZERO,
                    null);
        }
        LocalDate today = LocalDate.now();
        Object[] all = records.totals(memberId, LocalDateTime.of(2000, 1, 1, 0, 0)).get(0);
        Object[] week = records.totals(memberId,
                today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)).atStartOfDay()).get(0);
        Object[] month = records.totals(memberId, today.withDayOfMonth(1).atStartOfDay()).get(0);
        BigDecimal totalKm = (BigDecimal) all[0];
        long totalSec = ((Number) all[2]).longValue();
        Integer avgPace = totalKm.signum() > 0
                ? BigDecimal.valueOf(totalSec).divide(totalKm, 0, RoundingMode.HALF_UP).intValue()
                : null;
        Object[] together = self ? new Object[] { 0L, BigDecimal.ZERO, null }
                : records.together(me, memberId).get(0);
        return new RunDto.FriendStats(com.example.runkk.member.MemberDto.Profile.of(target), true, totalKm,
                (BigDecimal) week[0], (BigDecimal) month[0], ((Number) all[1]).longValue(), avgPace,
                (LocalDateTime) all[3],
                records.findTop5ByMemberMemberIdOrderByStartedAtDesc(memberId).stream().map(RunDto.Summary::of)
                        .toList(),
                ((Number) together[0]).longValue(), (BigDecimal) together[1], (LocalDateTime) together[2]);
    }

    /** 함께 달리기 초대 하나와, 그 초대로 두 사람이 남긴 기록 */
    public RunDto.InviteRecords inviteDetail(Long me, Long inviteId) {
        RunInvite i = invites.findById(inviteId)
                .filter(found -> found.getInviter().getMemberId().equals(me) || found.getInvitee().getMemberId().equals(me))
                .orElseThrow(() -> ApiException.notFound("초대를 찾을 수 없어요."));
        return new RunDto.InviteRecords(RunDto.Invite.of(i),
                records.findByInvite(inviteId).stream().map(r -> RunDto.RecordItem.of(r, me)).toList());
    }

    // ===== 내부 도우미 =====

    private RunRecord mine(Long me, Long recordId) {
        return records.findById(recordId).filter(r -> r.getMember().getMemberId().equals(me))
                .orElseThrow(() -> ApiException.notFound("러닝 기록을 찾을 수 없어요."));
    }

    /** 목표 달성률: 거리 목표는 km, 시간 목표는 분. 거리+시간은 거리를 채우고 시간 안에 들어왔는지 */
    private static void applyGoal(RunRecord r) {
        BigDecimal goal = r.getGoalValue();
        if (r.getGoalType() == RunRecord.GoalType.NONE || goal == null || goal.signum() <= 0) {
            return;
        }
        BigDecimal rate = switch (r.getGoalType()) {
            case TIME -> BigDecimal.valueOf(r.getDurationSec())
                    .multiply(BigDecimal.valueOf(100))
                    .divide(goal.multiply(BigDecimal.valueOf(60)), 1, RoundingMode.HALF_UP);
            default -> r.getDistanceKm().multiply(BigDecimal.valueOf(100)).divide(goal, 1, RoundingMode.HALF_UP);
        };
        BigDecimal capped = rate.min(BigDecimal.valueOf(100));
        r.setCompletionRate(capped);
        r.setGoalAchieved(capped.compareTo(BigDecimal.valueOf(100)) >= 0);
    }

    private static RunDto.Detail toDetail(RunRecord r, List<RoutePoint> pts) {
        return new RunDto.Detail(RunDto.Summary.of(r), r.getInvite() == null ? null : r.getInvite().getInviteId(),
                r.getMeetup() == null ? null : r.getMeetup().getMeetupId(),
                pts.stream().map(p -> new RunDto.Point(p.getLat(), p.getLng(), p.getRecordedAt())).toList());
    }
}
