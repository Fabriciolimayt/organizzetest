# Editorial Publication

Date: 2026-09-22

## Release Scope

- Release branch: `codex/publish-editorial`, based on GitHub `main` at `8cc9f5b`.
- Approved source snapshot: `codex/invisible-ledger` at `087b785`.
- Canonical site: https://organizze-mes-claro.fabriciolimayt.chatgpt.site/
- Login: https://organizzetest.lovable.app/auth
- Signup: https://organizzetest.lovable.app/signup
- Signup now opens account creation directly, using the existing Auth component.
- Existing GitHub subscription validation and backend files are retained.
- No database migration, Edge Function deployment, secret transfer or DNS change.
- Production frontend uses the existing business Supabase project
  `mvnpfnmplnsdfkufghgh`, matching the approved local app. Production configuration
  contains only browser-public values and a publishable key, never a service key.

## Preservation

Original worktree and Desktop copies are untouched. Local design changes have a
committed snapshot. The release overlays the frontend on current remote history;
it does not replace main with the divergent development branch. Original public
landing source remains in version control but `/` routes to the canonical Site.
Authentication callback parameters stay on the app origin.

## Validation

The earlier interface evidence is in `editorial-product-delivery.md` and
`qa/product-editorial-validation.md`. This isolated release passed 405 tests in
33 files with two Vitest workers, TypeScript and production build. ESLint reports
zero errors and 10 existing Fast Refresh warnings. The larger development branch
has additional backend-only trial tests not included in this frontend release.

The initial unlimited-worker test run timed out on two interaction tests under
CPU contention. The two-worker full rerun passes without increased timeouts.
The publication scope includes only presentation, routing, documentation,
dependency locks and browser-public production configuration.

## Supabase Availability

The initial DNS failure was caused by a paused project. The Supabase connector
confirmed `INACTIVE`; the existing free-plan project was resumed and now reports
`ACTIVE_HEALTHY`. The Auth settings endpoint responds HTTP 200 using the existing
publishable key. Email signup is enabled; email autoconfirm remains enabled.
All 22 app_v2 tables have RLS enabled. No tables or accounts were recreated.
The native Google provider is disabled; the existing Lovable OAuth bridge is
unchanged and must not be treated as verified by the email availability check.

Existing accounts, real financial entries, subscriptions and WhatsApp sessions
were not modified. Live login, signup, checkout and WhatsApp remain unverified.

## Published Release

- GitHub PR: https://github.com/Fabriciolimayt/organizzetest/pull/1 (merged).
- Published main commit: `49a8bd0d82b93675fe9eca0be0ccf54d133b075e`.
- Frontend tree: `0aef15fa4b088370fca22d1c79704a053f32cf35`, verified identical
  between the validated local release and the GitHub release.
- Lovable deployment: `b02004c8-4087-4cca-8ca4-15da0c1995b6`.
- Public application: https://organizzetest.lovable.app

## Live Smoke Checks

Verified on the public deployment, without signing in or writing user data:

- Landing navigation: Entrar opens `/auth`; Comecar opens `/signup`.
- `/signup` displays account creation rather than the login form.
- The app logo and return link lead to the canonical Site.
- The application root `/` redirects to that same Site, not the legacy landing.
- The rendered landing contains no localhost or loopback links.
- Anonymous `/dashboard` navigation returns to `/auth`.
- The new auth artwork loads; the desktop login presentation is visible.
- At 375 CSS pixels, the signup form measures 343 pixels with 16-pixel gutters;
  the document has no horizontal overflow. Browser viewport override was reset.
- No console errors were captured during the app navigation smoke checks.
- Public production JavaScript returns HTTP 200 and contains only the business
  Supabase URL `https://mvnpfnmplnsdfkufghgh.supabase.co`, not the old project.

These checks verify publication, routing and configuration, not a real account
creation, authenticated financial session, Google OAuth, purchase or WhatsApp
message delivery. Those flows still need an authorized end-to-end session.

## Existing Security Follow-Up

Supabase advisors returned no ERROR-level findings. Leaked password protection
is disabled (WARN). RLS-without-policy notices on service-only `app_v2.whatsapp_jobs`
and legacy `public.expenses` are INFO-level findings. No permissions or security
settings were relaxed during publication.
