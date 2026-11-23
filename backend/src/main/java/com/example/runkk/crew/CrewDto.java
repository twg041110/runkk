package com.example.runkk.crew;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import com.example.runkk.member.MemberDto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class CrewDto {

    private CrewDto() {
    }

    public record Summary(Long crewId, String name, String intro, String region, String meetingPlace,
            Integer avgPaceSec, String meetingDays, LocalTime meetingTime, long memberCount, Integer maxMembers,
            Crew.JoinType joinType, Crew.GenderLimit genderLimit, Integer minAge, Integer maxAge, boolean recruiting,
            List<String> tags) {
    }

    public record Detail(Summary crew, Double meetingLat, Double meetingLng, MemberDto.Simple leader,
            LocalDateTime createdAt,
            /** 나와 이 크루의 관계: null(관계 없음) / PENDING / JOINED / REJECTED / LEFT */
            CrewMember.JoinStatus myStatus, boolean iAmLeader, Meetup nextMeetup) {
    }

    /** 내 크루 화면. 가입한 크루가 없으면 crew 가 null */
    public record MyCrew(Detail crew, CrewMember.JoinStatus status) {
    }

    /** 크루 가입 조건 (1km 이상 러닝 5회) 충족 여부 */
    public record Eligibility(boolean eligible, long runCount, int required) {
    }

    public record CrewRequest(
            @NotBlank(message = "크루 이름을 입력해 주세요.") @Size(min = 2, max = 20, message = "크루 이름은 2~20자예요.") String name,
            @Size(max = 500) String intro,
            @Size(max = 50) String region,
            @Size(max = 100) String meetingPlace,
            Double meetingLat,
            Double meetingLng,
            @Min(150) @Max(1200) Integer avgPaceSec,
            @Size(max = 30) String meetingDays,
            LocalTime meetingTime,
            @NotNull(message = "최대 인원을 정해 주세요.") @Min(value = 2, message = "최대 인원은 2~100명이에요.") @Max(value = 100, message = "최대 인원은 2~100명이에요.") Integer maxMembers,
            @NotNull Crew.JoinType joinType,
            Crew.GenderLimit genderLimit,
            @Min(14) @Max(100) Integer minAge,
            @Min(14) @Max(100) Integer maxAge,
            Boolean recruiting,
            @Size(max = 5, message = "태그는 5개까지 달 수 있어요.") List<@Size(min = 1, max = 20) String> tags) {
    }

    public record MemberItem(Long crewMemberId, MemberDto.Simple member, CrewMember.Role role,
            CrewMember.JoinStatus status, LocalDateTime joinedAt) {

        static MemberItem of(CrewMember cm) {
            return new MemberItem(cm.getCrewMemberId(), MemberDto.Simple.of(cm.getMember()), cm.getRole(),
                    cm.getJoinStatus(), cm.getJoinedAt());
        }
    }

    public record Meetup(Long meetupId, LocalDateTime runAt, String meetingPlace, Double meetingLat,
            Double meetingLng, String description, long attendingCount, MeetupAttendance.Status myAttendance) {
    }

    public record MeetupRequest(
            @NotNull(message = "모임 날짜와 시간을 정해 주세요.") @Future(message = "지난 시간으로는 모임을 만들 수 없어요.") LocalDateTime runAt,
            @Size(max = 100) String meetingPlace,
            Double meetingLat,
            Double meetingLng,
            @Size(max = 500) String description) {
    }

    public record AttendanceRequest(@NotNull MeetupAttendance.Status status) {
    }

    public record Notice(Long noticeId, String title, String content, MemberDto.Simple writer,
            LocalDateTime createdAt) {

        static Notice of(CrewNotice n) {
            return new Notice(n.getNoticeId(), n.getTitle(), n.getContent(), MemberDto.Simple.of(n.getWriter()),
                    n.getCreatedAt());
        }
    }

    public record NoticeRequest(
            @NotBlank(message = "제목을 입력해 주세요.") @Size(max = 100) String title,
            @NotBlank(message = "내용을 입력해 주세요.") @Size(max = 5000) String content) {
    }
}
