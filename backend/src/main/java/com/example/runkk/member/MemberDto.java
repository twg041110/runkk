package com.example.runkk.member;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** 회원 API 에서 주고받는 모양 */
public final class MemberDto {

    private MemberDto() {
    }

    /** 내 정보 (나에게만 보여 주는 값 포함) */
    public record Me(Long memberId, String email, String nickname, String profileImageUrl, String bio, String region,
            Member.Gender gender, Integer birthYear, BigDecimal heightCm, BigDecimal weightKg, Member.Level level,
            String friendCode, BigDecimal weeklyGoalKm, LocalDateTime createdAt) {

        public static Me of(Member m) {
            return new Me(m.getMemberId(), m.getEmail(), m.getNickname(), m.getProfileImageUrl(), m.getBio(),
                    m.getRegion(), m.getGender(), m.getBirthYear(), m.getHeightCm(), m.getWeightKg(), m.getLevel(),
                    m.getFriendCode(), m.getWeeklyGoalKm(), m.getCreatedAt());
        }
    }

    /** 다른 사람에게 보이는 프로필 */
    public record Profile(Long memberId, String nickname, String profileImageUrl, String bio, String region,
            Member.Level level, String friendCode) {

        public static Profile of(Member m) {
            return new Profile(m.getMemberId(), m.getNickname(), m.getProfileImageUrl(), m.getBio(), m.getRegion(),
                    m.getLevel(), m.getFriendCode());
        }
    }

    /** 목록에 들어가는 짧은 회원 정보 */
    public record Simple(Long memberId, String nickname, String profileImageUrl) {

        public static Simple of(Member m) {
            if (m == null) {
                return null;
            }
            return new Simple(m.getMemberId(), m.getNickname(), m.getProfileImageUrl());
        }
    }

    /** 프로필 수정. 보내지 않은(null) 칸은 그대로 둔다 */
    public record UpdateRequest(
            @Size(min = 2, max = 12, message = "닉네임은 2~12자로 정해 주세요.") String nickname,
            @Size(max = 500) String profileImageUrl,
            @Size(max = 200, message = "소개는 200자까지 쓸 수 있어요.") String bio,
            @Size(max = 50) String region,
            Member.Gender gender,
            @Min(value = 1920, message = "출생연도를 확인해 주세요.") @Max(value = 2020, message = "출생연도를 확인해 주세요.") Integer birthYear,
            @DecimalMin("50") @DecimalMax("250") BigDecimal heightCm,
            @DecimalMin("20") @DecimalMax("300") BigDecimal weightKg,
            Member.Level level,
            @DecimalMin("0") @DecimalMax("500") BigDecimal weeklyGoalKm) {
    }

    public record WithdrawRequest(@Size(max = 300) String reason) {
    }

    /** 비밀번호 변경. 새 비밀번호 규칙은 회원가입과 같다 */
    public record PasswordChangeRequest(
            @NotBlank(message = "현재 비밀번호를 입력해 주세요.") String currentPassword,
            @NotBlank(message = "새 비밀번호를 입력해 주세요.")
            @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).{8,64}$", message = "비밀번호는 영문과 숫자를 섞어 8자 이상으로 정해 주세요.") String newPassword) {
    }

    public record Settings(boolean pushEnabled, boolean notifyFriendRequest, boolean notifyRunInvite,
            boolean notifyCrewSchedule, boolean notifyCrewNotice, boolean notifyCrewMember, boolean notifyComment,
            boolean notifyLike, boolean notifyHotPost, boolean notifyBestRecord, boolean notifyWeeklyGoal,
            LocalTime quietStart, LocalTime quietEnd, MemberSettings.DistanceUnit distanceUnit, boolean voiceGuide,
            boolean autoPause, boolean keepScreenOn) {

        public static Settings of(MemberSettings s) {
            return new Settings(s.isPushEnabled(), s.isNotifyFriendRequest(), s.isNotifyRunInvite(),
                    s.isNotifyCrewSchedule(), s.isNotifyCrewNotice(), s.isNotifyCrewMember(), s.isNotifyComment(),
                    s.isNotifyLike(), s.isNotifyHotPost(), s.isNotifyBestRecord(), s.isNotifyWeeklyGoal(),
                    s.getQuietStart(), s.getQuietEnd(), s.getDistanceUnit(), s.isVoiceGuide(), s.isAutoPause(),
                    s.isKeepScreenOn());
        }
    }

    /** 설정 수정. null 은 그대로 둔다. 방해 금지 시간을 끄려면 quietTimeOff: true */
    public record SettingsUpdate(Boolean pushEnabled, Boolean notifyFriendRequest, Boolean notifyRunInvite,
            Boolean notifyCrewSchedule, Boolean notifyCrewNotice, Boolean notifyCrewMember, Boolean notifyComment,
            Boolean notifyLike, Boolean notifyHotPost, Boolean notifyBestRecord, Boolean notifyWeeklyGoal,
            LocalTime quietStart, LocalTime quietEnd, Boolean quietTimeOff, MemberSettings.DistanceUnit distanceUnit,
            Boolean voiceGuide, Boolean autoPause, Boolean keepScreenOn) {
    }
}
