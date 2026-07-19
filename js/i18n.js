/* ==========================================================================
   TECHNICAL LABS INTERNATIONALIZATION (I18N) CONTROLLER
   Mirrors the Firewall-Mon website i18n system: lazy-loaded JSON locales,
   deep-merge fallback onto English, localStorage persistence, and a globe
   dropdown language picker in the navbar.
   ========================================================================== */

(function () {
    const DEFAULT_LANG = 'en';
    const SUPPORTED_LANGS = ['en', 'es', 'fr', 'ja', 'zh', 'de', 'pt', 'ko', 'it', 'ru'];
    const LANG_LABELS = {
        'en': 'EN',
        'es': 'ES',
        'fr': 'FR',
        'ja': 'JA',
        'zh': 'ZH',
        'de': 'DE',
        'pt': 'PT',
        'ko': 'KO',
        'it': 'IT',
        'ru': 'RU'
    };

    let currentTranslations = {};
    let englishTranslations = {};
    let currentLang = DEFAULT_LANG;

    // Helper: Access nested object keys via dot notation
    function getNestedValue(obj, path) {
        if (!path) return undefined;
        const keys = path.split('.');
        let current = obj;
        for (const k of keys) {
            if (current === undefined || current === null) return undefined;
            current = current[k];
        }
        return current;
    }

    // Expose translate globally
    window.t = function (key) {
        const value = getNestedValue(currentTranslations, key);
        if (value !== undefined) return value;

        // Fallback to English
        const fallback = getNestedValue(englishTranslations, key);
        if (fallback !== undefined) return fallback;

        return key;
    };

    // Report the active language for any consumer that needs it
    window.getCurrentLang = function () {
        return currentLang;
    };

    // Deep merge function to merge target translation onto English
    function deepMerge(target, source) {
        const output = Object.assign({}, target);
        if (isObject(target) && isObject(source)) {
            Object.keys(source).forEach(key => {
                if (isObject(source[key])) {
                    if (!(key in target)) {
                        Object.assign(output, { [key]: source[key] });
                    } else {
                        output[key] = deepMerge(target[key], source[key]);
                    }
                } else {
                    Object.assign(output, { [key]: source[key] });
                }
            });
        }
        return output;
    }

    function isObject(item) {
        return (item && typeof item === 'object' && !Array.isArray(item));
    }

    // Fetch and load the given language JSON lazily
    async function loadLanguage(lang) {
        if (!SUPPORTED_LANGS.includes(lang)) {
            lang = DEFAULT_LANG;
        }

        try {
            // 1. Lazy load English reference if not loaded yet
            if (Object.keys(englishTranslations).length === 0) {
                const enRes = await fetch('locales/en.json');
                if (!enRes.ok) throw new Error("Failed to load English base localization.");
                englishTranslations = await enRes.json();
            }

            // 2. Load the target language
            if (lang === 'en') {
                currentTranslations = englishTranslations;
            } else {
                const res = await fetch(`locales/${lang}.json`);
                if (!res.ok) throw new Error(`Could not fetch ${lang} locale file.`);
                const targetTranslations = await res.json();

                // Merge to guarantee full fallback coverage
                currentTranslations = deepMerge(englishTranslations, targetTranslations);
            }

            currentLang = lang;
            localStorage.setItem('lang', lang);

            // 3. Update DOM
            translateDOM();

            // 4. Update picker UI
            updatePickerUI(lang);

            // 5. Notify other scripts (like app.js) that language has changed
            window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));

        } catch (error) {
            console.error("I18n loading failed, defaulting to English:", error);
            currentTranslations = englishTranslations;
            currentLang = 'en';
            translateDOM();
            updatePickerUI('en');
            window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: 'en' } }));
        }
    }

    // Translate all elements with data-i18n attributes
    function translateDOM() {
        // Text / innerHTML content
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translation = window.t(key);

            if (translation !== undefined) {
                if (el.hasAttribute('data-i18n-html')) {
                    el.innerHTML = translation;
                } else {
                    el.textContent = translation;
                }
            }
        });

        // Placeholder attributes (inputs / textareas)
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            const translation = window.t(key);
            if (translation !== undefined) {
                el.setAttribute('placeholder', translation);
            }
        });

        // HTML tag lang attribute update
        document.documentElement.setAttribute('lang', currentLang);
    }

    // Update Language Picker Display
    function updatePickerUI(lang) {
        const activeTextEl = document.getElementById('active-lang-text');
        if (activeTextEl) {
            activeTextEl.textContent = LANG_LABELS[lang] || lang.toUpperCase();
        }

        document.querySelectorAll('.lang-option').forEach(opt => {
            if (opt.getAttribute('data-lang') === lang) {
                opt.classList.add('active');
            } else {
                opt.classList.remove('active');
            }
        });
    }

    // Set up navbar picker events
    function setupLanguagePicker() {
        const container = document.getElementById('lang-picker-container');
        const btn = document.getElementById('lang-picker-btn');

        if (!btn || !container) return;

        // Toggle dropdown open/closed
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            container.classList.toggle('open');
        });

        // Click outside closes dropdown
        document.addEventListener('click', () => {
            container.classList.remove('open');
        });

        // Handle language option clicks
        document.querySelectorAll('.lang-option').forEach(opt => {
            opt.addEventListener('click', (e) => {
                e.stopPropagation();
                const selectedLang = opt.getAttribute('data-lang');
                loadLanguage(selectedLang);
                container.classList.remove('open');
            });
        });
    }

    // Document Ready Initialisation
    document.addEventListener("DOMContentLoaded", () => {
        setupLanguagePicker();

        // Detect saved language, browser language, or fallback to English
        const savedLang = localStorage.getItem('lang');
        const browserLang = navigator.language ? navigator.language.split('-')[0] : DEFAULT_LANG;
        const initialLang = savedLang || browserLang;

        loadLanguage(initialLang);
    });
})();
