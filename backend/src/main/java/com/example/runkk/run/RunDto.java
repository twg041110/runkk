package com.example.runkk.run;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import com.example.runkk.member.MemberDto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class RunDto {

    private RunDto() {
    }

    public record Point(@NotNull Double lat, @NotNull Double lng, LocalDateTime recordedAt) {
    }

    /** 달리기가 끝나면 앱이 보내는 기록. 비어 있는 값(페이스, 칼로리, 달성률)은 서버가 계산한다 */
    public record SaveRequest(
            RunRecord.RunType runType,
            RunRecord.GoalType goalType,
            @DecimalMin("0") BigDecimal goalValue,
            @NotNull(message = "달린 거리가 필요해요.") @DecimalMin(value = "0", message = "거리를 확인해 주세요.") @DecimalMax("1000") BigDecimal distanceKm,
            @NotNull(message = "달린 시간이 필요해요.") @Min(value = 1, message = "시간을 확인해 주세요.") @Max(86400) Integer durationSec,
            Integer avgPaceSec,
            @Min(0) Integer calories,
            @NotNull(message = "시작 시각이 필요해요.") LocalDateTime startedAt,
            LocalDateTime endedAt,
            Long courseId,
            Long inviteId,
            Long meetupId,
            @Size(max = 20000) List<@Valid Point> routePoints) {
    }

    public record Summary(Long recordId, RunRecord.RunType runType, BigDecimal distanceKm, Integer durationSec,
            Integer avgPaceSec, Integer calories, RunRecord.GoalType goalType, BigDecimal goalValue,
            BigDecimal completionRate, Boolean goalAchieved, LocalDateTime startedAt, LocalDateTime endedAt,
            Long courseId, String courseName, String courseRegion) {

        public static Summary of(RunRecord r) {
            return new Summary(r.getRecordId(), r.getRunType(), r.getDistanceKm(), r.getDurationSec(),
                    r.getAvgPaceSec(), r.getCalories(), r.getGoalType(), r.getGoalValue(), r.getCompletionRate(),
                    r.getGoalAchieved(), r.getStartedAt(), r.getEndedAt(),
                    r.getCourse() == null ? null : r.getCourse().getCourseId(),
                    r.getCourse() == null ? null : r.getCourse().getName(),
                    r.getCourse() == null ? null : r.getCourse().getRegion());
        }
    }

    public record Detail(Summary record, Long inviteId, Long meetupId, List<Point> routePoints) {
    }

    /** 코스 기록 비교, 함께 달리기 결과에 쓰는 기록 한 줄 */
    public record RecordItem(MemberDto.Simple member, boolean me, Long recordId, Integer durationSec,
            BigDecimal distanceKm, Integer avgPaceSec, LocalDateTime startedAt) {

        public static RecordItem of(RunRecord r, Long me) {
            return new RecordItem(MemberDto.Simple.of(r.getMember()), r.getMember().getMemberId().equals(me),
                    r.getRecordId(), r.getDurationSec(), r.getDistanceKm(), r.getAvgPaceSec(), r.getStartedAt());
        }
    }

    /** 친구 상세 화면: 친구의 누적·이번 주·이번 달 기록과 최근 러닝 */
    public record FriendStats(MemberDto.Profile member, boolean friend, BigDecimal totalKm, BigDecimal weeklyKm,
            BigDecimal monthlyKm, long runCount, Integer avgPaceSec, LocalDateTime firstRunAt,
            List<Summary> recentRuns, long togetherCount, BigDecimal togetherKm, LocalDateTime lastTogether) {
    }

    /** 함께 달리기 초대와 두 사람이 남긴 기록 */
    public record InviteRecords(Invite invite, List<RecordItem> records) {
    }

    public record DayKm(LocalDate date, BigDecimal distanceKm) {
    }

    /** 이번 주 요약 (홈 화면) */
    public record WeeklySummary(LocalDate weekStart, BigDecimal totalKm, int runCount, int totalSec,
            Integer avgPaceSec, BigDecimal weeklyGoalKm, Integer goalPercent, List<DayKm> days) {
    }

    public record InviteRequest(
            @NotNull(message = "초대할 친구를 골라 주세요.") Long inviteeId,
            Long courseId,
            @NotNull(message = "달릴 날짜와 시간을 정해 주세요.") @Future(message = "지난 시간으로는 초대할 수 없어요.") LocalDateTime runAt,
            @Size(max = 100) String meetingPlace,
            Double meetingLat,
            Double meetingLng,
            @Min(150) @Max(1200) Integer targetPaceSec) {
    }

    public record Invite(Long inviteId, MemberDto.Simple inviter, MemberDto.Simple invitee, Long courseId,
            String courseName, LocalDateTime runAt, String meetingPlace, Double meetingLat, Double meetingLng,
            Integer targetPaceSec, RunInvite.Status status) {

        public static Invite of(RunInvite i) {
            return new Invite(i.getInviteId(), MemberDto.Simple.of(i.getInviter()),
                    MemberDto.Simple.of(i.getInvitee()), i.getCourse() == null ? null : i.getCourse().getCourseId(),
                    i.getCourse() == null ? null : i.getCourse().getName(), i.getRunAt(), i.getMeetingPlace(),
                    i.getMeetingLat(), i.getMeetingLng(), i.getTargetPaceSec(), i.getStatus());
        }
    }
}
