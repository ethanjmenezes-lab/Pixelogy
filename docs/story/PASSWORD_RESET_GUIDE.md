# Pixelogy password-recovery diagnostic checklist

**Reported symptom:** The user receives a reset email, but clicking its link does not show a working form to set a new password.

**Do not assume a cause until inspected:** Common causes include a wrong Supabase Site URL, an omitted Redirect URL, an email template that links straight to `{{ .RedirectTo }}` (which by itself is not a verified recovery link), a route guard that redirects before verification, a missing Vercel SPA rewrite, a PKCE code-verifier mismatch across devices, or an already-consumed recovery token.

## Desired user flow

1. From Login or Profile, choose **Forgot Password**.
2. Request one recovery email; show a neutral confirmation message.
3. Open the **newest** email. The link should open a confirmation callback which verifies the recovery token (even when clicked on a different browser/phone).
4. Show `/reset-password` with **New password** and **Confirm password** inputs.
5. Save with `supabase.auth.updateUser({ password: newPassword })` after establishing a session.
6. Show success and a clear action back to login/Pixelogy.
7. Invalid or expired links show a recovery-specific error and a **Request Another Link** action, not a blank page or overworld redirect.

## Supabase dashboard checks

Authentication → URL Configuration:
- **Site URL:** `https://pixelogy-three.vercel.app` (unless the project's stable canonical production domain differs; inspect before changing).
- **Redirect URLs:** include exact production callback/reset paths and development localhost. Add preview URLs narrowly if needed; do not blindly allow all domains.
- If the email template uses `{{ .SiteURL }}`, confirm it points to that stable site. If the template uses `{{ .ConfirmationURL }}`, verify `redirectTo` points to a registered recovery endpoint.

Authentication → Email Templates → Reset Password:

For a cross-device token-hash callback architecture, configure a link that includes the verified token hash, for example:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password">Reset password</a>
```

In the callback, verify the link with `supabase.auth.verifyOtp({ token_hash, type: 'recovery' })`, then navigate to `/reset-password` after the session exists. `next` must be an internal allowlisted path; never redirect to arbitrary `next` URLs.

**Use a single coherent implementation**: if retaining the standard confirmation URL/implicit flow, configure the allowed `redirectTo` and ensure the auth SDK establishes the session and the React route responds to recovery; don't mix two callback schemes accidentally.

## End-to-end verification

- Request the email from desktop, open it in the **same browser**.
- Request a fresh email and open it on a **different phone/browser** (test the deployed production link, not just localhost).
- Test a page refresh on `/reset-password` and browser navigation.
- Test incorrect, consumed, expired, and superseded reset links.
- After a successful reset, log out and confirm the new password signs in and the old password no longer works.
- Never paste reset tokens in public issues, commits, screenshot recordings, analytics, or debug logs.

## References

- https://supabase.com/docs/guides/auth/passwords
- https://supabase.com/docs/guides/auth/redirect-urls
- https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail

This file is implementation guidance, not a claim that any live Supabase dashboard setting has already been changed.
