package com.example.demo.entity; // 본인의 실제 패키지 경로에 맞게 수정하세요

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "member")
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long memberId;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false, length = 50)
    private String nickname;

    private LocalDateTime createdAt = LocalDateTime.now();
}