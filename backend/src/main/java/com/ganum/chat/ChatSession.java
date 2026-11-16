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
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 화면 맥락 대화 1개. 어떤 화면(contextType)의 어떤 리소스(contextId)에서 열었는지 기억합니다. */
@Entity
@Table(name = "chat_sessions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ChatSession {

	public enum ContextType { HOME, ASSET, BENEFIT, REPORT, INSTRUMENT, SIMULATION }

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private Long userId;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private ContextType contextType;

	@Column(length = 50)
	private String contextId;

	@Column(nullable = false, length = 50)
	private String title;

	@Column(nullable = false)
	private Instant createdAt;

	public ChatSession(Long userId, ContextType contextType, String contextId, String title, Instant createdAt) {
		this.userId = userId;
		this.contextType = contextType;
		this.contextId = contextId;
		this.title = title;
		this.createdAt = createdAt.truncatedTo(ChronoUnit.MILLIS);
	}
}
