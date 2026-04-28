/* =========================================================
  RychléVýpočty.cz — Tool Page V2 Core JS
  Version: 2.0
  Scope: shared helpers for calculator pages
  Usage:
    const app = RVTool.createCalculator({ ... })
========================================================= */
(function (window, document) {
  'use strict';

  const RVTool = {
    qs(selector, root = document) {
      return root.querySelector(selector);
    },

    qsa(selector, root = document) {
      return Array.from(root.querySelectorAll(selector));
    },

    on(target, event, handler, options) {
      if (!target) return () => {};
      target.addEventListener(event, handler, options);
      return () => target.removeEventListener(event, handler, options);
    },

    parseNumber(value, fallback = 0) {
      if (typeof value === 'number' && Number.isFinite(value)) return value;
      if (value == null) return fallback;
      const normalized = String(value)
        .replace(/\s/g, '')
        .replace(/,/g, '.')
        .replace(/[^0-9.+-]/g, '');
      const parsed = Number.parseFloat(normalized);
      return Number.isFinite(parsed) ? parsed : fallback;
    },

    clamp(value, min, max) {
      return Math.min(Math.max(value, min), max);
    },

    round(value, decimals = 0) {
      const factor = 10 ** decimals;
      return Math.round((value + Number.EPSILON) * factor) / factor;
    },

    formatNumber(value, decimals = 0) {
      return new Intl.NumberFormat('cs-CZ', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }).format(Number.isFinite(value) ? value : 0);
    },

    formatCZK(value, decimals = 0) {
      return `${RVTool.formatNumber(value, decimals)} Kč`;
    },

    formatPercent(value, decimals = 1) {
      return `${RVTool.formatNumber(value, decimals)} %`;
    },

    setText(selectorOrNode, value, root = document) {
      const node = typeof selectorOrNode === 'string' ? RVTool.qs(selectorOrNode, root) : selectorOrNode;
      if (node) node.textContent = value;
    },

    setHTML(selectorOrNode, value, root = document) {
      const node = typeof selectorOrNode === 'string' ? RVTool.qs(selectorOrNode, root) : selectorOrNode;
      if (node) node.innerHTML = value;
    },

    setMeter(selectorOrNode, percent, root = document) {
      const node = typeof selectorOrNode === 'string' ? RVTool.qs(selectorOrNode, root) : selectorOrNode;
      if (!node) return;
      node.style.setProperty('--meter-position', `${RVTool.clamp(percent, 0, 100)}%`);
    },

    readForm(form) {
      const values = {};
      if (!form) return values;
      const data = new FormData(form);
      for (const [key, value] of data.entries()) {
        const field = form.elements[key];
        if (field && (field.type === 'checkbox')) {
          values[key] = field.checked;
        } else if (field && (field.type === 'radio')) {
          values[key] = value;
        } else if (field && ['number', 'range'].includes(field.type)) {
          values[key] = RVTool.parseNumber(value);
        } else {
          values[key] = value;
        }
      }
      return values;
    },

    applyPreset(form, preset) {
      if (!form || !preset) return;
      Object.entries(preset).forEach(([name, value]) => {
        const field = form.elements[name];
        if (!field) return;
        if (field instanceof RadioNodeList) {
          const radio = Array.from(field).find(item => String(item.value) === String(value));
          if (radio) radio.checked = true;
          return;
        }
        if (field.type === 'checkbox') field.checked = Boolean(value);
        else field.value = value;
        field.dispatchEvent(new Event('input', { bubbles: true }));
        field.dispatchEvent(new Event('change', { bubbles: true }));
      });
    },

    getStatusByScore(score, thresholds = { good: 35, warning: 70 }) {
      if (score <= thresholds.good) return { type: 'good', label: 'Rozumný scénář' };
      if (score <= thresholds.warning) return { type: 'warning', label: 'Na hraně' };
      return { type: 'risk', label: 'Rizikovější scénář' };
    },

    initAnchorOffset() {
      RVTool.qsa('a[href^="#"]').forEach(anchor => {
        RVTool.on(anchor, 'click', event => {
          const id = anchor.getAttribute('href');
          if (!id || id === '#') return;
          const target = RVTool.qs(id);
          if (!target) return;
          event.preventDefault();
          const offset = 118;
          const top = target.getBoundingClientRect().top + window.scrollY - offset;
          window.scrollTo({ top, behavior: 'smooth' });
        });
      });
    },

    initMobileResultBar(options = {}) {
      const bar = RVTool.qs(options.barSelector || '.mobile-result-bar');
      const source = RVTool.qs(options.sourceSelector || '#primaryResult');
      const target = RVTool.qs(options.targetSelector || '#mobilePrimaryResult');
      const revealAfter = options.revealAfter || 520;
      if (!bar || !source || !target) return;

      const sync = () => {
        target.textContent = source.textContent;
        const shouldShow = window.matchMedia('(max-width: 720px)').matches && window.scrollY > revealAfter;
        bar.hidden = !shouldShow;
      };

      const observer = new MutationObserver(sync);
      observer.observe(source, { childList: true, characterData: true, subtree: true });
      RVTool.on(window, 'scroll', sync, { passive: true });
      RVTool.on(window, 'resize', sync);
      sync();
    },

    createCalculator(config) {
      const form = RVTool.qs(config.formSelector);
      if (!form) {
        console.warn(`[RVTool] Form not found: ${config.formSelector}`);
        return null;
      }

      const state = {
        values: {},
        result: {},
        errors: []
      };

      const run = () => {
        state.values = config.read ? config.read(form, RVTool) : RVTool.readForm(form);
        state.errors = config.validate ? config.validate(state.values, RVTool) : [];
        state.result = config.calculate(state.values, RVTool);
        if (config.interpret) state.interpretation = config.interpret(state.values, state.result, RVTool);
        if (config.render) config.render({ ...state }, RVTool);
        if (config.onAfterRender) config.onAfterRender({ ...state }, RVTool);
      };

      RVTool.on(form, 'input', run);
      RVTool.on(form, 'change', run);

      if (config.presets) {
        RVTool.qsa('[data-preset]').forEach(button => {
          RVTool.on(button, 'click', () => {
            const id = button.getAttribute('data-preset');
            RVTool.applyPreset(form, config.presets[id]);
            RVTool.qsa('[data-preset]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
            run();
          });
        });
      }

      run();
      return { form, state, run };
    },

    init() {
      RVTool.initAnchorOffset();
      RVTool.initMobileResultBar();
    }
  };

  window.RVTool = RVTool;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', RVTool.init, { once: true });
  } else {
    RVTool.init();
  }
})(window, document);
