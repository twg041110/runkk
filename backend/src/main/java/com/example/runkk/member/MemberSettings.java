package com.example.runkk.member;

import java.time.LocalTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** 회원 설정 (ERD: member_settings). 회원 번호를 그대로 기본키로 쓴다 */
@Entity
@Table(name = "member_settings")
@Getter
@Setter
@NoArgsConstructor
public class MemberSettings {

    public enum DistanceUnit {
        KM, MILE
    }

    @Id
    private Long memberId;

    @MapsId
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id")
    private Member member;

    private boolean pushEnabled = true;
    private boolean notifyFriendRequest = true;
    private boolean notifyRunInvite = true;
    private boolean notifyCrewSchedule = true;
    private boolean notifyCrewNotice = true;
    private boolean notifyCrewMember = true;
    private boolean notifyComment = true;
    private boolean notifyLike = true;
    private boolean notifyHotPost = true;
    private boolean notifyBestRecord = true;
    private boolean notifyWeeklyGoal = true;

    /** 방해 금지 시간. 둘 다 비어 있으면 사용하지 않음 */
    private LocalTime quietStart;
    private LocalTime quietEnd;

    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    private DistanceUnit distanceUnit = DistanceUnit.KM;

    private boolean voiceGuide = true;
    private boolean autoPause = true;
    private boolean keepScreenOn = true;

    public MemberSettings(Member member) {
        this.member = member;
    }
}
