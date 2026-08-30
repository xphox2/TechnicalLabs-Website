# Changelog

All notable changes to the Technical Labs website are documented in this file.

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
