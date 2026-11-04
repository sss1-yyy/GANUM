package com.ganum.chat;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.ganum.chat.dto.ChatDtos;
import com.ganum.common.api.ApiResponse;
import com.ganum.common.api.ListData;
import com.ganum.common.auth.CurrentUserId;

@RestController
@RequestMapping("/api/v1/chat/sessions")
public class ChatController {

	private final ChatService chatService;

	public ChatController(ChatService chatService) {
		this.chatService = chatService;
	}

	/** CHAT-01 · 화면 맥락 대화 생성 */
	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public ApiResponse<ChatDtos.Session> create(@CurrentUserId Long userId,
			@RequestBody ChatDtos.CreateSessionRequest request) {
		return ApiResponse.of(chatService.create(userId, request));
	}

	/** CHAT-03 · 대화 메시지 목록 */
	@GetMapping("/{sessionId}/messages")
	public ApiResponse<ListData<ChatDtos.Message>> messages(@CurrentUserId Long userId,
			@PathVariable String sessionId, @RequestParam(required = false) String cursor,
			@RequestParam(required = false) Integer limit) {
		return ApiResponse.of(chatService.messages(userId, sessionId, cursor, limit));
	}

	/** CHAT-04 · 질문 전송 */
	@PostMapping("/{sessionId}/messages")
	public ApiResponse<ChatDtos.SendResult> send(@CurrentUserId Long userId, @PathVariable String sessionId,
			@RequestBody ChatDtos.SendRequest request) {
		return ApiResponse.of(chatService.send(userId, sessionId, request));
	}
}
