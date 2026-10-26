import { describe, expect, it } from "vitest";
import { ApiError } from "./error";
import { pollUntilDone } from "./poll";
import type { JobStatus } from "./types";

describe("pollUntilDone", () => {
  it("SUCCEEDED 가 되면 멈추고 결과를 돌려준다", async () => {
    const sequence: JobStatus[] = ["QUEUED", "RUNNING", "SUCCEEDED"];
    let i = 0;
    const result = await pollUntilDone(async () => ({ status: sequence[i++]! }), { intervalMs: 1 });
    expect(result.status).toBe("SUCCEEDED");
    expect(i).toBe(3);
  });

  it("FAILED 도 멈춘다 (HTTP 200 으로 오는 실패)", async () => {
    const result = await pollUntilDone(async () => ({ status: "FAILED" as JobStatus }), {
      intervalMs: 1,
    });
    expect(result.status).toBe("FAILED");
  });

  it("시간이 지나면 POLL_TIMEOUT", async () => {
    await expect(
      pollUntilDone(async () => ({ status: "RUNNING" as JobStatus }), {
        intervalMs: 1,
        timeoutMs: 10,
      }),
    ).rejects.toBeInstanceOf(ApiError);
  });
});
