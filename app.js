(() => {
  'use strict';

  // Every user-facing string built in JS goes through tt(): production i18n.js
  // installs window.t, and until then the fallback is the English copy.
  const tt = (key, fallback) => {
    const value = typeof window.t === 'function' ? window.t(key) : undefined;
    return value === undefined || value === null || value === key ? fallback : value;
  };

  // Google Analytics: no-op when gtag is absent or disabled (local/dev).
  const track = (name, params) => {
    if (typeof window.gtag !== 'function') return;
    try {
      window.gtag('event', name, params || {});
    } catch (_) {
      /* analytics must never break the page */
    }
  };

  const prefersReducedMotion = () =>
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const scrollBehavior = () => (prefersReducedMotion() ? 'auto' : 'smooth');

  document.addEventListener('DOMContentLoaded', () => {
    initMobileNav();
    initLanguagePicker();
    initDialogs();
    initBookingEntryPoints();
    initSchedulerForm();
    initCopyButtons();
    initScrollReveal();
    initActiveSectionNav();
    initSystemMonitor();
    initBookPill();
  });

  /* --------------------------------------------------------------------------
     1. MOBILE NAVIGATION
     -------------------------------------------------------------------------- */
  function initMobileNav() {
    const header = document.getElementById('site-header');
    const toggle = document.getElementById('mobile-menu-toggle');
    const nav = document.getElementById('primary-nav');
    if (!header || !toggle || !nav) return;

    const setOpen = (open, restoreFocus = false) => {
      header.classList.toggle('nav-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      if (!open && restoreFocus) toggle.focus();
    };

    toggle.addEventListener('click', () => {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => setOpen(false));
    });

    document.addEventListener('click', (e) => {
      if (toggle.getAttribute('aria-expanded') === 'true' && !header.contains(e.target)) {
        setOpen(false);
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false, true);
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 980 && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
      }
    });
  }

  /* --------------------------------------------------------------------------
     2. LANGUAGE PICKER (10 languages)
        js/i18n.js owns the language state (localStorage "lang", locale
        loading, DOM translation). This picker only calls window.setLanguage()
        and mirrors the active language when i18n.js fires `languageChanged`.
        Options use .lang-choice so i18n.js's own .lang-option binding is unused.
     -------------------------------------------------------------------------- */
  function initLanguagePicker() {
    const container = document.getElementById('lang-picker');
    const trigger = document.getElementById('lang-trigger');
    const listbox = document.getElementById('lang-listbox');
    const codeDisplay = document.getElementById('active-lang-code');
    if (!container || !trigger || !listbox || !codeDisplay) return;

    const options = Array.from(listbox.querySelectorAll('.lang-choice'));

    const setMenuOpen = (open, focusTrigger = false) => {
      listbox.hidden = !open;
      trigger.setAttribute('aria-expanded', String(open));
      if (open) {
        const active = listbox.querySelector('.lang-choice.is-active') || options[0];
        if (active) active.focus();
      } else if (focusTrigger) {
        trigger.focus();
      }
    };

    // Mirror the active language in the picker UI (no state of its own)
    const reflectLanguage = (lang) => {
      const opt = options.find((o) => o.dataset.lang === lang) || options[0];
      options.forEach((item) => {
        const selected = item === opt;
        item.classList.toggle('is-active', selected);
        item.setAttribute('aria-selected', String(selected));
        item.setAttribute('tabindex', selected ? '0' : '-1');
      });
      codeDisplay.textContent = opt.dataset.code || (opt.dataset.lang || 'en').toUpperCase();
    };

    const applyLanguage = (opt) => {
      const lang = opt.dataset.lang || 'en';
      if (typeof window.setLanguage === 'function') {
        window.setLanguage(lang);
      } else {
        // i18n.js missing (e.g. 404 page): keep the picker consistent anyway
        reflectLanguage(lang);
      }
    };

    window.addEventListener('languageChanged', (e) => {
      reflectLanguage(e.detail && e.detail.lang ? e.detail.lang : 'en');
      track('language_change', { language: e.detail && e.detail.lang });
      track('select_content', { content_type: 'language', item_id: e.detail && e.detail.lang });
    });

    if (typeof window.getCurrentLang === 'function') reflectLanguage(window.getCurrentLang());

    trigger.addEventListener('click', () => {
      setMenuOpen(trigger.getAttribute('aria-expanded') !== 'true');
    });

    options.forEach((opt, idx) => {
      opt.addEventListener('click', () => {
        applyLanguage(opt);
        setMenuOpen(false, true);
      });

      opt.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          options[(idx + 1) % options.length].focus();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          options[(idx - 1 + options.length) % options.length].focus();
        } else if (e.key === 'Home') {
          e.preventDefault();
          options[0].focus();
        } else if (e.key === 'End') {
          e.preventDefault();
          options[options.length - 1].focus();
        } else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          applyLanguage(opt);
          setMenuOpen(false, true);
        }
      });
    });

    document.addEventListener('click', (e) => {
      if (!listbox.hidden && !container.contains(e.target)) setMenuOpen(false);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !listbox.hidden) setMenuOpen(false, true);
    });
  }

  /* --------------------------------------------------------------------------
     3. ARCHITECTURE DIALOGS (native <dialog> + showModal())
        The browser provides the inert background, Escape handling and the
        focus return; we only wire the triggers and the backdrop click.
     -------------------------------------------------------------------------- */
  function initDialogs() {
    const triggers = document.querySelectorAll('[data-modal-open]');
    const dialogs = document.querySelectorAll('dialog.modal');
    if (!triggers.length || !dialogs.length) return;

    const canShowModal = typeof HTMLDialogElement === 'function' &&
      typeof HTMLDialogElement.prototype.showModal === 'function';

    let opener = null;

    const openDialog = (dialog, triggerEl) => {
      if (!dialog || dialog.open) return;
      opener = triggerEl || null;
      if (canShowModal) {
        dialog.showModal();
      } else {
        dialog.setAttribute('open', '');
      }
      const closeBtn = dialog.querySelector('.modal-close');
      if (closeBtn) closeBtn.focus();
      track('select_content', { content_type: 'project', item_id: dialog.id.replace(/^modal-/, '') });
    };

    const closeDialog = (dialog) => {
      if (!dialog || !dialog.open) return;
      if (canShowModal) {
        dialog.close();
      } else {
        dialog.removeAttribute('open');
      }
    };

    triggers.forEach((btn) => {
      btn.addEventListener('click', () => {
        openDialog(document.getElementById(btn.getAttribute('data-modal-open')), btn);
      });
    });

    dialogs.forEach((dialog) => {
      dialog.querySelectorAll('[data-modal-close]').forEach((closeBtn) => {
        closeBtn.addEventListener('click', () => closeDialog(dialog));
      });

      // Clicks on ::backdrop are dispatched to the dialog element itself.
      dialog.addEventListener('click', (e) => {
        if (e.target === dialog) closeDialog(dialog);
      });

      // Belt and braces: browsers restore focus on close, but an opener that
      // was re-rendered or scrolled away still gets it back explicitly.
      dialog.addEventListener('close', () => {
        if (opener && typeof opener.focus === 'function' && document.contains(opener)) {
          opener.focus({ preventScroll: true });
        }
        opener = null;
      });
    });
  }

  /* --------------------------------------------------------------------------
     4. BOOKING ENTRY POINTS
        Hero topic chips and service cards (`data-pick-topic`) pre-select the
        topic; every `[data-book-link]` (header, pill, band, footer, FAQ)
        scrolls to the form. Both land focus on the name field.
     -------------------------------------------------------------------------- */
  function initBookingEntryPoints() {
    const bookingBox = document.getElementById('booking');
    const nameInput = document.getElementById('contact-name');
    if (!bookingBox) return;

    const goToForm = () => {
      bookingBox.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
      if (nameInput) {
        const delay = prefersReducedMotion() ? 0 : 350;
        setTimeout(() => nameInput.focus({ preventScroll: true }), delay);
      }
      if (history.replaceState) history.replaceState(null, '', '#booking');
    };

    document.querySelectorAll('[data-pick-topic]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const topic = btn.getAttribute('data-pick-topic');
        const radio = document.querySelector(`input[name="topic"][value="${topic}"]`);
        if (radio) {
          radio.checked = true;
          radio.dispatchEvent(new Event('change', { bubbles: true }));
        }
        track('begin_booking', { topic, source: btn.classList.contains('topic-chip') ? 'hero_chip' : 'service_card' });
        track('select_content', { content_type: 'scheduler_topic', item_id: topic });
        goToForm();
      });
    });

    document.querySelectorAll('[data-book-link]').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        goToForm();
      });
    });
  }

  /* --------------------------------------------------------------------------
     5. SESSION SCHEDULER / BOOKING FORM
        POST /api/schedule {name, email, topic, notes}; on failure the
        pre-filled mailto becomes the primary action.
     -------------------------------------------------------------------------- */
  function initSchedulerForm() {
    const form = document.getElementById('scheduler-form');
    if (!form) return;

    const fieldsWrap = document.getElementById('scheduler-fields');
    const confirmedWrap = document.getElementById('scheduler-confirmed');
    const confirmedTopic = document.getElementById('confirmed-topic');
    const confirmedEmail = document.getElementById('confirmed-email');
    const resetBtn = document.getElementById('scheduler-reset');

    const nameInput = document.getElementById('contact-name');
    const emailInput = document.getElementById('contact-email');
    const notesInput = document.getElementById('contact-notes');
    const errName = document.getElementById('err-name');
    const errEmail = document.getElementById('err-email');

    const errorBanner = document.getElementById('scheduler-error');
    const mailtoCompose = document.getElementById('scheduler-mailto-compose');
    const submitBtn = document.getElementById('scheduler-submit');
    const submitText = document.getElementById('scheduler-submit-text');

    const REQUEST_TIMEOUT_MS = 12000;

    const topicLabel = (topic) => {
      switch (topic) {
        case 'firewalls_networking':
          return tt('scheduler.card_net_title', 'Firewalls & Networking');
        case 'datacentre_infra':
          return tt('scheduler.card_fw_title', 'Data Centre & Infrastructure');
        case 'automation':
          return tt('scheduler.card_docker_title', 'System & Process Automation');
        case 'development':
          return tt('scheduler.card_dev_title', 'Custom Development');
        default:
          return topic;
      }
    };

    const setFieldError = (input, errEl, message) => {
      if (!input || !errEl) return;
      if (message) {
        input.setAttribute('aria-invalid', 'true');
        errEl.textContent = message;
        errEl.hidden = false;
      } else {
        input.removeAttribute('aria-invalid');
        errEl.textContent = '';
        errEl.hidden = true;
      }
    };

    const isValidEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

    form.querySelectorAll('input[name="topic"]').forEach((radio) => {
      // Only a person's own click counts here: topic chips and service cards
      // set the radio with a synthetic change event and track begin_booking
      // themselves (with their source), so one selection sends one event.
      radio.addEventListener('change', (e) => {
        if (radio.checked && e.isTrusted) track('begin_booking', { topic: radio.value, source: 'form' });
      });
    });

    // Last submission, so the confirmation / mailto can be re-rendered in a new language
    let lastSubmission = null;
    let lastFieldErrors = { name: null, email: null };

    const fillMailto = (sub) => {
      const topicTitle = topicLabel(sub.topic);
      const subject = encodeURIComponent(
        `${tt('scheduler.mail_subject', 'Technical Labs Session Request')} — ${topicTitle}`
      );
      const bodyLines = [
        `${tt('scheduler.name_label', 'Full Name')}: ${sub.name}`,
        `${tt('scheduler.email_label', 'Email Address')}: ${sub.email}`,
        `${tt('scheduler.topic_label', 'Topic')}: ${topicTitle} (${sub.topic})`,
        '',
        `${tt('scheduler.notes_label', 'Project Notes')}: ${sub.notes || tt('scheduler.notes_none', '(none provided)')}`
      ];
      if (mailtoCompose) {
        mailtoCompose.href = `mailto:xphox@xphox.net?subject=${subject}&body=${encodeURIComponent(bodyLines.join('\n'))}`;
      }
    };

    const fieldMessage = (which) => {
      const kind = lastFieldErrors[which];
      if (!kind) return '';
      if (kind === 'name') return tt('scheduler.err_name', 'Please enter your full name.');
      if (kind === 'email') return tt('scheduler.err_email', 'Please enter your email address.');
      return tt('scheduler.err_email_format', 'Please enter a valid email address.');
    };

    window.addEventListener('languageChanged', () => {
      if (lastSubmission) {
        confirmedTopic.textContent = topicLabel(lastSubmission.topic);
        fillMailto(lastSubmission);
      }
      if (lastFieldErrors.name) setFieldError(nameInput, errName, fieldMessage('name'));
      if (lastFieldErrors.email) setFieldError(emailInput, errEmail, fieldMessage('email'));
      if (!submitBtn.disabled) submitText.textContent = tt('scheduler.schedule', 'Schedule Session');
    });

    nameInput.addEventListener('input', () => {
      if (nameInput.value.trim()) {
        lastFieldErrors.name = null;
        setFieldError(nameInput, errName, '');
      }
    });

    emailInput.addEventListener('input', () => {
      if (isValidEmail(emailInput.value.trim())) {
        lastFieldErrors.email = null;
        setFieldError(emailInput, errEmail, '');
      }
    });

    const postWithTimeout = (payload) => {
      const controller = typeof AbortController === 'function' ? new AbortController() : null;
      const timer = controller ? setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS) : null;
      return fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller ? controller.signal : undefined
      }).finally(() => {
        if (timer) clearTimeout(timer);
      });
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorBanner.hidden = true;

      const name = nameInput.value.trim();
      const email = emailInput.value.trim();
      const notes = notesInput ? notesInput.value.trim() : '';
      const checkedTopic = form.querySelector('input[name="topic"]:checked');
      const topic = checkedTopic ? checkedTopic.value : 'firewalls_networking';

      let firstInvalid = null;

      lastFieldErrors = { name: name ? null : 'name', email: !email ? 'email' : !isValidEmail(email) ? 'format' : null };
      setFieldError(nameInput, errName, fieldMessage('name'));
      setFieldError(emailInput, errEmail, fieldMessage('email'));
      if (lastFieldErrors.name) firstInvalid = nameInput;
      else if (lastFieldErrors.email) firstInvalid = emailInput;

      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      submitBtn.disabled = true;
      submitText.textContent = tt('scheduler.sending', 'Sending…');

      try {
        const res = await postWithTimeout({ name, email, topic, notes });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        lastSubmission = { name, email, topic, notes };
        confirmedTopic.textContent = topicLabel(topic);
        confirmedEmail.textContent = email;
        fieldsWrap.hidden = true;
        confirmedWrap.hidden = false;
        confirmedWrap.focus();
        form.reset();
        track('generate_lead', { topic });
      } catch (err) {
        lastSubmission = { name, email, topic, notes };
        fillMailto(lastSubmission);
        errorBanner.hidden = false;
        if (mailtoCompose) mailtoCompose.focus({ preventScroll: true });
        track('booking_error', { topic, reason: err && err.name === 'AbortError' ? 'timeout' : String((err && err.message) || 'network') });
      } finally {
        submitBtn.disabled = false;
        submitText.textContent = tt('scheduler.schedule', 'Schedule Session');
      }
    });

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        lastSubmission = null;
        confirmedWrap.hidden = true;
        errorBanner.hidden = true;
        fieldsWrap.hidden = false;
        nameInput.focus();
      });
    }
  }

  /* --------------------------------------------------------------------------
     6. COPY-TO-CLIPBOARD (IRC SERVER)
     -------------------------------------------------------------------------- */
  function initCopyButtons() {
    document.querySelectorAll('[data-copy]').forEach((btn) => {
      const label = btn.querySelector('.btn-copy-text') || btn;
      const original = label.textContent;

      btn.addEventListener('click', async () => {
        const value = btn.getAttribute('data-copy');
        if (!value) return;

        let copied = false;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          try {
            await navigator.clipboard.writeText(value);
            copied = true;
          } catch (_) {
            copied = false;
          }
        }

        if (!copied) {
          const area = document.createElement('textarea');
          area.value = value;
          area.setAttribute('readonly', '');
          area.style.position = 'fixed';
          area.style.opacity = '0';
          document.body.appendChild(area);
          area.select();
          try {
            document.execCommand('copy');
            copied = true;
          } catch (_) {
            copied = false;
          }
          document.body.removeChild(area);
        }

        if (copied) {
          label.textContent = tt('irc.copied', 'Copied ✓');
          setTimeout(() => {
            label.textContent = original;
          }, 2200);
        }
      });
    });
  }

  /* --------------------------------------------------------------------------
     7. SCROLL REVEAL (transform only: content is always visible at rest)
     -------------------------------------------------------------------------- */
  function initScrollReveal() {
    const items = document.querySelectorAll('[data-reveal]');
    if (!items.length) return;

    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
      items.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -40px 0px', threshold: 0.05 }
    );

    items.forEach((el) => observer.observe(el));
  }

  /* --------------------------------------------------------------------------
     8. ACTIVE NAVIGATION HIGHLIGHT ON SCROLL
     -------------------------------------------------------------------------- */
  function initActiveSectionNav() {
    const sections = document.querySelectorAll('main section[id]');
    const navLinks = document.querySelectorAll('.primary-nav .nav-link[href^="#"]');
    if (!sections.length || !navLinks.length || typeof IntersectionObserver === 'undefined') return;

    const linkMap = new Map();
    navLinks.forEach((link) => linkMap.set(link.getAttribute('href'), link));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = `#${entry.target.id}`;
          if (!linkMap.has(id)) return;
          navLinks.forEach((l) => {
            l.classList.remove('is-current');
            l.removeAttribute('aria-current');
          });
          const active = linkMap.get(id);
          active.classList.add('is-current');
          active.setAttribute('aria-current', 'true');
        });
      },
      { rootMargin: '-28% 0px -58% 0px', threshold: 0 }
    );

    sections.forEach((sec) => observer.observe(sec));
  }

  /* --------------------------------------------------------------------------
     9. LIVE GITHUB RELEASE TELEMETRY
        One renderer: every element with data-version-for="<key>" gets the
        version (plus " · Stable" when data-stable="true"). Hero rows keep
        their hud-*-status IDs and the tl-hud-versions cache key for
        compatibility with the production app.js.
     -------------------------------------------------------------------------- */
  function initSystemMonitor() {
    const hudRoot = document.getElementById('hero-status-hud');
    if (!hudRoot) return;

    const HUD_ROWS = [
      { id: 'hud-vinylfo-status', key: 'vinyl', repo: 'xphox2/Vinylfo-Releases', baseline: 'v0.16.13', stable: true },
      { id: 'hud-fwmon-server-status', key: 'fw_server', repo: 'xphox2/Firewall-Monitoring', baseline: 'v0.11.233' },
      { id: 'hud-fwmon-collector-status', key: 'fw_collector', repo: 'xphox2/Firewall-Collector', baseline: 'v1.3.44' },
      { id: 'hud-rust-status', key: 'rust_plugin', repo: 'xphox2/SignArtSaver', baseline: 'v0.11.14' }
    ];

    const HUD_CACHE_KEY = 'tl-hud-versions';
    const HUD_CACHE_TTL = 30 * 60 * 1000;
    const isPrerelease = (tag) => /-(?:alpha|beta|rc|pre)/i.test(tag);

    const badge = document.getElementById('ops-status-badge');
    const feedState = document.getElementById('ops-feed-state');
    const sourceLabel = document.getElementById('ops-source-label');

    const SOURCE_TEXT = {
      live: () => tt('hud.source_live', 'Live'),
      cached: () => tt('hud.source_cached', 'Cached'),
      snapshot: () => tt('hud.source_snapshot', 'Snapshot')
    };

    const readVersionCache = () => {
      try {
        const raw = sessionStorage.getItem(HUD_CACHE_KEY);
        if (!raw) return null;
        const { at, versions } = JSON.parse(raw);
        if (!at || Date.now() - at > HUD_CACHE_TTL) return null;
        return versions;
      } catch (_) {
        return null;
      }
    };

    const writeVersionCache = (versions) => {
      try {
        sessionStorage.setItem(HUD_CACHE_KEY, JSON.stringify({ at: Date.now(), versions }));
      } catch (_) {
        /* storage unavailable */
      }
    };

    const fetchVersion = async (repo) => {
      const base = `https://api.github.com/repos/${repo}`;

      try {
        const res = await fetch(`${base}/releases/latest`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.tag_name) return data.tag_name;
        }
      } catch (_) {
        /* fall back to tags */
      }

      try {
        const res = await fetch(`${base}/tags`);
        if (res.ok) {
          const tags = await res.json();
          if (Array.isArray(tags)) {
            const stable = tags.find((t) => t && t.name && !isPrerelease(t.name));
            if (stable) return stable.name;
          }
        }
      } catch (_) {
        /* fall back to snapshot */
      }

      return null;
    };

    // The single place a version number is written into the page.
    const renderVersion = (key, version, live) => {
      document.querySelectorAll(`[data-version-for="${key}"]`).forEach((el) => {
        const stable = el.getAttribute('data-stable') === 'true';
        el.removeAttribute('data-i18n');
        el.dataset.version = version;
        el.textContent = stable ? `${version} · ${tt('hud.stable', 'Stable')}` : version;
        el.classList.toggle('is-live', Boolean(live));
        // Labelled pills ("server v0.11.x") keep the label outside the rendered span.
        const pill = el.closest('.ops-version-pill');
        if (pill && pill !== el) pill.classList.toggle('is-live', Boolean(live));
      });
    };

    const renderState = (state) => {
      const label = (SOURCE_TEXT[state] || SOURCE_TEXT.snapshot)();
      if (badge) badge.dataset.state = state;
      if (feedState) {
        feedState.removeAttribute('data-i18n');
        feedState.textContent = label;
      }
      if (sourceLabel) {
        sourceLabel.textContent = `${label} // ${tt('hud.repos', '4 repos')}`;
      }
    };

    let lastVersions = {};
    let lastState = 'pending';

    const renderAll = (versions, state) => {
      lastVersions = versions;
      lastState = state;
      HUD_ROWS.forEach((row) => {
        renderVersion(row.key, versions[row.key] || row.baseline, Boolean(versions[row.key]));
      });
      renderState(state);
    };

    const loadVersions = async () => {
      const cached = readVersionCache();
      if (cached) {
        renderAll(cached, 'cached');
        return;
      }

      const resolved = await Promise.all(HUD_ROWS.map((row) => fetchVersion(row.repo)));
      const versions = {};
      HUD_ROWS.forEach((row, idx) => {
        if (resolved[idx]) versions[row.key] = resolved[idx];
      });

      if (Object.keys(versions).length === HUD_ROWS.length) {
        writeVersionCache(versions);
        renderAll(versions, 'live');
        return;
      }

      try {
        const res = await fetch('assets/versions.json?v=dev');
        if (res.ok) {
          const snapshot = await res.json();
          HUD_ROWS.forEach((row) => {
            if (!versions[row.key] && snapshot && snapshot[row.key]) {
              versions[row.key] = snapshot[row.key];
            }
          });
        }
      } catch (_) {
        /* static baselines cover remaining keys */
      }

      renderAll(versions, 'snapshot');
    };

    loadVersions();

    // Re-render the translated parts ("Stable", source label) on language change.
    window.addEventListener('languageChanged', () => {
      if (lastState !== 'pending') renderAll(lastVersions, lastState);
    });
  }

  /* --------------------------------------------------------------------------
     10. FLOATING "BOOK A SESSION" PILL (phones only)
         Shown only while neither the hero nor the booking form is on screen.
     -------------------------------------------------------------------------- */
  function initBookPill() {
    const pill = document.getElementById('book-pill');
    const hero = document.getElementById('hero');
    const booking = document.getElementById('booking');
    if (!pill || !hero || !booking || typeof IntersectionObserver === 'undefined') return;

    let heroVisible = true;
    let bookingVisible = false;

    const update = () => {
      pill.classList.toggle('is-shown', !heroVisible && !bookingVisible);
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.target === hero) heroVisible = entry.isIntersecting;
        if (entry.target === booking) bookingVisible = entry.isIntersecting;
      });
      update();
    });

    observer.observe(hero);
    observer.observe(booking);
  }
})();
