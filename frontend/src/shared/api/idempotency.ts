/** POST /paper/orders 처럼 중복 요청을 막아야 하는 API 의 Idempotency-Key 를 만듭니다. */
export function createIdempotencyKey(prefix = "req"): string {
  const random =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${random}`;
}
