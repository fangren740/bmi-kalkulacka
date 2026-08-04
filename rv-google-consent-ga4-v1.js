(function () {
  'use strict';

  if (window.__rvGoogleConsentGa4V1Initialized) return;
  window.__rvGoogleConsentGa4V1Initialized = true;

  const MEASUREMENT_ID = 'G-E9QVPMKPSV';
  const PRIVACY_UI_ID = 'rv-google-privacy-settings';

  window.googlefc = window.googlefc || {};
  window.googlefc.callbackQueue = window.googlefc.callbackQueue || [];
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () {
    window.dataLayer.push(arguments);
  };

  let gaStarted = false;
  let pageViewSent = false;
  let privacyUiVisible = false;

  function consentStatus(name, fallback) {
    const statuses = window.googlefc && window.googlefc.ConsentModePurposeStatusEnum;
    return statuses && typeof statuses[name] === 'number' ? statuses[name] : fallback;
  }

  function analyticsIsAllowed(values) {
    if (!values) return false;
    const status = values.analyticsStoragePurposeConsentStatus;
    return status === consentStatus('GRANTED', 1) ||
      status === consentStatus('NOT_APPLICABLE', 3);
  }

  function sanitizedLocation() {
    return window.location.protocol + '//' + window.location.hostname + window.location.pathname;
  }

  function sanitizedReferrer() {
    if (!document.referrer) return '';

    try {
      const referrer = new URL(document.referrer);
      if (referrer.origin === window.location.origin) {
        return referrer.origin + referrer.pathname;
      }
      return referrer.origin;
    } catch (_error) {
      return '';
    }
  }

  function analyticsPageFields() {
    const fields = {
      page_title: document.title,
      page_location: sanitizedLocation(),
      page_path: window.location.pathname
    };
    const referrer = sanitizedReferrer();
    if (referrer) fields.page_referrer = referrer;
    return fields;
  }

  function startGa4() {
    if (gaStarted) return;
    gaStarted = true;

    const pageFields = analyticsPageFields();
    window.gtag('js', new Date());
    window.gtag('config', MEASUREMENT_ID, Object.assign({
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    }, pageFields));

    if (!pageViewSent) {
      pageViewSent = true;
      window.gtag('event', 'page_view', pageFields);
    }

    const gaScript = document.createElement('script');
    gaScript.async = true;
    gaScript.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(MEASUREMENT_ID);
    gaScript.dataset.rvGa4 = 'consented';
    (document.head || document.documentElement).appendChild(gaScript);
  }

  function ensurePrivacyUi() {
    if (!document.body || document.getElementById(PRIVACY_UI_ID)) return;

    const style = document.createElement('style');
    style.textContent =
      '.rv-google-privacy-settings{display:none;align-items:center;justify-content:center;padding:6px 16px;background:#071a33}' +'.rv-google-privacy-settings[data-visible="true"]{display:flex;min-height:44px}' +
      '.rv-google-privacy-settings button{appearance:none;border:0;background:transparent;color:#dbeafe;font:inherit;font-size:.9rem;line-height:1.35;text-decoration:underline;text-underline-offset:3px;cursor:pointer;padding:8px 10px;border-radius:6px}' +
      '.rv-google-privacy-settings button:hover{color:#fff}' +
      '.rv-google-privacy-settings button:focus-visible{outline:3px solid #7dd3fc;outline-offset:2px}' +
      '';
    (document.head || document.documentElement).appendChild(style);

    const wrapper = document.createElement('div');
    wrapper.id = PRIVACY_UI_ID;
    wrapper.className = 'rv-google-privacy-settings';
    wrapper.dataset.visible = privacyUiVisible ? 'true' : 'false';

    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Nastavení soukromí a cookies';
    button.disabled = !privacyUiVisible;
    button.addEventListener('click', function () {
      window.googlefc.callbackQueue.push({
        CONSENT_API_READY: function () {
          if (typeof window.googlefc.showRevocationMessage === 'function') {
            window.googlefc.showRevocationMessage();
          }
        }
      });
    });

    wrapper.appendChild(button);
    document.body.appendChild(wrapper);
  }

  function renderPrivacyUi() {
    if (!document.body) {
      document.addEventListener('DOMContentLoaded', renderPrivacyUi, { once: true });
      return;
    }

    ensurePrivacyUi();
    const wrapper = document.getElementById(PRIVACY_UI_ID);
    if (!wrapper) return;
    wrapper.dataset.visible = privacyUiVisible ? 'true' : 'false';
    const button = wrapper.querySelector('button');
    if (button) button.disabled = !privacyUiVisible;
  }

  renderPrivacyUi();

  window.googlefc.callbackQueue.push({
    CONSENT_MODE_DATA_READY: function () {
      try {
        if (typeof window.googlefc.getGoogleConsentModeValues === 'function' &&
            analyticsIsAllowed(window.googlefc.getGoogleConsentModeValues())) {
          startGa4();
        }
      } catch (_error) {
        // Fail closed: analytics remains unloaded if consent data is unavailable.
      }
    }
  });

  window.googlefc.callbackQueue.push({
    CONSENT_API_READY: function () {
      if (typeof window.__tcfapi !== 'function') return;
      window.__tcfapi('addEventListener', 0, function (tcData, success) {
        privacyUiVisible = Boolean(success && tcData && tcData.gdprApplies);
        renderPrivacyUi();
      });
    }
  });
}());
