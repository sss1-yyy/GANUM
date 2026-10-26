import { beforeEach, describe, expect, it } from "vitest";
import { handleMockRequest } from "../server";
import { resetMockState } from "../store";

const call = (
  method: "GET" | "POST" | "PUT" | "PATCH",
  path: string,
  body?: unknown,
  headers?: Record<string, string>,
) => handleMockRequest({ method, path, body, headers });

beforeEach(() => resetMockState());

describe("목 서버 기본 동작", () => {
  it("없는 API 는 404 NOT_FOUND", async () => {
    const res = await call("GET", "/nope");
    expect(res.status).toBe(404);
  });

  it("홈 대시보드는 명세의 필드를 모두 가진다 (HOME-01)", async () => {
    const res = await call("GET", "/home");
    const data = (res.body as { data: Record<string, unknown> }).data;
    for (const key of [
      "user",
      "assetSummary",
      "investmentProfile",
      "goal",
      "coachCard",
      "benefits",
      "unreadNotificationCount",
    ]) {
      expect(data).toHaveProperty(key);
    }
  });
});

describe("모의 주문 (PAPER-03)", () => {
  const order = { instrumentId: "ins_000660", side: "BUY", quantity: 2 };

  it("Idempotency-Key 가 없으면 422", async () => {
    expect((await call("POST", "/paper/orders", order)).status).toBe(422);
  });

  it("Figma 숫자와 같다: 2주 매수 → 남는 금액 6,352,002원", async () => {
    const res = await call("POST", "/paper/orders", order, { "idempotency-key": "k1" });
    expect(res.status).toBe(201);
    expect((res.body as { data: { cashBalanceAfter: number } }).data.cashBalanceAfter).toBe(
      6_352_002,
    );
  });

  it("같은 키 + 같은 내용은 한 번만 체결된다", async () => {
    await call("POST", "/paper/orders", order, { "idempotency-key": "k1" });
    await call("POST", "/paper/orders", order, { "idempotency-key": "k1" });
    const portfolio = await call("GET", "/paper/portfolio");
    expect((portfolio.body as { data: { cashBalance: number } }).data.cashBalance).toBe(6_352_002);
  });

  it("같은 키 + 다른 내용은 409 IDEMPOTENCY_CONFLICT", async () => {
    await call("POST", "/paper/orders", order, { "idempotency-key": "k1" });
    const res = await call(
      "POST",
      "/paper/orders",
      { ...order, quantity: 1 },
      { "idempotency-key": "k1" },
    );
    expect(res.status).toBe(409);
  });

  it("잔액 부족은 409 INSUFFICIENT_BALANCE", async () => {
    const res = await call(
      "POST",
      "/paper/orders",
      { ...order, quantity: 6 },
      { "idempotency-key": "k2" },
    );
    expect(res.status).toBe(409);
    expect((res.body as { error: { code: string } }).error.code).toBe("INSUFFICIENT_BALANCE");
  });

  it("2주 매수 뒤 1주 매도하면 현금 8,193,002원 (Figma)", async () => {
    await call("POST", "/paper/orders", order, { "idempotency-key": "k0" });
    const res = await call(
      "POST",
      "/paper/orders",
      { ...order, side: "SELL", quantity: 1 },
      { "idempotency-key": "k3" },
    );
    expect((res.body as { data: { cashBalanceAfter: number } }).data.cashBalanceAfter).toBe(
      8_193_002,
    );
  });
});

describe("투자 성향 진단 (PROFILE-01/02/03)", () => {
  it("미진단이면 latest 는 data:null", async () => {
    expect((await call("GET", "/investment-profiles/latest")).body).toEqual({ data: null });
  });

  it("8문항을 모두 답하면 201 + 결과 저장", async () => {
    const q = await call("GET", "/investment-questionnaires/current");
    const { version, questions } = (
      q.body as {
        data: { version: string; questions: Array<{ id: string; options: Array<{ id: string }> }> };
      }
    ).data;
    expect(questions).toHaveLength(8);
    const answers = questions.map((x) => ({ questionId: x.id, optionId: x.options[0]!.id }));
    const res = await call("POST", "/investment-profiles", {
      questionnaireVersion: version,
      answers,
    });
    expect(res.status).toBe(201);
    const latest = await call("GET", "/investment-profiles/latest");
    expect((latest.body as { data: { type: string } }).data.type).toBeTruthy();
  });

  it("문항을 빼먹으면 422 INVALID_ANSWERS", async () => {
    const q = await call("GET", "/investment-questionnaires/current");
    const { version } = (q.body as { data: { version: string } }).data;
    const res = await call("POST", "/investment-profiles", {
      questionnaireVersion: version,
      answers: [],
    });
    expect(res.status).toBe(422);
  });
});

describe("비동기 생성 (REPORT-01/03)", () => {
  it("성향 진단 전에는 409 PROFILE_INCOMPLETE", async () => {
    expect((await call("POST", "/reports", { kind: "FINANCIAL" })).status).toBe(409);
  });

  it("202 → QUEUED → RUNNING → SUCCEEDED 순서로 조회된다", async () => {
    const created = await call("POST", "/reports", { kind: "PAPER" });
    expect(created.status).toBe(202);
    const id = (created.body as { data: { id: string } }).data.id;
    const statuses: string[] = [];
    for (let i = 0; i < 3; i += 1) {
      const res = await call("GET", `/reports/${id}`);
      statuses.push((res.body as { data: { status: string } }).data.status);
    }
    expect(statuses).toEqual(["QUEUED", "RUNNING", "SUCCEEDED"]);
  });
});

describe("이용권", () => {
  it("챗봇 질문 1번에 토큰 1개를 차감한다", async () => {
    const s = await call("POST", "/chat/sessions", { contextType: "HOME", contextId: null });
    const id = (s.body as { data: { id: string } }).data.id;
    await call("POST", `/chat/sessions/${id}/messages`, { content: "안녕" });
    const usage = await call("GET", "/me/usage");
    expect((usage.body as { data: { tokenBalance: number } }).data.tokenBalance).toBe(5);
  });
});
