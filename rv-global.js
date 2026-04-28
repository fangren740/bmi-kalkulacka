(function () {
  if (window.__rvGlobalLoaded) return;
  window.__rvGlobalLoaded = true;

  const path = window.location.pathname.replace(/\/$/, '') || '/';

  document.querySelectorAll('.topnav a[href]').forEach((link) => {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    const normalized = href.replace(/\/$/, '') || '/';
    if (normalized === path) link.setAttribute('aria-current', 'page');
  });

  const main = document.querySelector('main');
  if (main && !main.id) main.id = 'main-content';

  const topnav = document.querySelector('.topnav');
  if (topnav && !topnav.getAttribute('aria-label')) topnav.setAttribute('aria-label', 'Hlavní navigace');

  document.querySelectorAll('main h2, main h3').forEach((heading) => {
    if (heading.id) return;
    const text = (heading.textContent || '').trim().toLowerCase();
    if (!text) return;
    let slug = text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 80);
    if (!slug) return;
    let unique = slug;
    let i = 2;
    while (document.getElementById(unique)) unique = slug + '-' + i++;
    heading.id = unique;
  });

  Array.from(document.images || []).forEach((img, index) => {
    if (!img.hasAttribute('decoding')) img.decoding = 'async';
    const likelyAboveFold = index < 2 || img.closest('.hero, .hero-media, .hero-visual, header');
    if (!img.hasAttribute('loading') && !likelyAboveFold) img.loading = 'lazy';
    if (!img.hasAttribute('fetchpriority') && likelyAboveFold) img.setAttribute('fetchpriority', 'high');
  });

  document.querySelectorAll('table').forEach((table) => {
    const parent = table.parentElement;
    if (table.closest('.table-scroll, .table-wrap')) return;
    if (parent) {
      const parentClass = parent.className || '';
      const hasCustomScrollWrap = typeof parentClass === 'string' && /(?:^|\s)(?:[\w-]*table[\w-]*|[\w-]*scroll[\w-]*|[\w-]*wrap[\w-]*)(?:\s|$)/.test(parentClass);
      const parentStyle = window.getComputedStyle(parent);
      if (hasCustomScrollWrap || /(auto|scroll)/.test(parentStyle.overflowX)) return;
    }
    const wrapper = document.createElement('div');
    wrapper.className = 'table-scroll';
    table.parentNode.insertBefore(wrapper, table);
    wrapper.appendChild(table);
  });

  let btn = document.getElementById('rvBackToTop');
  if (!btn) {
    btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'rvBackToTop';
    btn.className = 'back-to-top';
    btn.setAttribute('aria-label', 'Zpět nahoru');
    btn.textContent = '↑';
    document.body.appendChild(btn);
  }

  if (!btn.dataset.rvBound) {
    const toggle = () => btn.classList.toggle('is-visible', window.scrollY > 520);
    toggle();
    window.addEventListener('scroll', toggle, { passive: true });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    btn.dataset.rvBound = '1';
  }
})();