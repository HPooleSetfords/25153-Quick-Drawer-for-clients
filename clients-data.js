// ============================================================
//  Clients dataset for the sticky Clients panel.
//  Names are derived from the shared matter dataset
//  (matters-data.js) — we take the distinct "Client Name"
//  values so the panel always reflects the real matters.
//  `mine`      — appears under the "My Clients" segment.
//  `archived`  — appears under the "Archived" segment.
// ============================================================
(function () {
  const matters = window.HALO_MATTERS || [];

  // Distinct client names, in the order they first appear.
  const seen = new Set();
  const names = [];
  matters.forEach((m) => {
    const name = (m.client || '').trim();
    if (!name || seen.has(name)) return;
    seen.add(name);
    names.push(name);
  });

  // Alphabetical, matching the Figma design's ordering.
  names.sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));

  // The matter dataset has no ownership/archive data yet, so we flag a
  // couple of clients as archived to keep the segmented filter meaningful.
  const ARCHIVED = new Set(['Hale Estate', 'Lambert & Co']);

  window.HALO_CLIENTS = names.map((name) => ({
    name,
    mine: !ARCHIVED.has(name),
    archived: ARCHIVED.has(name),
  }));
})();
