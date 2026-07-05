(function () {
  const index = Array.isArray(window.RV_TOOL_INDEX) ? window.RV_TOOL_INDEX : [];
  if (!index.length) return;

  const FAVORITES_KEY = 'rv_catalog_favorites_v1';
  const RECENT_KEY = 'rv_catalog_recent_v1';
  const cleanHref = href => {
    try { return new URL(href, location.origin).pathname; }
    catch (_) { return href || ''; }
  };
  const read = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; }
    catch (_) { return fallback; }
  };
  const write = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (_) { /* Personalizace zůstane aktivní alespoň během návštěvy. */ }
  };
  const byHref = new Map(index.map(tool => [cleanHref(tool.url), tool]));
  let favorites = new Set(read(FAVORITES_KEY, []).map(cleanHref));
  let recent = read(RECENT_KEY, []).filter(item => item && item.href).slice(0, 6);

  function addRecent(tool) {
    const href = cleanHref(tool.url || tool.href);
    const normalized = { href, title: tool.title, category: tool.type || tool.category || 'Online výpočet' };
    recent = [normalized, ...recent.filter(item => cleanHref(item.href) !== href)].slice(0, 6);
    write(RECENT_KEY, recent);
    render();
  }
  function toolLink(tool) {
    const href = cleanHref(tool.url || tool.href);
    const canonical = byHref.get(href) || tool;
    const link = document.createElement('a');
    link.className = 'rv-home-tool';
    link.href = href;
    const copy = document.createElement('span');
    const title = document.createElement('strong');
    const type = document.createElement('small');
    const arrow = document.createElement('span');
    title.textContent = canonical.title || tool.title || 'Kalkulačka';
    type.textContent = canonical.type || tool.category || 'Online výpočet';
    arrow.textContent = '→';
    arrow.setAttribute('aria-hidden', 'true');
    copy.append(title, type);
    link.append(copy, arrow);
    link.addEventListener('click', () => addRecent(canonical));
    return link;
  }
  function renderFavorites() {
    const list = document.getElementById('rvHomeFavorites');
    if (!list) return;
    const allTools = Array.from(favorites).map(href => byHref.get(href)).filter(Boolean);
    const tools = allTools.slice(0, 4);
    list.replaceChildren();
    if (!tools.length) {
      const empty = document.createElement('p');
      empty.className = 'rv-home-workspace__empty';
      empty.textContent = 'V katalogu označte kalkulačku hvězdičkou a objeví se zde.';
      list.append(empty);
    } else {
      tools.forEach(tool => {
        const wrap = document.createElement('div');
        wrap.className = 'rv-home-favorite-wrap';
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'rv-home-remove-favorite';
        button.textContent = '★';
        button.setAttribute('aria-label', `Odebrat ${tool.title} z oblíbených`);
        button.addEventListener('click', () => {
          favorites.delete(cleanHref(tool.url));
          write(FAVORITES_KEY, Array.from(favorites));
          render();
        });
        wrap.append(toolLink(tool), button);
        list.append(wrap);
      });
    }
    const count = document.getElementById('rvHomeFavoritesCount');
    if (count) count.textContent = allTools.length;
  }
  function renderRecent() {
    const list = document.getElementById('rvHomeRecent');
    if (!list) return;
    const tools = recent.map(item => byHref.get(cleanHref(item.href)) || item).slice(0, 4);
    list.replaceChildren();
    if (!tools.length) {
      const empty = document.createElement('p');
      empty.className = 'rv-home-workspace__empty';
      empty.textContent = 'Po otevření kalkulačky se zde zobrazí rychlá cesta zpět.';
      list.append(empty);
    } else {
      tools.forEach(tool => list.append(toolLink(tool)));
    }
    const count = document.getElementById('rvHomeRecentCount');
    if (count) count.textContent = recent.length;
  }
  function render() {
    document.querySelectorAll('[data-home-tool-count]').forEach(element => { element.textContent = index.length; });
    renderFavorites();
    renderRecent();
  }

  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link || link.closest('.rv-home-workspace')) return;
    const tool = byHref.get(cleanHref(link.getAttribute('href')));
    if (tool) addRecent(tool);
  }, { capture: true });
  window.addEventListener('storage', event => {
    if (event.key === FAVORITES_KEY) favorites = new Set(read(FAVORITES_KEY, []).map(cleanHref));
    if (event.key === RECENT_KEY) recent = read(RECENT_KEY, []).filter(item => item && item.href).slice(0, 6);
    render();
  });
  render();
})();
