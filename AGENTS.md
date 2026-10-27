# GANUM(가늠) — AI 작업 규칙

이 파일은 사람과 AI 코딩 도구(Claude Code, Copilot, Cursor 등) **모두가 반드시 따르는 규칙**입니다.
자세한 설명은 `docs/` 폴더에 있어요. 규칙이 서로 부딪히면 이 파일이 우선합니다.

## 프로젝트 한 줄 요약

청년 대상 금융 코치 웹앱. **모바일 폭 393px 전용**(PC 화면 없음). Next.js(App Router) + TypeScript + Tailwind v4 + TanStack Query. 패키지 매니저는 **npm**.

## 0. 저장소 구조

```
GANUM/
  frontend/   웹앱(Next.js). 이 규칙의 대부분은 여기에 해당해요. npm 명령은 모두 이 폴더 안에서 실행
  backend/    서버(백엔드 팀이 채움). 프론트 작업에서는 건드리지 않아요
  docs/       팀 규칙 문서
  .github/    CI·PR/이슈 양식
```

## 1. 폴더 규칙 (충돌을 막는 핵심)

```
frontend/src/app/            라우트(page.tsx)만. 화면 코드는 넣지 말고 features 의 컴포넌트를 불러와 한 줄로 렌더링
frontend/src/features/<기능>/  기능별 코드. components/(화면) api.ts types.ts mocks/routes.ts
frontend/src/components/     모든 기능이 같이 쓰는 UI. 지금은 비어 있어요(ui/ layout/ charts/ domain/). 필요하면 아래 규칙대로 추가
frontend/src/shared/         API 클라이언트, 포맷 함수, 공용 타입
frontend/src/mocks/          목 서버 핵심 + 공용 목데이터
```

- **내 담당 기능 폴더(`docs/ownership.md`) 밖은 수정하지 않습니다.** 필요하면 아래 "공통 부품이 필요할 때"를 따르세요.
- `features/A` 는 `features/B` 를 **import 하지 않습니다**(ESLint 가 막아요). 같이 쓰는 것은 `components/` 또는 `shared/` 로 옮깁니다.
- `components/`·`shared/` 는 `features/` 를 import 하지 않습니다.
- 기능 코드는 `@/mocks/*` 를 직접 import 하지 않습니다. 데이터는 항상 `api.ts` 의 함수(→ `apiGet/apiPost`)로 가져옵니다.
- 공통 부품이 더 필요하면 **그 화면 담당자가 자기 기능 폴더 안에** 만듭니다. 두 기능 이상이 쓰게 되면 그때 `components/` 로 옮깁니다.
- 한 번에 큰 파일을 크게 바꾸는 리팩터링 금지. 다른 사람 파일의 포맷만 바꾸는 변경도 금지.

## 2. 데이터·API 규칙

- 서버 통신은 **`@/shared/api` 의 `apiGet/apiPost/...` 만** 사용합니다. 컴포넌트에서 `fetch` 직접 호출 금지.
- 경로·필드 이름은 API 명세서(Notion "GANUM API 명세서 v0.2") 그대로. 임의로 바꾸지 마세요. 명세에 없는 API 를 쓰면 코드에 `[명세 외]` 주석을 달고 `docs/figma-api-gaps.md` 에 적습니다.
- 응답은 `{ data, meta? }`. 오류는 `ApiError`(`code`, `status`, `fields`).
- 목데이터 모드(`NEXT_PUBLIC_USE_MOCK=true`)가 기본입니다. 새 API 는 **자기 기능의 `mocks/routes.ts`** 에 추가하고 `frontend/src/mocks/routes.ts` 에 한 줄 등록합니다. 자세한 방법: `docs/mock-guide.md`.
- 비동기 생성(레포트·시뮬레이션)은 202 → 상세 GET 반복 조회 → `SUCCEEDED/FAILED` 에서 중단 (`pollUntilDone` 또는 `refetchInterval`). `FAILED` 도 HTTP 200 입니다.
- 모의 주문은 `Idempotency-Key` 헤더 필수(`createIdempotencyKey`). 같은 주문을 다시 보낼 때는 같은 키를 재사용합니다.
- 로그인 토큰은 **메모리에만** 둡니다. `localStorage`/쿠키에 토큰·개인 금융정보를 저장하지 않습니다.

## 3. 금융 서비스 특수 규칙 (`docs/finance-rules.md`)

- 금액은 **원 단위 정수**. 수량·평균단가처럼 소수가 필요한 값은 **문자열**. 계산 중 부동소수점 오차를 만들지 않습니다.
- 표시는 `@/shared/lib/format` 의 함수만 사용(`formatKRW`, `formatSignedPercent` …). 직접 `toLocaleString` 금지.
- 색 규칙(한국식): **상승 = 빨강(`text-positive`), 하락 = 파랑(`text-negative`)**. 오류 메시지는 `text-danger`.
- "오늘" 날짜는 기기 시계가 아니라 응답의 `meta.asOf` 기준(`referenceDate`).
- 실제 자산과 모의투자 자산을 **합산하지 않습니다.** 모의투자 화면에는 "가상 자금 · 실제 돈이 아니에요" 표시.
- 투자 권유처럼 보이는 문구(확정 수익, "꼭 사세요")를 쓰지 않습니다. 수익률·시뮬레이션 화면에는 "과거 결과이며 앞으로를 보장하지 않아요" 문구를 둡니다.
- AI 응답/숫자가 예시일 때는 화면에 "[예시]"를 표시합니다. 계산은 서버, AI 는 설명만 한다고 가정합니다.

## 4. 코드 스타일

- TypeScript strict. `any` 금지(불가피하면 이유 주석). `@ts-ignore` 금지.
- 기본은 서버 컴포넌트, 상태/이벤트가 필요한 파일 맨 위에만 `"use client"`.
- 스타일은 Tailwind + `globals.css` 의 토큰(`bg-primary`, `text-text-sub`, `rounded-card` …). **색 값(#xxxxxx)을 컴포넌트에 직접 쓰지 않습니다**(Figma 와 맞추려는 일회성 장식은 예외, 주석 필수).
- 새 UI 를 만들기 전에 `frontend/src/components/` 에 이미 있는지 확인합니다. 공통 컴포넌트는 처음에 만들어 두지 않았으니, 필요한 사람이 자기 기능 폴더에 만들고 둘 이상이 쓰면 옮깁니다.
- 파일 이름: 컴포넌트 `PascalCase.tsx`, 그 외 `kebab-case.ts`. 화면 문구는 한국어 해요체.
- Figma 파일은 **절대 수정하지 않습니다**(읽기만).

## 5. Git 규칙 (`docs/git-workflow.md`)

- 작업은 항상 **`dev` 에서 따낸 브랜치**에서. `main`/`dev` 에 직접 push 금지.
- 브랜치: `feat/12-home-banner`, `fix/…`, `refactor/…`, `docs/…`, `chore/…` — **접두사 + 이슈번호 + 영어 설명(kebab-case)**. `feature/` 는 쓰지 않습니다.
- 커밋 메시지는 **한국어**, 형식 `feat: 홈 배너 추가`. 접두사: feat fix refactor docs chore style test.
- PR 은 `dev` 로. PR 템플릿을 채우고, 로컬에서 `npm run check` 가 통과해야 합니다. 머지는 CI 통과 + **팀원 1명 이상 Approve**(본인 PR 은 본인이 승인할 수 없음) 후 Squash and merge.
- `README.md` 는 만들거나 고치지 않습니다(팀 합의 전까지).

## 6. 작업을 끝내기 전에 (AI 포함)

1. `npm run check` (typecheck + lint + test + format) 통과
2. 내 담당 폴더 밖 변경이 없는지 `git status` 로 확인
3. 새 API/Figma 불일치가 있으면 `docs/figma-api-gaps.md` 에 추가
4. 비밀값(.env*, 토큰, 키)을 커밋하지 않았는지 확인
