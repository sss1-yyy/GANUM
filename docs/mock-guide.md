# 목데이터 가이드

> 목데이터(응답 값)는 API 명세서와 Figma 를 보고 미리 만들어 두었어요. **화면과의 연결은 각자 합니다.** 값이 부족하면 자기 기능의 `mocks/routes.ts` 에 추가하세요.

서버가 없어도 화면을 만들 수 있게 **가짜 서버(목 서버)** 를 브라우저 안에 두었어요. 화면 코드는 진짜 API 를 부르듯이 `apiGet/apiPost` 만 쓰면 되고, `NEXT_PUBLIC_USE_MOCK=true` 일 때만 목 서버가 응답해요.

## 구조

```
src/mocks/server.ts        요청 → 알맞은 핸들러 찾기(404 처리, 지연 150ms)
src/mocks/routes.ts        모든 기능의 목 API 등록부  ← 새 기능은 여기에 한 줄 추가
src/mocks/shared/          여러 기능이 같이 쓰는 데이터 (종목·모의계좌·사용자·이용권)
src/features/<기능>/mocks/routes.ts   기능 전용 목 API
```

## 새 API 의 목 만들기 (예: 알림)

```ts
// features/mypage/mocks/routes.ts
import { ok } from "@/mocks/helpers";
import type { MockRoute } from "@/mocks/types";

export const mypageMockRoutes: MockRoute[] = [
  { method: "GET", path: "/notifications", handler: () => ok({ items: [], nextCursor: null }) },
];
```

```ts
// src/mocks/routes.ts — 한 줄 추가
import { mypageMockRoutes } from "@/features/mypage/mocks/routes";
export const mockRoutes = [ ...sharedRoutes, ..., ...mypageMockRoutes ];
```

- 경로는 명세서 그대로, 변수는 `:id` (`/reports/:reportId` → `request.params.reportId`)
- 도우미: `ok` `created` `accepted`(202) `fail(status, code, message)` `notFound` `validationError` `listOf`
- 자산·시세·분석 응답은 `ok(data, true)` 로 `meta:{source:"MOCK", asOf}` 를 붙여요.
- 상태가 필요하면 `mockState("키", () => 초기값)` — 새로고침하면 초기화돼요.
- 오래 걸리는 작업(202)은 `statusForReadCount` 로 조회할 때마다 QUEUED→RUNNING→SUCCEEDED 가 되게 해요.
- 오류 상황(잔액 부족, 토큰 부족 등)도 목에 넣어 두면 화면의 오류 처리를 확인할 수 있어요.

## 고정된 "오늘"

목 모드의 오늘은 **2026-10-25 09:00(KST)** 로 고정이에요(`src/mocks/clock.ts`). D-day 는 기기 시계가 아니라 응답의 `meta.asOf` 로 계산하세요(`referenceDate`).

## 규칙

- 목데이터 숫자는 **Figma 에 있는 값**을 그대로 쓰고, 없는 값은 문서(`figma-api-gaps.md`)에 "예시"로 적어요.
- 화면 코드(`components/` 등)에서 `@/mocks/*` 를 직접 import 하면 ESLint 가 막아요.
- 목 핸들러는 실제 서버처럼 **검증 오류(422)·충돌(409)** 도 돌려주세요.
