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

  // The dataset carries no client type/reference, so we derive plausible
  // mock values: company-style names get "Company", everyone else
  // "Individual", and each client a deterministic reference (letter + digits)
  // shown beside the name — e.g. "Company - D651610".
  const COMPANY_RE = /\b(ltd|limited|llp|plc|inc|holdings|group|properties|corporation|company|& co|retail)\b/i;
  function clientType(name) {
    return COMPANY_RE.test(name) ? 'Company' : 'Individual';
  }
  function clientId(name) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
    const letter = (name.match(/[A-Za-z]/) || ['C'])[0].toUpperCase();
    return letter + String(h % 1000000).padStart(6, '0');
  }

  window.HALO_CLIENTS = names.map((name) => ({
    name,
    mine: !ARCHIVED.has(name),
    archived: ARCHIVED.has(name),
    type: clientType(name),
    id: clientId(name),
    // Every matter belonging to this client, in dataset order. Drives the
    // panel behaviour: 1 matter → open it directly, >1 → expand an accordion.
    matters: matters
      .filter((m) => (m.client || '').trim() === name)
      .map((m) => ({ ref: m.reference, description: m.description, status: m.status })),
  }));
})();
