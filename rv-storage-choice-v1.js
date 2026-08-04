(function () {
  'use strict';

  const PREFERENCES_KEY = 'rv-storage-preferences-v1';

  function readPreferences() {
    try {
      const value = JSON.parse(localStorage.getItem(PREFERENCES_KEY) || '{}');
      return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    } catch (_) {
      return {};
    }
  }

  function writePreferences(preferences) {
    try {
      const enabledScopes = Object.keys(preferences).filter((key) => preferences[key] === true);
      if (enabledScopes.length) localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
      else localStorage.removeItem(PREFERENCES_KEY);
      return true;
    } catch (_) {
      return false;
    }
  }

  function setPreference(scope, enabled) {
    const preferences = readPreferences();
    if (enabled) preferences[scope] = true;
    else delete preferences[scope];
    return writePreferences(preferences);
  }

  function isEnabled(scope) {
    return readPreferences()[scope] === true;
  }

  function removeData(dataKey) {
    try { localStorage.removeItem(dataKey); } catch (_) { /* Nástroj funguje i bez úložiště. */ }
  }

  function create(options) {
    const input = document.getElementById(options.inputId);
    const status = options.statusId ? document.getElementById(options.statusId) : null;
    if (!input) throw new Error(`Chybí ovládací prvek ${options.inputId}.`);

    let enabled = isEnabled(options.scope);
    input.checked = enabled;

    function renderStatus() {
      if (!status) return;
      status.textContent = enabled
        ? 'Zapnuto. Nastavení se uloží pouze v tomto prohlížeči.'
        : 'Vypnuto. Nastavení zůstane jen po dobu této návštěvy.';
    }

    function update(nextEnabled, notify = true) {
      enabled = Boolean(nextEnabled);
      input.checked = enabled;
      setPreference(options.scope, enabled);
      if (!enabled) removeData(options.dataKey);
      renderStatus();
      if (!notify) return;
      if (enabled && typeof options.onEnable === 'function') options.onEnable();
      if (!enabled && typeof options.onDisable === 'function') options.onDisable();
    }

    input.addEventListener('change', () => update(input.checked));
    renderStatus();

    return {
      enabled: () => enabled,
      disable: (notify = true) => update(false, notify),
      removeData: () => removeData(options.dataKey)
    };
  }

  window.RVStorageChoice = { PREFERENCES_KEY, create, isEnabled, removeData };
})();
