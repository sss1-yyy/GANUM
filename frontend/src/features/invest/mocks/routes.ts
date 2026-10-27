import { bodyAsObject, created, fail, listOf, validationError } from "@/mocks/helpers";
import { executeOrder, paperState } from "@/mocks/shared/paper";
import type { MockRoute } from "@/mocks/types";

/** PAPER-03 / PAPER-04. 포트폴리오(PAPER-01)와 종목 API 는 shared 에 있어요. */
export const investMockRoutes: MockRoute[] = [
  // PAPER-03 · 같은 Idempotency-Key + 같은 내용 → 첫 결과 재사용, 다른 내용 → 409
  {
    method: "POST",
    path: "/paper/orders",
    handler: (request) => {
      const key = request.headers["idempotency-key"];
      if (!key) {
        return validationError([{ field: "Idempotency-Key", message: "헤더가 필요해요." }]);
      }
      const body = bodyAsObject(request);
      const instrumentId = body?.instrumentId;
      const side = body?.side;
      const quantity = body?.quantity;
      if (typeof instrumentId !== "string" || (side !== "BUY" && side !== "SELL")) {
        return validationError([{ field: "side", message: "BUY 또는 SELL 이어야 해요." }]);
      }
      if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1) {
        return fail(422, "INVALID_QUANTITY", "수량은 1 이상의 정수여야 해요.", [
          { field: "quantity", message: "1 이상의 정수여야 합니다." },
        ]);
      }

      const state = paperState();
      const fingerprint = `${instrumentId}|${side}|${quantity}`;
      const previous = state.idempotency[key];
      if (previous) {
        if (previous.fingerprint !== fingerprint) {
          return fail(409, "IDEMPOTENCY_CONFLICT", "같은 요청 키로 다른 주문을 보낼 수 없어요.");
        }
        return created(previous.order, true);
      }

      const result = executeOrder(instrumentId, side, quantity, state);
      if (!result.ok) return fail(result.status, result.code, result.message);
      state.idempotency[key] = { fingerprint, order: result.order };
      return created(result.order, true);
    },
  },

  // PAPER-04
  {
    method: "GET",
    path: "/paper/orders",
    handler: (request) => {
      const { side, instrumentId } = request.query;
      let orders = paperState().orders.slice();
      if (side === "BUY" || side === "SELL") orders = orders.filter((o) => o.side === side);
      if (instrumentId) orders = orders.filter((o) => o.instrumentId === instrumentId);
      return listOf(orders, request, true);
    },
  },
];
