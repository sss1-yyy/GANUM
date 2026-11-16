package com.ganum.chat;

import java.time.Clock;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

import org.springframework.data.domain.Limit;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import com.ganum.ai.AiException;
import com.ganum.ai.GeminiClient;
import com.ganum.chat.ChatSession.ContextType;
import com.ganum.chat.dto.ChatDtos;
import com.ganum.common.api.KeysetCursor;
import com.ganum.common.api.ListData;
import com.ganum.common.api.OffsetCursor;
import com.ganum.common.error.ApiException;
import com.ganum.common.error.ErrorCode;
import com.ganum.common.time.Times;
import com.ganum.report.ReportContent;
import com.ganum.usage.UsageFeature;
import com.ganum.usage.UsageService;

import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Service
public class ChatService {

	private static final int MAX_CONTENT = 2000;
	/** 답변의 이 문구 뒤는 화면에서 "쉽게 말하면" 카드로 따로 보여줍니다 (프론트 약속) */
	private static final String EASY_PREFIX = "\n\n쉽게 말하면: ";

	private static final String SYSTEM = """
			너는 20대 청년을 돕는 금융 코치 서비스 "가늠"의 챗봇이야.
			규칙:
			- 한국어 해요체, 2~4문장으로 짧고 쉽게 답해.
			- 숫자는 [화면 맥락의 사실]에 있는 값만 써. 새로운 수치·수익률·금리를 지어내지 마. 모르면 모른다고 말해.
			- 확정 수익, "꼭 사세요" 같은 투자 권유 표현 금지. 투자 이야기에는 손실 가능성을 함께 알려.
			- 혜택 자격은 단정하지 말고 공식 안내 확인을 권해.
			- easy 에는 중학생도 이해할 한 문장 요약을 써.
			- suggestedQuestions 는 사용자가 이어서 물어볼 만한 짧은 질문 3개 (15자 이내).
			""";

	private static final Map<String, Object> SCHEMA = Map.of(
			"type", "OBJECT",
			"properties", Map.of(
					"answer", Map.of("type", "STRING"),
					"easy", Map.of("type", "STRING"),
					"suggestedQuestions", Map.of("type", "ARRAY", "items", Map.of("type", "STRING"))),
			"required", List.of("answer", "easy", "suggestedQuestions"));

	private final ChatSessionRepository sessionRepository;
	private final ChatMessageRepository messageRepository;
	private final ChatContextLoader contextLoader;
	private final GeminiClient gemini;
	private final UsageService usageService;
	private final ObjectMapper objectMapper;
	private final TransactionTemplate tx;
	private final Clock clock;

	public ChatService(ChatSessionRepository sessionRepository, ChatMessageRepository messageRepository,
			ChatContextLoader contextLoader, GeminiClient gemini, UsageService usageService, ObjectMapper objectMapper,
			TransactionTemplate tx, Clock clock) {
		this.sessionRepository = sessionRepository;
		this.messageRepository = messageRepository;
		this.contextLoader = contextLoader;
		this.gemini = gemini;
		this.usageService = usageService;
		this.objectMapper = objectMapper;
		this.tx = tx;
		this.clock = clock;
	}

	/** CHAT-01 */
	@Transactional
	public ChatDtos.Session create(Long userId, ChatDtos.CreateSessionRequest request) {
		ContextType type = parseType(request.contextType());
		String contextId = request.contextId();
		boolean needsId = type != ContextType.HOME && type != ContextType.ASSET;
		if (needsId && (contextId == null || contextId.isBlank())) {
			throw ApiException.validation("contextId", "리소스 ID 가 필요해요.");
		}
		if (!needsId && contextId != null) {
			throw ApiException.validation("contextId", "HOME·ASSET 은 null 이어야 해요.");
		}
		String title = contextLoader.verifyAndTitle(userId, type, contextId);
		ChatSession s = sessionRepository.save(new ChatSession(userId, type, needsId ? contextId : null, title,
				clock.instant()));
		return new ChatDtos.Session(String.valueOf(s.getId()), type.name(), s.getContextId(), s.getTitle(),
				ChatContextLoader.SUGGESTIONS.get(type), Times.toKst(s.getCreatedAt()));
	}

	/** CHAT-03 · 오래된 순 */
	@Transactional(readOnly = true)
	public ListData<ChatDtos.Message> messages(Long userId, String sessionId, String cursor, Integer limit) {
		ChatSession session = find(userId, sessionId);
		int size = OffsetCursor.limit(limit);
		KeysetCursor after = KeysetCursor.decode(cursor);
		List<ChatMessage> rows = messageRepository.findPage(session.getId(), after == null ? null : after.createdAt(),
				after == null ? null : after.id(), Limit.of(size + 1));
		boolean hasNext = rows.size() > size;
		List<ChatMessage> page = hasNext ? rows.subList(0, size) : rows;
		String next = hasNext ? new KeysetCursor(page.getLast().getCreatedAt(), page.getLast().getId()).encode() : null;
		return ListData.of(page.stream().map(this::toDto).toList(), next);
	}

	/**
	 * CHAT-04 · 동기 방식. AI 가 실패하면 아무것도 저장하지 않고 토큰도 차감하지 않습니다.
	 */
	public ChatDtos.SendResult send(Long userId, String sessionId, ChatDtos.SendRequest request) {
		ChatSession session = tx.execute(s -> find(userId, sessionId));
		String content = request == null || request.content() == null ? "" : request.content().strip();
		if (content.isEmpty() || content.length() > MAX_CONTENT) {
			throw ApiException.validation("content", "1~2000자로 입력해 주세요.");
		}
		if (!usageService.hasEnough(userId, UsageFeature.CHAT)) {
			throw new ApiException(ErrorCode.TOKEN_INSUFFICIENT);
		}

		ChatContext context = tx.execute(s -> contextLoader.load(userId, session));
		Answer answer = gemini.enabled() ? askGemini(session, context, content) : template(session, context);
		String sourcesJson = objectMapper.writeValueAsString(context.sources());

		return tx.execute(s -> {
			int charged = usageService.charge(userId, UsageFeature.CHAT);
			ChatMessage user = messageRepository.save(new ChatMessage(session.getId(), ChatMessage.Role.USER, content,
					"[]", null, clock.instant()));
			ChatMessage assistant = messageRepository.save(new ChatMessage(session.getId(),
					ChatMessage.Role.ASSISTANT, answer.text(), sourcesJson, answer.aiTokens(), clock.instant()));
			return new ChatDtos.SendResult(toDto(user), toDto(assistant), answer.suggestions(), charged);
		});
	}

	private Answer askGemini(ChatSession session, ChatContext context, String question) {
		StringBuilder ctx = new StringBuilder("[화면 맥락] ").append(context.description()).append('\n');
		ctx.append("[화면 맥락의 사실]\n");
		context.facts().forEach(f -> ctx.append("- ").append(f).append('\n'));

		List<GeminiClient.Turn> turns = new ArrayList<>();
		turns.add(GeminiClient.Turn.user(ctx.toString()));
		turns.add(GeminiClient.Turn.model("{\"answer\":\"화면 맥락을 확인했어요.\",\"easy\":\"\",\"suggestedQuestions\":[]}"));
		List<ChatMessage> history = new ArrayList<>(
				messageRepository.findTop10BySessionIdOrderByCreatedAtDescIdDesc(session.getId()));
		java.util.Collections.reverse(history);
		for (ChatMessage m : history) {
			turns.add(m.getRole() == ChatMessage.Role.USER ? GeminiClient.Turn.user(m.getContent())
					: GeminiClient.Turn.model(m.getContent()));
		}
		turns.add(GeminiClient.Turn.user(question));

		try {
			GeminiClient.Reply reply = gemini.generateJson(SYSTEM, turns, SCHEMA);
			JsonNode json = reply.json();
			String body = json.path("answer").asString("").strip();
			if (body.isEmpty()) {
				throw new AiException(ErrorCode.SERVICE_UNAVAILABLE, "빈 답변");
			}
			String easy = json.path("easy").asString("").strip();
			List<String> suggestions = new ArrayList<>();
			for (JsonNode q : json.path("suggestedQuestions")) {
				String t = q.asString("").strip();
				if (!t.isEmpty() && suggestions.size() < 3) {
					suggestions.add(t.length() > 30 ? t.substring(0, 30) : t);
				}
			}
			if (suggestions.isEmpty()) {
				suggestions = ChatContextLoader.SUGGESTIONS.get(session.getContextType());
			}
			return new Answer(easy.isEmpty() ? body : body + EASY_PREFIX + easy, suggestions, reply.totalTokens());
		}
		catch (AiException e) {
			throw new ApiException(e.code(), e.code().defaultMessage());
		}
	}

	private static Answer template(ChatSession session, ChatContext context) {
		return new Answer(context.templateAnswer() + EASY_PREFIX + context.templateEasy(),
				ChatContextLoader.SUGGESTIONS.get(session.getContextType()), null);
	}

	private ChatDtos.Message toDto(ChatMessage m) {
		List<ReportContent.Source> sources = objectMapper.readValue(m.getSourcesJson(),
				new TypeReference<List<ReportContent.Source>>() {
				});
		return new ChatDtos.Message(String.valueOf(m.getId()), m.getRole().name(), m.getContent(), sources,
				Times.toKst(m.getCreatedAt()));
	}

	private ChatSession find(Long userId, String sessionId) {
		return parseId(sessionId).flatMap(id -> sessionRepository.findByIdAndUserId(id, userId))
				.orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "대화를 찾을 수 없어요."));
	}

	private static ContextType parseType(String text) {
		if (text == null) {
			throw ApiException.validation("contextType", "필수 값이에요.");
		}
		try {
			return ContextType.valueOf(text.toUpperCase(Locale.ROOT));
		}
		catch (IllegalArgumentException e) {
			throw ApiException.validation("contextType", "올바른 화면 종류가 아니에요.");
		}
	}

	private static Optional<Long> parseId(String id) {
		try {
			return Optional.of(Long.parseLong(id));
		}
		catch (NumberFormatException e) {
			return Optional.empty();
		}
	}

	private record Answer(String text, List<String> suggestions, Integer aiTokens) {
	}
}
