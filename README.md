# GANUM

# 청년 맞춤 AI 금융 코치 

## 0. 한 줄 정리

금융 초보 청년이 자신의 재정 상태와 투자 성향을 점검하고, 소비·저축·투자 기준을 세우도록 돕는 AI 금융 코칭 서비스

> 현재 기획·개발 단계. 기능과 정책은 변경 가능.

---

## 1. 만든 이유

- 금융 정보와 자산 현황이 여러 앱과 자료에 흩어져 있음.
- 일반적인 금융 정보를 내 저축 여력과 위험 성향에 맞춰 보기 어려움.
- 복잡한 용어와 보고서 때문에 금융 결정을 미루거나 불안해짐.

## 2. 목적

- 초기 검증 대상은 20대 대학생이며, 향후 사회초년생까지 서비스 대상을 확대할 계획.
- 내 재정 상태와 투자 성향에 맞는 자산 배분 예시와 보고서 제공.
- 결과만 알려주지 않고 판단 근거, 손실 가능성, 가정까지 함께 보여줘서 사용자가 스스로 판단하도록 지원.

## 3. 주요 기능

| 기능 | 설명 |
|---|---|
| 청년 혜택 추천 | 사용자 정보를 기반으로 적합한 청년 혜택 추천 |
| 투자 성향 진단 | 사용자의 위험감수 수준과 감당 가능한 손실 범위를 점검하고, 결과를 이해하기 쉽게 성향별 포트폴리오 보고서와 조언서 제공 |
| 알림         | 실시간 금융 정보, 가격 변화에 따른 포트폴리오 비중·위험 변화 알림, 사용자 상황에 맞는 행동 가이드 제안 |
| 모의투자      | 과거 같은 시점·금액으로 다른 종목에 투자했을 경우 비교, 미래는 조건별 시나리오와 상세 설명 제공 |
| 챗봇 팝업     | 화면 항목이나 금융 용어를 팝업 챗봇에게 바로 질문 |

**조언서 구성:** 자산 비중, 주요 위험 요인, 가격 변동 원인, 손실 가능성, 대응 시 고려사항

**시뮬레이션 안내:** 미래 시뮬레이션은 확정 예측이 아닌 가정별 결과. 투자 권유가 아닌 참고용. <<미정

## 4. 이용 방식

토큰 구독제로 운영할 계획.

- 무료: 이용 가능, 제공 토큰 적음.
- 유료: 더 많은 이용량 제공.
- 초기 가격 가설은 월 5,900원이며, 대학생 인터뷰와 사용성 테스트를 통해 지불 의사를 검증할 예정임. 구독료와 토큰 지급량은 검증 결과에 따라 변경될 수 있음.

## 5. 기술 스택

| 구분 | 사용 기술 |
|---|---|
| 프레임워크 | Next.js (App Router) |
| 언어 | TypeScript |
| 스타일링 | Tailwind CSS |
| 서버 데이터 | TanStack Query |
| 패키지 매니저 | npm (Node.js 22 LTS 권장) |

### 실행 방법

```bash
git clone [레포 주소]
cd [폴더명]
git switch dev
npm install
cp .env.example .env.local   # Windows PowerShell: Copy-Item .env.example .env.local
npm run dev
```
**cp .env.example .env.local  : env.local 파일을 만드는 명령어입니다. .env.example.은 커밋되면 안되기 때문에 실행해야합니다. 따라서 나중에 비밀키 같은 거 올려두면 env.local.파일에 두고 실행해야함. (env.local은 커밋할 때 되지 않는 파일이긴 하지만, -f 를 사용하면서 강제로 커밋하면 안된다는 뜻.) 

실행 후 http://localhost:3000 접속. 모바일 폭(393px) 전용이라 개발자도구의 모바일 보기로 확인하세요.

PR 올리기 전에는 `npm run check`(타입·린트·테스트·서식)를 꼭 실행하세요.

### 문서 안내

| 문서 | 내용 |
|---|---|
| `docs/start-here.md` | 처음 시작하는 법 |
| `docs/ownership.md` | 누가 어느 폴더/화면을 맡는지 |
| `docs/git-workflow.md` | 브랜치·커밋·PR 규칙 |
| `docs/conflict-avoidance.md` | 충돌을 줄이는 방법 |
| `docs/mock-guide.md` | 목데이터 사용법 |
| `docs/figma-api-gaps.md` | 디자인과 API 명세가 다른 부분 |
| `AGENTS.md` | AI 코딩 도구(Claude Code, Copilot, Cursor)가 따르는 규칙 |

## 6. 컨벤션 규칙

자세한 내용은 `docs/git-workflow.md`를 따릅니다.

### 브랜치

| 브랜치 | 용도 |
|---|---|
| main | 배포용. 직접 push 금지 |
| dev | 개발 내용을 모으는 브랜치. 직접 push 금지 |
| feat/이슈번호-영어설명 | dev에서 따서 기능 단위로 작업 (예: `feat/12-home-banner`) |

`fix/`, `refactor/`, `docs/`, `chore/`도 같은 형식으로 씁니다. `feature/`는 쓰지 않습니다.

### 커밋 메시지

`말머리: 내용` 형태로 한국어로 작성. (예: `feat: 투자 성향 진단 화면 추가`)

| 말머리 | 뜻 |
|---|---|
| feat | 새 기능 |
| fix | 버그 수정 |
| docs | 문서 수정 |
| style | 코드 모양만 수정 (기능 변화 없음) |
| refactor | 코드 구조 개선 |
| test | 테스트 추가·수정 |
| chore | 설정 등 기타 작업 |


## 작업 순서

1. 이슈를 만들고 dev에서 브랜치 생성
2. 작업 후 `npm run check` 통과 확인
3. dev를 base로 Pull Request 작성 (템플릿 작성)
4. 머지 (dev→main 병합은 정해진 담당자가 진행)
   

### detail

## 작업 시작부터 PR까지 (매번 하는 순서)

PowerShell 기준이에요. 자세한 규칙은 `docs/git-workflow.md`를 보세요.

**1. 최신 dev 받고 내 브랜치 만들기**
```powershell
git switch dev
git pull
git switch -c feat/12-home-banner
```
브랜치 이름은 `접두사/이슈번호-영어설명`이에요. (접두사: feat, fix, refactor, docs, chore)

**2. 작업하고 확인하기**
```powershell
npm run dev       # 화면 확인
npm run check     # 올리기 전 점검 (타입·린트·테스트·서식). 통과해야 해요
```

**3. 커밋하기**
```powershell
git status                      # 올라갈 파일 확인 (.env.local 이 보이면 안 돼요)
git add .
git commit -m "feat: 홈 배너 추가"
```
커밋 메시지는 한국어로 `말머리: 내용` 형식이에요. 형식이 틀리면 자동으로 막아요.

**4. 올리기**
```powershell
git push -u origin feat/12-home-banner
```
처음 올릴 때만 `-u origin 브랜치명`이 필요하고, 이후에는 `git push`만 쓰면 돼요.

**5. PR 만들기**
1. GitHub에서 "Compare & pull request" 클릭
2. base 브랜치를 **dev**로 확인 (main이 아니에요)
3. 템플릿 체크 항목을 채우고 `Closes #이슈번호` 작성
4. Reviewers에서 팀원 1명 지정
5. 자동 검사(`check`)가 초록불이고 팀원이 Approve하면 **Squash and merge**

**6. 머지 후 정리**
```powershell
git switch dev
git pull
git branch -d feat/12-home-banner
```

### 자주 막히는 상황

| 상황 | 해결 |
|---|---|
| 커밋이 거부돼요 | 메시지가 `feat: 내용` 형식인지, `npm run check`가 통과하는지 확인하세요. |
| push가 거부돼요 | main/dev에서는 직접 push할 수 없어요. 브랜치를 만들어서 올리세요. |
| 브랜치 이름 오류 | `feat/12-home-banner`처럼 `접두사/숫자-영어` 형식인지 확인하세요. |
| `dev`와 충돌이 나요 | `docs/conflict-avoidance.md`를 보세요. |
| `.env.local`이 없어요 | `Copy-Item .env.example .env.local` 을 실행하세요. |

##팀원

| 이름 | 역할 |
|---|---|
| 남궁길 | PM |
| 염유민 | 백엔드&챗봇 |
| 양창규 | 프론트엔드 |
| 박상욱 | 프론트엔드 |
| 강수연 | 프론트엔드 |
| 김수빈 | 디자인 |
| 이재림 | 프론트엔드 |
| 김여진 | 디자인 |
