package com.ganum.chat;

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
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 말풍선 1개 */
@Entity
@Table(name = "chat_messages", indexes = @Index(columnList = "session_id, created_at, id"))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ChatMessage {

	public enum Role { USER, ASSISTANT }

	/** MySQL: mediumtext(16MB), H2: varchar(100000) */
	static final int TEXT_LENGTH = 100_000;

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "session_id", nullable = false)
	private Long sessionId;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 10)
	private Role role;

	/** 길이를 명시해야 MySQL 에서 mediumtext 가 됩니다. (@Lob + @Column 은 tinytext=255바이트로 만들어져 저장 실패) */
	@Column(nullable = false, length = TEXT_LENGTH)
	private String content;

	/** sources[] JSON (사용자 메시지는 "[]") */
	@Column(nullable = false, length = TEXT_LENGTH)
	private String sourcesJson;

	/** AI 모델 토큰 수 (비용 추적용, ASSISTANT 만) */
	private Integer aiTokens;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	public ChatMessage(Long sessionId, Role role, String content, String sourcesJson, Integer aiTokens,
			Instant createdAt) {
		this.sessionId = sessionId;
		this.role = role;
		this.content = content;
		this.sourcesJson = sourcesJson;
		this.aiTokens = aiTokens;
		this.createdAt = createdAt.truncatedTo(ChronoUnit.MILLIS);
	}
}
