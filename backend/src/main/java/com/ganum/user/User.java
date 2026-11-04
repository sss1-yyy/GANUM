package com.ganum.user;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	/** 로그인 식별자. 지금은 데모 사용자 "demo" 하나뿐. */
	@Column(nullable = false, unique = true, length = 50)
	private String loginId;

	@Column(nullable = false, length = 20)
	private String nickname;

	@Column(nullable = false)
	private Instant createdAt;

	public User(String loginId, String nickname, Instant createdAt) {
		this.loginId = loginId;
		this.nickname = nickname;
		this.createdAt = createdAt;
	}
}
