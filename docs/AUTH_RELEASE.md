> Production configuration update: approved authentication destinations are saved and verified after reload. Site URL is https://pixelogy-three.vercel.app; six confirmation/recovery URL entries cover the scanner and profile return paths. The matching 256-bit receipt-signing secret is installed in Vercel Production and Supabase private.server_secrets, verified by equality without disclosing it. The older pending-approval notes below describe the preceding checkpoint. Deployment and real email/camera acceptance are still being verified.

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

## Remaining release actions

1. Dashboard access is now available. Verified Auth URL Configuration still has Site URL http://localhost:3000 and an empty redirect allowlist. Production URL changes are prepared but not saved, pending browser action-time confirmation. Use https://pixelogy-three.vercel.app as the production Site URL. Allow the exact production /auth/callback and /auth/update-password routes, including query parameters. Add localhost equivalents only for development; avoid broad production wildcard domains. Keep email confirmation enabled. Test delivery and any SMTP/rate-limit requirements.
2. Provision matching cryptographically random SCAN_SIGNING_SECRET in Vercel's server environment and private.server_secrets(name='tickets') in Supabase. No secret is currently installed. Browser action-time approval has been requested for this credential setup. Never expose it via VITE_, source control, client code, screenshots, or logs.
3. Publish the source changes and deploy a new production build. Production variable changes alone do not deploy local code. Preview environments need separate public Supabase variables if used for testing.
4. Complete a real registration + email confirmation + login + camera + consented Gemini + saved collectible + equipment + battle + reload test. Test password recovery using a real email link. Then verify the same account on a second device. Automated mocked browser checks do not establish those outcomes.

The supplied deployment remains unverified after these local changes. No real confirmation email was sent, no personal password was changed, and no physical-phone camera/GPS acceptance is claimed. The dashboard is now accessible; saving the prepared authentication destinations and provisioning the receipt secret require action-time approval. Later major features are deferred until this auth/scan loop can be accepted: the opt-in weekly leaderboard is still unavailable; 160 catalog sprites remain explicitly draft; account deletion/import of unverified legacy rewards is not implemented. Existing local saves are intact.

## Verification

Typecheck, ESLint, 67 unit/API tests, plain-Node loading of both API modules with five rejection checks, and production build passed. All 62 existing browser regression checks passed in the full run. All 12 new authentication checks passed in the final targeted Chromium/WebKit run, including 375/390/430px layout and keyboard screenshots. Initial recovery fixture failures were corrected (new-document navigation, input selector scope, SDK-added request fields); no application assertions were removed. Browser auth tests use the real SDK with intercepted network responses; gameplay tests use camera/location/Gemini/Supabase fixtures. Live database tests are separate from browser fixtures.
