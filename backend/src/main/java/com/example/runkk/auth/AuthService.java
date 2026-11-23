package com.example.runkk.auth;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.Locale;
import java.util.Set;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.runkk.common.ApiException;
import com.example.runkk.member.Member;
import com.example.runkk.member.MemberDto;
import com.example.runkk.member.MemberRepository;
import com.example.runkk.member.MemberSettings;
import com.example.runkk.member.MemberSettingsRepository;
import com.example.runkk.member.TermsAgreement;
import com.example.runkk.member.TermsAgreementRepository;

@Service
public class AuthService {

    private static final Set<TermsAgreement.TermsType> REQUIRED_TERMS = EnumSet.allOf(TermsAgreement.TermsType.class);
    /** 헷갈리는 글자(0, O, 1, I)를 뺀 친구 코드용 글자 */
    private static final String CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final MemberRepository members;
    private final MemberSettingsRepository settings;
    private final TermsAgreementRepository terms;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(MemberRepository members, MemberSettingsRepository settings, TermsAgreementRepository terms,
            PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.members = members;
        this.settings = settings;
        this.terms = terms;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthDto.TokenResponse signup(AuthDto.SignupRequest req) {
        if (!req.agreedTerms().containsAll(REQUIRED_TERMS)) {
            throw ApiException.badRequest("필수 약관에 모두 동의해 주세요.");
        }
        String email = normalizeEmail(req.email());
        String nickname = req.nickname().trim();
        if (members.existsByEmail(email)) {
            throw ApiException.conflict("이미 가입한 이메일이에요.");
        }
        if (members.existsByNickname(nickname)) {
            throw ApiException.conflict("이미 쓰고 있는 닉네임이에요.");
        }

        Member m = new Member();
        m.setEmail(email);
        m.setPassword(passwordEncoder.encode(req.password()));
        m.setNickname(nickname);
        m.setGender(req.gender());
        m.setBirthYear(req.birthYear());
        m.setRegion(req.region());
        m.setHeightCm(req.heightCm());
        m.setWeightKg(req.weightKg());
        if (req.level() != null) {
            m.setLevel(req.level());
        }
        m.setFriendCode(newFriendCode());
        m.setLastLoginAt(LocalDateTime.now());
        members.save(m);

        settings.save(new MemberSettings(m));

        LocalDateTime now = LocalDateTime.now();
        for (TermsAgreement.TermsType type : req.agreedTerms()) {
            TermsAgreement t = new TermsAgreement();
            t.setMember(m);
            t.setTermsType(type);
            t.setTermsVersion(TermsAgreement.CURRENT_VERSION);
            t.setAgreed(true);
            t.setAgreedAt(now);
            terms.save(t);
        }
        return token(m);
    }

    @Transactional
    public AuthDto.TokenResponse login(AuthDto.LoginRequest req) {
        // 이메일이 없는 경우와 비밀번호가 틀린 경우를 같은 말로 답해서, 가입 여부를 알 수 없게 한다
        Member m = members.findByEmail(normalizeEmail(req.email()))
                .filter(found -> passwordEncoder.matches(req.password(), found.getPassword()))
                .orElseThrow(() -> ApiException.unauthorized("이메일 또는 비밀번호가 맞지 않아요."));
        if (!m.isActive()) {
            throw ApiException.unauthorized("탈퇴한 계정이에요.");
        }
        m.setLastLoginAt(LocalDateTime.now());
        return token(m);
    }

    public boolean emailAvailable(String email) {
        return email != null && !email.isBlank() && !members.existsByEmail(normalizeEmail(email));
    }

    public boolean nicknameAvailable(String nickname) {
        return nickname != null && !nickname.isBlank() && !members.existsByNickname(nickname.trim());
    }

    private AuthDto.TokenResponse token(Member m) {
        return new AuthDto.TokenResponse(jwtService.issue(m), "Bearer", jwtService.expireSeconds(),
                MemberDto.Me.of(m));
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String newFriendCode() {
        for (int attempt = 0; attempt < 20; attempt++) {
            StringBuilder sb = new StringBuilder("RKK-");
            for (int i = 0; i < 4; i++) {
                sb.append(CODE_CHARS.charAt(RANDOM.nextInt(CODE_CHARS.length())));
            }
            String code = sb.toString();
            if (!members.existsByFriendCode(code)) {
                return code;
            }
        }
        throw new IllegalStateException("친구 코드를 만들지 못했습니다");
    }
}
