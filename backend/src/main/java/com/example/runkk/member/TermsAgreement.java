package com.example.runkk.member;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** 약관 동의 기록 (ERD: terms_agreement) */
@Entity
@Table(name = "terms_agreement")
@Getter
@Setter
@NoArgsConstructor
public class TermsAgreement {

    public enum TermsType {
        SERVICE, // 서비스 이용약관 (필수)
        PRIVACY, // 개인정보 처리방침 (필수)
        LOCATION, // 위치기반 서비스 (필수)
        AGE14 // 만 14세 이상 (필수)
    }

    public static final String CURRENT_VERSION = "2026-11";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long agreementId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id")
    private Member member;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TermsType termsType;

    @Column(length = 20)
    private String termsVersion;

    private boolean agreed;

    private LocalDateTime agreedAt;
}
