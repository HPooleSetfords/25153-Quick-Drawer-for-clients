// ---------- Sample data ----------
// Defined in matters-data.js (shared with the tab-strip flyout).
const matters = window.HALO_MATTERS || [];

// ---------- State ----------
let activeTab = 'Open';
let searchTerm = '';

// ---------- DOM ----------
const tbody = document.getElementById('matters-tbody');
const emptyEl = document.getElementById('table-empty');
const loadingEl = document.getElementById('table-loading');
const countEl = document.getElementById('pagination-count');
const searchForm = document.getElementById('matter-search-form');
const searchInput = document.getElementById('matter-search');
const searchClearBtn = document.getElementById('matter-search-clear');
const tabButtons = document.querySelectorAll('.seg-btn');

// Show the clear ('x') affordance only when there's a query to clear.
function syncSearchClear() {
  if (searchClearBtn) searchClearBtn.hidden = !searchInput.value;
}

// ---------- Icons ----------
const heartOutline = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';
const heartFilled  = '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';
// call_made — used on the "Open in new window" menu item
const iconCallMade = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg>';

// ---------- Render ----------
function renderRows() {
  const term = searchTerm.trim().toLowerCase();

  const visible = matters.filter((m) => {
    // Tab filter
    let matchesTab = true;
    if (activeTab === 'Favourite')      matchesTab = m.favourite === true;
    else if (activeTab === 'Recent')    matchesTab = m.recent === true;
    else if (activeTab === 'All')       matchesTab = true;
    else                                matchesTab = m.status === activeTab; // Open / Closing / Closed / Reopening

    if (!matchesTab) return false;

    // Search filter — match against any visible text field
    if (!term) return true;
    return (
      m.description.toLowerCase().includes(term) ||
      m.reference.toLowerCase().includes(term)   ||
      m.client.toLowerCase().includes(term)      ||
      m.status.toLowerCase().includes(term)      ||
      m.type.toLowerCase().includes(term)        ||
      m.feeEarner.toLowerCase().includes(term)
    );
  });

  tbody.innerHTML = visible.map((m, idx) => {
    return `
    <tr data-idx="${matters.indexOf(m)}" data-ref="${escapeAttr(m.reference)}" data-title="${escapeAttr(m.description)}" class="row-link">
      <td class="col-fav">
        <button class="fav-btn" type="button" aria-label="${m.favourite ? 'Remove from favourites' : 'Add to favourites'}" data-fav>
          ${m.favourite ? heartFilled : heartOutline}
        </button>
      </td>
      <td class="col-desc" title="${escapeAttr(m.description)}">${escapeHtml(m.description)}</td>
      <td class="col-reference">${escapeHtml(m.reference)}</td>
      <td class="col-client" title="${escapeAttr(m.client)}">${escapeHtml(m.client)}</td>
      <td class="col-status"><span class="status-pill" data-status="${escapeAttr(m.status)}">${escapeHtml(m.status)}</span></td>
      <td class="col-type" title="${escapeAttr(m.type)}">${escapeHtml(m.type)}</td>
      <td class="col-earner">${escapeHtml(m.feeEarner)}</td>
      <td class="col-office">-</td>
      <td class="col-action"><button class="action-btn" type="button" aria-label="Row actions">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><circle cx="12" cy="5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="19" r="1.6"/></svg>
      </button></td>
    </tr>
  `;
  }).join('');

  emptyEl.hidden = visible.length !== 0;
  // Static label per design; the filtered count would only be informational.
  countEl.textContent = '1 of 4553 pages (113803 items)';
}

// ---------- Helpers ----------
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
function escapeAttr(str) {
  return escapeHtml(str).replace(/"/g, '&quot;');
}

// ---------- Events ----------
tabButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    tabButtons.forEach((b) => {
      b.classList.remove('seg-btn--active');
      b.setAttribute('aria-selected', 'false');
    });
    btn.classList.add('seg-btn--active');
    btn.setAttribute('aria-selected', 'true');
    activeTab = btn.dataset.tab;
    renderRows();
  });
});

let searchLoadingTimer = null;
function runSearch(value) {
  if (searchLoadingTimer) clearTimeout(searchLoadingTimer);
  loadingEl.hidden = false;
  emptyEl.hidden = true;
  tbody.innerHTML = '';
  searchLoadingTimer = setTimeout(() => {
    searchTerm = value;
    loadingEl.hidden = true;
    renderRows();
    syncSearchClear();
    searchLoadingTimer = null;
  }, 1000);
}

searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  runSearch(searchInput.value);
});

// Keep the clear button in sync as the user types.
searchInput.addEventListener('input', syncSearchClear);

// Clear the query — removes the client-name filter applied from the panel.
if (searchClearBtn) {
  searchClearBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchTerm = '';
    syncSearchClear();
    renderRows();
    searchInput.focus();
  });
}

// Toggle favourite from the table — handled before row navigation
tbody.addEventListener('click', (e) => {
  const favBtn = e.target.closest('[data-fav]');
  if (favBtn) {
    e.stopPropagation();
    const row = favBtn.closest('tr');
    const idx = Number(row.dataset.idx);
    if (Number.isNaN(idx)) return;
    matters[idx].favourite = !matters[idx].favourite;
    renderRows();
    return;
  }

  // Kebab/action button opens the same menu as a right-click, anchored to it.
  const actionBtn = e.target.closest('.action-btn');
  if (actionBtn) {
    e.stopPropagation();
    const row = actionBtn.closest('tr.row-link');
    if (!row) return;
    const rect = actionBtn.getBoundingClientRect();
    openRowMenu(rect.right, rect.bottom, { ref: row.dataset.ref, title: row.dataset.title });
    return;
  }

  // Otherwise open a tab for the matter and navigate to its detail page
  const row = e.target.closest('tr.row-link');
  if (!row) return;
  window.HaloTabs.openMatterTab({ ref: row.dataset.ref, title: row.dataset.title });
});

// ---------- Row context menu (open in new tab / window) ----------
// Figma: 2781-46673. Right-click a row (or use the kebab) to choose where
// to open the matter — one of our tabs, or a separate browser window.
let menuMatter = null;
const rowMenu = document.createElement('div');
rowMenu.className = 'matter-menu';
rowMenu.setAttribute('role', 'menu');
rowMenu.hidden = true;
rowMenu.innerHTML =
  '<button class="matter-menu__item" type="button" role="menuitem" data-menu-action="tab">' +
    '<span>Open in new tab</span>' +
  '</button>' +
  '<button class="matter-menu__item" type="button" role="menuitem" data-menu-action="window">' +
    '<span>Open in new window</span>' + iconCallMade +
  '</button>';
document.body.appendChild(rowMenu);

function openRowMenu(x, y, matter) {
  menuMatter = matter;
  rowMenu.hidden = false;
  // Clamp to the viewport so the menu never opens off-screen.
  const w = rowMenu.offsetWidth;
  const h = rowMenu.offsetHeight;
  const left = Math.max(8, Math.min(x, window.innerWidth - w - 8));
  const top = Math.max(8, Math.min(y, window.innerHeight - h - 8));
  rowMenu.style.left = left + 'px';
  rowMenu.style.top = top + 'px';
  rowMenu.querySelector('.matter-menu__item').focus();
}

function closeRowMenu() {
  if (rowMenu.hidden) return;
  rowMenu.hidden = true;
  menuMatter = null;
}

tbody.addEventListener('contextmenu', (e) => {
  const row = e.target.closest('tr.row-link');
  if (!row) return;
  e.preventDefault();
  openRowMenu(e.clientX, e.clientY, { ref: row.dataset.ref, title: row.dataset.title });
});

rowMenu.addEventListener('click', (e) => {
  const item = e.target.closest('[data-menu-action]');
  if (!item || !menuMatter) return;
  const matter = menuMatter;
  const action = item.dataset.menuAction;
  closeRowMenu();
  if (action === 'window') {
    window.HaloTabs.openMatterWindow(matter);
  } else {
    // Add the tab but keep the user on the matters list.
    window.HaloTabs.addMatterTab(matter);
  }
});

// Dismiss the menu on an outside click, Escape, scroll or resize.
document.addEventListener('click', (e) => {
  if (!rowMenu.contains(e.target)) closeRowMenu();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeRowMenu();
});
window.addEventListener('resize', closeRowMenu);
window.addEventListener('scroll', closeRowMenu, true);

// ---------- Clients panel integration ----------
// The sticky Clients panel (clients-panel.js) calls this to filter the
// table to a single client. We switch to the "All" status tab so matters
// in any state are shown, then search by the client name.
window.HaloMatters = {
  filterByClient(name) {
    activeTab = 'All';
    tabButtons.forEach((b) => {
      const on = b.dataset.tab === 'All';
      b.classList.toggle('seg-btn--active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    if (searchInput) searchInput.value = name;
    syncSearchClear();
    // Switching clients triggers a fresh search — show the spinner before
    // the results appear, mirroring a typed search.
    runSearch(name);
  },
};

// Allow deep-linking from the matter detail page: index.html#client=<name>
(function applyClientHash() {
  const match = /(?:^|#|&)client=([^&]+)/.exec(window.location.hash);
  if (match) {
    try {
      window.HaloMatters.filterByClient(decodeURIComponent(match[1]));
    } catch (e) {
      /* ignore malformed hash */
    }
  }
})();

// ---------- Init ----------
syncSearchClear();
renderRows();
