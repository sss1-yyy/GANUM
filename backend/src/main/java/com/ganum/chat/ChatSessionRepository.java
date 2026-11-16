package com.ganum.chat;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatSessionRepository extends JpaRepository<ChatSession, Long> {

	Optional<ChatSession> findByIdAndUserId(Long id, Long userId);
}
