package com.example.runkk.member;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface MemberRepository extends JpaRepository<Member, Long> {

    Optional<Member> findByEmail(String email);

    Optional<Member> findByFriendCode(String friendCode);

    boolean existsByEmail(String email);

    boolean existsByNickname(String nickname);

    boolean existsByFriendCode(String friendCode);

    List<Member> findTop20ByNicknameContainingAndStatusOrderByNicknameAsc(String nickname, Member.Status status);
}
