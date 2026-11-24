package com.example.runkk.safety;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import com.example.runkk.member.Member;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** 차단 (ERD: block). blocker 가 blocked 를 차단했다 */
@Entity
@Table(name = "block", uniqueConstraints = @UniqueConstraint(columnNames = { "blocker_id", "blocked_id" }))
@Getter
@Setter
@NoArgsConstructor
public class Block {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long blockId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "blocker_id")
    private Member blocker;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "blocked_id")
    private Member blocked;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
