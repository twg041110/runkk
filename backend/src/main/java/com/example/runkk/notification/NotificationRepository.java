package com.example.runkk.notification;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    Page<Notification> findByMemberMemberIdOrderByCreatedAtDesc(Long memberId, Pageable pageable);

    long countByMemberMemberIdAndIsReadFalse(Long memberId);

    @Modifying
    @Query("update Notification n set n.isRead = true where n.member.memberId = :memberId and n.isRead = false")
    int markAllRead(@Param("memberId") Long memberId);
}
