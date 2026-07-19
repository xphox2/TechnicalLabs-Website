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
  const fetchLatestVersion = async (repo) => {
    try {
      // 1. Try to fetch the latest official release first
      let response = await fetch(`https://api.github.com/repos/${repo}/releases/latest`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.tag_name) {
          return data.tag_name;
        }
      }
      
      // 2. Fallback to tags if no official release is set up
      response = await fetch(`https://api.github.com/repos/${repo}/tags`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          return data[0].name;
        }
      }
      return 'v1.0.0'; // Fallback default
    } catch (e) {
      console.error(`Error querying GitHub version for ${repo}:`, e);
      return 'Offline';
    }
  };

  const loadSystemMonitor = async () => {
    const vinylEl = document.getElementById('hud-vinylfo-status');
    const fwmonEl = document.getElementById('hud-fwmon-status');
    const rustEl = document.getElementById('hud-rust-status');

    // Fetch and display Vinyl Music (xphox2/Vinyl-Release)
    if (vinylEl) {
      const vVer = await fetchLatestVersion('xphox2/Vinyl-Release');
      vinylEl.textContent = `${vVer} • Stable`;
      vinylEl.classList.add('emerald');
    }

    // Fetch and display Firewall Monitor (Server & Collector)
    if (fwmonEl) {
      const serverVer = await fetchLatestVersion('xphox2/Firewall-Monitoring');
      const collectorVer = await fetchLatestVersion('xphox2/Firewall-Collector');
      fwmonEl.textContent = `Server: ${serverVer} • Collector: ${collectorVer}`;
      fwmonEl.classList.add('active');
    }

    // Fetch and display Rust Game Plugin (xphox2/SignArtSaver)
    if (rustEl) {
      const rustVer = await fetchLatestVersion('xphox2/SignArtSaver');
      rustEl.textContent = rustVer;
      rustEl.classList.add('active');
    }
  };

  // Run on load
  loadSystemMonitor();

});
