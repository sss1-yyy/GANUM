# 기술 결정 기록

| 결정                                               | 이유                                                                                                                                 |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Next.js App Router, TypeScript strict, npm         | 팀 합의                                                                                                                              |
| Tailwind v4(`@theme` 토큰)                         | Figma 색·간격을 토큰으로 관리. `@tailwindcss/turbopack` 로더 유지                                                                    |
| `cacheComponents` / `partialPrefetching` 옵션 제거 | 초기 구조를 단순하게 두기 위해. 필요해지면 `frontend/next.config.ts` 에 다시 켜기 (모든 페이지가 클라이언트 데이터 조회라 지금은 이득이 없음) |
| 상태 관리: TanStack Query + 컴포넌트 상태          | 서버 데이터가 대부분. 전역 스토어 라이브러리는 필요해질 때 팀 합의 후                                                                |
| 차트 라이브러리 없음, SVG 직접                     | 번들 크기·충돌 방지. 필요하면 팀 합의 후 추가                                                                                        |
| 목 서버를 브라우저 안에서 동작                     | 백엔드 없이 개발. 운영 빌드(`USE_MOCK=false`)에는 코드가 포함되지 않음                                                               |
| 앱 폭 393px 고정(PC는 가운데 정렬)                 | 모바일 전용 서비스                                                                                                                   |
| ESLint 로 폴더 경계 강제                           | 규칙이 아니라 도구가 충돌을 막도록                                                                                                   |
| `@types/node` ^22                                  | vitest 의존성 충돌 회피. Node 22 LTS 권장 (`engines.node >= 20.19`)                                                                  |
| `typecheck` = `next typegen && tsc --noEmit`       | `PageProps`/`LayoutProps` 전역 타입이 생성 파일에 의존                                                                               |
| 폰트 Pretendard (가변, `frontend/src/styles/fonts`)         | Figma 와 동일                                                                                                                        |
