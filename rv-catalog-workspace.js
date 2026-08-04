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
  const norm = value => (value || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const toolWord = (count) => count === 1 ? 'nástroj' : count >= 2 && count <= 4 ? 'nástroje' : 'nástrojů';
  let favorites = new Set(read(FAVORITES_KEY, []).map(cleanHref));
  const recentEnabled = window.RVStorageChoice?.isEnabled('catalogRecent') === true;
  let recent = recentEnabled ? read(RECENT_KEY, []).filter(item => item && item.href).slice(0, 6) : [];

  const toolData = (item) => {
    const link = item.querySelector('a[href]');
    return {
      href: cleanHref(link?.getAttribute('href')),
      title: item.querySelector('.calc-title')?.textContent.trim() || link?.textContent.trim() || 'Kalkulačka',
      category: item.querySelector('.calc-meta')?.textContent.trim() || 'Online výpočet',
      categoryKey: item.dataset.category || '',
      description: item.querySelector('.calc-desc')?.textContent.trim() || '',
      search: item.dataset.search || ''
    };
  };
  const tools = items.map(toolData);
  const byHref = new Map(tools.map(tool => [tool.href, tool]));

  window.rvCatalogIsFavorite = href => favorites.has(cleanHref(href));

  function saveFavorites() {
    write(FAVORITES_KEY, Array.from(favorites));
  }
  function toggleFavorite(tool) {
    favorites.has(tool.href) ? favorites.delete(tool.href) : favorites.add(tool.href);
    saveFavorites();
    syncFavoriteButtons();
    renderWorkspace();
    renderSmartResults();
    window.dispatchEvent(new CustomEvent('rv:favorites-changed'));
  }
  function addRecent(tool) {
    recent = [tool, ...recent.filter(item => cleanHref(item.href) !== tool.href)].slice(0, 6);
    if (recentEnabled) write(RECENT_KEY, recent);
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
    const clearFavorites = document.getElementById('rvClearFavorites');
    const clearRecent = document.getElementById('rvClearRecent');
    if (clearFavorites) clearFavorites.hidden = favoriteTools.length === 0;
    if (clearRecent) clearRecent.hidden = recent.length === 0;
    const chipCount = document.querySelector('.cat-chip[data-filter="favorites"] b');
    if (chipCount) chipCount.textContent = favoriteTools.length;
  }
  function scoreTool(tool, query) {
    const title = norm(tool.title);
    const haystack = norm(`${tool.title} ${tool.description} ${tool.search} ${tool.category}`);
    const stems = {
      hypoteka: ['hypot'],
      'splatka hypoteky': ['hypot', 'splatk'],
      'cista mzda': ['cist', 'mzd'],
      'kolik dostanu cisteho': ['cist', 'mzd'],
      elektrina: ['elektr'],
      rekonstrukce: ['rekonstruk']
    };
    const terms = [query, ...(stems[query] || []), ...query.split(/\s+/).filter(word => word.length > 2)];
    let score = 0;
    if (title === query) score += 140;
    if (title.startsWith(query)) score += 95;
    if (title.includes(query)) score += 75;
    if (haystack.includes(query)) score += 40;
    terms.forEach(term => {
      if (title.includes(term)) score += 18;
      else if (haystack.includes(term)) score += 7;
    });
    if (favorites.has(tool.href)) score += 4;
    if (recent.some(item => cleanHref(item.href) === tool.href)) score += 2;
    return score;
  }
  function smartCard(tool) {
    const article = document.createElement('article');
    article.className = 'rv-smart-card';
    const link = document.createElement('a');
    link.href = tool.href;
    const title = document.createElement('strong');
    const description = document.createElement('small');
    const category = document.createElement('em');
    title.textContent = tool.title;
    description.textContent = tool.description;
    category.textContent = tool.category;
    link.append(title, description, category);
    link.addEventListener('click', () => addRecent(tool));
    const button = document.createElement('button');
    const active = favorites.has(tool.href);
    button.type = 'button';
    button.className = 'rv-smart-favorite';
    button.setAttribute('aria-pressed', String(active));
    button.setAttribute('aria-label', `${active ? 'Odebrat' : 'Přidat'} ${tool.title} ${active ? 'z oblíbených' : 'do oblíbených'}`);
    button.textContent = active ? '★' : '☆';
    button.addEventListener('click', () => toggleFavorite(tool));
    article.append(link, button);
    return article;
  }
  function renderSmartResults() {
    const section = document.getElementById('rvSmartResults');
    const grid = document.getElementById('rvSmartGrid');
    const count = document.getElementById('rvSmartCount');
    const input = document.getElementById('catalog-search');
    if (!section || !grid || !input) return;
    const query = norm(input.value.trim());
    if (query.length < 2) {
      section.hidden = true;
      grid.replaceChildren();
      return;
    }
    const ranked = items
      .filter(item => !item.classList.contains('is-hidden'))
      .map(item => toolData(item))
      .map(tool => ({ tool, score: scoreTool(tool, query) }))
      .sort((a, b) => b.score - a.score || a.tool.title.localeCompare(b.tool.title, 'cs'));
    grid.replaceChildren(...ranked.slice(0, 6).map(result => smartCard(result.tool)));
    if (count) count.textContent = `${ranked.length} ${ranked.length === 1 ? 'výsledek' : ranked.length >= 2 && ranked.length <= 4 ? 'výsledky' : 'výsledků'}`;
    section.hidden = ranked.length === 0;
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
    button.addEventListener('click', () => toggleFavorite(tool));
    item.append(button);
    item.querySelector('a[href]')?.addEventListener('click', () => addRecent(tool));
  });

  updateCounts();
  syncFavoriteButtons();
  renderWorkspace();
  renderSmartResults();

  document.getElementById('catalog-search')?.addEventListener('input', renderSmartResults);
  document.getElementById('search-clear')?.addEventListener('click', renderSmartResults);
  document.getElementById('reset-search')?.addEventListener('click', renderSmartResults);
  document.querySelectorAll('.cat-chip,.suggest-chip').forEach(button => button.addEventListener('click', renderSmartResults));
  window.addEventListener('rv:favorites-changed', renderSmartResults);

  document.getElementById('rvClearFavorites')?.addEventListener('click', () => {
    favorites.clear();
    saveFavorites();
    syncFavoriteButtons();
    renderWorkspace();
    renderSmartResults();
    window.dispatchEvent(new CustomEvent('rv:favorites-changed'));
  });
  document.getElementById('rvClearRecent')?.addEventListener('click', () => {
    recent = [];
    try { localStorage.removeItem(RECENT_KEY); } catch (_) {}
    renderWorkspace();
    renderSmartResults();
  });

  const toast = document.createElement('div');
  toast.className = 'rv-search-toast';
  toast.setAttribute('role', 'status');
  document.body.append(toast);
  let toastTimer;
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2400);
  }
  document.getElementById('share-search')?.addEventListener('click', async event => {
    const button = event.currentTarget;
    try {
      await navigator.clipboard.writeText(window.location.href);
      button.classList.add('is-copied');
      button.textContent = 'Odkaz zkopírován';
      showToast('Odkaz na aktuální hledání je ve schránce.');
      setTimeout(() => {
        button.classList.remove('is-copied');
        button.textContent = 'Sdílet tento výběr';
      }, 2200);
    } catch (_) {
      showToast('Aktuální výběr je uložený v adrese stránky.');
    }
  });
})();
