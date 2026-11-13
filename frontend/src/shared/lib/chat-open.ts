/**
 * AI 금융 코치 시트를 "기능 폴더 밖에서" 열기 위한 작은 통로예요.
 *
 * features 끼리는 직접 import 할 수 없어서(ESLint 규칙), 예를 들어
 * 종목 상세(invest)의 "쉽게 설명 듣기" 버튼이 챗봇(chat)의 시트를 열고 싶을 때
 * 이 모듈을 통해 요청만 보내요. 실제로 여는 건 화면에 떠 있는 ChatFab 이에요.
 */
type Listener = () => void;

const listeners = new Set<Listener>();

/** AI 코치 시트 열기 요청을 구독해요 (ChatFab 이 사용). 반환값은 구독 해제 함수예요. */
export function onOpenChatRequest(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** 지금 화면의 AI 코치 시트를 열어요 (예: 종목 상세 "쉽게 설명 듣기"). */
export function requestOpenChat(): void {
  for (const listener of listeners) {
    listener();
  }
}
