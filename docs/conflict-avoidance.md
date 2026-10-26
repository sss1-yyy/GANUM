# 충돌 피하는 법

Git 충돌은 "같은 파일의 같은 줄을 둘이 고칠 때" 생겨요. 그래서 구조로 막아 두었어요.

1. **담당 폴더가 나뉘어 있어요.** (`ownership.md`) 내 폴더 안에서만 작업하면 남과 겹치지 않아요.
2. **공통 파일은 건드리지 않아요.** `package.json`, `globals.css`, `eslint.config.mjs`, `src/shared/**` 는 팀장 담당. 꼭 고쳐야 하면 먼저 팀 채팅에 알리고 **작은 PR 하나**로 올려요.
3. **등록 파일 두 개**만 여러 명이 같이 고쳐요:
   - `src/mocks/routes.ts` — 한 줄(`...내기능MockRoutes,`)만 추가. 항상 같은 위치(목록 끝)에 추가하면 충돌해도 해결이 쉬워요.
   - `package.json` — 라이브러리를 새로 설치할 때. 설치 전에 팀에 먼저 알려요.
4. **자주 가져와요.** 작업 시작 전과 PR 올리기 전에 `git pull origin dev`. 오래 묶어 두면 충돌이 커져요.
5. **PR 은 작게, 자주.** 파일 20개 이상이면 쪼개요.
6. **포맷 전체 적용 금지.** `prettier --write .` 로 남의 파일까지 바꾸지 않아요(커밋 시 자동으로 내가 바꾼 파일만 정리돼요).
7. `package-lock.json` 충돌이 나면 직접 고치지 말고: `git checkout origin/dev -- package-lock.json` 후 `npm install` 로 다시 만들어요.

## 충돌이 났을 때

```powershell
git pull origin dev          # 충돌 표시가 나옴
# VS Code 에서 충돌 파일을 열면 "현재 변경 사항 수락 / 수신 변경 사항 수락 / 둘 다 수락" 버튼이 보여요
npm run check                # 해결 후 반드시 확인
git add .
git commit                   # 병합 커밋 메시지는 그대로 저장
```

모르겠으면 혼자 끙끙대지 말고 팀장에게 화면 공유로 물어보세요.
