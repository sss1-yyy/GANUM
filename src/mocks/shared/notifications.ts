import { mockState } from "../store";

export interface MockNotification {
  id: string;
  type: "PRICE_CHANGE" | "PORTFOLIO_RISK" | "BENEFIT_DEADLINE" | "REPORT_READY" | "SYSTEM";
  title: string;
  body: string;
  target: {
    type: "HOME" | "ASSET" | "BENEFIT" | "REPORT" | "INSTRUMENT" | "SIMULATION";
    resourceId: string | null;
  };
  readAt: string | null;
  createdAt: string;
}

/** ⚠ Figma 에 알림 화면 디자인이 없어서 내용은 예시입니다. (홈의 읽지 않은 알림 2개와 맞춤) */
export const notificationState = () =>
  mockState<{ items: MockNotification[] }>("notifications", () => ({
    items: [
      {
        id: "noti_1",
        type: "BENEFIT_DEADLINE",
        title: "청년도약계좌 신청 마감이 다가와요",
        body: "마감까지 12일 남았어요.",
        target: { type: "BENEFIT", resourceId: "ben_youth_leap" },
        readAt: null,
        createdAt: "2026-10-25T08:00:00+09:00",
      },
      {
        id: "noti_2",
        type: "PRICE_CHANGE",
        title: "SK하이닉스가 크게 움직였어요",
        body: "오늘 +0.4% 올랐어요.",
        target: { type: "INSTRUMENT", resourceId: "ins_000660" },
        readAt: null,
        createdAt: "2026-10-24T15:30:00+09:00",
      },
      {
        id: "noti_3",
        type: "REPORT_READY",
        title: "새 레포트가 준비됐어요",
        body: "10월 8일 내 레포트를 확인해 보세요.",
        target: { type: "REPORT", resourceId: "report_1008" },
        readAt: "2026-10-08T11:00:00+09:00",
        createdAt: "2026-10-08T10:05:00+09:00",
      },
    ],
  }));

export const unreadCount = () => notificationState().items.filter((n) => n.readAt === null).length;
