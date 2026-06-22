// ============================================================
//  Collapsible navigation sidebar.
//  Wires up the existing .sidebar__collapse chevron to toggle
//  the dark nav between full and icon-only widths. The state is
//  persisted in localStorage so it stays consistent across the
//  matters list and individual matters.
// ============================================================
(function () {
  const app = document.querySelector('.app');
  const btn = document.querySelector('.sidebar__collapse');
  if (!app || !btn) return;

  const KEY = 'halo.sidebar.collapsed';
  const menuItems = document.querySelectorAll('.sidebar__menu .menu-item');

  function apply(collapsed) {
    app.classList.toggle('is-sidebar-collapsed', collapsed);
    btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    btn.setAttribute('aria-label', collapsed ? 'Expand sidebar' : 'Collapse sidebar');
    // When labels are hidden, surface them as tooltips for accessibility.
    menuItems.forEach((item) => {
      const label = item.querySelector('span');
      if (collapsed && label) item.setAttribute('title', label.textContent.trim());
      else item.removeAttribute('title');
    });
  }

  let collapsed = false;
  try { collapsed = localStorage.getItem(KEY) === '1'; } catch (e) { /* ignore */ }

  // Apply the saved state before enabling transitions so the page
  // doesn't visibly animate from open to collapsed on load.
  apply(collapsed);
  requestAnimationFrame(() => app.classList.add('has-sidebar-anim'));

  btn.addEventListener('click', () => {
    collapsed = !collapsed;
    try { localStorage.setItem(KEY, collapsed ? '1' : '0'); } catch (e) { /* ignore */ }
    apply(collapsed);
  });
})();
