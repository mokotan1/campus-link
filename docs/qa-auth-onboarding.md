# Auth & Onboarding Manual QA Checklist

> MVP demo domain: `school.ac.kr`. Replace this with the real university domain before production.

## Sign Up

- [ ] Sign up with a valid school email (`student@school.ac.kr`).
- [ ] Verify Supabase creates the auth user and, when a session is returned, `/api/auth/bootstrap` creates the app user and profile without sending client-provided identity.
- [ ] Sign up when Supabase requires email confirmation and verify:
  - [ ] No bootstrap call is made without an active session.
  - [ ] The UI shows the email confirmation message.
- [ ] Attempt sign up with a non-school email and verify the UI blocks it before Supabase auth.

## Sign In / Sign Out

- [ ] Sign in with an existing account and verify bootstrap runs server-side and profile loads.
- [ ] Sign out and verify the auth panel clears session state.
- [ ] After sign out, open `/onboarding` and verify the auth gate appears instead of the onboarding steps.

## Onboarding Profile Save

- [ ] Complete all 5 onboarding steps and verify profile data is saved via `PUT /api/profiles/me`.
- [ ] After completion, verify navigation to `/projects`.
- [ ] Set a student ID elsewhere (auth panel profile form), then complete onboarding again and verify the existing student ID is preserved.
- [ ] Simulate or trigger a profile API failure during final save and verify:
  - [ ] An error message is shown.
  - [ ] The user remains on onboarding (no redirect).
- [ ] Save profile fields from the Auth Panel after onboarding completion and verify `onboardingCompleted` and structured onboarding fields are not reset.

## Onboarding Email Display

- [ ] Sign in as user A, start onboarding, and verify the read-only email field shows user A's session email.
- [ ] Sign out, sign in as user B, return to onboarding, and verify the read-only email field updates to user B's session email.
- [ ] Switching accounts does not show previous user's profile values (name, campus, roles, portfolio fields).

## Portfolio Step (MVP)

- [ ] On step 3, verify there is no file upload control.
- [ ] Enter an external portfolio link and role in work, complete onboarding, and verify `POST /api/portfolios` persists the link when provided.
- [ ] Submit the same external portfolio URL again and verify it updates instead of creating a duplicate record.
- [ ] Trigger a portfolio API failure and verify the user stays on onboarding with an error message.
- [ ] Portfolio GET failure does not block onboarding resume.

## Demo Stability

- [ ] Profile GET failure shows the fallback message: "저장된 프로필을 불러오지 못했습니다. 기본값으로 온보딩을 시작합니다."
- [ ] Profile GET failure still allows onboarding to continue with default values.
- [ ] Final save button is disabled while profile is loading.
- [ ] Switching accounts does not show previous user's profile values.

## Auth Panel Error Handling

- [ ] Trigger a bootstrap or profile load failure during sign-in and verify a clear error message appears and the submit button is re-enabled.

## Known QA Limits

- Local testing requires valid Supabase credentials in `frontend/.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, publishable key, `SUPABASE_SERVICE_ROLE_KEY`).
- If Supabase email confirmation is enabled, sign-up may not return an active session until the user confirms email; bootstrap and onboarding save cannot be verified end-to-end without a confirmed session.
- Remote Supabase migrations under `frontend/supabase/migrations/` must be applied to the target project before structured onboarding fields and readiness checks work.
