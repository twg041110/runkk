package com.example.runkk.auth;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import com.example.runkk.member.Member;

/** 로그인 토큰 발급. 토큰 안의 subject 에 회원 번호를 넣는다 */
@Service
public class JwtService {

    private final JwtEncoder encoder;
    private final long expireDays;

    public JwtService(JwtEncoder encoder, @Value("${runkk.jwt.expire-days:14}") long expireDays) {
        this.encoder = encoder;
        this.expireDays = expireDays;
    }

    public String issue(Member member) {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("runkk")
                .issuedAt(now)
                .expiresAt(now.plus(expireDays, ChronoUnit.DAYS))
                .subject(String.valueOf(member.getMemberId()))
                .claim("nickname", member.getNickname())
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }

    public long expireSeconds() {
        return expireDays * 24 * 60 * 60;
    }
}
