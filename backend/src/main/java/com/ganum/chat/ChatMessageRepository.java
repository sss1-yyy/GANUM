package com.ganum.chat;

import java.time.Instant;
import java.util.List;

import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

	/** 대화 화면은 시간 순서대로 그리므로 오래된 순 */
	@Query("""
			select m from ChatMessage m
			where m.sessionId = :sessionId
			  and (:cursorAt is null or m.createdAt > :cursorAt or (m.createdAt = :cursorAt and m.id > :cursorId))
			order by m.createdAt asc, m.id asc
			""")
	List<ChatMessage> findPage(Long sessionId, Instant cursorAt, Long cursorId, Limit limit);

	/** AI 에 넘길 최근 대화 (최신순으로 가져와 뒤집어 씀) */
	List<ChatMessage> findTop10BySessionIdOrderByCreatedAtDescIdDesc(Long sessionId);
}
