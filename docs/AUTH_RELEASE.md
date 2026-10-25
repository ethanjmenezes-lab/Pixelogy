# Password recovery correction — 2026-10-24

This section supersedes the older recovery status below.

## Root cause and fix

The current production alias was verified in Vercel as `https://pixelogy-three.vercel.app`. Reset requests previously used the current browser origin and an arbitrary `next` query. The live Supabase allowlist only covered six exact callback/update-password URLs. Requests from a rotating preview or another return destination could fall back to the Site URL. The root page did not route `PASSWORD_RECOVERY` to a password form.

- `src/cloud/authNavigation.ts`: hosted requests now use the stable `/auth/confirm` URL; local development retains its local origin.
- `src/cloud/client.ts` and `recovery.ts`: explicit implicit flow, early recovery-event handling and an expiring, user-bound UI marker. No token/password logging or extra credential storage. Supabase still authorizes password changes.
- `src/pages/Recovery.tsx`: public callback waits for SDK session establishment before removing the URL fragment; `/reset-password` supports confirmation, validation, errors, refresh and success/login. Legacy `/auth/update-password` and root recovery fallbacks are supported. Missing/expired/invalid links offer Request Another Link.
- `src/pages/Auth.tsx` requests the fixed destination. `src/App.tsx` allows recovery before game-data loading. Existing Vercel SPA rewrite already supports these routes and excludes APIs/static assets.

## Verified live configuration

Site URL remains the stable production origin. Eight entries were added, preserving the existing six (14 total): `/auth/confirm` and `/reset-password` on production, `http://localhost:5173`, `http://127.0.0.1:5173` and `http://127.0.0.1:5175`. Dashboard readback confirmed the saved entries.

The recovery email template was inspected and uses verified `{{ .ConfirmationURL }}`. Template editing is disabled until custom SMTP is configured, so the valid default implicit flow is retained; it does not require the requesting browser's PKCE verifier. No token-hash template was installed, no authentication security setting was disabled, and no broad preview wildcard was added.

## Actual acceptance and remaining work

All 18 authentication browser checks passed across Chromium and WebKit, including requesting in one context and completing recovery in a fresh context, refresh, new-password login, invalid/expired links, root fallback, ordinary-session rejection and phone layouts. These use the real Supabase SDK with intercepted service responses, not actual email delivery or physical devices. Stable URL/rewrite unit tests passed.

**Live recovery is not verified.** A dedicated test account was requested; none was supplied. No real recovery email was sent and no personal password was changed. Vercel CLI reports logged out; this change has not been deployed. After deployment, request the newest email on a dedicated account, open it in a separate browser/device, set the password, then log in with it. Check consumed/expired links and Safari outside the installed PWA. No further template change is required for the chosen default flow.

---

# Authentication repair — 2026-10-24

## Diagnosis and implemented repair

The supplied Vercel deployment displayed “Supabase is not configured for this deployment” on Profile. Vercel Production had only GEMINI_API_KEY. Missing VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY caused the client to be null and hid the old embedded account form. Supabase's live public Auth settings returned email enabled, signup enabled, and email confirmation required.

Dedicated routes now cover /auth/login, /auth/signup, /auth/reset, /auth/callback, and /auth/update-password. Guest Scan redirects to Login with an allowlisted return destination. Registration explains email confirmation and offers resend; login restores Scan; authenticated sessions persist through the existing Supabase SDK. Recovery requests return to a password-update route. Expired/missing sessions cannot update passwords. Errors remain visible and retryable. Profile links to account screens and provides logout; guest exploration remains available. No confirmation bypass or fake auth was added.

Changed implementation files: src/pages/Auth.tsx, src/cloud/authNavigation.ts, src/cloud/client.ts, src/cloud/AccountPanel.tsx, src/pages/Scan.tsx, src/pages/Profile.tsx, src/App.tsx, src/tropical.css, pwa.config.ts. Tests: tests/e2e/auth.spec.ts. Migration filenames and scripts/seed-catalog.ts were aligned with the actual remote ledger versions 20261024233214 and 20261024233221. Existing API .js imports and server compilation are preserved.

## Live configuration changes

- Reused project rsdgbxpqpdewqpmeuwvp; no duplicate project.
- Applied existing shoredex and catalog_seed migrations. Verified 200 catalog rows and RLS on all 12 public tables.
- Ran supabase/tests/rls.sql successfully against the real database. It verifies ownership, incompatible slots, forged/cross-user receipts, duplicate discovery/cleanup, equipment special selection, and rejection of direct progression/catalog writes. The transaction rolled back; no test users remain.
- Added VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to Vercel Production. These are public client configuration, not server secrets. Existing GEMINI_API_KEY was neither revealed nor changed. New deployments must rebuild to include these variables; an existing immutable deployment URL does not gain them retroactively.
- Supabase's security advisor reports seven intentional authenticated SECURITY DEFINER RPCs, with no missing-RLS finding. These enforce server receipts or ownership checks, use fixed empty search_path and per-user locks, and reject unauthenticated writes. Review guidance: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable

## Production deployment and remaining acceptance

The production Site URL is https://pixelogy-three.vercel.app. Six saved redirect entries cover /auth/callback and /auth/update-password, with no query and with next=%2Fscan or next=%2Fprofile. These values were verified after reloading the Supabase dashboard. Email confirmation remains enabled.

A matching random 256-bit receipt secret is installed as SCAN_SIGNING_SECRET in Vercel Production and in Supabase private.server_secrets(name='tickets'). Equality was verified without returning the value. The temporary local copy was removed. No secret entered source control or the frontend.

Application commit 33b72c2 was pushed to main and Vercel deployment 8Boziv76HvVQffKWogZb7RBc6H17 reached Ready (25-second build). The stable production alias now serves the repaired auth routes. Live /scan redirects to /auth/login?next=%2Fscan; Sign Up opens an enabled registration form. Both API functions cold-started and returned 401 with Cache-Control: no-store to unauthenticated requests; malformed analyze requests returned 400. These checks do not call Gemini.

Remaining acceptance requires the user to create an account, confirm the actual email, log in, capture a photo, complete a consented Gemini discovery, equip gear, battle, and reload. Password-reset email delivery and cross-device persistence also need a real-account check. No real confirmation email was sent by the agent, no personal password was changed, and no physical-phone success is claimed. Use the stable production alias rather than the old immutable deployment link.

The opt-in weekly leaderboard remains unavailable and 160 catalog sprites remain draft. Existing local saves are intact. Preview environments require their own configuration if used.

## Verification

Typecheck, ESLint, 67 unit/API tests, plain-Node loading of both API modules with five rejection checks, and production build passed. All 62 existing browser regression checks passed in the full run. All 12 new authentication checks passed in the final targeted Chromium/WebKit run, including 375/390/430px layout and keyboard screenshots. Initial recovery fixture failures were corrected (new-document navigation, input selector scope, SDK-added request fields); no application assertions were removed. Browser auth tests use the real SDK with intercepted network responses; gameplay tests use camera/location/Gemini/Supabase fixtures. Live database tests are separate from browser fixtures.
