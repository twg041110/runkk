package com.example.runkk.auth;

import java.math.BigDecimal;
import java.util.Set;

import com.example.runkk.member.Member;
import com.example.runkk.member.MemberDto;
import com.example.runkk.member.TermsAgreement;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class AuthDto {

    private AuthDto() {
    }

    public record SignupRequest(
            @NotBlank(message = "이메일을 입력해 주세요.") @Email(message = "이메일 형식을 확인해 주세요.") @Size(max = 100) String email,
            @NotBlank(message = "비밀번호를 입력해 주세요.")
            @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).{8,64}$", message = "비밀번호는 영문과 숫자를 섞어 8자 이상으로 정해 주세요.") String password,
            @NotBlank(message = "닉네임을 입력해 주세요.") @Size(min = 2, max = 12, message = "닉네임은 2~12자로 정해 주세요.") String nickname,
            /** 동의한 약관 목록. 필수 4개(SERVICE, PRIVACY, LOCATION, AGE14)가 모두 있어야 한다 */
            @NotEmpty(message = "약관에 동의해 주세요.") Set<TermsAgreement.TermsType> agreedTerms,
            Member.Gender gender,
            @Min(1920) @Max(2020) Integer birthYear,
            @Size(max = 50) String region,
            Member.Level level,
            BigDecimal heightCm,
            BigDecimal weightKg) {
    }

    public record LoginRequest(
            @NotBlank(message = "이메일을 입력해 주세요.") String email,
            @NotBlank(message = "비밀번호를 입력해 주세요.") String password) {
    }

    /** 로그인 결과. 앱은 accessToken 을 저장해 두고 요청마다 헤더에 붙인다 */
    public record TokenResponse(String accessToken, String tokenType, long expiresIn, MemberDto.Me member) {
    }

    public record AvailableResponse(boolean available) {
    }
}
