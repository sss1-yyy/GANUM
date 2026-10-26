# GitHub 설정 (저장소 관리자 1회 작업)

1. **기본 브랜치를 `dev` 로**: Settings → Branches → Default branch → `dev`.
2. **브랜치 보호**: Settings → Rules → Rulesets → New branch ruleset (또는 Branches → Add rule)
   - 대상 `main` 과 `dev` 각각
   - ✅ Require a pull request before merging (Approvals 1)
   - ✅ Require status checks to pass → `check` (GitHub Actions 첫 실행 후 선택 가능)
   - ✅ Block force pushes · ✅ Restrict deletions
   - (관리자도 예외 없이 적용하려면 "Do not allow bypassing" 체크)
3. **머지 방식**: Settings → General → Pull Requests → Squash merging 만 허용(`dev → main` 은 Merge commit 도 허용), "Automatically delete head branches" 체크.
4. **Actions 권한**: Settings → Actions → General → Workflow permissions 는 기본(읽기)으로 충분해요.
5. 이 저장소의 `.github/` 에 PR/이슈 템플릿과 CI(`ci.yml`)가 들어 있어요.
