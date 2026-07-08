# Auth & Onboarding Manual QA Checklist

## Sign Up

- [ ] Sign up with a valid school email (`student@school.ac.kr`).
- [ ] Verify Supabase creates the auth user and, when a session is returned, `/api/auth/bootstrap` creates the app user and profile without sending client-provided identity.
- [ ] Sign up when Supabase requires email confirmation and verify:
  - [ ] No bootstrap call is made without an active session.
  - [ ] The UI shows the email confirmation message.

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

## Onboarding Email Display

- [ ] Sign in as user A, start onboarding, and verify the read-only email field shows user A's session email.
- [ ] Sign out, sign in as user B, return to onboarding, and verify the read-only email field updates to user B's session email.

## Portfolio Step (MVP)

- [ ] On step 3, verify there is no file upload control.
- [ ] Enter an external portfolio link and role in work, complete onboarding, and verify `POST /api/portfolios` persists the link when provided.
- [ ] Trigger a portfolio API failure and verify the user stays on onboarding with an error message.

## Auth Panel Error Handling

- [ ] Trigger a bootstrap or profile load failure during sign-in and verify a clear error message appears and the submit button is re-enabled.
