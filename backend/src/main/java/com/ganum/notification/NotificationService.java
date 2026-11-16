package com.ganum.notification;

import java.time.Clock;
import java.util.List;

import org.springframework.data.domain.Limit;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ganum.common.api.KeysetCursor;
import com.ganum.common.api.ListData;
import com.ganum.common.api.OffsetCursor;
import com.ganum.common.error.ApiException;
import com.ganum.common.error.ErrorCode;
import com.ganum.notification.dto.NotificationResponse;

@Service
public class NotificationService {

	private final NotificationRepository repository;
	private final Clock clock;

	public NotificationService(NotificationRepository repository, Clock clock) {
		this.repository = repository;
		this.clock = clock;
	}

	/** NOTI-01 · 최신순, cursor·limit */
	@Transactional(readOnly = true)
	public ListData<NotificationResponse> list(Long userId, boolean unreadOnly, String cursor, Integer limit) {
		int size = OffsetCursor.limit(limit);
		KeysetCursor after = KeysetCursor.decode(cursor);
		List<Notification> rows = repository.findPage(userId, unreadOnly,
				after == null ? null : after.createdAt(), after == null ? null : after.id(), Limit.of(size + 1));
		boolean hasNext = rows.size() > size;
		List<Notification> page = hasNext ? rows.subList(0, size) : rows;
		String next = hasNext ? new KeysetCursor(page.getLast().getCreatedAt(), page.getLast().getId()).encode() : null;
		return ListData.of(page.stream().map(NotificationResponse::from).toList(), next);
	}

	/** NOTI-02 · 본인 알림이 아니면 404 */
	@Transactional
	public NotificationResponse markRead(Long userId, String notificationId) {
		Notification n = parseId(notificationId)
				.flatMap(id -> repository.findByIdAndUserId(id, userId))
				.orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "알림을 찾을 수 없어요."));
		n.markRead(clock.instant());
		return NotificationResponse.from(n);
	}

	@Transactional(readOnly = true)
	public long unreadCount(Long userId) {
		return repository.countByUserIdAndReadAtIsNull(userId);
	}

	/**
	 * 알림을 만듭니다. 같은 dedupKey 가 이미 있으면 만들지 않고 false.
	 */
	@Transactional
	public boolean publish(Long userId, Notification.Type type, String title, String body,
			Notification.TargetType targetType, String targetResourceId, String dedupKey) {
		if (repository.existsByUserIdAndDedupKey(userId, dedupKey)) {
			return false;
		}
		repository.save(new Notification(userId, type, title, body, targetType, targetResourceId, dedupKey,
				clock.instant()));
		return true;
	}

	private static java.util.Optional<Long> parseId(String id) {
		try {
			return java.util.Optional.of(Long.parseLong(id));
		}
		catch (NumberFormatException e) {
			return java.util.Optional.empty();
		}
	}
}
