# Changelog

All notable changes to the Technical Labs website are documented in this file.

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
