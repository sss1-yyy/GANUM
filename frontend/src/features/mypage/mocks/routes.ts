import { bodyAsObject, listOf, notFound, ok, validationError } from "@/mocks/helpers";
import { MOCK_NOW } from "@/mocks/clock";
import { notificationState } from "@/mocks/shared/notifications";
import type { MockRoute } from "@/mocks/types";

export const mypageMockRoutes: MockRoute[] = [
  // NOTI-01
  {
    method: "GET",
    path: "/notifications",
    handler: (request) => {
      const unreadOnly = request.query.unreadOnly === "true";
      const items = notificationState().items.filter((n) => !unreadOnly || n.readAt === null);
      return listOf(items, request);
    },
  },

  // NOTI-02 · read 는 true 만 허용
  {
    method: "PATCH",
    path: "/notifications/:notificationId",
    handler: (request) => {
      if (bodyAsObject(request)?.read !== true) {
        return validationError([{ field: "read", message: "true 만 보낼 수 있어요." }]);
      }
      const item = notificationState().items.find((n) => n.id === request.params.notificationId);
      if (!item) return notFound("알림을 찾을 수 없어요.");
      item.readAt ??= MOCK_NOW;
      return ok(item);
    },
  },
];
