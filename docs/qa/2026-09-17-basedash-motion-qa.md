# Basedash Reference Reconstruction, 2026-09-17

## Scope

Rebuilt the public landing against the supplied JPG and decoded MP4 frames. Original Organizze branding, approved PT-PT/PT-BR copy, static financial demonstration values and existing authentication destinations remain. No changes to customer data, protected-page mechanics, payment offers, trial eligibility, backend, secrets or deployment.

Composition now follows: layered chart opening, centered promise, inspectable monthly dashboard, WhatsApp interpretation, available-amount context, source convergence, metallic 15-day trial, alternating financial detail bands, privacy evidence, perspective financial scene and pixel-assembled wordmark. This supersedes the flatter composition at `2999ee4`; older reference-map geometry is historical, while `DESIGN.md` and this report describe the current implementation.

## Visual And Interaction Checks

- Chromium screenshots inspected at 375, 768 and 1440 px. No document overflow or browser exceptions.
- PT-BR interaction checks also passed at 320 px: menu/Escape/focus return, opening disclosure, all four tabs, category-limit disclosure, trial reflection, auth navigation and return to the landing.
- Tabs keep the dashboard at 689 px desktop and 828 px mobile across all four states; changing views does not move following sections.
- Pixel assembly was observed on entering text, then stops. Reduced-motion changes hide the animation overlays immediately while retaining readable DOM text.
- Three.js is imported near the closing scene, caps DPR at 1.5, pauses when idle/offscreen/hidden, and disposes observers, listeners, textures, geometry and WebGL resources. Static HTML/SVG remains accessible and acts as the visible WebGL fallback.
- Direct framebuffer checks with production `preserveDrawingBuffer: false` verified nonblank four-color rendering, transparency, framing, pointer response on desktop, scroll response on desktop/mobile and zero motion under reduced motion. A 90 px scroll changed 229,388 pixels at 1280 px and 169,564 pixels at 375 px; reduced-motion hashes were unchanged.
- ScrollTrigger boundaries refresh after disclosure height changes. Unit tests verify observer disconnection and animation cleanup.
- An independent review found a fixed source-angle increment that overlapped a sixth input. It was replaced with a count-derived increment and covered by a regression test.

## Verification

- Full Vitest suite: 352 tests passed; the additional six-source regression test passed in an 8-test focused follow-up, bringing current verified coverage to 353 tests. All four motion lifecycle tests also passed after the final resize deduplication.
- TypeScript application check and production build passed.
- ESLint: zero errors; 27 existing Fast Refresh warnings remain.
- Frozen-lockfile installation passed. Dependency changes are limited to Three.js 0.180.0 and its matching type dependency closure.
- React Doctor identified one observer-cleanup diagnostic and two index-key warnings. Reviewed as false positives: the effect return cancels the pending frame, disconnects the observer and reverts GSAP contexts (tested); the two keys identify fixed time-series positions in stateless SVG/list output. No diagnostic was suppressed.

## Performance

Three sequential Lighthouse 12.8.2 runs per profile against the production preview, before the final contrast correction: median desktop performance 94, mobile 62; LCP 0.893 s / 4.072 s; CLS 0.00274 / 0.00229. Final individual rechecks scored 98 desktop / 62 mobile performance and 100 accessibility on both profiles, after removing reduced opacity from source labels. Final mobile LCP was 4.171 s and CLS was zero. These are local lab measurements, not field data.

The inherited eager application bundle remains approximately 1.45 MB (407 KB gzip) and loads Stripe on the public page. This is still the main mobile performance and best-practices limitation; no checkout or route-loading refactor was included in this visual request. The separate 483 KB Three renderer chunk loads only near the closing scene.

## Evidence And Handoff

Production preview: `http://127.0.0.1:56784/`.

Screenshots, interaction JSON, framebuffer checks, Lighthouse reports and the motion recording are local QA artifacts in `/tmp/organizze-reference-qa-2026-09-17/`, copied into the Desktop handoff's ignored `.continuacao-local/evidencias-2026-09-17/` directory. They are not public-site assets.

Entry/onboarding and protected screens have not been restyled in this reference-reconstruction round. Supabase, Gemini, Stripe, Evolution and Railway were not revalidated against live customer workflows. No push or deployment was performed.
