# Home page redesign: A+ (v1.0.11)

The owner approved A+ from the 2026-11-07 redesign round and said "publish it". Before that, take out every line that asks people to contact the owner for access to the AI or the labs.

Design source: `scratchpad/mk/opt-AP/site/` (Option A by Gemini 4 Argon, rebuilt by Fable with fold-ins from B–H and three rounds of owner changes).

One branch (`feat/redesign-a-plus`), one PR, one DeepSeek review session, merge when green, then deploy to rust-01.

## Port
- [x] Copy A+ over `index.html`, `style.css`, `app.js`. Add `404.html` and `assets/favicon.svg`. `/ai/`, `server/`, `scripts/` and `locales/` structure stay.
- [x] Remove the access-by-contact copy:
  - the "Invitation test program" label
  - the AI panel's "By invitation while we test. Ask Nicholas for a personal key."
  - the FAQ "How do I get access?" and its answer
  - any other "ask/contact for access" wording for the AI or the labs
- [x] Google Analytics: restore the `G-KKV5S28YZS` snippet with its local/dev disable logic exactly as on main. Add the events:
  - project details opened
  - language changed
  - booking started (topic chosen)
  - `generate_lead` on a successful booking
- [x] Translations:
  - Add `data-i18n` keys to all visible copy, on the innermost text spans; use `data-i18n-html` where a translation contains links.
  - Add all new keys to `locales/en.json` and translate them into the other 9 locales.
  - Route every JS string through `tt()`.
  - `i18n.js` stays the only owner of language state. A+'s accessible picker (`.lang-choice`) calls it, there is no second storage key, and `languageChanged` fires after the language has loaded.
- [x] Fonts: self-host the woff2 files (latin) under `assets/fonts/` with `?v=dev`; no Google Fonts request.
- [x] nginx: `error_page 404 /404.html`. Dockerfile: stamp `?v=` in `404.html` as well as `index.html`.
- [x] CHANGELOG: a new 1.0.11 entry at the very top.

## Verification (before push)
- [x] `docker compose build website` succeeds. Run the image locally.
- [x] Playwright against the container at 1440/1100/820/390:
  - no console errors, no sideways scroll, everything visible at rest
  - menu, 4 dialogs, topic chips, booking error box, phone pill
  - 404 on a nested path
  - all 10 languages: switching works, no raw keys showing, no sideways scroll in de/ru at 390
- [x] Versions: live from GitHub with the snapshot fallback; the merged Firewall Monitor row; WiFi Doctor "Early access".
- [x] `git status` clean apart from untracked files.
- [x] MiniMax-M3.1-Flash checks the build/test logs. DeepSeek V4 Pro reviews the diff (Ollama route; direct has no balance).

## Review
- **Container QA** (`live-qa.mjs` against the production image, `docker build` exit 0): 0 problems.
  - 4 widths, every language (en de es fr it pt ru ja ko zh) at 390 and 1440: no sideways scroll, no raw keys, the `lang` attribute follows.
  - 4 dialogs at 1440 and 390 are modal and close on Escape.
  - Nested 404 is styled with no overflow. Required fields are flagged (2). The booking error box shows with its mailto and no overflow.
  - The title and stylesheet load.
- **Extra QA** (`extra-qa.mjs`): 0 problems.
  - One `begin_booking` per chip click and per radio click. `booking_error` once on failure; `generate_lead` only after success. `select_content` when a dialog opens. GA is disabled on localhost.
  - The removed access text (en phrases, plus main's FAQ q3/a3 in all 10 languages) does not render.
  - The three fonts load. Favicon and fonts return 200.
- **i18n key check:** 309 keys used, present in all 10 locales, 0 gaps. **HTML structure:** index.html and 404.html have 0 unclosed tags and no duplicate ids.
- **Caught in QA:** the port lost the GA block's closing `</script>`, which hid the title and the stylesheet link (the page would have shipped unstyled). Fixed; 6/6 script tags.
- **Caught in QA:** `tasks/` was copied into the image and served at /tasks/todo.md. Added to `.dockerignore`; it now returns 404.
- **DeepSeek V4 Pro review** (Ollama backup; direct has no balance) of the behaviour diff (app.js, i18n.js, 404.html, nginx, Dockerfile, .dockerignore): CHANGES REQUIRED, triaged.
  - Checked, not defects: confirmation elements always exist (#1); confirmation has tabindex=-1 (#16); the mailto sits inside the hidden error box (#15); versions.json is always served no-cache, so its `?v=dev` is fine (#24).
  - Accepted LOW: a stale dialog opener only if `showModal()` throws (#9).
  - The rest DeepSeek dismissed itself.
- **MiniMax-M3.1-Flash validation:** BUILD PASS; TESTS FAIL on auditability, not on any failing command.
  - Real: a topic chip sent `begin_booking` twice (synthetic change event). Fixed with `isTrusted`; the new test failed before the fix (2) and passes after (1). LOW, so no re-review.
  - Added assertions for GA events, the removed wording, fonts and favicon.
  - Accepted: 404.html stays English-only (i18n.js fetches locales relatively). The QA scripts live in the session scratchpad, since this repo has no test setup.
  - Not defects: the session cache comes before GitHub, the same as main, to stay inside the 60 requests/hour limit. The i18n load order is unchanged from main.
- **Pre-existing, raised with the owner (not changed):** CHANGELOG.md, Dockerfile and server/index.js are publicly served by `COPY .`.

## Deploy (owner said "publish it")
- [ ] rust-01 `/opt/TechnicalLabs-Website`: `git pull --ff-only`, `docker compose build website`, `docker compose up -d website`. Check that `.env` keeps `PORT=8333` before and after (a 2026-11 deploy fell back to 8080 and went down).
- [ ] Live check: https://technicallabs.org at 4 widths, version stamp, `/ai/` unchanged, `/api/schedule` still proxied.
