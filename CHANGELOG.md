# Changelog

All notable changes to the Technical Labs website are documented in this file.

## [1.0.12] - 2026-11-08

### Changed
- **AI guide model names now match the live gateway:** `ornith-1.5-122b`, `ornith-1.5-35b-a3b` and `qwen3.8-turbo-27b`. One name works for both the OpenAI and Anthropic formats. Older names (`ornith-122b-openai`, `ornith-35b-anthropic`, `qwen3.8-27b-turbo-openai`) still work as hidden aliases for existing configs.
- **Setup behaviour:** the catalog no longer claims that the inactive Ornith name is answered by the other model. All three names stay listed; a model whose setup is not loaded returns a clear "model not found" error.
- **OpenCode and Claude Code snippets** use the new names. Qwen's OpenCode input limit is 229,376 so input plus output stays inside its 262,144-token context.
- **Qwen long-context row** now shows the measured follow-up at ~244k (13–28 s, then 18–22 tok/s) instead of "not measured yet".
- The connector test prompts use the new model names.

## [1.0.11] - 2026-11-07

### Changed
- **New home page design ("A+").** It comes from a redesign round in which eight models each built a full site from the same brief. The owner picked Option A, a dark operations console, and two independent reviews folded in the best parts of the others:
  - **Booking from anywhere:** topic chips in the hero, a header button, a floating button on phones and a closing booking band. The form opens with the chosen topic already selected.
  - **Live project versions:** the hero's System Monitor shows them, and clicking a row opens that project's details. Firewall Monitor's server and collector share one row, and every row and version pill is the same size.
  - **Project details:** they open in native dialogs with an architecture flow written as text, so it can be translated and read by screen readers.
  - **Shorter hero copy**, a certifications strip, the resume timeline, one AI spec panel, an FAQ grouped into AI lab, Booking and Community, and the IRC details.
  - Dark only. Every fact comes from the existing site copy.
- **SignArtSaver** is labelled a game plugin, not a game server.
- **Fonts** (Space Grotesk, IBM Plex Sans, JetBrains Mono) are self-hosted under `assets/fonts/`. The page makes no Google Fonts request.

### Added
- **WiFi Doctor** as the fourth project, with its own details dialog, links to wifi-doctor.technicallabs.org and its early-access form, and a System Monitor row showing "Early access". Its repository is private, so no version is shown.
- **190 new translation keys** in all 10 languages. The new language picker uses `js/i18n.js`, which stays the only owner of the chosen language through the new `window.setLanguage()`.
- **A custom 404 page.** nginx serves it for any missing path (`error_page 404 /404.html`), and its links are root-absolute so it also works on nested paths.
- **Google Analytics events:** a project's details opened, language changed, booking started, a booking sent (`generate_lead`) and a booking error. The tag and its local-development switch are unchanged.

### Removed
- Every line asking visitors to contact the owner for access to the AI or the labs, including the "How do I get access?" FAQ.
- The light/dark toggle and the multi-step booking wizard. Booking is now one form with inline checks, a 12-second timeout, and a pre-filled email fallback if sending fails.

### Fixed
- The Docker build now also stamps `?v=` in `404.html` and `style.css`, so the font URLs carry the build id. `tasks/` is kept out of the image, so planning notes are not served.

## [1.0.10] - 2026-11-07

### Changed
- **TechLabs connector URL** in the `/ai/` guide is now `https://mcp.technicallabs.org/mcp`, on the standard HTTPS port through Cloudflare. The Claude app's servers never connect to port 8443, so the direct address from 1.0.9 worked only for Claude Code. Verified on 2026-11-07: a full Claude app connect from a phone hotspot (sign-in, token, tool calls up to 75 s), and a 201-second tool call through Cloudflare. The connector sends a progress update every 10 seconds, so Cloudflare's 100-second limit doesn't cut long answers. Claude Code uses the same address.

## [1.0.9] - 2026-11-07

### Added
- **"Connector: connect and test" section** in the `/ai/` guide (`#connector`, linked from the page menu): steps for the Claude app and for Claude Code (`claude mcp add --transport http`, then `/mcp` and Authenticate), a test prompt with the expected answer, and fixes for the four errors people can hit. The error wording matches the sign-in page exactly.

### Changed
- **TechLabs connector URL** is now `https://llm.technicallabs.org:8443/mcp`, served directly with no Cloudflare in the path, so long tool calls are not cut off at Cloudflare's 100-second limit. It works from any network; every connection signs in with a personal key. This replaces the Cloudflare address from 1.0.8 at the owner's request. Claude's servers did not connect to port 8443 in a Nov 6 test, so the guide asks testers to send the error text if the Claude app can't connect; Claude Code connects from the person's own computer and is not affected.
- The "Using the Claude app?" box no longer says there is no connector. It points to the new section.
- Long connector addresses wrap inside their cards on phones instead of widening the page.

## [1.0.8] - 2026-11-06

### Fixed
- **The mobile menu never opened.** `app.js` toggles `.mobile-active` on `.nav-container` (the parent of `<nav>` and of the burger button), but the CSS revealed the menu only for `nav.mobile-active`, so tapping the burger did nothing on screens up to 768px. The burger's X animation used the same wrong selector (the button is not inside `<nav>`). Both rules now target `.nav-container.mobile-active`.
- **`/ai` redirected through plain http.** Nginx sees only http behind nginx-proxy-manager and Cloudflare, so its directory redirect pointed at `http://technicallabs.org/ai/` and the browser took an extra hop back to https. `absolute_redirect off` makes redirects relative (`Location: /ai/`), so they keep the scheme and host the visitor used.

### Changed
- **TechLabs connector URL** in the `/ai/` guide is now `https://mcp.technicallabs.org/techlabs/mcp`. Claude's custom connectors never connected to the old address on port 8443; the new hostname serves the connector on the standard HTTPS port through Cloudflare.
- The burger button now reports its state to assistive technology: `aria-controls="nav-menu"` and an `aria-expanded` value that `app.js` keeps in sync when the menu opens, closes, or a menu link is chosen.

## [1.0.7] - 2026-11-06

### Added
- **Technical Labs AI guide at `/ai/`.** A standalone page for testers of our self-hosted AI models (Ornith-1.5-122B, Ornith-1.5-35B, Qwen3.8-27B TURBO on an ASUS Ascent GX10): the two setups and when each one wins, measured team-job results for 1 to 6 people at once, a minute-by-minute example job, the full model catalog with exact builds, and ready-to-copy settings for OpenCode and Claude Code. A "For companies" section explains how a Claude Team/Enterprise Owner adds the TechLabs connector and how staff connect with their own key. Served by the existing Nginx `location /` rule (`/ai/` resolves to `ai/index.html`, revalidated like every HTML document); no server changes.
- **FAQ section** on the home page (`#faq`), with three questions: what Technical Labs AI is, how to connect to it (a button links to `/ai/#connect`), and how to get access. Native `<details>` elements, so it works without JavaScript and is keyboard accessible.
- `FAQ` links in the header navigation and the footer navigation. Between 769px and 1100px the header hides its FAQ link (it stays in the footer and on the page), and from 769px to 960px the header text and gaps shrink slightly, so the bar stays on one line in every language; nav labels and the logo no longer wrap onto two lines.
- New `faq` translation group (9 keys) and `nav.faq` across all ten locales. All ten locales are at full key parity: 152 keys each, no drift.

## [1.0.6] - 2026-08-29

### Added
- **Community card for the public IRC server**, in the Services section directly beneath the scheduler — the scheduler sells booked time, so this offers the free way to reach us. Shows the server (`irc.technicallabs.org`), the TLS port (6697) and the main channel (`#technicallabs`), with a primary call to action opening the existing Lounge web client at <https://irc.technicallabs.org/> in a new tab. All details were read from the server's own MOTD and ISUPPORT rather than hand-written, so they match what the network actually advertises.
- New `irc` translation group (7 keys) across all ten locales.

### Fixed
- **The System Monitor HUD was showing stale hardcoded versions instead of live ones.** All three resolution tiers were failing through to the same static constants, so the rows had frozen at Vinylfo v0.16.12 / Firewall server v0.11.122 / Firewall collector v1.3.16 while the real releases had moved to v0.16.13 / v0.11.233 / v1.3.44. Two independent causes:
  - The Nginx `/api/github/` proxy injected `Authorization: token <credential>`, and the running container's credential was missing or expired, so every proxied call returned `401 Bad credentials`.
  - `scripts/fetch-versions.js` gated its HTTP path behind an auth check, so a credential-less build skipped straight to the `gh` CLI — which does not exist in the `node:20-alpine` builder stage. Every image build therefore baked the hardcoded fallbacks into `assets/versions.json`.
- **Switching language wiped three of the four HUD rows.** `js/i18n.js` re-translates every `[data-i18n]` node on change, and only the Vinylfo row was restored afterwards, so the other three reverted to "Fetching version..." permanently. Resolved rows now drop their `data-i18n` attribute once they own their text.
- The `/tags` fallback returned the most recently *created* tag, which for Vinylfo is a pre-release (`v0.16.16-alpha.26`). Pre-release tags are now skipped, since these rows are labelled "Stable".
- **Services & Custom Mentorship: the two columns were not spaced to match.** `.services-layout` used `align-items: start`, so the three service cards kept their natural height and the left column finished 59px above the scheduler card, leaving a ragged edge. The grid now stretches and the cards share the column height evenly (`flex: 1`), so both sides start and end level with the 2rem gaps between cards unchanged. Service card padding was raised from 2rem to 2.5rem to match the scheduler, so copy on both sides sits at the same inset, and card content is vertically centred rather than pinned to the top. Below 1024px the section stacks into one column, where cards revert to content height and 2rem padding — the stacked layout is unchanged.
- Backfilled five strings that were present only in English and silently falling back for every other language: `projects.runs_on`, `projects.built_for`, `projects.deployed_with` (added with the platform badges in 1.0.4) and `scheduler.sending`, `scheduler.error` (added with the SMTP booking form). All ten locales are now at full key parity — 142 keys each, no drift in either direction.

### Changed
- All four repositories are public, so version lookups no longer use any credential. The browser queries `api.github.com` directly (the REST API sends `Access-Control-Allow-Origin: *`), which means versions refresh without a redeploy and there is no secret left to rotate or expire.
- Resolved versions are cached in `sessionStorage` for 30 minutes, so repeat views cost no requests against GitHub's 60/hour unauthenticated per-IP budget. Only a complete result is cached, so a partial failure retries on the next load.
- `loadSystemMonitor` now drives all four rows from one `HUD_ROWS` table instead of repeating the same four assignments across three fallback branches.
- `scripts/fetch-versions.js` always attempts the unauthenticated HTTP fetch first; a token remains optional and only raises the build-time rate limit.

### Removed
- The `location ^~ /api/github/` block in `nginx.conf.template`. Nothing calls it now, and as written it was an unauthenticated open proxy to the GitHub API for any visitor.
- The runtime credential passthrough on the `website` service in `docker-compose.yml` — Nginx no longer needs it. The build arg is retained.

## [1.0.5] - 2026-07-19

### Changed
- Rust Game Plugin card now uses the **official Rust game logo** (`rust-marque` brand mark from files.facepunch.com), inlined with its real brand colours, replacing the placeholder game-controller icon. Still links to rust.facepunch.com.
- Added a `.platform-icon.rust-marque` rule so full-colour brand marks keep their own colours (with slightly rounded corners) instead of inheriting `currentColor`.

## [1.0.4] - 2026-07-19

### Added
- **Platform / technology badges on the project cards:**
  - Vinylfo — "Runs on" Windows, macOS, and Linux (inline brand SVGs, official Tux for Linux).
  - Firewall Monitor — "Deployed with" Docker badge.
  - Rust Game Plugin — "Built for" a Rust badge that links out to the Rust game site (rust.facepunch.com).
  - New `.project-platforms` / `.platform-icon` / `.platform-item` / `.platform-name` styles; icons inherit `currentColor` so they adapt to light/dark themes.

### Changed
- Normalized the language name to **"Go"** everywhere (was inconsistently "Go Lang", "Go Language", and "Golang" across the project tags and modals).
- Rust Game Plugin tag corrected from "C# / Rust" to just "C#".

## [1.0.3] - 2026-07-18

### Fixed
- **Stale-cache bug: site updates now take effect without a manual/force refresh.** Previously `index.html` was cacheable and `app.js`/`style.css`/`i18n.js` had no `?v=` cache-busting tag, so browsers (and the Cloudflare edge) kept serving old code after a deploy — which is why the scheduler kept running the old `mailto:` version.

### Changed
- Added `?v=dev` version tags to `style.css`, `js/i18n.js`, and `app.js` in `index.html`; the Docker build stamps these with a unique build id on every deploy, so a new build = a new asset URL.
- New Nginx cache policy (`nginx.conf.template`): HTML and JSON are always revalidated (`no-cache`, cheap 304s), while fingerprinted CSS/JS/font/image assets are cached hard (`max-age=1y, immutable`) — but only when they carry a real build id. A `map` on `$arg_v` keeps `?v=dev` / unversioned requests on `no-cache` so local bind-mount development still hot-reloads without a forced refresh. Marked the GitHub API proxy `^~` so the new static-asset regexes never intercept it.

## [1.0.2] - 2026-07-18

### Added
- **Server-side email delivery for the "Schedule a Session" booking form.** Bookings are now sent from the server over SMTP instead of relying on the visitor's local mail client.
  - New `mailer` service (`server/`): a small zero-framework Node/nodemailer relay exposing `POST /api/schedule` (validates name/email/topic/notes, rate-limits per IP, escapes user input) and `GET /health`.
  - New `server/Dockerfile` and a `mailer` service in `docker-compose.yml`, configured via `SMTP_HOST/PORT/USER/PASS/SECURE` and `MAIL_TO`/`MAIL_FROM` environment variables.
  - Nginx `location = /api/schedule` proxy (`nginx.conf.template`) forwards submissions to the mailer over the internal Docker network, resolving the service name at request time via Docker DNS.
  - New `.env.example` documenting all required variables; `.gitignore` now keeps `.env.example` tracked.

### Changed
- `app.js` scheduler wizard now `fetch`-POSTs the booking to `/api/schedule` (with a "Sending…" state and error handling/retry) instead of opening a `mailto:` link. The recipient (`xphox@xphox.net`) is now server-configured.
- Added `scheduler.sending` and `scheduler.error` strings to the English locale.

## [1.0.1] - 2026-07-18

### Added
- **Multi-language support (i18n)** across the entire site, mirroring the Firewall-Mon website system:
  - New `locales/` directory with 10 language files (EN, DE, ES, FR, IT, PT, RU, JA, KO, ZH), 130 keys each.
  - New `js/i18n.js` controller: lazy-loads locale JSON, deep-merges onto English for full fallback coverage, persists the choice in `localStorage`, honors the browser language on first visit, and updates `<html lang>`.
  - Globe-icon language picker dropdown in the navbar (left of the theme toggle), with matching light/dark styling and a compact icon-only variant on mobile.
  - `data-i18n`, `data-i18n-html`, and `data-i18n-placeholder` attributes wired across the hero, system-monitor HUD, projects, resume/timeline, skills, services, scheduler wizard, footer, and all three project modals.
- **Google Analytics** (gtag.js, property `G-KKV5S28YZS`) in the document head.

### Changed
- `app.js` scheduler wizard buttons ("Continue" / "Schedule Session" / "Back"), the validation alert, and the HUD "Stable" status suffix now resolve through the translator and re-render on language change.
- Fixed a typo in the scheduler topic card: "Docker & Containters" → "Docker & Containers".

## [1.0.0]

### Added
- Initial Technical Labs marketing/portfolio website: hero, live system-monitor HUD with GitHub version fetching, projects showcase with detail modals, resume timeline, skills, and a multi-step booking scheduler.
- Light/dark theme toggle, Nginx GitHub API proxy, and Docker deployment.
