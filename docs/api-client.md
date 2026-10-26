# API 클라이언트 사용법

```ts
import { apiGet, apiPost } from "@/shared/api";

// features/<기능>/api.ts
export const getHome = (signal?: AbortSignal) => apiGet<HomeDashboard>("/home", { signal });
export const createReport = (kind: ReportKind) =>
  apiPost<{ id: string; status: "QUEUED" }>("/reports", { kind });
```

- 경로는 `/api/v1` 뒤부터만 적어요.
- 반환값은 `{ data, meta? }`. 화면에서는 `useQuery({ queryKey, queryFn })` 로 부르고 `query.data.data` 를 써요.
- 오류는 `ApiError` — `error.code`(예: `INSUFFICIENT_BALANCE`), `error.status`, `error.fields`. 공통 컴포넌트 `<ErrorState error onRetry />` 가 기본 표시를 해줘요.
- 401 이 오면 `setUnauthorizedHandler` 로 등록한 동작이 실행돼요(로그인 방식 확정 후 연결).
- 토큰은 메모리에만(`setAccessToken`). 새로고침하면 사라지는 게 정상이에요.

## 비동기 작업

```ts
const done = await pollUntilDone(async () => (await getReport(id)).data, { signal });
// done.status 가 FAILED 여도 HTTP 는 200 — 꼭 확인
```

화면에서 바로 이어 보여주려면 `useQuery` 의 `refetchInterval` 로 `SUCCEEDED/FAILED` 일 때 `false` 를 돌려주세요.

## 중복 요청 방지

`POST /paper/orders` 는 `Idempotency-Key` 가 필수예요. 확인 시트를 열 때 `createIdempotencyKey()` 를 한 번 만들고, 같은 주문의 재시도에는 **같은 키**를 쓰세요.

## queryKey 규칙

`[기능, 세부...]`. 여러 기능이 같이 쓰는 키는 `shared/api/query-keys.ts` 에, 한 기능만 쓰는 키는 그 기능의 `api.ts` 에 둬요. 데이터를 바꾼 뒤에는 관련 키를 `invalidateQueries` 하세요.
