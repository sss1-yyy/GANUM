"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { USE_MOCK } from "@/shared/api";
import { getNotifications, markNotificationRead, mypageKeys } from "../api";
import { formatDotDate } from "@/shared/lib/format";

export function NotificationsScreen() {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const queryClient = useQueryClient();

  const notifications = useQuery({
    queryKey: [...mypageKeys.notifications, unreadOnly],
    queryFn: () => getNotifications(unreadOnly),
  });

  const markRead = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: mypageKeys.notifications }),
  });

  const items = notifications.data?.data.items;

  return (
    <main className="flex h-dvh flex-col gap-5 overflow-y-auto overscroll-contain px-8 pt-5 pb-10">
      <h1 className="text-title text-text-strong font-bold">알림</h1>

      <label className="text-text flex min-h-11 cursor-pointer items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          className="accent-primary size-5"
          checked={unreadOnly}
          onChange={(event) => setUnreadOnly(event.target.checked)}
        />
        안 읽은 알림만 보기
      </label>

      {notifications.isPending && (
        <p role="status" className="text-text-sub text-sm">
          알림을 불러오고 있어요.
        </p>
      )}

      {notifications.isError && !items && (
        <div className="space-y-2">
          <p role="alert" className="text-danger text-sm">
            알림을 불러오지 못했어요.
          </p>
          <button
            type="button"
            className="rounded-button bg-sub text-primary min-h-11 px-4 text-sm font-semibold"
            onClick={() => void notifications.refetch()}
          >
            다시 시도해요
          </button>
        </div>
      )}

      {markRead.isError && (
        <p role="alert" className="text-danger text-sm">
          읽음 처리하지 못했어요. 알림을 다시 눌러주세요.
        </p>
      )}

      {items?.length === 0 && (
        <p className="text-text-sub text-sm">
          {unreadOnly ? "안 읽은 알림이 없어요." : "아직 알림이 없어요."}
        </p>
      )}

      {items && items.length > 0 && (
        <ul className="space-y-3" aria-label="알림 목록">
          {items.map((item) => {
            const unread = item.readAt === null;
            const details = (
              <>
                <span className="text-text-strong block font-semibold wrap-anywhere">
                  {USE_MOCK ? "[예시] " : ""}
                  {item.title}
                </span>
                <span className="text-text-sub block text-sm wrap-anywhere">{item.body}</span>
                <time dateTime={item.createdAt} className="text-text-sub block text-xs">
                  {formatDotDate(item.createdAt)}
                </time>
              </>
            );

            return (
              <li key={item.id} className="rounded-card border-line bg-surface border">
                {unread ? (
                  <button
                    type="button"
                    className="rounded-card bg-sub w-full space-y-1 p-4 text-left disabled:opacity-60"
                    onClick={() => markRead.mutate(item.id)}
                    disabled={markRead.isPending}
                  >
                    <span className="text-primary block text-xs font-semibold">안 읽음</span>
                    {details}
                  </button>
                ) : (
                  <div className="space-y-1 p-4">
                    <span className="text-text-sub block text-xs">읽음</span>
                    {details}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
