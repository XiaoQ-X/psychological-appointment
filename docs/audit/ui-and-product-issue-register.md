# UI And Product Issue Register

Date: 2026-06-14

Severity:

- P0: blocks clean delivery, startup, or core demo.
- P1: should be fixed before presenting as a polished product.
- P2: quality, maintainability, or follow-up improvement.

## Cross-Project

### P0

- The original GitHub target is empty; source has only now been extracted locally and still needs commit/push.
- The original project folder has many unrelated untracked and modified files. Treat it as a source archive, not a clean repository.
- Root build script previously omitted student and counselor H5. This has been fixed in the extracted repository.
- Docker used a fixed `container_name` and port `3307`, which conflicted with the original project. This has been fixed in the extracted repository by using compose-managed names and `3308`.

### P1

- `server/src/app.js` is a large single file with routing, business logic, validation, and persistence mixed together.
- `apps/student/src/App.vue` and `apps/admin/src/App.vue` are very large single-file applications, making regression risk high.
- `apps/wechat-miniapp/src/styles/prototype.css` is a large prototype-migration stylesheet with many override-style rules.
- `npm audit` reports 30 vulnerabilities, including high-severity issues in `xlsx`, Vite/esbuild, and the uni-app dependency chain.
- The seed creates a minimal empty baseline. README has been corrected, but product/demo planning still needs a stable demo-data strategy for non-technical reviewers.

### P2

- Some console/log output appears garbled in PowerShell because tooling is not consistently UTF-8 clean.
- Documentation is now organized, but original Chinese docs should be reviewed after copying to ensure content is still current.
- There is no CI workflow yet for install, build, API test, and audit.

## Student H5

### P0

- No P0 visual blocker found on login screenshot after using the correct target port.

### P1

- The student H5 renders inside a fixed phone-shell frame. This is useful for prototype review but not appropriate for a production responsive H5 unless that is an explicit product decision.
- The login page and H5 product language diverge from the WeChat miniapp branding, especially hero art, logo treatment, and entry hierarchy.
- Agreement text and secondary actions are visually small relative to primary input and button controls.

### P2

- The first screen has substantial unused lower whitespace after the login card on 390x844.
- Emergency help is present but visually treated as a small secondary row; for mental-health scenarios it should be more reliably discoverable.
- The design relies heavily on blue/teal and could benefit from a clearer semantic color system for risk, warning, success, and neutral states.

## Counselor H5

### P0

- No P0 visual blocker found on login screenshot.

### P1

- The consultant login page uses a generic medical icon and blue block header, while the miniapp/admin use LightCatch visual assets. This weakens cross-end brand consistency.
- The WeChat scan login button is visually prominent but may not have a complete real authentication flow; verify before demo.
- On 320px width, the card fits but vertical rhythm is tight, especially between header and card.

### P2

- Login form labels are clear, but helper text and failure/recovery states were not visible in screenshot audit.
- Button icon/text alignment is acceptable but should be checked across all post-login workflows.

## Admin

### P0

- No P0 visual blocker found on the login page at 1024x768 and 1440x900.

### P1

- The login page background is illustrative and brand-heavy. For a school management backend, the product should lean more operational: clearer institutional identity, stronger security cues, and less decorative background dependency.
- The admin app uses a desktop minimum width strategy. Confirm whether tablet/narrow desktop is officially unsupported; otherwise responsive behavior needs more work.
- Admin business UI is concentrated in a very large `App.vue`, making page-level QA and modular fixes difficult.

### P2

- "Remember me" is checked by default; for a sensitive mental-health admin system this should be reconsidered.
- The "forgot password" affordance exists, but password recovery policy is not documented in the UI audit.

## WeChat Miniapp

### P0

- No P0 login-screen rendering blocker found at 320x700 and 390x844.

### P1

- Stale "replace with real data later" comments were removed from pages already wired to APIs. The remaining consent copy is intentionally built in and must be institutionally reviewed before production.
- The 320px login screen shows the agreement checkbox and protocol links as too small for comfortable touch.
- The hero image takes a large first-screen share; on small screens it compresses the login form and secondary actions.
- "Counselor login" is treated like a small text link below the card, making role switching less discoverable.
- The current uni-app alpha toolchain effectively fixes H5 development to port `5176`; parallel local project copies require releasing that port first.

### P2

- The login page uses a strong image-led style, while counselor H5 uses a flatter blue style. Cross-end design tokens should be unified.
- The emergency help entry is visible but could have stronger priority and touch target sizing.
- Global status-bar and safe-area behavior should be tested on real WeChat DevTools and at least two phone sizes before release.

## Next Fix Order

1. Commit the clean extracted repository and push it to the empty GitHub target.
2. Fix dependency audit risks or document accepted temporary exceptions.
3. Reconcile seed/demo account expectations with README and API tests.
4. Split backend and large Vue entry files by module.
5. Run post-login screenshot audit for all core flows, not only login pages.
6. Verify every miniapp page with real API data and remove stale prototype-restoration comments.
