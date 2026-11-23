package com.example.runkk.member;

import java.time.LocalDateTime;
import java.util.List;
import java.util.function.Consumer;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.runkk.common.ApiException;

@Service
@Transactional(readOnly = true)
public class MemberService {

    private final MemberRepository members;
    private final MemberSettingsRepository settingsRepo;

    public MemberService(MemberRepository members, MemberSettingsRepository settingsRepo) {
        this.members = members;
        this.settingsRepo = settingsRepo;
    }

    /** 로그인한 회원. 탈퇴했거나 없는 회원이면 다시 로그인하게 한다 */
    public Member getActive(Long memberId) {
        Member m = members.findById(memberId)
                .orElseThrow(() -> ApiException.unauthorized("회원 정보를 찾을 수 없어요. 다시 로그인해 주세요."));
        if (!m.isActive()) {
            throw ApiException.unauthorized("탈퇴한 계정이에요.");
        }
        return m;
    }

    /** 다른 회원 (프로필 보기, 친구 요청 대상 등) */
    public Member getOther(Long memberId) {
        Member m = members.findById(memberId).orElseThrow(() -> ApiException.notFound("회원을 찾을 수 없어요."));
        if (!m.isActive()) {
            throw ApiException.notFound("탈퇴한 회원이에요.");
        }
        return m;
    }

    public MemberDto.Me me(Long memberId) {
        return MemberDto.Me.of(getActive(memberId));
    }

    public MemberDto.Profile profile(Long memberId) {
        return MemberDto.Profile.of(getOther(memberId));
    }

    public List<MemberDto.Profile> search(String nickname) {
        if (nickname == null || nickname.isBlank()) {
            return List.of();
        }
        return members.findTop20ByNicknameContainingAndStatusOrderByNicknameAsc(nickname.trim(), Member.Status.ACTIVE)
                .stream().map(MemberDto.Profile::of).toList();
    }

    @Transactional
    public MemberDto.Me update(Long memberId, MemberDto.UpdateRequest req) {
        Member m = getActive(memberId);
        if (req.nickname() != null) {
            String nickname = req.nickname().trim();
            if (!nickname.equals(m.getNickname()) && members.existsByNickname(nickname)) {
                throw ApiException.conflict("이미 쓰고 있는 닉네임이에요.");
            }
            m.setNickname(nickname);
        }
        setIfPresent(req.profileImageUrl(), m::setProfileImageUrl);
        setIfPresent(req.bio(), m::setBio);
        setIfPresent(req.region(), m::setRegion);
        setIfPresent(req.gender(), m::setGender);
        setIfPresent(req.birthYear(), m::setBirthYear);
        setIfPresent(req.heightCm(), m::setHeightCm);
        setIfPresent(req.weightKg(), m::setWeightKg);
        setIfPresent(req.level(), m::setLevel);
        setIfPresent(req.weeklyGoalKm(), m::setWeeklyGoalKm);
        return MemberDto.Me.of(m);
    }

    /**
     * 회원 탈퇴. 기록을 지우지는 않고 상태만 바꾼다.
     * 같은 이메일로 다시 가입할 수 있도록 이메일은 알아볼 수 없는 값으로 바꾼다.
     */
    @Transactional
    public void withdraw(Long memberId, String reason) {
        Member m = getActive(memberId);
        m.setStatus(Member.Status.WITHDRAWN);
        m.setWithdrawReason(reason);
        m.setWithdrawnAt(LocalDateTime.now());
        m.setEmail("withdrawn_" + m.getMemberId() + "@runkk.invalid");
        m.setNickname("탈퇴한 회원");
        m.setProfileImageUrl(null);
        m.setBio(null);
    }

    @Transactional
    public MemberDto.Settings settings(Long memberId) {
        return MemberDto.Settings.of(settingsOf(getActive(memberId)));
    }

    @Transactional
    public MemberDto.Settings updateSettings(Long memberId, MemberDto.SettingsUpdate req) {
        MemberSettings s = settingsOf(getActive(memberId));
        setIfPresent(req.pushEnabled(), s::setPushEnabled);
        setIfPresent(req.notifyFriendRequest(), s::setNotifyFriendRequest);
        setIfPresent(req.notifyRunInvite(), s::setNotifyRunInvite);
        setIfPresent(req.notifyCrewSchedule(), s::setNotifyCrewSchedule);
        setIfPresent(req.notifyCrewNotice(), s::setNotifyCrewNotice);
        setIfPresent(req.notifyCrewMember(), s::setNotifyCrewMember);
        setIfPresent(req.notifyComment(), s::setNotifyComment);
        setIfPresent(req.notifyLike(), s::setNotifyLike);
        setIfPresent(req.notifyHotPost(), s::setNotifyHotPost);
        setIfPresent(req.notifyBestRecord(), s::setNotifyBestRecord);
        setIfPresent(req.notifyWeeklyGoal(), s::setNotifyWeeklyGoal);
        if (Boolean.TRUE.equals(req.quietTimeOff())) {
            s.setQuietStart(null);
            s.setQuietEnd(null);
        } else if (req.quietStart() != null || req.quietEnd() != null) {
            if (req.quietStart() == null || req.quietEnd() == null) {
                throw ApiException.badRequest("방해 금지 시작과 끝 시간을 함께 정해 주세요.");
            }
            s.setQuietStart(req.quietStart());
            s.setQuietEnd(req.quietEnd());
        }
        setIfPresent(req.distanceUnit(), s::setDistanceUnit);
        setIfPresent(req.voiceGuide(), s::setVoiceGuide);
        setIfPresent(req.autoPause(), s::setAutoPause);
        setIfPresent(req.keepScreenOn(), s::setKeepScreenOn);
        return MemberDto.Settings.of(s);
    }

    /** 설정이 없으면(예전에 가입한 회원) 기본값으로 만든다 */
    @Transactional
    public MemberSettings settingsOf(Member m) {
        return settingsRepo.findById(m.getMemberId()).orElseGet(() -> settingsRepo.save(new MemberSettings(m)));
    }

    private static <T> void setIfPresent(T value, Consumer<T> setter) {
        if (value != null) {
            setter.accept(value);
        }
    }
}
