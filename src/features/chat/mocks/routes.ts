import { MOCK_NOW } from "@/mocks/clock";
import {
  bodyAsObject,
  created,
  fail,
  listOf,
  notFound,
  ok,
  validationError,
} from "@/mocks/helpers";
import { mockState, nextMockId } from "@/mocks/store";
import { chargeTokens, TOKEN_COSTS } from "@/mocks/shared/usage";
import type { MockRoute } from "@/mocks/types";
import type { ChatMessage, ChatSession } from "../types";

/**
 * 챗봇 목데이터. 답변은 화면 종류별 고정 문장이에요(실제 AI 아님).
 * 답변 본문의 "쉽게 말하면:" 뒤는 화면에서 흰 카드로 따로 보여줘요. (명세 외 제안 — docs/figma-api-gaps.md)
 */
interface ChatState {
  sessions: Record<string, ChatSession>;
  messages: Record<string, ChatMessage[]>;
}
const state = () => mockState<ChatState>("chat", () => ({ sessions: {}, messages: {} }));

const TITLES: Record<ChatSession["contextType"], string> = {
  HOME: "기준금리 인하",
  ASSET: "내 자산",
  BENEFIT: "청년 혜택",
  REPORT: "내 레포트",
  INSTRUMENT: "종목 설명",
  SIMULATION: "시뮬레이션 결과",
};

const SUGGESTIONS: Record<ChatSession["contextType"], string[]> = {
  HOME: ["내 적금은?", "예시로 설명", "더 쉽게"],
  ASSET: ["어디에 많이 있어요?", "비중이 괜찮나요?", "더 쉽게"],
  BENEFIT: ["5년 뒤 얼마 받아?", "가입할 수 있을까?", "중도 해지하면?"],
  REPORT: ["뭐부터 해요?", "비상금은 얼마나?", "월세 지원 신청법"],
  INSTRUMENT: ["어떤 회사예요?", "위험한가요?", "얼마부터 시작해요?"],
  SIMULATION: ["왜 이런 결과가 나왔어요?", "분산하면 달라져요?", "더 쉽게"],
};

const ANSWERS: Record<ChatSession["contextType"], { body: string; easy: string }> = {
  HOME: {
    body: "기준금리가 내려가면 예금·적금 금리도 함께 내려갈 가능성이 커요. 이미 가입한 상품은 가입 당시 금리가 유지되는 경우가 많아요.",
    easy: "새로 가입하는 상품의 이자가 줄어들 수 있고, 이미 든 적금은 그대로인 경우가 많아요.",
  },
  ASSET: {
    body: "예적금 비중이 가장 크고, 증권과 코인이 나머지를 차지해요. 한 곳에 몰려 있지는 않은지 비중을 함께 살펴보세요.",
    easy: "돈이 어디에 얼마나 나뉘어 있는지 보는 거예요.",
  },
  BENEFIT: {
    body: "신청 조건과 마감일은 공식 안내에서 한 번 더 확인해 주세요. 입력하신 나이·소득 기준으로는 대상일 가능성이 있어요.",
    easy: "내 조건이 맞는지 확인하고, 마감 전에 신청하면 돼요.",
  },
  REPORT: {
    body: "비상금을 먼저 채운 뒤 장기 적금을 시작하는 순서를 권해요. 월 저축 여력 안에서 나눠 담아 보세요.",
    easy: "급할 때 쓸 돈부터 만들고, 그다음에 오래 묶어둘 돈을 모으는 거예요.",
  },
  INSTRUMENT: {
    body: "이 종목은 가격 변동이 있을 수 있어요. 한 번에 큰 금액을 넣기보다 나눠서 시작하는 방법이 있어요.",
    easy: "주가가 오르내릴 수 있으니 작게 시작해 보라는 뜻이에요.",
  },
  SIMULATION: {
    body: "선택한 기간의 실제 가격 흐름으로 계산한 결과예요. 앞으로의 수익을 보장하지 않아요.",
    easy: "그때 샀다면 이랬을 거라는 계산일 뿐, 미래를 알려주는 건 아니에요.",
  },
};

function message(role: ChatMessage["role"], content: string): ChatMessage {
  return { id: nextMockId("msg"), role, content, sources: [], createdAt: MOCK_NOW };
}

export const chatMockRoutes: MockRoute[] = [
  // CHAT-01
  {
    method: "POST",
    path: "/chat/sessions",
    handler: (request) => {
      const body = bodyAsObject(request);
      const type = body?.contextType;
      const id = body?.contextId ?? null;
      if (typeof type !== "string" || !(type in TITLES)) {
        return validationError([{ field: "contextType", message: "올바른 화면 종류가 아니에요." }]);
      }
      const contextType = type as ChatSession["contextType"];
      const needsId = contextType !== "HOME" && contextType !== "ASSET";
      if (needsId && typeof id !== "string") {
        return validationError([{ field: "contextId", message: "리소스 ID 가 필요해요." }]);
      }
      const session: ChatSession = {
        id: nextMockId("chat"),
        contextType,
        contextId: needsId ? (id as string) : null,
        title: TITLES[contextType],
        suggestedQuestions: SUGGESTIONS[contextType],
        createdAt: MOCK_NOW,
      };
      state().sessions[session.id] = session;
      state().messages[session.id] = [];
      return created(session);
    },
  },

  // CHAT-03
  {
    method: "GET",
    path: "/chat/sessions/:sessionId/messages",
    handler: (request) => {
      const list = state().messages[request.params.sessionId ?? ""];
      if (!list) return notFound("대화를 찾을 수 없어요.");
      return listOf(list, request);
    },
  },

  // CHAT-04
  {
    method: "POST",
    path: "/chat/sessions/:sessionId/messages",
    handler: (request) => {
      const sessionId = request.params.sessionId ?? "";
      const session = state().sessions[sessionId];
      if (!session) return notFound("대화를 찾을 수 없어요.");
      const content = String(bodyAsObject(request)?.content ?? "").trim();
      if (content.length < 1 || content.length > 2000) {
        return validationError([{ field: "content", message: "1~2000자로 입력해 주세요." }]);
      }
      if (!chargeTokens("CHAT")) {
        return fail(409, "TOKEN_INSUFFICIENT", "이용권이 부족해요.");
      }
      const answer = ANSWERS[session.contextType];
      const userMessage = message("USER", content);
      const assistantMessage = message(
        "ASSISTANT",
        `${answer.body}\n\n쉽게 말하면: ${answer.easy}`,
      );
      state().messages[sessionId]!.push(userMessage, assistantMessage);
      return ok({
        userMessage,
        assistantMessage,
        suggestedQuestions: SUGGESTIONS[session.contextType],
        tokensCharged: TOKEN_COSTS.CHAT,
      });
    },
  },
];
