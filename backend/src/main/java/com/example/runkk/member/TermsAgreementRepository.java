package com.example.runkk.member;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface TermsAgreementRepository extends JpaRepository<TermsAgreement, Long> {

    List<TermsAgreement> findByMemberMemberId(Long memberId);
}
