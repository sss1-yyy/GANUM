package com.ganum.notification;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

	@Query("""
			select n from Notification n
			where n.userId = :userId
			  and (:unreadOnly = false or n.readAt is null)
			  and (:cursorAt is null or n.createdAt < :cursorAt or (n.createdAt = :cursorAt and n.id < :cursorId))
			order by n.createdAt desc, n.id desc
			""")
	List<Notification> findPage(Long userId, boolean unreadOnly, Instant cursorAt, Long cursorId, Limit limit);

	Optional<Notification> findByIdAndUserId(Long id, Long userId);

	boolean existsByUserIdAndDedupKey(Long userId, String dedupKey);

	long countByUserIdAndReadAtIsNull(Long userId);
}
