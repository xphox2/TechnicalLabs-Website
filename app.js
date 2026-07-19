document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

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
  let selectedTopic = 'networking';

  // Topic Select Card Clicks
  selectCards.forEach(card => {
    card.addEventListener('click', () => {
      selectCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedTopic = card.getAttribute('data-value');
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
      nextBtn.innerHTML = 'Continue <i data-lucide="arrow-right"></i>';
    } else if (currentStep === 2) {
      prevBtn.style.display = 'inline-flex';
      nextBtn.style.display = 'inline-flex';
      nextBtn.innerHTML = 'Schedule Session <i data-lucide="check"></i>';
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

  nextBtn.addEventListener('click', () => {
    if (currentStep === 1) {
      currentStep = 2;
      updateSchedulerUI();
    } else if (currentStep === 2) {
      // Basic validation
      const nameInput = document.getElementById('contact-name');
      const emailInput = document.getElementById('contact-email');
      const notesInput = document.getElementById('contact-notes');
      
      if (!nameInput.value || !emailInput.value) {
        alert('Please fill out your Name and Email address.');
        return;
      }
      
      // Construct subject and body for the email client
      const subjectStr = `Mentorship Booking: ${selectedTopic.charAt(0).toUpperCase() + selectedTopic.slice(1)}`;
      const bodyStr = `Hi Nick,\n\nI would like to book a deployment mentorship session. Here are my details:\n\n` +
                      `- Name: ${nameInput.value}\n` +
                      `- Contact Email: ${emailInput.value}\n` +
                      `- Service Topic: ${selectedTopic.charAt(0).toUpperCase() + selectedTopic.slice(1)}\n\n` +
                      `Project Notes:\n` +
                      `${notesInput.value || 'None'}\n\n` +
                      `Best regards,\n` +
                      `${nameInput.value}`;

      // Open the local mail client pre-filled with details
      window.location.href = `mailto:xphox@xphox.net?subject=${encodeURIComponent(subjectStr)}&body=${encodeURIComponent(bodyStr)}`;

      // Transition to final visually completed step
      currentStep = 3;
      updateSchedulerUI();
      
      // Reset form fields after delay
      setTimeout(() => {
        schedulerForm.reset();
      }, 1000);
    }
  });

  prevBtn.addEventListener('click', () => {
    if (currentStep > 1) {
      currentStep--;
      updateSchedulerUI();
    }
  });


  // --- DYNAMIC GITHUB VERSION FETCHING FOR SYSTEM MONITOR ---
  const loadSystemMonitor = async () => {
    const vinylEl = document.getElementById('hud-vinylfo-status');
    const fwServerEl = document.getElementById('hud-fwmon-server-status');
    const fwCollectorEl = document.getElementById('hud-fwmon-collector-status');
    const rustEl = document.getElementById('hud-rust-status');

    try {
      // Fetch local compiled versions (securely parsed by pre-build node task)
      const response = await fetch('assets/versions.json');
      if (response.ok) {
        const versions = await response.json();
        
        if (vinylEl && versions.vinyl) {
          vinylEl.textContent = `${versions.vinyl} • Stable`;
          vinylEl.classList.add('emerald');
        }
        if (fwServerEl && versions.fw_server) {
          fwServerEl.textContent = versions.fw_server;
          fwServerEl.classList.add('active');
        }
        if (fwCollectorEl && versions.fw_collector) {
          fwCollectorEl.textContent = versions.fw_collector;
          fwCollectorEl.classList.add('active');
        }
        if (rustEl && versions.rust_plugin) {
          rustEl.textContent = versions.rust_plugin;
          rustEl.classList.add('active');
        }
        return;
      }
    } catch (e) {
      console.warn('Failed to load local versions.json, falling back to public GitHub queries:', e);
    }

    // FALLBACK: Query public repositories directly
    const fetchPublicVersion = async (repo) => {
      try {
        const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`);
        if (res.ok) {
          const d = await res.json();
          if (d && d.tag_name) return d.tag_name;
        }
        const tagRes = await fetch(`https://api.github.com/repos/${repo}/tags`);
        if (tagRes.ok) {
          const tags = await tagRes.json();
          if (tags && tags.length > 0) return tags[0].name;
        }
      } catch (e) {
        console.error(e);
      }
      return 'v1.0.0';
    };

    if (vinylEl) {
      vinylEl.textContent = 'v0.16.12 • Stable';
      vinylEl.classList.add('emerald');
    }
    if (fwServerEl) {
      fwServerEl.textContent = 'v0.11.122';
      fwServerEl.classList.add('active');
    }
    if (fwCollectorEl) {
      fwCollectorEl.textContent = 'v1.3.16';
      fwCollectorEl.classList.add('active');
    }
    if (rustEl) {
      const rustVer = await fetchPublicVersion('xphox2/SignArtSaver');
      rustEl.textContent = rustVer;
      rustEl.classList.add('active');
    }
  };

  // Run on load
  loadSystemMonitor();

});
