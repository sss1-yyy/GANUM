package com.ganum.chat.dto;

import java.time.OffsetDateTime;
import java.util.List;

import com.ganum.report.ReportContent;

/** CHAT-01·03·04 요청/응답 */
public final class ChatDtos {

	private ChatDtos() {
	}

	/** CHAT-01 요청 */
	public record CreateSessionRequest(String contextType, String contextId) {
	}

	/** CHAT-01 응답 */
	public record Session(String id, String contextType, String contextId, String title,
			List<String> suggestedQuestions, OffsetDateTime createdAt) {
	}

	/** CHAT-03 항목 */
	public record Message(String id, String role, String content, List<ReportContent.Source> sources,
			OffsetDateTime createdAt) {
	}

	/** CHAT-04 요청 */
	public record SendRequest(String content) {
	}

	/** CHAT-04 응답 */
	public record SendResult(Message userMessage, Message assistantMessage, List<String> suggestedQuestions,
			int tokensCharged) {
	}
}
