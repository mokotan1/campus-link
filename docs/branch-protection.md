# main 브랜치 보호 규칙 설정 가이드

이 문서는 `main` 브랜치에 **브랜치 보호 규칙(Branch protection rule)** 을 추가하는 방법을 설명합니다.

브랜치 보호 규칙을 켜면, CI가 통과하지 않은 코드나 검토 없이 `main`에 merge되는 것을 GitHub가 막아 줍니다.

## 먼저 확인할 것 (중요)

`campus-link` 레포는 현재 **Private(비공개)** 입니다.

GitHub **Free** 플랜의 Private 레포에서는 **브랜치 보호 규칙을 사용할 수 없습니다.**

아래 중 하나가 필요합니다.

| 방법 | 설명 |
| --- | --- |
| **GitHub Pro** | 개인 계정 유료 플랜 (브랜치 보호 사용 가능) |
| **레포 Public 전환** | 공개 레포로 바꾸면 Free 플랜에서도 브랜치 보호 가능 |

Pro 업그레이드 또는 Public 전환 후, 아래 절차대로 설정하면 됩니다.

---

## 권장 보호 규칙 요약

| 항목 | 권장 값 | 이유 |
| --- | --- | --- |
| PR 필수 | 켜기 | `main`에 직접 push 대신 PR로만 merge |
| 필수 상태 검사 | `CI 통과` | lint, 타입, 빌드, 테스트 자동 검증 |
| 최신 브랜치 요구 | 켜기 | merge 전 `main` 최신 코드 반영 |
| force push 금지 | 켜기 | 히스토리 덮어쓰기 방지 |
| 브랜치 삭제 금지 | 켜기 | `main` 실수 삭제 방지 |

---

## GitHub 웹에서 설정하기 (단계별)

### 1단계 — Settings 이동

1. https://github.com/mokotan1/campus-link 접속
2. 상단 **Settings** 탭 클릭
3. 왼쪽 메뉴 **Branches** (또는 **Rules → Rulesets**) 선택

> GitHub UI 버전에 따라 **Branch protection rules** 또는 **Rulesets** 메뉴 이름이 다를 수 있습니다.

### 2단계 — 규칙 추가

**Branch protection rules** 방식:

1. **Add branch protection rule** 클릭
2. **Branch name pattern**에 `main` 입력

**Rulesets** 방식:

1. **New ruleset** → **New branch ruleset** 클릭
2. **Enforcement status**: Active
3. **Target branches** → **Add target** → `main` 포함

### 3단계 — Pull Request 규칙

아래 옵션을 켭니다.

- **Require a pull request before merging** (merge 전 PR 필수)
- **Require approvals**: MVP 1~2인 팀이면 `0`도 가능 (PR만 강제)
- (선택) **Dismiss stale pull request approvals when new commits are pushed**

### 4단계 — 상태 검사(Status checks) 규칙

아래 옵션을 켭니다.

- **Require status checks to pass before merging**
- **Require branches to be up to date before merging** (권장)

검색창에서 아래 체크를 **필수(required)** 로 추가합니다.

```txt
CI 통과
```

> `CI 통과` Job은 `.github/workflows/ci.yml` 마지막 Job입니다.  
> 한 번이라도 CI가 main 또는 PR에서 성공해야 GitHub 검색 목록에 나타납니다.

(선택) 세부 Job까지 모두 필수로 두려면:

```txt
Frontend 검사
Backend 검사
```

문서/README만 수정한 PR은 Frontend/Backend Job이 skip될 수 있습니다.  
GitHub는 **skip된 필수 검사를 통과로 처리**하므로, 통합 검사 이름 **`CI 통과` 하나만 필수**로 두는 것을 권장합니다.

### 5단계 — 추가 보안 옵션

- **Do not allow bypassing the above settings** (관리자도 우회 불가) — 팀 정책에 따라 선택
- **Restrict who can push to matching branches** — 필요 시 특정 사람만 direct push 허용
- **Allow force pushes** → **끄기**
- **Allow deletions** → **끄기**

### 6단계 — 저장

**Create** 또는 **Save changes** 클릭 후, 테스트 PR 하나를 만들어 규칙이 적용되는지 확인합니다.

---

## 설정 후 팀 작업 흐름

```txt
1. feature 브랜치 생성
2. 작업 후 push
3. main 대상 Pull Request 생성
4. CI 통과 확인 (Actions 탭)
5. PR merge
```

`main`에 직접 push하면 (규칙에 따라) 거부되거나, PR 없이 merge할 수 없게 됩니다.

---

## CLI로 설정하기 (Pro 또는 Public 레포)

GitHub Pro 또는 Public 레포 전환 후, 아래 명령으로도 설정할 수 있습니다.

```bash
gh api \
  --method PUT \
  repos/mokotan1/campus-link/branches/main/protection \
  -f required_status_checks[strict]=true \
  -f required_status_checks[contexts][]=CI\ 통과 \
  -f enforce_admins=false \
  -F required_pull_request_reviews[required_approving_review_count]=0 \
  -f restrictions=
```

PowerShell:

```powershell
gh api --method PUT repos/mokotan1/campus-link/branches/main/protection `
  -f "required_status_checks[strict]=true" `
  -f "required_status_checks[contexts][]=CI 통과" `
  -f enforce_admins=false `
  -F "required_pull_request_reviews[required_approving_review_count]=0" `
  -f restrictions=
```

---

## Pro/Public 전환 전 팀 규칙 (임시)

브랜치 보호를 아직 켤 수 없을 때는 아래를 팀 규칙으로 운영합니다.

1. `main`에 **직접 push 하지 않기**
2. 모든 변경은 **Pull Request**로 merge
3. PR merge 전 **Actions → CI** 성공 확인
4. `.github/pull_request_template.md` 체크리스트 작성

---

## 문제 해결

### 필수 검사 목록에 `CI 통과`가 안 보임

- main 또는 PR에서 CI 워크플로가 **최소 1번 성공**해야 목록에 표시됩니다.
- Actions 탭에서 실패 Run을 연 뒤 **Re-run jobs**로 다시 실행해 보세요.

### merge 버튼이 비활성화됨

- CI가 실패했거나 아직 실행 중인지 확인
- **Require branches to be up to date**가 켜져 있으면 `Update branch`로 main 최신 반영

### docs만 수정했는데 Frontend/Backend 검사가 skip됨

- 정상 동작입니다. skip은 통과로 처리됩니다.
- `CI 통과` Job만 필수로 두면 merge에 문제 없습니다.
