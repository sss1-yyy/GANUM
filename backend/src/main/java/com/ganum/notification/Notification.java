package com.ganum.notification;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 인앱 알림. 생성은 서버(스케줄러·레포트 완료)가 하고, API 는 조회·읽음 처리만 합니다. */
@Entity
@Table(name = "notifications",
		uniqueConstraints = @UniqueConstraint(columnNames = { "user_id", "dedup_key" }),
		indexes = @Index(columnList = "user_id, created_at, id"))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Notification {

	public enum Type { PRICE_CHANGE, PORTFOLIO_RISK, BENEFIT_DEADLINE, REPORT_READY, SYSTEM }

	public enum TargetType { HOME, ASSET, BENEFIT, REPORT, INSTRUMENT, SIMULATION }

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "user_id", nullable = false)
	private Long userId;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private Type type;

	@Column(nullable = false, length = 100)
	private String title;

	@Column(nullable = false, length = 500)
	private String body;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private TargetType targetType;

	@Column(length = 50)
	private String targetResourceId;

	private Instant readAt;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	/** 같은 사건으로 알림이 두 번 생기지 않게 하는 키. 예: PRICE:ins_005930:2026-11-03 */
	@Column(name = "dedup_key", nullable = false, length = 120)
	private String dedupKey;

	public Notification(Long userId, Type type, String title, String body, TargetType targetType,
			String targetResourceId, String dedupKey, Instant createdAt) {
		this.userId = userId;
		this.type = type;
		this.title = title;
		this.body = body;
		this.targetType = targetType;
		this.targetResourceId = targetResourceId;
		this.dedupKey = dedupKey;
		// 커서 비교가 DB 정밀도와 어긋나지 않도록 밀리초 단위로 저장
		this.createdAt = createdAt.truncatedTo(ChronoUnit.MILLIS);
	}

	/** 이미 읽은 알림은 처음 읽은 시각을 유지 */
	public void markRead(Instant now) {
		if (readAt == null) {
			readAt = now.truncatedTo(ChronoUnit.MILLIS);
		}
	}
}
