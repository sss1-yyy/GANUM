# Git 규칙: 브랜치 · 커밋 · 이슈 · PR

## 브랜치

- 기준 브랜치는 **`dev`**. `main` 은 배포용이라 직접 push 하지 않아요(둘 다 GitHub 에서 막아 둡니다 — `github-settings.md`).
- 이름 형식: `접두사/이슈번호-영어설명`
  | 접두사      | 쓰임                    | 예                          |
  | ----------- | ----------------------- | --------------------------- |
  | `feat/`     | 새 기능·화면            | `feat/12-home-banner`       |
  | `fix/`      | 버그 수정               | `fix/27-order-quantity`     |
  | `refactor/` | 동작은 같고 구조만 개선 | `refactor/31-api-types`     |
  | `docs/`     | 문서                    | `docs/40-mock-guide`        |
  | `chore/`    | 설정·빌드·의존성        | `chore/1-initial-structure` |
- `feature/` 는 **쓰지 않습니다**. 설명은 소문자 영어와 `-` 만.
- 이슈 번호가 없으면 먼저 이슈를 만들어요(템플릿 있음).

## 커밋 메시지 (한국어)

```
feat: 홈 화면 혜택 카드 추가
fix: 주문 수량이 0일 때 확인 버튼이 눌리는 문제 수정
```

- 형식 `접두사: 내용`. 접두사 = `feat fix refactor docs chore style test`
- 한 커밋에는 한 가지 일. 내용은 "무엇을 했는지"를 한 줄로.
- 형식이 틀리면 커밋이 거부돼요(husky `commit-msg`).
- AI 도구가 만든 커밋이면 마지막 줄에 `Co-Authored-By:` 가 붙어도 괜찮아요.

## 이슈

`.github/ISSUE_TEMPLATE` 의 **기능 / 버그 / 작업** 중 골라 작성. 제목은 `[기능] 홈: 혜택 카드` 처럼.

## PR 흐름

1. `dev` 최신화 → 브랜치 만들기
2. 작업 → `npm run check` 통과
3. push 후 GitHub 에서 **base 가 `dev`** 인지 확인하고 PR 생성 (템플릿 채우기, `Closes #이슈번호`)
4. CI(GitHub Actions)가 초록불이 되면 팀원 **1명 이상 확인(Approve)** 후 **Squash and merge** (본인 PR 은 본인이 승인할 수 없어서, 다른 팀원에게 리뷰를 요청해요)
5. 머지된 브랜치는 삭제

- `dev → main` 은 지정된 1명이 일반 merge 로 합칩니다.

## 하루 작업 흐름

```powershell
git switch dev
git pull origin dev
git switch -c feat/12-home-banner     # 이슈 번호는 내 이슈 번호로
cd frontend                           # npm 명령은 이 폴더 안에서
npm run dev                           # 개발 서버 (http://localhost:3000)
# ... 코드 작성 ...
npm run check                         # 올리기 전 점검 (frontend 폴더에서)
git add src/features/home
git commit -m "feat: 홈 배너 추가"
git push -u origin feat/12-home-banner
# GitHub 에서 PR 만들기 (base: dev)
```
