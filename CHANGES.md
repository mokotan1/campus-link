# 이번 패치 요약

기존 저장소의 같은 경로에 그대로 덮어쓰면 됩니다. (`frontend/...` 이하 구조 동일)

## 1. 더미데이터 삭제 → CSV 데이터로 교체
- `shared/constants/index.ts`에 하드코딩되어 있던 `initialProjects`(미사용 dead code),
  `initialTalents`(가짜 인재 3명), `initialApplications`(미사용 dead code)를 삭제했습니다.
- `students.csv`를 `shared/data/students.ts`로 변환해 실제 학생 100명 데이터를
  `Talent[]` 형태로 넣었습니다. `/projects` 페이지의 "추천 인재" 사이드바가 이 데이터를 씁니다.
- `projects.csv`, `messages.csv`는 현재 코드에서 쓰는 자리가 없습니다.
  (프로젝트 목록은 이미 실제 백엔드 API에서 불러오고, 메시지/쪽지 기능 자체가 아직 없습니다.)
  DB 시드용 SQL이나 메시지 기능이 필요하면 말씀해주세요.

## 2. 온보딩 폼 검증 추가
`app/onboarding/page.tsx`에 `validateStep()`을 추가해서, "다음" 버튼을 눌러도
- 1단계: 이름/닉네임 미입력, 학과 미입력이면 못 넘어갑니다.
- 2단계: 역할을 하나도 안 고르면 못 넘어갑니다.
- 3단계: 포트폴리오 링크가 비어있거나 `http(s)://`로 시작하는 올바른 URL이
  아니면, 작업물 내 역할이 비어있으면 못 넘어갑니다.
문제가 있으면 버튼 아래에 빨간 에러 메시지가 뜨고 해당 단계에 머무릅니다.
(기존에는 최종 저장 시점에만 확인했고, 그마저도 값이 비어야만 걸렸어서
 아무 문자나 입력하면 그냥 통과되던 문제가 있었습니다.)

## 3. 썸네일을 사용자가 직접 고를 수 있도록 수정 (피드백 1)
- 온보딩 3단계(작업물 검증)에 있던 "대표 썸네일 URL" 텍스트 입력을
  프로젝트/포트폴리오 작성 페이지에서 이미 쓰던 `FileDropField`(파일 선택/드래그앤드롭)
  컴포넌트로 교체했습니다.
- 더 중요한 문제: 프로젝트 등록, 포트폴리오 작성, 온보딩 페이지 모두 `FileDropField`로
  파일을 고르긴 했지만, 실제로 API 요청 바디에 파일명이 담겨 전송되지 않고
  버려지고 있었습니다 (`coverImageName`이 어디서도 서버로 전달/저장되지 않음).
  - `projects` / `portfolio_items` 테이블에 `cover_image_name` 컬럼을 추가하는
    마이그레이션을 새로 만들었습니다: `supabase/migrations/202607090001_cover_image_fields.sql`
  - `features/projects/server/projects.ts`, `features/portfolios/server/portfolios.ts`에서
    `coverImageName`을 정규화 → 검증 → insert/select → 응답 매핑까지 전 구간 연결했습니다.
  - `shared/lib/app-data-context.tsx`의 `addProject`/`addPortfolio`가 이제
    실제로 `coverImageName`을 요청 바디에 실어 보냅니다.
  - 참고: 지금은 "파일 이름"만 저장합니다. 실제 이미지 바이트를 Supabase Storage 등에
    업로드하는 기능은 이번 범위에 없습니다. 진짜 이미지 업로드/미리보기까지 필요하시면
    별도로 Storage 버킷 연동을 도와드릴 수 있습니다.

## 4. SQL 인젝션(PostgREST 필터 인젝션) 수정 (피드백 2)
- `features/projects/server/projects.ts`의 프로젝트 검색(`listProjects`)에서
  사용자가 입력한 검색어를 그대로 문자열 템플릿으로 `.or()` 필터에 꽂고 있었습니다:
  ```ts
  query = query.or(`title.ilike.%${search}%,summary.ilike.%${search}%`);
  ```
  Supabase(PostgREST)의 `.or()`는 문자열을 직접 파싱하기 때문에, 검색어에
  `,` `(` `)` 같은 문자가 들어가면 사용자가 필터 조건 자체를 조작할 수 있는
  전형적인 PostgREST 필터 인젝션 취약점입니다. (기존에도 `%`, `,`는 일부
  제거하고 있었지만 `(` `)` `.` `*` 등은 그대로 뚫려 있었습니다.)
- `escapeLikeQuery()`를 강화해서 필터 예약 문자(`, ( ) % _ * . ' " \`)를 전부
  제거하고 길이도 100자로 제한했습니다. 정제 후 검색어가 비면 필터 자체를
  적용하지 않도록 했습니다.


## 5. 이메일 형식 검증 수정

기존 코드는 온보딩 1단계에서 이름/학과/이메일이 "비어있지 않은지"만 확인해서,
`ddd` 처럼 이메일 형식이 아닌 문자열을 넣어도 "다음" 버튼이 눌리는 문제가 있었습니다.

`app/onboarding/page.tsx`의 `stepValidation[0]`에 이메일 형식 검사를 추가했습니다.

```ts
function isValidEmailFormat(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
```

- `@`가 없거나, `@` 앞/뒤에 공백이 있거나, 도메인에 온점(`.`)이 없는 경우
  (예: `ddd`, `ddd@`, `ddd@school`) 모두 형식 오류로 처리되어 다음 단계로 못 넘어갑니다.
- 필드가 비어있을 때와 형식이 잘못됐을 때 에러 메시지를 다르게 보여줍니다.
  - 비어있음: "이름, 학과, 학교 이메일을 모두 입력해주세요."
  - 형식 오류: "학교 이메일 형식이 올바르지 않습니다. (예: student@school.ac.kr)"
- "다음" 버튼은 이미 `!currentStepValid`일 때 비활성화되도록 되어 있던 로직을
  그대로 활용했기 때문에, 검증 함수만 고치면 자동으로 버튼도 막힙니다.