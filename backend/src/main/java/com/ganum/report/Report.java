package com.ganum.report;

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

import com.ganum.common.api.Meta.DataSource;

/** 조언서 1부. 생성은 비동기: QUEUED → RUNNING → SUCCEEDED / FAILED */
@Entity
@Table(name = "reports", indexes = @Index(columnList = "user_id, created_at, id"))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Report {

	public enum Kind { FINANCIAL, PAPER }

	public enum Status { QUEUED, RUNNING, SUCCEEDED, FAILED }

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "user_id", nullable = false)
	private Long userId;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private Kind kind;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private Status status;

	/** ReportContent JSON. 성공 전에는 null. MySQL: mediumtext, H2: varchar(1000000) */
	@Column(length = 1_000_000)
	private String contentJson;

	@Column(length = 40)
	private String errorCode;

	/** 생성 시 차감한 서비스 토큰 (실패 시 환불용) */
	@Column(nullable = false)
	private int tokensCharged;

	/** AI 모델 입력+출력 토큰 수 (비용 추적용) */
	private Integer aiTokens;

	/** 사용한 데이터의 출처·기준 시각 (응답 meta) */
	@Enumerated(EnumType.STRING)
	@Column(length = 10)
	private DataSource dataSource;

	private Instant dataAsOf;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	private Instant completedAt;

	public Report(Long userId, Kind kind, int tokensCharged, Instant createdAt) {
		this.userId = userId;
		this.kind = kind;
		this.status = Status.QUEUED;
		this.tokensCharged = tokensCharged;
		this.createdAt = createdAt.truncatedTo(ChronoUnit.MILLIS);
	}

	public void start() {
		this.status = Status.RUNNING;
	}

	public void succeed(String contentJson, Integer aiTokens, DataSource dataSource, Instant dataAsOf, Instant now) {
		this.status = Status.SUCCEEDED;
		this.contentJson = contentJson;
		this.aiTokens = aiTokens;
		this.dataSource = dataSource;
		this.dataAsOf = dataAsOf;
		this.errorCode = null;
		this.completedAt = now;
	}

	public void fail(String errorCode, Instant now) {
		this.status = Status.FAILED;
		this.errorCode = errorCode;
		this.completedAt = now;
	}

	public boolean isFinished() {
		return status == Status.SUCCEEDED || status == Status.FAILED;
	}
}
