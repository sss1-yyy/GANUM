package com.ganum.report;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ReportRepository extends JpaRepository<Report, Long> {

	@Query("""
			select r from Report r
			where r.userId = :userId
			  and (:cursorAt is null or r.createdAt < :cursorAt or (r.createdAt = :cursorAt and r.id < :cursorId))
			order by r.createdAt desc, r.id desc
			""")
	List<Report> findPage(Long userId, Instant cursorAt, Long cursorId, Limit limit);

	Optional<Report> findByIdAndUserId(Long id, Long userId);

	List<Report> findByStatusIn(Collection<Report.Status> statuses);
}
