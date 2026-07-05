(function () {
  const items = Array.from(document.querySelectorAll('.calc-item'));
  if (!items.length) return;

  const FAVORITES_KEY = 'rv_catalog_favorites_v1';
  const RECENT_KEY = 'rv_catalog_recent_v1';
  const read = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; }
    catch (_) { return fallback; }
  };
  const write = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (_) { /* Funkce zůstane použitelná alespoň v aktuální návštěvě. */ }
  };
  const cleanHref = (href) => {
    try { return new URL(href, location.origin).pathname; }
    catch (_) { return href || ''; }
  };
  const toolWord = (count) => count === 1 ? 'nástroj' : count >= 2 && count <= 4 ? 'nástroje' : 'nástrojů';
  let favorites = new Set(read(FAVORITES_KEY, []).map(cleanHref));
  let recent = read(RECENT_KEY, []).filter(item => item && item.href).slice(0, 6);

  const toolData = (item) => {
    const link = item.querySelector('a[href]');
    return {
      href: cleanHref(link?.getAttribute('href')),
      title: item.querySelector('.calc-title')?.textContent.trim() || link?.textContent.trim() || 'Kalkulačka',
      category: item.querySelector('.calc-meta')?.textContent.trim() || 'Online výpočet'
    };
  };
  const tools = items.map(toolData);
  const byHref = new Map(tools.map(tool => [tool.href, tool]));

  window.rvCatalogIsFavorite = href => favorites.has(cleanHref(href));

  function saveFavorites() {
    write(FAVORITES_KEY, Array.from(favorites));
  }
  function addRecent(tool) {
    recent = [tool, ...recent.filter(item => cleanHref(item.href) !== tool.href)].slice(0, 6);
    write(RECENT_KEY, recent);
  }
  function card(tool) {
    const safe = byHref.get(cleanHref(tool.href)) || tool;
    const link = document.createElement('a');
    link.className = 'rv-personal-tool';
    link.href = safe.href;
    link.innerHTML = `<span><strong></strong><small></small></span><span aria-hidden="true">→</span>`;
    link.querySelector('strong').textContent = safe.title;
    link.querySelector('small').textContent = safe.category || 'Online výpočet';
    link.addEventListener('click', () => addRecent(safe));
    return link;
  }
  function renderList(id, values, emptyText) {
    const list = document.getElementById(id);
    if (!list) return;
    list.replaceChildren();
    if (!values.length) {
      const empty = document.createElement('p');
      empty.className = 'rv-personal-empty';
      empty.textContent = emptyText;
      list.append(empty);
      return;
    }
    values.slice(0, 4).forEach(tool => list.append(card(tool)));
  }
  function renderWorkspace() {
    const favoriteTools = Array.from(favorites).map(href => byHref.get(href)).filter(Boolean);
    renderList('rvFavoritesList', favoriteTools, 'Klikněte na hvězdičku u kalkulačky a vytvořte si vlastní rychlý výběr.');
    renderList('rvRecentList', recent, 'Po otevření kalkulačky se zde zobrazí vaše naposledy použité nástroje.');
    const favoriteCount = document.getElementById('rvFavoritesCount');
    const recentCount = document.getElementById('rvRecentCount');
    if (favoriteCount) favoriteCount.textContent = favoriteTools.length;
    if (recentCount) recentCount.textContent = recent.length;
    const chipCount = document.querySelector('.cat-chip[data-filter="favorites"] b');
    if (chipCount) chipCount.textContent = favoriteTools.length;
  }
  function syncFavoriteButtons() {
    items.forEach(item => {
      const tool = toolData(item);
      const button = item.querySelector('.tool-favorite');
      if (!button) return;
      const active = favorites.has(tool.href);
      button.setAttribute('aria-pressed', String(active));
      button.setAttribute('aria-label', `${active ? 'Odebrat' : 'Přidat'} ${tool.title} ${active ? 'z oblíbených' : 'do oblíbených'}`);
      button.textContent = active ? '★' : '☆';
    });
  }
  function updateCounts() {
    document.querySelectorAll('[data-tool-count]').forEach(el => { el.textContent = items.length; });
    document.querySelectorAll('.cat-chip[data-filter]').forEach(chip => {
      if (chip.dataset.filter === 'favorites') return;
      const amount = chip.dataset.filter === 'all' ? items.length : items.filter(item => item.dataset.category === chip.dataset.filter).length;
      const badge = chip.querySelector('b');
      if (badge) badge.textContent = amount;
    });
    document.querySelectorAll('.directory-group').forEach(group => {
      const amount = group.querySelectorAll('.calc-item').length;
      const label = group.querySelector('.directory-actions strong');
      if (label) label.textContent = `${amount} ${toolWord(amount)}`;
    });
  }

  items.forEach(item => {
    const tool = toolData(item);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tool-favorite';
    button.addEventListener('click', () => {
      favorites.has(tool.href) ? favorites.delete(tool.href) : favorites.add(tool.href);
      saveFavorites();
      syncFavoriteButtons();
      renderWorkspace();
      window.dispatchEvent(new CustomEvent('rv:favorites-changed'));
    });
    item.append(button);
    item.querySelector('a[href]')?.addEventListener('click', () => addRecent(tool));
  });

  updateCounts();
  syncFavoriteButtons();
  renderWorkspace();
})();
