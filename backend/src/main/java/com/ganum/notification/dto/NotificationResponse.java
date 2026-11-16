package com.ganum.notification.dto;

import java.time.OffsetDateTime;

import com.ganum.common.time.Times;
import com.ganum.notification.Notification;

/** NOTI-01 항목 / NOTI-02 응답 */
public record NotificationResponse(
		String id,
		String type,
		String title,
		String body,
		Target target,
		OffsetDateTime readAt,
		OffsetDateTime createdAt) {

	/** NoticeLink */
	public record Target(String type, String resourceId) {
	}

	public static NotificationResponse from(Notification n) {
		return new NotificationResponse(String.valueOf(n.getId()), n.getType().name(), n.getTitle(), n.getBody(),
				new Target(n.getTargetType().name(), n.getTargetResourceId()), Times.toKst(n.getReadAt()),
				Times.toKst(n.getCreatedAt()));
	}
}
