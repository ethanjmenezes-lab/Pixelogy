> Primary release: mobile-first PWA on Vercel HTTPS. Follow [PWA setup](PWA_SETUP.md). Native projects and store submission are optional future work, not release prerequisites. Keep browser camera/GPS, existing local saves and gameplay. Do not cache private/API/photo responses.

# Store release checklist

This is a development build, not a store-compliant or approved release.

- [ ] Install full native SDKs and pass iOS/Android builds.
- [ ] Replace `com.pixelogy.dev` with the owner's registered production ID; confirm URL scheme ownership and version/build numbers.
- [ ] Configure Apple Developer / App Store Connect and Google Play Console accounts, signing, provisioning and release keystore outside version control.
- [ ] Test camera opening immediately on supported iPhone and Android phones; rear preference, OS prompts, denial, cancellation, retake and camera interruption.
- [ ] Test foreground GPS outdoors and indoors, approximate permission, denied/revoked permissions, stale updates, jitter, pan/recenter and watch shutdown while backgrounded.
- [ ] Test Android low-memory camera restoration, Back behavior and cold deep links.
- [ ] Verify safe areas, landscape/tablet fallback, reduced motion, VoiceOver/TalkBack, keyboard access and contrast on devices.
- [ ] Verify existing save upgrades, local privacy settings, offline gameplay and restart persistence. Communicate that uninstall may erase local saves.
- [ ] Deploy and configure the HTTPS Gemini backend; test allowed native origins, consent, errors and quota/rate-limit protection. Secrets must remain server-only.
- [ ] Review provider terms, photo processing/retention, map attribution and location-region disclosure. Never claim photos are disposal verification.
- [ ] Publish an owner-approved privacy policy/support URL; complete Apple privacy labels and Google Data Safety accurately, including third-party photo processing and map traffic.
- [ ] Review included SDK privacy manifests and current required-reason API declarations before submission.
- [ ] Cloud accounts are absent. If accounts are added, implement secure authentication, RLS, data export/deletion and in-app deletion before releasing that feature.
- [ ] Review original icon/splash placeholders at store dimensions and on devices; prepare screenshots, age rating, descriptions and review notes.
- [ ] Archive a signed iOS release in Xcode, validate/upload to App Store Connect, distribute through TestFlight and collect device results.
- [ ] Build a signed Android App Bundle, upload to Play internal testing, review pre-launch reports and test installation/update.
- [ ] Review current store policies and target SDK deadlines at submission time; this checklist is not a compliance certification.

Supabase accounts, synchronization, public rankings and PvP remain unimplemented. No precise locations are published, no background tracking is configured, and no movement XP is awarded.
