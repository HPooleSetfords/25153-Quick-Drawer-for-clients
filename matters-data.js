// ============================================================
//  Shared matter dataset
//  Used by the matters table (matters.js) and the "add tab"
//  flyout in the tab strip (matter-tabs.js), so it lives in a
//  standalone file loaded by every page.
//  `recent`     — appears under the Recent filter.
//  `favourite`  — appears under the Favourite filter, filled heart.
// ============================================================
window.HALO_MATTERS = [
  { description: 'Ground Floor Retail Unit Lease',        reference: '110/1',     client: '121E143LH LTD',           status: 'Open',      type: 'Property / Commercial',         feeEarner: 'Fiasal Asl…',    favourite: false, recent: true  },
  { description: 'Purchase of the Freehold',              reference: '60002/1',   client: '65 Garratt Terrace…',     status: 'Open',      type: 'Property / Commercial',         feeEarner: 'Paul Reyn…',     favourite: false, recent: true  },
  { description: 'Purchase of 14 Durham Road',            reference: 'A1/1',      client: 'Mohamed Alsheb…',         status: 'Open',      type: 'Property / Residential',        feeEarner: 'Guy Setfo…',     favourite: false, recent: false },
  { description: 'Dispute with Mrs Mayhew',               reference: 'A8/7',      client: 'Mark Appleton',           status: 'Open',      type: 'Litigation / General…',         feeEarner: 'Tessie Be…',     favourite: false, recent: false },
  { description: 'Purchase 8 Bloomsbury Court',           reference: 'A25/1',     client: 'Adrian Adamson',          status: 'Open',      type: 'Property / Residential',        feeEarner: 'Guy Setfo…',     favourite: false, recent: true  },
  { description: 'Purchase of 17 Wickham Avenue',         reference: 'A204/3',    client: 'Jennifer Moir Allen',     status: 'Open',      type: 'Property / Residential',        feeEarner: 'Sarah Gill…',    favourite: false, recent: false },
  { description: 'Sale of 8 Home Croft Drive',            reference: 'A204/4',    client: 'Jennifer Moir Allen',     status: 'Closing',   type: 'Property / Residential',        feeEarner: 'Sarah Gill…',    favourite: false, recent: true  },
  { description: 'Purchase of Saxon House',               reference: 'A208/4',    client: 'J Andrews',               status: 'Open',      type: 'Property / Residential',        feeEarner: 'Crispin D…',     favourite: false, recent: false },
  { description: 'Property litigation Forsythe matter',   reference: 'A252/1',    client: 'Annette Alderson',        status: 'Open',      type: 'Litigation / Property…',        feeEarner: 'Greg Bar…',      favourite: false, recent: false },
  { description: 'Lease extension and consent',           reference: 'A419/3',    client: 'David Anderson',          status: 'Open',      type: 'Landlord & Tenant /…',          feeEarner: 'Natalie T…',     favourite: false, recent: true  },
  { description: 'Estate of Mrs Beatrice Hale',           reference: 'B12/2',     client: 'Hale Estate',             status: 'Closed',    type: 'Probate / Estates',             feeEarner: 'Paul Reyn…',     favourite: false, recent: false },
  { description: 'Reopen — Smith v Jones',                reference: 'C99/4',     client: 'Marcus Smith',            status: 'Reopening', type: 'Litigation / General…',         feeEarner: 'Tessie Be…',     favourite: false, recent: true  },
  { description: 'Sale of Pinewood Industrial Unit',      reference: 'D45/1',     client: 'Pinewood Holdings Ltd',   status: 'Closing',   type: 'Property / Commercial',         feeEarner: 'Fiasal Asl…',    favourite: false, recent: false },
  { description: 'Old retainer — Lambert',                reference: 'E07/2',     client: 'Lambert & Co',            status: 'Closed',    type: 'Corporate / Advice',            feeEarner: 'Greg Bar…',      favourite: false, recent: false },
  { description: 'Lease renewal — 22 High Street',        reference: 'F11/9',     client: 'Greenway Retail',         status: 'Reopening', type: 'Landlord & Tenant /…',          feeEarner: 'Natalie T…',     favourite: false, recent: true  },
];
