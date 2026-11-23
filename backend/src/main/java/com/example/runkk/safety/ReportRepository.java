package com.example.runkk.safety;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ReportRepository extends JpaRepository<Report, Long> {

    boolean existsByReporterMemberIdAndTargetTypeAndTargetIdAndStatus(Long reporterId, Report.TargetType targetType,
            Long targetId, Report.Status status);
}
