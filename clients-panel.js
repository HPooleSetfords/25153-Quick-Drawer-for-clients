// ============================================================
//  Sticky Clients panel (Figma 2955:68190).
//  Renders into <aside id="clients-pane"> on every page that
//  includes it, so the panel persists when navigating the
//  matters list and between individual matters.
//
//  State (active segment, search term, selected client) is kept
//  in sessionStorage so it survives page navigation.
// ============================================================
(function () {
  const mount = document.getElementById('clients-pane');
  if (!mount) return;

  const clients = window.HALO_CLIENTS || [];

  // ---------- Icons ----------
  const iconSearch =
    '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
  const iconChevron =
    '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';
  const iconNext =
    '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg>';

  // ---------- Persisted state ----------
  const store = window.sessionStorage;
  const get = (k, d) => {
    try { const v = store.getItem(k); return v === null ? d : v; } catch (e) { return d; }
  };
  const set = (k, v) => { try { store.setItem(k, v); } catch (e) { /* ignore */ } };

  let activeSegment = get('halo.clients.segment', 'mine'); // mine | all | archived
  let term = get('halo.clients.term', '');
  let selected = get('halo.clients.selected', '');

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
  const segBtns = mount.querySelectorAll('.clients-seg__btn');

  searchInput.value = term;

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
      const isSel = c.name === selected;
      return `
        <button class="client-item${isSel ? ' client-item--selected' : ''}" type="button"
                role="listitem" data-client="${escapeAttr(c.name)}"${isSel ? ' aria-current="true"' : ''}>
          <span class="client-item__name" title="${escapeAttr(c.name)}">${escapeHtml(c.name)}</span>
          <span class="client-item__icon client-item__icon--default" aria-hidden="true">${iconChevron}</span>
          <span class="client-item__icon client-item__icon--hover" aria-hidden="true">${iconNext}</span>
        </button>
      `;
    }).join('');
  }

  function render() {
    renderSegments();
    renderList();
  }

  // ---------- Events ----------
  segBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      activeSegment = btn.dataset.seg;
      set('halo.clients.segment', activeSegment);
      render();
    });
  });

  searchInput.addEventListener('input', () => {
    term = searchInput.value;
    set('halo.clients.term', term);
    renderList();
  });

  listEl.addEventListener('click', (e) => {
    const item = e.target.closest('.client-item');
    if (!item) return;
    selected = item.dataset.client;
    set('halo.clients.selected', selected);
    renderList();

    // Let the host page react (e.g. filter the matters table).
    document.dispatchEvent(new CustomEvent('halo:client-select', { detail: { name: selected } }));

    // On the matters list, filter the table in place; the matters page
    // exposes this hook. Elsewhere (matter detail) we jump back to the
    // list pre-filtered to the chosen client.
    if (window.HaloMatters && typeof window.HaloMatters.filterByClient === 'function') {
      window.HaloMatters.filterByClient(selected);
    } else if (!document.getElementById('matters-tbody')) {
      window.location.href = 'index.html#client=' + encodeURIComponent(selected);
    }
  });

  render();
})();
