document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // i18n helper: use the global translator when available, else fall back
  const tt = (key, fallback) => (typeof window.t === 'function' ? window.t(key) : fallback);

  // --- THEME TOGGLE LOGIC ---
  const themeToggle = document.getElementById('theme-toggle');
  const htmlEl = document.documentElement;

  // Retrieve theme preference or default to dark
  const currentTheme = localStorage.getItem('theme') || 'dark';
  htmlEl.setAttribute('data-theme', currentTheme);

  themeToggle.addEventListener('click', () => {
    const activeTheme = htmlEl.getAttribute('data-theme');
    const newTheme = activeTheme === 'dark' ? 'light' : 'dark';
    
    htmlEl.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    // Track theme toggle in Google Analytics
    if (typeof gtag === 'function') {
      gtag('event', 'select_content', {
        content_type: 'theme',
        item_id: newTheme
      });
    }
  });

  // --- MOBILE NAVIGATION BURGER ---
  const mobileToggle = document.getElementById('mobile-menu-toggle');
  const mainHeader = document.getElementById('main-header');
  const navMenu = document.getElementById('nav-menu');

  mobileToggle.addEventListener('click', () => {
    navMenu.parentElement.classList.toggle('mobile-active');
  });

  // Close mobile nav when clicking a menu link
  const navLinks = navMenu.querySelectorAll('a');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navMenu.parentElement.classList.remove('mobile-active');
    });
  });


  // --- PORTFOLIO DETAILS MODAL LOGIC ---
  const detailTriggers = document.querySelectorAll('.project-link[data-modal]');
  const modals = document.querySelectorAll('.modal');
  const modalCloseButtons = document.querySelectorAll('.modal-close-btn');

  detailTriggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const modalId = trigger.getAttribute('data-modal');
      const targetModal = document.getElementById(modalId);
      if (targetModal) {
        targetModal.classList.add('active');
        targetModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden'; // Disable page scrolling

        // Track modal open in Google Analytics
        if (typeof gtag === 'function') {
          gtag('event', 'select_content', {
            content_type: 'portfolio_project',
            item_id: modalId
          });
        }
      }
    });
  });

  const closeModal = (modal) => {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = ''; // Re-enable page scrolling
  };

  modalCloseButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal');
      closeModal(modal);
    });
  });

  // Close modal when clicking outside modal-content
  modals.forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal(modal);
      }
    });
  });

  // Close modal on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      modals.forEach(modal => {
        if (modal.classList.contains('active')) {
          closeModal(modal);
        }
      });
    }
  });


  // --- BACK TO TOP BUTTON LOGIC ---
  const backToTopBtn = document.getElementById('back-to-top-btn');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      backToTopBtn.classList.add('visible');
    } else {
      backToTopBtn.classList.remove('visible');
    }
  });

  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });


  // --- ANIMATE SKILLS ON SCROLL ---
  const skillsGrid = document.getElementById('skills-visual-grid');
  const skillBars = document.querySelectorAll('.skill-bar-inner');
  let animated = false;

  const animateSkills = () => {
    if (animated) return;
    const rect = skillsGrid.getBoundingClientRect();
    const isVisible = (rect.top <= window.innerHeight - 80);

    if (isVisible) {
      skillBars.forEach(bar => {
        const val = bar.getAttribute('data-skill-val');
        bar.style.width = `${val}%`;
      });
      animated = true;
    }
  };

  window.addEventListener('scroll', animateSkills);
  animateSkills(); // Trigger immediately in case it's already in viewport


  // --- MULTI-STEP SCHEDULER WIZARD ---
  const schedulerForm = document.getElementById('scheduler-form');
  const steps = document.querySelectorAll('.scheduler-step-pane');
  const stepIndicators = document.querySelectorAll('.step-indicator');
  const prevBtn = document.getElementById('scheduler-prev-btn');
  const nextBtn = document.getElementById('scheduler-next-btn');
  const selectCards = document.querySelectorAll('.select-card');
  
  let currentStep = 1;
  let selectedTopic = 'firewalls_networking';

  // Topic Select Card Clicks
  selectCards.forEach(card => {
    card.addEventListener('click', () => {
      selectCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedTopic = card.getAttribute('data-value');

      // Track topic selection in Google Analytics
      if (typeof gtag === 'function') {
        gtag('event', 'select_content', {
          content_type: 'scheduler_topic',
          item_id: selectedTopic
        });
      }
    });
  });

  const updateSchedulerUI = () => {
    // Show/hide step panes
    steps.forEach(step => {
      step.classList.remove('active');
      if (parseInt(step.getAttribute('data-step')) === currentStep) {
        step.classList.add('active');
      }
    });

    // Update step header indicator bullets
    stepIndicators.forEach(ind => {
      const stepNum = parseInt(ind.getAttribute('data-step'));
      ind.classList.remove('active', 'completed');
      if (stepNum === currentStep) {
        ind.classList.add('active');
      } else if (stepNum < currentStep) {
        ind.classList.add('completed');
      }
    });

    // Button states
    if (currentStep === 1) {
      prevBtn.style.display = 'none';
      nextBtn.style.display = 'inline-flex';
      nextBtn.innerHTML = `<span data-i18n="scheduler.continue">${tt('scheduler.continue', 'Continue')}</span> <i data-lucide="arrow-right"></i>`;
    } else if (currentStep === 2) {
      prevBtn.style.display = 'inline-flex';
      nextBtn.style.display = 'inline-flex';
      nextBtn.innerHTML = `<span data-i18n="scheduler.schedule">${tt('scheduler.schedule', 'Schedule Session')}</span> <i data-lucide="check"></i>`;
    } else {
      // Completed state (Step 3)
      prevBtn.style.display = 'none';
      nextBtn.style.display = 'none';
    }
    
    // Refresh icons inside buttons if dynamically altered
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  };

  nextBtn.addEventListener('click', async () => {
    if (currentStep === 1) {
      currentStep = 2;
      updateSchedulerUI();

      // Track progress to Step 2 in Google Analytics
      if (typeof gtag === 'function') {
        gtag('event', 'scheduler_progress', {
          step: 2,
          step_name: 'Contact Details',
          topic: selectedTopic
        });
      }
    } else if (currentStep === 2) {
      // Basic validation
      const nameInput = document.getElementById('contact-name');
      const emailInput = document.getElementById('contact-email');
      const notesInput = document.getElementById('contact-notes');
      
      if (!nameInput.value || !emailInput.value) {
        alert(tt('scheduler.validation', 'Please fill out your Name and Email address.'));
        return;
      }

      // Submit the booking to the server-side mail relay (Nginx proxies this
      // to the mailer service, which delivers the request over SMTP).
      const restoreLabel = nextBtn.innerHTML;
      nextBtn.disabled = true;
      nextBtn.innerHTML = `<span>${tt('scheduler.sending', 'Sending…')}</span>`;

      try {
        const res = await fetch('/api/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: nameInput.value,
            email: emailInput.value,
            topic: selectedTopic,
            notes: notesInput.value || ''
          })
        });

        if (!res.ok) {
          throw new Error(`Request failed with status ${res.status}`);
        }

        // Track booking conversion in Google Analytics
        if (typeof gtag === 'function') {
          gtag('event', 'generate_lead', {
            topic: selectedTopic
          });
        }

        // Transition to final visually completed step
        currentStep = 3;
        updateSchedulerUI();

        // Reset form fields after delay
        setTimeout(() => {
          schedulerForm.reset();
        }, 1000);
      } catch (err) {
        console.error('Booking submission failed:', err);
        alert(tt('scheduler.error', 'Sorry, we could not send your request. Please email xphox@xphox.net directly.'));
        // Restore the button so the visitor can retry
        nextBtn.disabled = false;
        nextBtn.innerHTML = restoreLabel;
        if (typeof lucide !== 'undefined') {
          lucide.createIcons();
        }
      }
    }
  });

  prevBtn.addEventListener('click', () => {
    if (currentStep > 1) {
      currentStep--;
      updateSchedulerUI();
    }
  });


  // --- DYNAMIC GITHUB VERSION FETCHING FOR SYSTEM MONITOR ---
  //
  // All four repos are public, so the browser talks to api.github.com directly:
  // no token, no server-side proxy, nothing that can expire. GitHub serves the
  // REST API with `Access-Control-Allow-Origin: *`, so this is a plain
  // cross-origin fetch.
  //
  // Unauthenticated GitHub allows 60 requests/hour per client IP and a page load
  // costs four, so a sessionStorage cache keeps repeat views free. If GitHub is
  // unreachable or that budget is spent, we fall back to assets/versions.json
  // (regenerated at image build time by scripts/fetch-versions.js), and finally
  // to the baselines below.
  const HUD_ROWS = [
    { id: 'hud-vinylfo-status',         key: 'vinyl',        repo: 'xphox2/Vinylfo-Releases',    baseline: 'v0.16.13', stable: true },
    { id: 'hud-fwmon-server-status',    key: 'fw_server',    repo: 'xphox2/Firewall-Monitoring', baseline: 'v0.11.233' },
    { id: 'hud-fwmon-collector-status', key: 'fw_collector', repo: 'xphox2/Firewall-Collector',  baseline: 'v1.3.44' },
    { id: 'hud-rust-status',            key: 'rust_plugin',  repo: 'xphox2/SignArtSaver',        baseline: 'v0.11.14' }
  ];

  const HUD_CACHE_KEY = 'tl-hud-versions';
  const HUD_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  // A tag like v0.16.16-alpha.26 sorts newer than the newest *release*, but these
  // rows are labelled "Stable", so a pre-release is never the right answer.
  const isPrerelease = (tag) => /-(?:alpha|beta|rc|pre)/i.test(tag);

  const readVersionCache = () => {
    try {
      const raw = sessionStorage.getItem(HUD_CACHE_KEY);
      if (!raw) return null;
      const { at, versions } = JSON.parse(raw);
      if (!at || Date.now() - at > HUD_CACHE_TTL) return null;
      return versions;
    } catch (e) {
      return null; // private mode, storage disabled, or a malformed entry
    }
  };

  const writeVersionCache = (versions) => {
    try {
      sessionStorage.setItem(HUD_CACHE_KEY, JSON.stringify({ at: Date.now(), versions }));
    } catch (e) {
      // Storage unavailable — the fetch still succeeded, so this is not fatal.
    }
  };

  // Latest published release, falling back to the newest non-prerelease tag for
  // repos that tag but never cut releases.
  const fetchVersion = async (repo) => {
    const base = `https://api.github.com/repos/${repo}`;

    try {
      const res = await fetch(`${base}/releases/latest`);
      if (res.ok) {
        const d = await res.json();
        if (d && d.tag_name) return d.tag_name;
      }
    } catch (e) {}

    try {
      const res = await fetch(`${base}/tags`);
      if (res.ok) {
        const tags = await res.json();
        if (Array.isArray(tags)) {
          const stable = tags.find((t) => t && t.name && !isPrerelease(t.name));
          if (stable) return stable.name;
        }
      }
    } catch (e) {}

    return null;
  };

  const renderHud = (versions) => {
    HUD_ROWS.forEach((row) => {
      const el = document.getElementById(row.id);
      if (!el) return;
      const version = versions[row.key] || row.baseline;

      // i18n.js re-translates every [data-i18n] node on language change, which
      // would otherwise stamp "Fetching version..." back over a resolved number.
      // Drop the attribute now that this row owns its own text.
      el.removeAttribute('data-i18n');
      el.dataset.version = version;
      el.textContent = row.stable ? `${version} • ${tt('hud.stable', 'Stable')}` : version;
      el.classList.add('emerald');
    });
  };

  const loadSystemMonitor = async () => {
    const cached = readVersionCache();
    if (cached) {
      renderHud(cached);
      return;
    }

    // 1. Live from GitHub.
    const resolved = await Promise.all(HUD_ROWS.map((row) => fetchVersion(row.repo)));
    const versions = {};
    HUD_ROWS.forEach((row, i) => {
      if (resolved[i]) versions[row.key] = resolved[i];
    });

    // Only cache a complete answer, so a partial failure retries on the next load.
    if (Object.keys(versions).length === HUD_ROWS.length) {
      writeVersionCache(versions);
      renderHud(versions);
      return;
    }

    // 2. Fill the gaps from the build-time snapshot.
    try {
      const res = await fetch('assets/versions.json');
      if (res.ok) {
        const snapshot = await res.json();
        HUD_ROWS.forEach((row) => {
          if (!versions[row.key] && snapshot[row.key]) versions[row.key] = snapshot[row.key];
        });
      }
    } catch (e) {
      console.warn('Failed to load assets/versions.json; using static baselines:', e);
    }

    // 3. renderHud() supplies the static baseline for anything still missing.
    renderHud(versions);
  };

  // Run on load
  loadSystemMonitor();


  // --- RE-RENDER DYNAMIC CONTENT ON LANGUAGE CHANGE ---
  // i18n.js translates all [data-i18n] nodes, but scheduler buttons and the
  // HUD status suffix are built imperatively, so refresh them here.
  window.addEventListener('languageChanged', (e) => {
    updateSchedulerUI();

    const vinylEl = document.getElementById('hud-vinylfo-status');
    if (vinylEl && vinylEl.dataset.version) {
      vinylEl.textContent = `${vinylEl.dataset.version} • ${tt('hud.stable', 'Stable')}`;
    }

    // Track language selection in Google Analytics
    if (typeof gtag === 'function') {
      const selectedLang = e.detail && e.detail.lang;
      if (selectedLang) {
        gtag('event', 'select_content', {
          content_type: 'language',
          item_id: selectedLang
        });
      }
    }
  });

});
