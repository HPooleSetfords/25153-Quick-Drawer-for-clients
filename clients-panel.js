// ============================================================
//  Sticky Clients panel (Figma 2955:68190).
//  Renders into <aside id="clients-pane"> on every page that
//  includes it, so the panel persists when navigating the
//  matters list and between individual matters.
//
//  State (active segment, search term) is kept in sessionStorage so it
//  survives page navigation. Accordions always start collapsed.
// ============================================================
(function () {
  const mount = document.getElementById('clients-pane');
  if (!mount) return;

  const clients = window.HALO_CLIENTS || [];

  // ---------- Icons ----------
  const iconSearch =
    '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
  const iconClear =
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
  // Right-pointing chevron — shown on hover for clients with a single matter.
  const iconChevronRight =
    '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>';
  // Down chevron — accordion indicator for clients with multiple matters.
  const iconChevronDown =
    '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';

  // ---------- Persisted state ----------
  const store = window.sessionStorage;
  const get = (k, d) => {
    try { const v = store.getItem(k); return v === null ? d : v; } catch (e) { return d; }
  };
  const set = (k, v) => { try { store.setItem(k, v); } catch (e) { /* ignore */ } };

  let activeSegment = get('halo.clients.segment', 'mine'); // mine | all | archived
  let term = get('halo.clients.term', '');
  // Multi-matter accordions are collapsed by default. We only carry the open
  // set across a navigation the user triggered by opening a matter, so the
  // originating accordion stays open on the destination page. It is consumed
  // on read — a plain reload returns to the collapsed default.
  const EXPAND_KEY = 'halo.clients.expand-once';
  let expanded;
  try { expanded = new Set(JSON.parse(get(EXPAND_KEY, '[]'))); }
  catch (e) { expanded = new Set(); }
  set(EXPAND_KEY, '[]');
  const snapshotExpanded = () => set(EXPAND_KEY, JSON.stringify([...expanded]));

  // ---------- Shell ----------
  mount.innerHTML = `
    <div class="clients-pane__head">
      <div class="clients-pane__heading">
        <p class="clients-pane__title">Clients</p>
        <p class="clients-pane__count" id="clients-count"></p>
      </div>
      <label class="clients-search">
        <span class="clients-search__icon" aria-hidden="true">${iconSearch}</span>
        <input class="clients-search__input" id="clients-search-input" type="search"
               placeholder="Search Clients" aria-label="Search clients" />
        <button class="clients-search__clear" id="clients-search-clear" type="button"
                aria-label="Clear search" hidden>${iconClear}</button>
      </label>
      <div class="clients-seg" role="tablist" aria-label="Filter clients">
        <button class="clients-seg__btn" type="button" role="tab" data-seg="mine">My Clients</button>
        <button class="clients-seg__btn" type="button" role="tab" data-seg="all">All</button>
        <button class="clients-seg__btn" type="button" role="tab" data-seg="archived">Archived</button>
      </div>
    </div>
    <div class="clients-pane__list" id="clients-list" role="list"></div>
  `;

  const listEl = mount.querySelector('#clients-list');
  const countEl = mount.querySelector('#clients-count');
  const searchInput = mount.querySelector('#clients-search-input');
  const searchClear = mount.querySelector('#clients-search-clear');
  const segBtns = mount.querySelectorAll('.clients-seg__btn');

  searchInput.value = term;

  // Show the clear ('x') affordance only when there's a term to clear.
  function syncSearchClear() {
    searchClear.hidden = !searchInput.value;
  }
  syncSearchClear();

  // ---------- Helpers ----------
  function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function escapeAttr(str) {
    return escapeHtml(str).replace(/"/g, '&quot;');
  }

  function getVisible() {
    const q = term.trim().toLowerCase();
    return clients.filter((c) => {
      if (activeSegment === 'mine' && !c.mine) return false;
      if (activeSegment === 'archived' && !c.archived) return false;
      if (q && !c.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }

  // ---------- Render ----------
  function renderSegments() {
    segBtns.forEach((b) => {
      const on = b.dataset.seg === activeSegment;
      b.classList.toggle('clients-seg__btn--active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
  }

  function renderList() {
    const visible = getVisible();
    const noun = activeSegment === 'archived' ? 'archived' : 'active';
    countEl.textContent = `${visible.length} ${noun} client${visible.length === 1 ? '' : 's'}`;

    if (!visible.length) {
      listEl.innerHTML = `<p class="clients-pane__empty">No clients found.</p>`;
      return;
    }

    listEl.innerHTML = visible.map((c) => {
      const nameHtml = escapeHtml(c.name);
      const nameAttr = escapeAttr(c.name);
      // Type + reference shown beneath the name, e.g. "Company - D651610".
      const meta = c.id ? `${c.type} - ${c.id}` : (c.type || '');
      const text = `
        <span class="client-item__text">
          <span class="client-item__name" title="${nameAttr}">${nameHtml}</span>
          ${meta ? `<span class="client-item__meta">${escapeHtml(meta)}</span>` : ''}
        </span>`;

      // Multiple matters — render an expandable accordion.
      if (c.matters.length > 1) {
        const isOpen = expanded.has(c.name);
        const rows = c.matters.map((m) => `
          <button class="client-matter" type="button" role="listitem"
                  data-ref="${escapeAttr(m.ref)}" data-title="${escapeAttr(m.description)}">
            <span class="client-matter__body">
              <span class="client-matter__top">
                <span class="client-matter__ref">${escapeHtml(m.ref)}</span>
                ${m.status ? `<span class="client-matter__status" data-status="${escapeAttr(m.status)}"><span class="client-matter__dot" aria-hidden="true"></span>${escapeHtml(m.status)}</span>` : ''}
              </span>
              <span class="client-matter__desc" title="${escapeAttr(m.description)}">${escapeHtml(m.description)}</span>
            </span>
            <span class="client-matter__icon" aria-hidden="true">${iconChevronRight}</span>
          </button>
        `).join('');
        return `
          <div class="client-group${isOpen ? ' client-group--open' : ''}">
            <button class="client-item client-item--group" type="button"
                    data-client="${nameAttr}" aria-expanded="${isOpen ? 'true' : 'false'}">
              ${text}
              <span class="client-item__icon client-item__chevron" aria-hidden="true">${iconChevronDown}</span>
            </button>
            <div class="client-matters" role="list"${isOpen ? '' : ' hidden'}>
              ${rows}
              <button class="client-matters__all" type="button" data-client="${nameAttr}">
                View all matters
              </button>
            </div>
          </div>
        `;
      }

      // Single matter — clicking opens it directly.
      const m = c.matters[0] || {};
      return `
        <button class="client-item client-item--single" type="button" role="listitem"
                data-ref="${escapeAttr(m.ref || '')}" data-title="${escapeAttr(m.description || '')}">
          ${text}
          <span class="client-item__icon client-item__icon--hover" aria-hidden="true">${iconChevronRight}</span>
        </button>
      `;
    }).join('');
  }

  function render() {
    renderSegments();
    renderList();
  }

  // Show a spinner in the list before search results appear — mirrors the
  // loading state used by the matters search.
  function renderListLoading() {
    listEl.innerHTML = `
      <div class="clients-loading" role="status" aria-live="polite" aria-busy="true">
        <span class="spinner" aria-hidden="true"></span>
        <span class="clients-loading__label">Searching…</span>
      </div>`;
  }

  let searchLoadingTimer = null;
  function runSearch() {
    if (searchLoadingTimer) clearTimeout(searchLoadingTimer);
    renderListLoading();
    searchLoadingTimer = setTimeout(() => {
      renderList();
      searchLoadingTimer = null;
    }, 1000);
  }

  // ---------- Events ----------
  segBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      activeSegment = btn.dataset.seg;
      set('halo.clients.segment', activeSegment);
      render();
    });
  });

  // Typing only updates the field; the search (and its loading state) runs
  // when the user submits the query — mirrors the matters search.
  searchInput.addEventListener('input', () => {
    term = searchInput.value;
    set('halo.clients.term', term);
    syncSearchClear();
  });

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      runSearch();
    }
  });

  searchClear.addEventListener('click', () => {
    if (searchLoadingTimer) { clearTimeout(searchLoadingTimer); searchLoadingTimer = null; }
    term = '';
    searchInput.value = '';
    set('halo.clients.term', term);
    syncSearchClear();
    renderList();
    searchInput.focus();
  });

  function openMatter(ref, title) {
    if (!ref) return;
    // Keep the originating accordion open on the destination page.
    snapshotExpanded();
    if (window.HaloTabs && typeof window.HaloTabs.openMatterTab === 'function') {
      window.HaloTabs.openMatterTab({ ref: ref, title: title || '' });
    } else {
      window.location.href =
        'matter.html?ref=' + encodeURIComponent(ref) + '&title=' + encodeURIComponent(title || '');
    }
  }

  // Open every matter for a client as its own tab, landing on the first.
  function openAllMatters(name) {
    const c = clients.find((x) => x.name === name);
    if (!c || !c.matters.length) return;
    snapshotExpanded();
    const tabs = window.HaloTabs;
    if (tabs && typeof tabs.openMatterTab === 'function') {
      // Register each matter as a tab, then navigate to the first one.
      if (typeof tabs.addMatterTab === 'function') {
        c.matters.slice(1).forEach((m) =>
          tabs.addMatterTab({ ref: m.ref, title: m.description }));
      }
      tabs.openMatterTab({ ref: c.matters[0].ref, title: c.matters[0].description });
    } else {
      openMatter(c.matters[0].ref, c.matters[0].description);
    }
  }

  listEl.addEventListener('click', (e) => {
    // Multi-matter client — toggle the accordion in place (no re-render, so
    // the list keeps its scroll position).
    const group = e.target.closest('.client-item--group');
    if (group) {
      const name = group.dataset.client;
      const wrap = group.closest('.client-group');
      const matters = wrap ? wrap.querySelector('.client-matters') : null;
      const open = !expanded.has(name);
      if (open) expanded.add(name);
      else expanded.delete(name);
      group.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (wrap) wrap.classList.toggle('client-group--open', open);
      if (matters) matters.hidden = !open;
      return;
    }

    // "View all matters" — open every matter for the client in its own tab.
    const all = e.target.closest('.client-matters__all');
    if (all) {
      openAllMatters(all.dataset.client);
      return;
    }

    // Single-matter client, or a matter row inside an expanded group —
    // open the associated matter.
    const opener = e.target.closest('.client-item--single, .client-matter');
    if (!opener) return;
    openMatter(opener.dataset.ref, opener.dataset.title);
  });

  // ---------- Right-click menu (open in new tab / window) ----------
  // Mirrors the matters-table row menu. Acts on a single matter (a matter row
  // or single-matter client) or every matter of a client (a multi-matter
  // header or the "View all matters" action).
  const iconCallMade =
    '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg>';

  let menuMatters = null; // [{ ref, title }] the menu acts on
  const ctxMenu = document.createElement('div');
  ctxMenu.className = 'matter-menu';
  ctxMenu.setAttribute('role', 'menu');
  ctxMenu.hidden = true;
  document.body.appendChild(ctxMenu);

  // The menu adapts to the target. A single matter offers both "new tab" and
  // "new window". Multiple matters only offer "new tab" — browsers can't
  // reliably open several windows from one click, so that option is dropped.
  function buildMenu(multi) {
    const tab =
      '<button class="matter-menu__item" type="button" role="menuitem" data-menu-action="tab"><span>' +
      (multi ? 'Open Matters in new tab' : 'Open in new tab') + '</span></button>';
    const win = multi ? '' :
      '<button class="matter-menu__item" type="button" role="menuitem" data-menu-action="window">' +
      '<span>Open in new window</span>' + iconCallMade + '</button>';
    ctxMenu.innerHTML = tab + win;
  }

  function mattersForTarget(el) {
    const byClient = (name) => {
      const c = clients.find((x) => x.name === name);
      return c ? c.matters.map((m) => ({ ref: m.ref, title: m.description })) : null;
    };
    const all = el.closest('.client-matters__all');
    if (all) return byClient(all.dataset.client);
    const matter = el.closest('.client-matter');
    if (matter) return [{ ref: matter.dataset.ref, title: matter.dataset.title }];
    const single = el.closest('.client-item--single');
    if (single && single.dataset.ref) return [{ ref: single.dataset.ref, title: single.dataset.title }];
    const group = el.closest('.client-item--group');
    if (group) return byClient(group.dataset.client);
    return null;
  }

  function openCtxMenu(x, y, matters) {
    menuMatters = matters;
    buildMenu(matters.length > 1);
    ctxMenu.hidden = false;
    const w = ctxMenu.offsetWidth;
    const h = ctxMenu.offsetHeight;
    ctxMenu.style.left = Math.max(8, Math.min(x, window.innerWidth - w - 8)) + 'px';
    ctxMenu.style.top = Math.max(8, Math.min(y, window.innerHeight - h - 8)) + 'px';
    const first = ctxMenu.querySelector('.matter-menu__item');
    if (first) first.focus();
  }

  function closeCtxMenu() {
    if (ctxMenu.hidden) return;
    ctxMenu.hidden = true;
    menuMatters = null;
  }

  listEl.addEventListener('contextmenu', (e) => {
    const matters = mattersForTarget(e.target);
    if (!matters || !matters.length) return;
    e.preventDefault();
    openCtxMenu(e.clientX, e.clientY, matters);
  });

  ctxMenu.addEventListener('click', (e) => {
    const item = e.target.closest('[data-menu-action]');
    if (!item || !menuMatters) return;
    const matters = menuMatters.filter((m) => m.ref);
    const action = item.dataset.menuAction;
    closeCtxMenu();
    const tabs = window.HaloTabs;
    if (!tabs) return;
    if (action === 'window' && typeof tabs.openMatterWindow === 'function') {
      matters.forEach((m, i) => tabs.openMatterWindow(m, i));
    } else if (typeof tabs.addMatterTab === 'function') {
      matters.forEach((m) => tabs.addMatterTab(m));
    }
  });

  document.addEventListener('click', (e) => { if (!ctxMenu.contains(e.target)) closeCtxMenu(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeCtxMenu(); });
  window.addEventListener('resize', closeCtxMenu);
  window.addEventListener('scroll', closeCtxMenu, true);

  render();
})();
