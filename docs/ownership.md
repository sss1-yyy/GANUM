# 담당 구역 (누가 어느 폴더를 만지나)

| 담당     | 기능 폴더                                                                | 화면(경로)                                                                                                                                |
| -------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **A**    | `features/landing` `features/login` `features/home` `features/diagnosis` | `/` 랜딩 · `/login` · `/home` · `/diagnosis` `/diagnosis/quiz` `/diagnosis/result` · `/market`(랭킹)                                      |
| **B**    | `features/invest` `features/chat`                                        | `/invest` · `/invest/[instrumentId]` · `/invest/[instrumentId]/order` · 챗봇 시트 안쪽                                                    |
| **C**    | `features/portfolio` `features/report` `features/simulation`             | `/portfolio` · `/report` `/report/[reportId]` · `/simulation`                                                                             |
| **D**    | `features/assets` `features/benefits` `features/mypage`                  | `/assets` `/assets/savings` `/assets/stocks` `/assets/coins` · `/benefits` `/benefits/[benefitId]` · `/menu` `/mypage/*` `/notifications` |
| **팀장** | `shared/`(API 클라이언트) `mocks/`(핵심) `app/layout.tsx` 설정 파일      | API 클라이언트·목 서버·규칙                                                                                                               |

- `frontend/src/app/**/page.tsx` 는 **해당 화면 담당자**가 만집니다(한 줄짜리 파일이라 충돌이 거의 없어요).
- 공통 컴포넌트(`components/`)는 **일부러 비워 뒀어요.** 필요한 사람이 **자기 기능 폴더 안에 직접 만듭니다.** 승인 절차는 없어요. 다른 기능에서도 쓰게 되면 `components/` 로 옮기는 PR 을 따로 올려 주세요(옮기기만 하는 작은 PR).
- `shared/` 에 **버그**가 있으면 직접 고치지 말고 팀장에게 알려 주세요(또는 아주 작은 수정 PR).

## API 30개 목데이터 담당

| 담당                 | API                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------ |
| 공통(`mocks/shared`) | USER-01·02·03 · GOAL-01·02 · MARKET-01·02·03 · PAPER-01 · USAGE-01 · PROFILE-03 · ASSET-04 |
| A                    | HOME-01 · PROFILE-01·02                                                                    |
| B                    | PAPER-03·04 · CHAT-01·03·04                                                                |
| C                    | REPORT-01·03 · SIM-01·03 (+ 명세 외 `GET /reports`)                                        |
| D                    | ASSET-01·03 · BENEFIT-01·02 · NOTI-01·02 (+ 명세 외 계좌/예적금/코인/연결)                 |

## 한 기능 폴더의 모양

```
features/<기능>/
  components/    화면 컴포넌트
  api.ts         이 기능이 쓰는 API 호출 함수 + queryKey
  types.ts       이 기능 전용 타입 (여러 기능이 쓰면 shared/types 로)
  mocks/routes.ts  이 기능의 목 API (frontend/src/mocks/routes.ts 에 등록)
```
