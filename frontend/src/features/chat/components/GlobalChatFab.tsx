"use client";

import { usePathname } from "next/navigation";
import type { ChatContextType } from "@/shared/types";
import { ChatFab } from "./ChatFab";

/**
 * 지금 경로 → 챗봇 컨텍스트(CHAT-01) 변환.
 * BENEFIT/REPORT/INSTRUMENT/SIMULATION 은 contextId 가 필수라서(명세 11장)
 * 경로에 id 가 있는 화면만 그 컨텍스트를 쓰고, 나머지는 HOME 으로 열어요.
 * 더 정확한 맥락이 필요한 화면은 여기에 규칙을 추가해 주세요.
 */
function contextFromPathname(pathname: string): {
  contextType: ChatContextType;
  contextId: string | null;
} {
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] === "assets") return { contextType: "ASSET", contextId: null };
  if (segments[0] === "benefits" && segments[1])
    return { contextType: "BENEFIT", contextId: segments[1] };
  if (segments[0] === "report" && segments[1])
    return { contextType: "REPORT", contextId: segments[1] };
  if (segments[0] === "invest" && segments[1])
    return { contextType: "INSTRUMENT", contextId: segments[1] };
  return { contextType: "HOME", contextId: null };
}

/**
 * Figma 에 AI 버튼이 없는 화면(리뷰 참고: 진단 시작·문항·결과, 종목 상세, 레포트 상세).
 * 버튼만 숨기고 ChatFab 은 그대로 둬서, "쉽게 설명 듣기" 같은 화면 버튼이
 * requestOpenChat() 으로 시트를 여는 건 계속 동작해요.
 */
function isButtonHidden(pathname: string): boolean {
  const segments = pathname.split("/").filter(Boolean);
  // 진단 시작(/diagnosis)·문항·결과 — 성향 진단 홈(/diagnosis/home)에는 버튼이 있어요
  if (segments[0] === "diagnosis" && segments[1] !== "home") return true;
  // 종목 상세 — 주문 화면(/invest/[id]/order)에는 버튼이 있어요
  if (segments[0] === "invest" && segments[1] && segments[2] !== "order") return true;
  // 레포트 상세
  if (segments[0] === "report" && segments[1]) return true;
  return false;
}

/**
 * 모든 화면 공용 AI 버튼. app/(main)/layout.tsx 에서 한 번만 렌더링해요.
 * 특정 화면에서 다른 컨텍스트로 띄우고 싶으면 그 화면에
 * `<ChatFab contextType=... contextId=... />` 를 직접 붙이는 대신
 * 위 contextFromPathname 에 규칙을 추가하면 돼요 (버튼이 두 개 뜨지 않게).
 */
export function GlobalChatFab() {
  const pathname = usePathname();
  const { contextType, contextId } = contextFromPathname(pathname);
  return (
    <ChatFab
      contextType={contextType}
      contextId={contextId}
      showButton={!isButtonHidden(pathname)}
    />
  );
}
