# Production auth email setup

Live audit: custom SMTP is disabled. Auth logs in the audit's last-24-hour window include one signup and one recovery 429 with code `over_email_send_rate_limit`. The default email service currently allows only two messages/hour and only pre-authorized team addresses; it is not a production mail service. See [Supabase SMTP](https://supabase.com/docs/guides/auth/auth-smtp) and [rate limits](https://supabase.com/docs/guides/auth/rate-limits).

The UI now reserves a 60-second cooldown before signup, reset and resend calls, persists it across reloads, disables buttons and explains 429 responses. Login remains available. This prevents accidental repeats; it does not bypass or increase server quotas.

## Owner action required

1. Choose a transactional provider such as Resend and verify a sending domain using that provider's DNS instructions. No provider account, DNS ownership or SMTP credentials were supplied in this audit.
2. In Supabase Authentication → Emails → SMTP Settings, enable custom SMTP and enter the provider's host, port, username, password, verified sender address and sender name. Obtain exact values from the provider; keep credentials in Supabase only, never VITE variables or Git.
3. Keep email confirmation enabled. Keep the default verified `{{ .ConfirmationURL }}` link for the existing implicit recovery flow; do not replace it with an unverified redirect link.
4. Review Authentication → Rate Limits after SMTP setup; tune to the provider quota and expected use without disabling abuse protection.
5. Use a dedicated test inbox: signup → newest confirmation email → login → Scan. Request reset and open the newest link on another device → Set New Password → login. The user must enter the new credential during browser-based acceptance.

Site URL verified: https://pixelogy-three.vercel.app. Twenty exact redirect entries are now saved, preserving all existing entries and adding the six remaining production callback destinations. Hosted signup and recovery always target the stable origin. Local development email callbacks require matching local entries; automated tests intercept email services.

No real email was sent in this audit. A test account/inbox was requested but not yet supplied. Live delivery, physical-device recovery and authenticated Gemini acceptance remain unverified.
