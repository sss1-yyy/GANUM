# 처음 시작하기 (Windows · VS Code)

## 준비물

- Node.js **22 LTS** (https://nodejs.org) — 설치 후 `node -v`
- Git (https://git-scm.com) · VS Code
- VS Code 에서 폴더를 열면 오른쪽 아래 "권장 확장 설치" 알림이 떠요 → 설치 (ESLint, Prettier, Tailwind CSS IntelliSense)

## 1. 내려받기

```powershell
cd C:\src
git clone https://github.com/<조직>/GANUM.git
cd GANUM
git switch dev
npm install
Copy-Item .env.example .env.local
npm run dev
```

브라우저에서 http://localhost:3000 → **화면은 아직 비어 있어요(정상).** 각자 담당 화면을 만들면서 채웁니다. 개발자도구(F12) → 모바일 보기(Ctrl+Shift+M)로 보면 편해요.

## 2. 목데이터 모드

`.env.local` 의 `NEXT_PUBLIC_USE_MOCK=true` 이면 **서버 없이** `apiGet/apiPost` 가 목데이터로 응답해요. 목데이터를 쓸지(`true`) 실서버를 쓸지(`false`)는 각자 개발할 때 정하면 돼요. 실서버가 생기면 `false` 로 바꾸고 `NEXT_PUBLIC_API_BASE_URL` 만 채우면 됩니다.

- 새로고침하면 목데이터 상태(주문·진단 결과 등)가 처음으로 돌아가요. 화면 이동(링크 클릭)에서는 유지돼요.
- 연결 전 자산 화면 보기: `.env.local` 에 `NEXT_PUBLIC_MOCK_ASSETS=disconnected`

## 3. 자주 쓰는 명령

| 명령                                              | 뜻                                                     |
| ------------------------------------------------- | ------------------------------------------------------ |
| `npm run dev`                                     | 개발 서버                                              |
| `npm run check`                                   | 올리기 전 점검(타입·린트·테스트·서식) — **PR 전에 꼭** |
| `npm run lint` / `npm run typecheck` / `npm test` | 개별 점검                                              |
| `npm run format`                                  | 서식 자동 정리                                         |
| `npm run build`                                   | 배포 빌드 확인                                         |

## 4. 내 일 시작하는 법

1. `ownership.md` 에서 내 폴더·화면 확인
2. Figma 에서 내 화면 확인 (**Figma 는 절대 수정 금지, 보기만**)
3. `features/<내 기능>/components` 에 화면 작성(처음엔 비어 있어요) → `app/(main)/...` 의 `page.tsx` 연결
4. 필요한 API 는 `api.ts` + `mocks/routes.ts` 에 추가
5. `git-workflow.md` 의 흐름대로 PR

## 문제가 생기면

- `npm install` 오류 → Node 버전 확인(`node -v` 가 20.19 이상)
- 빨간 줄이 안 사라짐 → VS Code: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"
- 커밋이 거부됨 → 메시지가 `feat: 내용` 형식인지, `npm run check` 가 통과하는지 확인
- 포트 3000 사용 중 → `npm run dev -- -p 3001`
