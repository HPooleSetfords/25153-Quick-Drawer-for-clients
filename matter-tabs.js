// ============================================================
//  Matter tabs — open-matter strip shared across pages
//  Figma: node 2779-59031 (bar) + 2778-44469 (component states)
//  Open tabs persist in localStorage so the strip survives navigation.
// ============================================================
(function () {
  const STORAGE_KEY = 'halo:openMatterTabs';
  // Strip scroll position, kept across navigation so a clicked tab stays where
  // it was scrolled to instead of snapping back to the right edge.
  const SCROLL_KEY = 'halo:tabStripScroll';
  const MATTERS_HREF = 'index.html';

  function saveScroll(strip) {
    try {
      sessionStorage.setItem(SCROLL_KEY, String(Math.round(strip.scrollLeft)));
    } catch {
      /* sessionStorage unavailable — scroll just won't persist */
    }
  }
  function loadScroll() {
    try {
      return parseInt(sessionStorage.getItem(SCROLL_KEY) || '0', 10) || 0;
    } catch {
      return 0;
    }
  }

  // ---------- Persistence ----------
  function loadTabs() {
    try {
      const arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(arr) ? arr.filter((t) => t && t.ref) : [];
    } catch {
      return [];
    }
  }
  function saveTabs(tabs) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs));
    } catch {
      /* storage unavailable — strip just won't persist */
    }
  }

  // ---------- Helpers ----------
  function matterHref(ref, title) {
    const params = new URLSearchParams({ ref, title: title || '' });
    return 'matter.html?' + params.toString();
  }

  // The matter ref the current page is showing (active tab), if any.
  function currentRef() {
    const root = document.getElementById('matter-tabs');
    if (root && root.dataset.activeRef) return root.dataset.activeRef;
    return new URLSearchParams(location.search).get('ref') || '';
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
  function escapeAttr(str) {
    return escapeHtml(str).replace(/"/g, '&quot;');
  }

  // ---------- Icons ----------
  const iconClose =
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  const iconAdd =
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';
  const iconChevronLeft =
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>';
  const iconChevronRight =
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>';
  const iconSearch =
    '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
  const iconFilter =
    '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>';
  const iconCheck =
    '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
  const iconPlus =
    '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';

  // Status filters offered by the flyout's segmented control.
  const FLYOUT_FILTERS = ['All', 'Open', 'Favourite', 'Recent', 'Closing', 'Closed', 'Reopening'];

  // ---------- Public actions ----------
  // Open (or focus) a matter tab, then navigate to its detail page.
  function openMatterTab(matter) {
    if (!matter || !matter.ref) return;
    const tabs = loadTabs();
    if (!tabs.some((t) => t.ref === matter.ref)) {
      tabs.push({ ref: matter.ref, title: matter.title || '' });
      saveTabs(tabs);
    }
    window.location.href = matterHref(matter.ref, matter.title);
  }

  // Add a matter to the strip without leaving the current page. The strip
  // re-renders so the new tab appears immediately.
  function addMatterTab(matter) {
    if (!matter || !matter.ref) return;
    const tabs = loadTabs();
    if (!tabs.some((t) => t.ref === matter.ref)) {
      tabs.push({ ref: matter.ref, title: matter.title || '' });
      saveTabs(tabs);
    }
    render();
  }

  // Add the matter if it isn't open yet, otherwise remove it. Used by the
  // flyout where each row toggles between the add (+) and check states.
  function toggleMatterTab(matter) {
    if (!matter || !matter.ref) return;
    const tabs = loadTabs();
    const idx = tabs.findIndex((t) => t.ref === matter.ref);
    if (idx === -1) {
      tabs.push({ ref: matter.ref, title: matter.title || '' });
    } else {
      tabs.splice(idx, 1);
    }
    saveTabs(tabs);
    render();
    renderFlyoutList();
  }

  // Open a matter in a separate browser window. It's registered in the shared
  // tab strip (via localStorage) so the new window shows the same open tabs.
  // `index` cascades successive windows so they don't all stack in one spot.
  function openMatterWindow(matter, index) {
    if (!matter || !matter.ref) return;
    const tabs = loadTabs();
    if (!tabs.some((t) => t.ref === matter.ref)) {
      tabs.push({ ref: matter.ref, title: matter.title || '' });
      saveTabs(tabs);
    }
    // Chrome only opens a genuine separate window (not a new tab) when the
    // features string includes a size — so pass width/height (and position it).
    const i = index || 0;
    const offset = i * 40;
    const w = Math.min(1200, (screen.availWidth || 1200) - offset);
    const h = Math.min(860, (screen.availHeight || 860) - offset);
    const baseLeft = ((screen.availWidth || w) - w) / 2 + (screen.availLeft || 0);
    const baseTop = ((screen.availHeight || h) - h) / 2 + (screen.availTop || 0);
    const left = Math.max(0, baseLeft + offset);
    const top = Math.max(0, baseTop + offset);
    const features = `noopener,popup=yes,width=${Math.round(w)},height=${Math.round(h)},left=${Math.round(left)},top=${Math.round(top)}`;
    window.open(matterHref(matter.ref, matter.title), 'matter_' + matter.ref, features);
  }

  function closeTab(ref) {
    const tabs = loadTabs();
    const idx = tabs.findIndex((t) => t.ref === ref);
    if (idx === -1) return;
    const wasActive = ref === currentRef();
    tabs.splice(idx, 1);
    saveTabs(tabs);

    if (wasActive) {
      // Fall back to the neighbouring tab, or the matters list when none remain.
      const next = tabs[idx] || tabs[idx - 1];
      window.location.href = next ? matterHref(next.ref, next.title) : MATTERS_HREF;
    } else {
      render();
    }
  }

  // ---------- Render ----------
  function tabHtml(tab, isActive) {
    const ref = tab.ref || '';
    const title = tab.title || '';
    return (
      // No `title` attribute — the custom hover tooltip replaces the native one.
      `<div class="mt-tab${isActive ? ' mt-tab--active' : ''}" role="tab"` +
      ` aria-selected="${isActive}" tabindex="0" data-ref="${escapeAttr(ref)}"` +
      ` data-title="${escapeAttr(title)}">` +
      `<span class="mt-tab__label">` +
      `<span class="mt-tab__ref">${escapeHtml(ref)}</span>` +
      `<span class="mt-tab__title">${escapeHtml(title)}</span>` +
      `</span>` +
      `<button class="mt-tab__close" type="button" aria-label="Close ${escapeAttr(ref)}" data-close>${iconClose}</button>` +
      `</div>`
    );
  }

  function render() {
    const root = document.getElementById('matter-tabs');
    if (!root) return;
    // Tabs are about to be rebuilt — drop any stale hover/tooltip state.
    hoverTab = null;
    hideTip();
    const tabs = loadTabs();

    if (!tabs.length) {
      root.hidden = true;
      root.innerHTML = '';
      return;
    }

    const active = currentRef();
    root.hidden = false;
    root.innerHTML =
      `<button class="mt-nav mt-nav--left" type="button" aria-label="Scroll tabs left" hidden>${iconChevronLeft}</button>` +
      `<div class="mt-strip">` +
      tabs.map((t) => tabHtml(t, t.ref === active)).join('') +
      `<button class="mt-add mt-add--inline" type="button" aria-label="Open a new matter">${iconAdd}</button>` +
      `</div>` +
      `<button class="mt-nav mt-nav--right" type="button" aria-label="Scroll tabs right" hidden>${iconChevronRight}</button>` +
      `<button class="mt-add mt-add--outer" type="button" aria-label="Open a new matter" hidden>${iconAdd}</button>`;

    // Keep the open matter in view, then react to scroll/resize so the
    // chevrons appear only while there's something to scroll to.
    const strip = root.querySelector('.mt-strip');
    if (strip) {
      strip.addEventListener(
        'scroll',
        () => {
          updateNav();
          saveScroll(strip);
          hideTip();
        },
        { passive: true }
      );
      // Place the chevrons / outer add first so the strip has its final width,
      // restore the previous scroll position, then only nudge the active tab
      // into view if it isn't already fully visible there.
      updateNav();
      strip.scrollLeft = loadScroll();
      scrollActiveIntoView();
      updateNav();
    }
  }

  // ---------- Scroll navigation ----------
  // Show a chevron only when the strip can scroll further that way.
  function updateNav() {
    const root = document.getElementById('matter-tabs');
    if (!root) return;
    const strip = root.querySelector('.mt-strip');
    const left = root.querySelector('.mt-nav--left');
    const right = root.querySelector('.mt-nav--right');
    const inlineAdd = root.querySelector('.mt-add--inline');
    const outerAdd = root.querySelector('.mt-add--outer');
    if (!strip || !left || !right) return;

    const overflowing = strip.scrollWidth - strip.clientWidth > 1;

    // When the tabs overflow, the add button hops out of the strip to become
    // the right-most control (after the chevrons); otherwise it sits inline
    // right after the last tab.
    if (inlineAdd) inlineAdd.hidden = overflowing;
    if (outerAdd) outerAdd.hidden = !overflowing;

    // Both chevrons stay put while overflowing so the strip's visible width is
    // constant regardless of scroll position — otherwise scrolling the last
    // tab into view would shrink the strip and clip it again. The chevron that
    // can't scroll any further is disabled rather than removed.
    left.hidden = !overflowing;
    right.hidden = !overflowing;
    if (!overflowing) return;

    const maxScroll = strip.scrollWidth - strip.clientWidth;
    left.classList.toggle('mt-nav--disabled', strip.scrollLeft <= 0);
    right.classList.toggle('mt-nav--disabled', strip.scrollLeft >= maxScroll - 1);
  }

  // Reveal the next/previous tab. Paging by one tab width keeps a whole
  // tab coming into view per click without changing which one is open.
  function scrollStrip(direction) {
    const root = document.getElementById('matter-tabs');
    if (!root) return;
    const strip = root.querySelector('.mt-strip');
    if (!strip) return;
    const tab = strip.querySelector('.mt-tab');
    const amount = tab ? tab.offsetWidth : Math.round(strip.clientWidth * 0.8);
    strip.scrollBy({ left: direction * amount, behavior: 'smooth' });
  }

  // Make sure the active tab is visible without scrolling the page.
  function scrollActiveIntoView() {
    const root = document.getElementById('matter-tabs');
    if (!root) return;
    const strip = root.querySelector('.mt-strip');
    const tab = root.querySelector('.mt-tab--active');
    if (!strip || !tab) return;
    const MARGIN = 8; // breathing room so the tab isn't flush against an edge
    const tabLeft = tab.offsetLeft;
    const tabRight = tabLeft + tab.offsetWidth;
    if (tabLeft < strip.scrollLeft + MARGIN) {
      strip.scrollLeft = tabLeft - MARGIN;
    } else if (tabRight > strip.scrollLeft + strip.clientWidth - MARGIN) {
      strip.scrollLeft = tabRight - strip.clientWidth + MARGIN;
    }
  }

  // ---------- "Add a tab" flyout ----------
  // Figma: 2786-38750. The + button opens a searchable matter picker; each
  // row toggles whether that matter is in the strip.
  let flyout = null;
  let flyoutSearch = '';
  let flyoutFilter = 'All';

  function getMatters() {
    return Array.isArray(window.HALO_MATTERS) ? window.HALO_MATTERS : [];
  }

  function flyoutResults() {
    const term = flyoutSearch.trim().toLowerCase();
    return getMatters().filter((m) => {
      let okFilter = true;
      if (flyoutFilter === 'Favourite') okFilter = m.favourite === true;
      else if (flyoutFilter === 'Recent') okFilter = m.recent === true;
      else if (flyoutFilter !== 'All') okFilter = m.status === flyoutFilter;
      if (!okFilter) return false;
      if (!term) return true;
      return (
        (m.reference || '').toLowerCase().includes(term) ||
        (m.description || '').toLowerCase().includes(term)
      );
    });
  }

  function buildFlyout() {
    flyout = document.createElement('div');
    flyout.className = 'mt-flyout';
    flyout.hidden = true;
    flyout.innerHTML =
      `<div class="mt-flyout__head">` +
      `<div class="mt-flyout__toolbar">` +
      `<div class="mt-flyout__search">${iconSearch}` +
      `<input type="text" class="mt-flyout__search-input" placeholder="Search" aria-label="Search matters" />` +
      `</div>` +
      `<button class="mt-flyout__filter" type="button" aria-label="Filter">${iconFilter}</button>` +
      `</div>` +
      `<div class="mt-flyout__segments" role="tablist">` +
      FLYOUT_FILTERS.map(
        (f) =>
          `<button class="mt-seg${f === flyoutFilter ? ' mt-seg--active' : ''}" type="button" data-filter="${escapeAttr(f)}">${escapeHtml(f)}</button>`
      ).join('') +
      `</div>` +
      `</div>` +
      `<div class="mt-flyout__list" role="listbox"></div>`;
    document.body.appendChild(flyout);

    const input = flyout.querySelector('.mt-flyout__search-input');
    input.addEventListener('input', () => {
      flyoutSearch = input.value;
      renderFlyoutList();
    });

    flyout.addEventListener('click', (e) => {
      // Keep the flyout open: re-rendering the list detaches the clicked node,
      // which would otherwise trip the document outside-click handler.
      e.stopPropagation();
      const seg = e.target.closest('[data-filter]');
      if (seg) {
        flyoutFilter = seg.dataset.filter;
        flyout.querySelectorAll('.mt-seg').forEach((s) =>
          s.classList.toggle('mt-seg--active', s.dataset.filter === flyoutFilter)
        );
        renderFlyoutList();
        return;
      }
      const item = e.target.closest('.mt-result');
      if (item) {
        toggleMatterTab({ ref: item.dataset.ref, title: item.dataset.title });
      }
    });
  }

  function renderFlyoutList() {
    if (!flyout) return;
    const list = flyout.querySelector('.mt-flyout__list');
    if (!list) return;
    const open = new Set(loadTabs().map((t) => t.ref));
    const results = flyoutResults();

    if (!results.length) {
      list.innerHTML = `<p class="mt-flyout__empty">No matters found.</p>`;
      return;
    }

    list.innerHTML = results
      .map((m) => {
        const inTabs = open.has(m.reference);
        return (
          `<button class="mt-result" type="button" role="option" aria-selected="${inTabs}"` +
          ` data-ref="${escapeAttr(m.reference)}" data-title="${escapeAttr(m.description)}">` +
          `<span class="mt-result__text">` +
          `<span class="mt-result__ref">${escapeHtml(m.reference)}</span>` +
          `<span class="mt-result__desc">${escapeHtml(m.description)}</span>` +
          `</span>` +
          `<span class="mt-result__icon">${inTabs ? iconCheck : iconPlus}</span>` +
          `</button>`
        );
      })
      .join('');
  }

  function positionFlyout(addBtn) {
    // Right-align the flyout under the + button, clamped to the viewport.
    const rect = addBtn.getBoundingClientRect();
    const width = flyout.offsetWidth;
    let left = rect.right - width;
    left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
    flyout.style.left = left + 'px';
    flyout.style.top = rect.bottom + 6 + 'px';
  }

  function openFlyout(addBtn) {
    if (!flyout) buildFlyout();
    flyoutSearch = '';
    const input = flyout.querySelector('.mt-flyout__search-input');
    if (input) input.value = '';
    renderFlyoutList();
    flyout.hidden = false;
    positionFlyout(addBtn);
    if (input) input.focus();
  }

  function closeFlyout() {
    if (flyout && !flyout.hidden) flyout.hidden = true;
  }

  function flyoutOpen() {
    return flyout && !flyout.hidden;
  }

  // ---------- Hover tooltip ----------
  // Figma: 2798-44882. After a short hover on a non-active tab, show a flyout
  // with the matter's ref, status, client and full description.
  const TIP_DELAY = 500;
  let tip = null;
  let tipTimer = null;
  let hoverTab = null;

  function lookupMatter(ref) {
    const list = Array.isArray(window.HALO_MATTERS) ? window.HALO_MATTERS : [];
    return list.find((m) => m.reference === ref) || null;
  }

  function showTip(tab) {
    const ref = tab.dataset.ref || '';
    const m = lookupMatter(ref) || {
      reference: ref,
      description: tab.dataset.title || '',
      client: '',
      status: '',
    };
    if (!tip) {
      tip = document.createElement('div');
      tip.className = 'mt-tip';
      document.body.appendChild(tip);
    }
    const statusHtml = m.status
      ? `<span class="mt-tip__status" data-status="${escapeAttr(m.status)}">` +
        `<span class="mt-tip__dot"></span>${escapeHtml(m.status)}</span>`
      : '';
    const clientHtml = m.client
      ? `<span class="mt-tip__client">${escapeHtml(m.client)}</span>`
      : '';
    tip.innerHTML =
      `<div class="mt-tip__top">` +
      `<span class="mt-tip__ref">${escapeHtml(m.reference || ref)}</span>` +
      statusHtml +
      `</div>` +
      `<div class="mt-tip__body">` +
      clientHtml +
      `<span class="mt-tip__desc">${escapeHtml(m.description || '')}</span>` +
      `</div>`;

    tip.hidden = false;
    // Position below the tab, left-aligned, clamped to the viewport.
    const rect = tab.getBoundingClientRect();
    const width = tip.offsetWidth;
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
    tip.style.left = left + 'px';
    tip.style.top = rect.bottom + 6 + 'px';
  }

  function hideTip() {
    if (tipTimer) {
      clearTimeout(tipTimer);
      tipTimer = null;
    }
    if (tip && !tip.hidden) tip.hidden = true;
  }

  // ---------- Events ----------
  function bind() {
    const root = document.getElementById('matter-tabs');
    if (!root) return;

    root.addEventListener('click', (e) => {
      // Close button takes priority over tab activation.
      const closeBtn = e.target.closest('[data-close]');
      if (closeBtn) {
        e.stopPropagation();
        const tab = closeBtn.closest('.mt-tab');
        if (tab) closeTab(tab.dataset.ref);
        return;
      }

      const navBtn = e.target.closest('.mt-nav');
      if (navBtn) {
        scrollStrip(navBtn.classList.contains('mt-nav--left') ? -1 : 1);
        return;
      }

      const addBtn = e.target.closest('.mt-add');
      if (addBtn) {
        e.stopPropagation();
        if (flyoutOpen()) closeFlyout();
        else openFlyout(addBtn);
        return;
      }

      const tab = e.target.closest('.mt-tab');
      if (!tab || tab.classList.contains('mt-tab--active')) return;
      window.location.href = matterHref(tab.dataset.ref, tab.dataset.title);
    });

    // Keyboard: Enter / Space activates the focused tab.
    root.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const tab = e.target.closest('.mt-tab');
      if (!tab || tab.classList.contains('mt-tab--active')) return;
      e.preventDefault();
      window.location.href = matterHref(tab.dataset.ref, tab.dataset.title);
    });

    // Hover tooltip on non-active tabs, after a short delay.
    root.addEventListener('mouseover', (e) => {
      const tab = e.target.closest('.mt-tab');
      if (!tab || tab.classList.contains('mt-tab--active')) {
        if (hoverTab) {
          hoverTab = null;
          hideTip();
        }
        return;
      }
      if (tab === hoverTab) return; // already tracking this tab
      hoverTab = tab;
      hideTip(); // cancel any pending/shown tip for the previous tab
      tipTimer = setTimeout(() => showTip(tab), TIP_DELAY);
    });
    root.addEventListener('mouseout', (e) => {
      const tab = e.target.closest('.mt-tab');
      if (!tab) return;
      // Ignore moves that stay within the same tab.
      if (e.relatedTarget && tab.contains(e.relatedTarget)) return;
      if (hoverTab === tab) hoverTab = null;
      hideTip();
    });

    // Re-evaluate chevron visibility when the bar width changes.
    window.addEventListener('resize', updateNav, { passive: true });

    // Dismiss the flyout on an outside click, Escape or resize.
    document.addEventListener('click', (e) => {
      if (flyoutOpen() && flyout && !flyout.contains(e.target)) closeFlyout();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeFlyout();
    });
    window.addEventListener('resize', () => {
      closeFlyout();
      hideTip();
    });
  }

  // On a matter detail page, reflect the opened matter (passed via query
  // string) in the header so the page matches its tab.
  function syncMatterHeader() {
    const params = new URLSearchParams(location.search);
    const ref = params.get('ref');
    const title = params.get('title');
    if (!ref) return;

    const refEl = document.querySelector('.matter-ref span');
    if (refEl) refEl.textContent = ref;
    if (title) {
      const titleEl = document.querySelector('.matter-title');
      if (titleEl) titleEl.textContent = title;
      document.title = ref + ' — ' + title;
    }

    // Reflect the opened matter's type, status and client in the header
    // (looked up from the shared dataset by ref).
    const matter = lookupMatter(ref);

    const typeEl = document.querySelector('.matter-type');
    if (typeEl) {
      const type = matter && matter.type ? matter.type : '';
      typeEl.textContent = type ? 'Type: ' + type : '';
      typeEl.hidden = !type;
    }

    const statusBadge = document.querySelector('.matter-status');
    if (statusBadge && matter && matter.status) {
      const statusText = statusBadge.querySelector('.matter-status__text');
      if (statusText) statusText.textContent = matter.status;
      const dot = statusBadge.querySelector('.dot');
      if (dot) dot.setAttribute('data-tone', statusTone(matter.status));
    }

    const clientEl = document.querySelector('.matter-client');
    const sepEl = document.querySelector('.matter-meta__sep');
    if (clientEl) {
      const client = matter && matter.client ? matter.client : '';
      clientEl.textContent = client;
      clientEl.hidden = !client;
      if (sepEl) sepEl.hidden = !client;
    }
  }

  // On a matter detail page, make sure the open matter always has its own tab
  // so the strip is visible even when the page was opened directly (e.g. a
  // deep link or a fresh session) rather than from the matters list. Without
  // this, loadTabs() is empty and render() hides the whole strip.
  function ensureCurrentTab() {
    if (!document.querySelector('.matter-header')) return; // not a detail page

    const params = new URLSearchParams(location.search);
    const refEl = document.querySelector('.matter-ref span');
    const titleEl = document.querySelector('.matter-title');
    const ref = params.get('ref') || (refEl ? refEl.textContent.trim() : '');
    if (!ref) return;
    const title = params.get('title') || (titleEl ? titleEl.textContent.trim() : '');

    // Flag the open matter as active so render() highlights its tab even when
    // there's no ?ref= query param to fall back on.
    const root = document.getElementById('matter-tabs');
    if (root) root.dataset.activeRef = ref;

    const tabs = loadTabs();
    if (!tabs.some((t) => t.ref === ref)) {
      tabs.push({ ref, title });
      saveTabs(tabs);
    }
  }

  // Map a matter status to a header dot tone.
  function statusTone(status) {
    switch (status) {
      case 'Closed':
        return 'muted';
      case 'Closing':
        return 'warn';
      case 'Reopening':
        return 'brand';
      default:
        return 'positive'; // Open
    }
  }

  // ---------- Init ----------
  function init() {
    syncMatterHeader();
    ensureCurrentTab();
    bind();
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for the matters table.
  window.HaloTabs = { openMatterTab, addMatterTab, toggleMatterTab, openMatterWindow, closeTab, render };
})();
