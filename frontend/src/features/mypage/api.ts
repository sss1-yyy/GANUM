import { apiGet, apiPatch } from "@/shared/api";
import type { ListData } from "@/shared/api";
import type { AppNotification, OrderRecord } from "./types";

// NOTI-01 · 인앱 알림 목록
export const getNotifications = (unreadOnly = false) =>
  apiGet<ListData<AppNotification>>("/notifications", { query: { unreadOnly } });

// NOTI-02 · 알림 읽음 처리
export const markNotificationRead = (id: string) =>
  apiPatch<AppNotification>(`/notifications/${id}`, { read: true });

// PAPER-04 · 모의 거래 기록 (투자 기록 화면)
export const getOrderRecords = () => apiGet<ListData<OrderRecord>>("/paper/orders");

export const mypageKeys = {
  notifications: ["notifications"] as const,
  orders: ["paper", "orders"] as const,
};
