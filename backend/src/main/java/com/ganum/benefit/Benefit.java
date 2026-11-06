package com.ganum.benefit;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 청년 혜택 시드. 혜택 API 자체는 목데이터 범위라 서버에 없고,
 * 실구현인 "혜택 마감 D-7 알림"이 마감일을 읽기 위해서만 둡니다.
 */
@Entity
@Table(name = "benefits")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Benefit {

	/** 프론트 목데이터와 같은 ID. 예: ben_youth_leap */
	@Id
	@Column(length = 50)
	private String id;

	@Column(nullable = false, length = 100)
	private String title;

	/** 신청 마감일. 상시면 null */
	private LocalDate deadline;

	public Benefit(String id, String title, LocalDate deadline) {
		this.id = id;
		this.title = title;
		this.deadline = deadline;
	}
}
