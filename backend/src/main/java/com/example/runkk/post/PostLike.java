package com.example.runkk.post;

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

/** 좋아요 (ERD: post_like). 한 사람이 한 글에 한 번만 */
@Entity
@Table(name = "post_like", uniqueConstraints = @UniqueConstraint(columnNames = { "post_id", "member_id" }))
@Getter
@Setter
@NoArgsConstructor
public class PostLike {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long likeId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "post_id")
    private Post post;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id")
    private Member member;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    public PostLike(Post post, Member member) {
        this.post = post;
        this.member = member;
    }
}
