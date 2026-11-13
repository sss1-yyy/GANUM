import type { ReactNode } from "react";
import { GlobalChatFab } from "@/features/chat/components/GlobalChatFab";

/**
 * 로그인 후 화면의 공통 틀. AI 금융 코치 버튼(ChatFab)은 여기서 한 번만 렌더링해서
 * 모든 화면에 떠요. 탭바 등 다른 공통 틀은 담당자와 합의해 여기에 추가하세요.
 */
export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <GlobalChatFab />
    </>
  );
}
