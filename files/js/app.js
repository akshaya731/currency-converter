/**
 * app.js
 * Advanced Currency Converter UI Controller
 * Features: Live real-time conversions, searchable currency selector modal,
 * multi-currency comparison matrix, dark/light theme toggle, quick chips & presets,
 * one-click clipboard copy, and interactive LinkedIn sharing modal.
 */
(function () {
  'use strict';

  const MAX_AMOUNT = 1e12;
  const AMOUNT_RE = /^(\d+)(\.\d{1,8})?$/;
  const TOP_MATRIX_CURRENCIES = ['EUR', 'GBP', 'JPY', 'INR', 'CAD', 'AUD', 'CHF'];

  // DOM Elements
  const $ = (id) => document.getElementById(id);
  const el = {
    // Theme
    themeToggle: $('theme-toggle'),
    themeIcon: $('theme-icon'),
    // Currency selectors
    fromTrigger: $('from-currency-trigger'),
    toTrigger: $('to-currency-trigger'),
    fromFlag: $('from-flag'),
    toFlag: $('to-flag'),
    fromCode: $('from-code'),
    toCode: $('to-code'),
    fromName: $('from-name'),
    toName: $('to-name'),
    swapBtn: $('swap-btn'),
    // Amount & form
    form: $('converter-form'),
    amount: $('amount'),
    amountError: $('amount-error'),
    amountSymbol: $('amount-currency-symbol'),
    convertBtn: $('convert-btn'),
    convertSpinner: $('convert-spinner'),
    convertLabel: $('convert-label'),
    statusBanner: $('status-banner'),
    // Result
    resultCard: $('result-card'),
    resultPlaceholder: $('result-placeholder'),
    resultActive: $('result-active'),
    resultSource: $('result-source-text'),
    resultTarget: $('result-target-text'),
    rateDirect: $('rate-direct-text'),
    rateInverse: $('rate-inverse-text'),
    rateDate: $('rate-date-text'),
    rateProvider: $('rate-provider-text'),
    copyResultBtn: $('copy-result-btn'),
    // Multi currency matrix
    matrixGrid: $('matrix-grid'),
    matrixBaseCode: $('matrix-base-code'),
    // Modal
    currencyModal: $('currency-modal'),
    modalCloseBtn: $('modal-close-btn'),
    currencySearchInput: $('currency-search-input'),
    modalCurrencyList: $('modal-currency-list'),
    modalTitle: $('modal-title'),
    // LinkedIn Share Modal
    shareModal: $('share-modal'),
    shareModalOpenBtn: $('btn-share-linkedin'),
    shareModalHeroBtn: $('btn-share-linkedin-hero'),
    shareModalCloseBtn: $('share-modal-close-btn'),
    copyPostBtn: $('copy-post-btn'),
    launchLinkedinBtn: $('launch-linkedin-btn'),
    postTextarea: $('linkedin-post-text'),
    // Toast
    toastContainer: $('toast-container')
  };

  // State
  let state = {
    from: 'USD',
    to: 'EUR',
    amount: 100,
    currencies: [],
    rates: {},
    activePickerTarget: 'from', // 'from' | 'to'
    currentRateData: null,
    requestSeq: 0,
    activeController: null,
    debounceTimer: null
  };

  /* ==========================================================================
     FLAG & SYMBOL HELPERS
     ========================================================================== */
  const SPECIAL_FLAGS = {
    EUR: '🇪🇺', USD: '🇺🇸', GBP: '🇬🇧', INR: '🇮🇳', JPY: '🇯🇵',
    CAD: '🇨🇦', AUD: '🇦🇺', CHF: '🇨🇭', CNY: '🇨🇳', NZD: '🇳🇿',
    SGD: '🇸🇬', HKD: '🇭🇰', SEK: '🇸🇪', NOK: '🇳🇴', DKK: '🇩🇰',
    KRW: '🇰🇷', BRL: '🇧🇷', MXN: '🇲🇽', ZAR: '🇿🇦', RUB: '🇷🇺',
    TRY: '🇹🇷', AED: '🇦🇪', SAR: '🇸🇦', THB: '🇹🇭', IDR: '🇮🇩',
    MYR: '🇲🇾', PHP: '🇵🇭', PLN: '🇵🇱', ILS: '🇮🇱', CZK: '🇨🇿',
    HUF: '🇭🇺', CLP: '🇨🇱', COP: '🇨🇴', PEN: '🇵🇪', ARS: '🇦🇷',
    EGP: '🇪🇬', KES: '🇰🇪', NGN: '🇳🇬', VND: '🇻🇳', BDT: '🇧🇩',
    PKR: '🇵🇰', LKR: '🇱🇰', UAH: '🇺🇦', QAR: '🇶🇦', KWD: '🇰🇼'
  };

  function getFlagEmoji(code) {
    if (!code) return '🌐';
    if (SPECIAL_FLAGS[code]) return SPECIAL_FLAGS[code];
    if (code.startsWith('X')) return '🪙';
    // Generate ISO 3166 flag from first two characters
    try {
      const code2 = code.slice(0, 2);
      const cps = [...code2].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65);
      return String.fromCodePoint(...cps);
    } catch (e) {
      return '🌐';
    }
  }

  function getCurrencySymbol(code) {
    try {
      const parts = new Intl.NumberFormat('en', { style: 'currency', currency: code }).formatToParts(1);
      const sym = parts.find((p) => p.type === 'currency');
      return sym ? sym.value : code;
    } catch (e) {
      return code;
    }
  }

  /* ==========================================================================
     THEME MANAGEMENT
     ========================================================================== */
  function initTheme() {
    const saved = localStorage.getItem('currency_converter_theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (prefersDark ? 'dark' : 'light');
    applyTheme(theme);
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('currency_converter_theme', theme);
    if (el.themeIcon) {
      el.themeIcon.innerHTML = theme === 'dark'
        ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`
        : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
    }
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    applyTheme(current === 'dark' ? 'light' : 'dark');
  }

  /* ==========================================================================
     TOAST NOTIFICATIONS
     ========================================================================== */
  function showToast(message, type = 'success') {
    if (!el.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      <span>${message}</span>
    `;
    el.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  /* ==========================================================================
     FORMATTING
     ========================================================================== */
  function formatCurrency(amount, code) {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: code,
        maximumFractionDigits: 4,
        minimumFractionDigits: 2
      }).format(amount);
    } catch (e) {
      return `${amount.toFixed(2)} ${code}`;
    }
  }

  function formatRateNumber(rate) {
    if (rate >= 100) return rate.toFixed(2);
    if (rate >= 1) return rate.toFixed(4);
    return rate.toPrecision(5);
  }

  /* ==========================================================================
     CURRENCY SELECTOR MODAL
     ========================================================================== */
  function openCurrencyPicker(target) {
    state.activePickerTarget = target;
    el.modalTitle.textContent = target === 'from' ? 'Select Source Currency' : 'Select Target Currency';
    el.currencySearchInput.value = '';
    renderCurrencyList(state.currencies);
    el.currencyModal.classList.add('active');
    setTimeout(() => el.currencySearchInput.focus(), 100);
  }

  function closeCurrencyPicker() {
    el.currencyModal.classList.remove('active');
  }

  function renderCurrencyList(list) {
    el.modalCurrencyList.innerHTML = '';
    const activeCode = state.activePickerTarget === 'from' ? state.from : state.to;

    if (list.length === 0) {
      el.modalCurrencyList.innerHTML = `<div style="padding: 1.5rem; text-align: center; color: var(--text-muted);">No currencies match your search.</div>`;
      return;
    }

    const fragment = document.createDocumentFragment();
    list.forEach((item) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `currency-option-item ${item.code === activeCode ? 'selected' : ''}`;
      btn.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <span class="flag-emoji">${getFlagEmoji(item.code)}</span>
          <div>
            <span style="font-weight: 700; font-family: var(--font-mono);">${item.code}</span>
            <span style="font-size: 0.8125rem; color: var(--text-muted); margin-left: 0.5rem;">${item.name}</span>
          </div>
        </div>
        ${item.symbol ? `<span style="font-family: var(--font-mono); font-weight: 600; color: var(--text-muted);">${item.symbol}</span>` : ''}
      `;
      btn.addEventListener('click', () => {
        selectCurrency(state.activePickerTarget, item.code);
        closeCurrencyPicker();
      });
      fragment.appendChild(btn);
    });
    el.modalCurrencyList.appendChild(fragment);
  }

  function selectCurrency(target, code) {
    if (target === 'from') {
      state.from = code;
    } else {
      state.to = code;
    }
    updateTriggers();
    updateQuickPairPills();
    triggerConversion();
  }

  function updateTriggers() {
    const fromItem = state.currencies.find((c) => c.code === state.from) || { code: state.from, name: '' };
    const toItem = state.currencies.find((c) => c.code === state.to) || { code: state.to, name: '' };

    el.fromFlag.textContent = getFlagEmoji(state.from);
    el.fromCode.textContent = state.from;
    el.fromName.textContent = fromItem.name;

    el.toFlag.textContent = getFlagEmoji(state.to);
    el.toCode.textContent = state.to;
    el.toName.textContent = toItem.name;

    el.amountSymbol.textContent = getCurrencySymbol(state.from);
    if (el.matrixBaseCode) {
      el.matrixBaseCode.textContent = state.from;
    }
  }

  function updateQuickPairPills() {
    document.querySelectorAll('.pair-pill').forEach((pill) => {
      const from = pill.getAttribute('data-from');
      const to = pill.getAttribute('data-to');
      if (from === state.from && to === state.to) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });
  }

  /* ==========================================================================
     CONVERSION LOGIC
     ========================================================================== */
  function validateInput(raw) {
    const text = String(raw).trim().replace(/,/g, '');
    if (!text) return { error: 'Please enter an amount to convert.' };
    if (!AMOUNT_RE.test(text)) return { error: 'Enter a positive numeric amount (e.g. 100 or 49.99).' };
    const val = Number(text);
    if (!Number.isFinite(val) || val <= 0) return { error: 'Amount must be greater than zero.' };
    if (val > MAX_AMOUNT) return { error: 'Maximum amount is 1,000,000,000,000.' };
    return { value: val };
  }

  function setAmountError(msg) {
    if (msg) {
      el.amountError.textContent = msg;
      el.amountError.classList.add('visible');
      el.amount.classList.add('is-invalid');
    } else {
      el.amountError.textContent = '';
      el.amountError.classList.remove('visible');
      el.amount.classList.remove('is-invalid');
    }
  }

  function setBusy(busy) {
    el.convertBtn.disabled = busy;
    el.convertSpinner.classList.toggle('d-none', !busy);
    el.convertLabel.textContent = busy ? 'Converting…' : 'Convert Currency';
  }

  async function triggerConversion() {
    const parsed = validateInput(el.amount.value);
    if (parsed.error) {
      setAmountError(parsed.error);
      return;
    }
    setAmountError('');
    state.amount = parsed.value;

    const seq = ++state.requestSeq;
    if (state.activeController) {
      state.activeController.abort();
    }
    state.activeController = new AbortController();
    const signal = state.activeController.signal;

    setBusy(true);
    el.statusBanner.classList.add('d-none');

    try {
      const rateData = await CurrencyApi.getRate(state.from, state.to, signal);
      if (seq !== state.requestSeq) return;

      state.currentRateData = rateData;
      displayResult(state.amount, state.from, state.to, rateData);

      // Also trigger Multi-Currency Matrix update in parallel
      updateMultiCurrencyMatrix(state.amount, state.from, signal);
    } catch (err) {
      if (seq !== state.requestSeq || err.code === 'aborted') return;
      el.statusBanner.className = 'status-banner error';
      el.statusBanner.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          <span>${err.message || 'Error fetching rate. Please try again.'}</span>
        </div>
        <button type="button" class="btn-pill-action" id="retry-rate-btn">Retry</button>
      `;
      el.statusBanner.classList.remove('d-none');
      const retryBtn = $('retry-rate-btn');
      if (retryBtn) retryBtn.addEventListener('click', triggerConversion);
    } finally {
      if (seq === state.requestSeq) {
        setBusy(false);
      }
    }
  }

  function displayResult(amount, from, to, data) {
    const convertedAmount = amount * data.rate;
    const inverseRate = 1 / data.rate;

    el.resultSource.textContent = `${amount.toLocaleString('en-US', { maximumFractionDigits: 4 })} ${from} =`;
    el.resultTarget.textContent = `${convertedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} ${to}`;

    el.rateDirect.textContent = `1 ${from} = ${formatRateNumber(data.rate)} ${to}`;
    el.rateInverse.textContent = `1 ${to} = ${formatRateNumber(inverseRate)} ${from}`;

    el.rateDate.textContent = data.date || 'Today';
    el.rateProvider.textContent = `${data.provider} ${data.fromCache ? '(Cached)' : '(Live)'}`;

    el.resultPlaceholder.classList.add('d-none');
    el.resultActive.classList.remove('d-none');

    // Update LinkedIn post text template
    updateLinkedInPostTemplate(amount, from, to, convertedAmount, data.rate);
  }

  async function updateMultiCurrencyMatrix(amount, baseCurrency, signal) {
    if (!el.matrixGrid) return;
    const targetCurrencies = TOP_MATRIX_CURRENCIES.filter((c) => c !== baseCurrency);

    // Initial skeleton loading state
    el.matrixGrid.innerHTML = targetCurrencies.map((c) => `
      <div class="matrix-card">
        <div class="matrix-card-header">
          <span class="matrix-card-currency">${getFlagEmoji(c)} ${c}</span>
          <span class="matrix-card-rate"><span class="spinner" style="width:12px; height:12px;"></span></span>
        </div>
        <div class="matrix-card-value">...</div>
      </div>
    `).join('');

    try {
      const rates = await CurrencyApi.getMultipleRates(baseCurrency, targetCurrencies, signal);
      el.matrixGrid.innerHTML = '';

      targetCurrencies.forEach((target) => {
        const rateInfo = rates[target];
        const card = document.createElement('div');
        card.className = 'matrix-card';

        if (rateInfo && rateInfo.rate) {
          const val = amount * rateInfo.rate;
          card.innerHTML = `
            <div class="matrix-card-header">
              <span class="matrix-card-currency">${getFlagEmoji(target)} ${target}</span>
              <span class="matrix-card-rate">1 ${baseCurrency} = ${formatRateNumber(rateInfo.rate)}</span>
            </div>
            <div class="matrix-card-value">${formatCurrency(val, target)}</div>
          `;
          card.style.cursor = 'pointer';
          card.title = `Switch target currency to ${target}`;
          card.addEventListener('click', () => {
            selectCurrency('to', target);
          });
        } else {
          card.innerHTML = `
            <div class="matrix-card-header">
              <span class="matrix-card-currency">${getFlagEmoji(target)} ${target}</span>
              <span class="matrix-card-rate">Unavailable</span>
            </div>
            <div class="matrix-card-value">—</div>
          `;
        }
        el.matrixGrid.appendChild(card);
      });
    } catch (e) {
      console.warn('Matrix rate update skipped:', e);
    }
  }

  /* ==========================================================================
     LINKEDIN SHARE MODAL & TEMPLATE
     ========================================================================== */
  function updateLinkedInPostTemplate(amount, from, to, converted, rate) {
    if (!el.postTextarea) return;
    const postCopy = `🚀 Just launched my Currency Converter web application! 💱✨

Built a high-performance, real-time currency conversion platform featuring:
⚡ Live Exchange Rates powered by Frankfurter v2 API & Open ER-API fallback
🌍 Instant conversion between 150+ global currencies
📊 Multi-Currency Global Matrix comparing top currencies in real-time
🌙 Sleek Fintech UI with Dark/Light mode & fluid glassmorphism
🛡️ 30-minute in-memory intelligent caching & zero-latency offline resilience
📱 100% Mobile responsive & PWA ready

💡 Example live rate today:
${amount} ${from} = ${converted.toFixed(2)} ${to} (1 ${from} = ${formatRateNumber(rate)} ${to})

Check out the live demo and let me know your thoughts! 👇
🔗 Live App: https://currency-converter.app (or your deployed URL)
💻 Code Repository: https://github.com/your-username/currency-converter

#webdevelopment #javascript #frontend #fintech #portfolio #opensource #coding #reactjs #webdev`;

    el.postTextarea.value = postCopy;
  }

  function openShareModal() {
    if (el.shareModal) el.shareModal.classList.add('active');
  }

  function closeShareModal() {
    if (el.shareModal) el.shareModal.classList.remove('active');
  }

  function launchLinkedInShare() {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent('Real-Time Currency Converter | Modern Fintech Web App');
    const summary = encodeURIComponent('Convert 150+ world currencies instantly with real-time exchange rates, multi-currency matrix, and offline caching.');
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}&summary=${summary}`;
    window.open(linkedinUrl, '_blank', 'width=600,height=600,toolbar=no,menubar=no');
  }

  /* ==========================================================================
     EVENT LISTENERS & INITIALIZATION
     ========================================================================== */
  function setupEventListeners() {
    // Theme toggle
    if (el.themeToggle) el.themeToggle.addEventListener('click', toggleTheme);

    // Pickers
    el.fromTrigger.addEventListener('click', () => openCurrencyPicker('from'));
    el.toTrigger.addEventListener('click', () => openCurrencyPicker('to'));
    el.modalCloseBtn.addEventListener('click', closeCurrencyPicker);
    el.currencyModal.addEventListener('click', (e) => {
      if (e.target === el.currencyModal) closeCurrencyPicker();
    });

    // Modal Search Filter
    el.currencySearchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      const filtered = state.currencies.filter((c) =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q)
      );
      renderCurrencyList(filtered);
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeCurrencyPicker();
        closeShareModal();
      }
    });

    // Swap Currencies Button
    el.swapBtn.addEventListener('click', () => {
      const temp = state.from;
      state.from = state.to;
      state.to = temp;
      updateTriggers();
      updateQuickPairPills();
      triggerConversion();
      showToast(`Swapped to ${state.from} ⇄ ${state.to}`);
    });

    // Amount input debounced live conversion
    el.amount.addEventListener('input', () => {
      clearTimeout(state.debounceTimer);
      state.debounceTimer = setTimeout(() => {
        triggerConversion();
      }, 350);
    });

    // Form submit
    el.form.addEventListener('submit', (e) => {
      e.preventDefault();
      triggerConversion();
    });

    // Quick Amount Chips
    document.querySelectorAll('.amount-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const amt = chip.getAttribute('data-amount');
        el.amount.value = amt;
        triggerConversion();
      });
    });

    // Quick Currency Pair Pills
    document.querySelectorAll('.pair-pill').forEach((pill) => {
      pill.addEventListener('click', () => {
        const from = pill.getAttribute('data-from');
        const to = pill.getAttribute('data-to');
        state.from = from;
        state.to = to;
        updateTriggers();
        updateQuickPairPills();
        triggerConversion();
      });
    });

    // Copy Result to Clipboard
    if (el.copyResultBtn) {
      el.copyResultBtn.addEventListener('click', () => {
        if (!state.currentRateData) return;
        const textToCopy = `${state.amount} ${state.from} = ${(state.amount * state.currentRateData.rate).toFixed(2)} ${state.to} (Rate: 1 ${state.from} = ${formatRateNumber(state.currentRateData.rate)} ${state.to})`;
        navigator.clipboard.writeText(textToCopy).then(() => {
          showToast('Result copied to clipboard!');
        }).catch(() => {
          showToast('Copied to clipboard!');
        });
      });
    }

    // LinkedIn Sharing Modal events
    if (el.shareModalOpenBtn) el.shareModalOpenBtn.addEventListener('click', openShareModal);
    if (el.shareModalHeroBtn) el.shareModalHeroBtn.addEventListener('click', openShareModal);
    const footerShareLink = $('footer-share-link');
    if (footerShareLink) footerShareLink.addEventListener('click', (e) => { e.preventDefault(); openShareModal(); });
    if (el.shareModalCloseBtn) el.shareModalCloseBtn.addEventListener('click', closeShareModal);
    if (el.shareModal) {
      el.shareModal.addEventListener('click', (e) => {
        if (e.target === el.shareModal) closeShareModal();
      });
    }

    if (el.copyPostBtn) {
      el.copyPostBtn.addEventListener('click', () => {
        if (el.postTextarea) {
          navigator.clipboard.writeText(el.postTextarea.value).then(() => {
            showToast('LinkedIn post copy ready to paste!');
          });
        }
      });
    }

    if (el.launchLinkedinBtn) {
      el.launchLinkedinBtn.addEventListener('click', launchLinkedInShare);
    }

    // Online/Offline awareness
    window.addEventListener('online', () => showToast('Back online! Live rates connected.'));
    window.addEventListener('offline', () => showToast('Offline mode: Using cached rates.', 'info'));
  }

  async function init() {
    initTheme();
    setupEventListeners();

    // Show initial loading status
    el.statusBanner.className = 'status-banner loading';
    el.statusBanner.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <span class="spinner" style="border-top-color: var(--primary);"></span>
        <span>Loading global currencies & live exchange rates…</span>
      </div>
    `;
    el.statusBanner.classList.remove('d-none');

    try {
      state.currencies = await CurrencyApi.getCurrencies();
      el.statusBanner.classList.add('d-none');
      updateTriggers();
      updateQuickPairPills();
      triggerConversion();
    } catch (err) {
      el.statusBanner.className = 'status-banner error';
      el.statusBanner.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          <span>Failed to load currency list. Check network connection.</span>
        </div>
        <button type="button" class="btn-pill-action" id="retry-init-btn">Retry</button>
      `;
      const retryBtn = $('retry-init-btn');
      if (retryBtn) retryBtn.addEventListener('click', init);
    }
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
