// ══════════════════════════════════════════════
// SUPABASE — single client, consistent naming
// ══════════════════════════════════════════════
const SUPABASE_URL = 'https://jzjjmpgonqbusumcryaj.supabase.co';
// WARNING: Replace this with your actual key or secure environment variable
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6amptcGdvbnFidXN1bWNyeWFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyODA0NTgsImV4cCI6MjA5Nzg1NjQ1OH0.k5A1OtUbsUT9UBZOD4-3T4-Mw-VHK9SWkzwF8Fp3NoM'; 
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ══════════════════════════════════════════════
// STATE
// ══════════════════════════════════════════════
let allVehicles = [];
let currentVehicle = null;
let currentUser = null;
let currentTab = 'home';
let currentLevel = null;
let selectedLotRect = null;
let selectedLotOrigFill = '#FFFFFF';
let selectedLotOrigStroke = '#C8CDB8';

const SAFETY_MESSAGES = [
  "Always check your mirrors before reversing. A moment of caution prevents a lifetime of regret.",
  "Keep walkways clear at all times. Pedestrians share this space — give them room.",
  "Do not exceed 10 km/h on all levels. Speed limits exist for your safety and others'.",
  "Report any oil spills or wet floors immediately to prevent slips and falls.",
  "Ensure your vehicle is in park with the handbrake engaged before leaving it.",
  "Never leave engines running in enclosed spaces. Carbon monoxide is invisible and deadly.",
  "Wear your high-visibility vest when working in the car park outside your vehicle.",
];

const LEVEL_META = {
  Workshop: { label:'Workshop', desc:'Maintenance & service bays', icon:'🔧', totalLots:25 },
  L1:       { label:'Level 1',  desc:'Ground level',               icon:'1',  totalLots:84 },
  L2:       { label:'Level 2',  desc:'Second level',               icon:'2',  totalLots:81 },
  L3:       { label:'Level 3',  desc:'Top level',                  icon:'3',  totalLots:81 },
};

// ══════════════════════════════════════════════
// UTILITY FUNCTIONS (Moved to global scope)
// ══════════════════════════════════════════════
function safe(val, fallback = '—') {
  return (val !== null && val !== undefined && val !== '') ? val : fallback;
}

// ══════════════════════════════════════════════
// VEHICLE DETAIL RENDERER
// ══════════════════════════════════════════════
function renderDetailScreen(v, latestEsc = null) {
  const fuelPct    = Number(v.fuel_pct)    || 0;
  const batPct     = Number(v.battery_pct) || 0;
  const fuelColor  = fuelPct > 50 ? 'var(--accent)' : fuelPct > 20 ? 'var(--warn)' : 'var(--danger)';
  const dInitials  = (v.driver || 'UN').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();

  document.getElementById('detail-badge').innerHTML =
    `<span class="badge badge-green" style="font-size:11px;">${v.level} · Lot ${v.lot}</span>`;

  // Build turret ESC section
  const escSection = latestEsc ? (() => {
    const escDate = latestEsc.created_at ? formatDate(latestEsc.created_at) : '—';
    const checks = [
      ['ICS', latestEsc.ics], ['GSU', latestEsc.gsu], ['WIM', latestEsc.wim],
      ['Trav Actuator', latestEsc.trav_actuator], ['Elev Actuator', latestEsc.elev_actuator],
      ['GCU', latestEsc.gcu], ['MDCU', latestEsc.mdcu], ['PSU', latestEsc.psu],
      ['Gun Gyro', latestEsc.gun_gyro], ['Conv Ass', latestEsc.conv_ass],
      ['Boost Box Ass', latestEsc.boost_box_ass], ['Slip Ring', latestEsc.slip_ring],
      ['Turr E-stop', latestEsc.turr_estop], ['Upplink Echute', latestEsc.upplink_echute],
      ['Upplink Splate', latestEsc.upplink_splate], ['Lowlink Splate', latestEsc.lowlink_splate],
      ['Lowlink Echute', latestEsc.lowlink_echute], ['Uppflex Chute', latestEsc.uppflex_chute],
      ['Lowflex Chute', latestEsc.lowflex_chute], ['LWS Comp', latestEsc.lws_comp],
    ];
    const checkRows = checks.map(([label, val]) => {
      const isNull = val === null || val === undefined;
      const icon = isNull ? '—' : val
        ? '<span style="color:var(--accent);font-weight:700;">✓</span>'
        : '<span style="color:var(--danger);font-weight:700;">✗</span>';
      return `<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid var(--border);">
        <div style="font-size:12px;">${label}</div>
        <div style="font-size:13px;">${icon}</div>
      </div>`;
    }).join('');
    return `
      <div class="section-label">Latest Turret ESC Checklist</div>
      <div class="card-sm" style="margin-bottom:12px;">
        <div style="font-size:11px;color:var(--muted);margin-bottom:10px;">
          Submitted by <strong>${safe(latestEsc.user_name)}</strong> · ${escDate}
        </div>
        ${checkRows}
        ${latestEsc.scu != null ? `<div style="font-size:12px;margin-top:8px;">SCU: <strong>${latestEsc.scu}</strong> &nbsp;·&nbsp; DCU: <strong>${latestEsc.dcu}</strong></div>` : ''}
        ${latestEsc.fault_list ? `<div style="font-size:12px;margin-top:6px;color:var(--danger);"><strong>Faults:</strong> ${latestEsc.fault_list}</div>` : ''}
        ${latestEsc.notes ? `<div style="font-size:12px;margin-top:4px;color:var(--muted);">${latestEsc.notes}</div>` : ''}
      </div>`;
  })() : `
    <div class="section-label">Latest Turret ESC Checklist</div>
    <div class="card-sm" style="margin-bottom:12px;text-align:center;color:var(--muted);font-size:13px;">
      No checklist submitted yet
    </div>`;

  document.getElementById('detail-body').innerHTML = `
    <div style="margin-bottom:18px;">
      <div style="font-family:'Syne',sans-serif;font-size:28px;font-weight:800;letter-spacing:-.5px;">${safe(v.plate)}</div>
      <div style="font-size:13px;color:var(--muted);margin-top:2px;">${safe(v.variant)}</div>
      <div style="font-size:12px;color:var(--muted);margin-top:4px;">Checked in: ${v.check_in ? formatDate(v.check_in) : '—'}</div>
    </div>

    <div class="section-label">Last Driver</div>
    <div class="driver-card">
      <div class="driver-avatar-sm">${dInitials}</div>
      <div style="flex:1;min-width:0;">
        <div style="font-weight:600;font-size:15px;">${safe(v.driver)}</div>
        <div style="font-size:12px;color:var(--muted);margin-top:1px;">${safe(v.driver_depot)}</div>
        <a href="tel:${safe(v.driver_phone,'')}" style="font-size:12px;color:var(--accent);text-decoration:none;margin-top:2px;display:block;font-weight:600;">${safe(v.driver_phone)}</a>
      </div>
    </div>

    <div class="section-label">Latest Readings</div>
    <div class="stat-grid" style="margin-bottom:12px;">
      <div class="stat-cell"><div class="stat-label">Odometer</div><div class="stat-value">${v.odometer != null ? Number(v.odometer).toLocaleString() : '—'} <span class="stat-unit">km</span></div></div>
      <div class="stat-cell"><div class="stat-label">Engine Hours</div><div class="stat-value">${safe(v.engine_hours)} <span class="stat-unit">hrs</span></div></div>
    </div>

    <div class="card-sm" style="margin-bottom:10px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
        <div style="font-size:12px;font-weight:600;">Starter</div>
        <div style="font-size:12px;color:var(--muted);">${v.starter_v || '--'}V | ${v.starter_pct || 0}%</div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div style="font-size:12px;font-weight:600;">Aux</div>
        <div style="font-size:12px;color:var(--muted);">${v.aux_v || '--'}V | ${v.aux_pct || 0}%</div>
      </div>
    </div>

    <div class="card-sm" style="margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <div style="font-size:12px;color:var(--muted);">Fuel Level</div>
        <div style="font-size:12px;color:var(--muted);">${safe(v.fuel_l)}L remaining</div>
      </div>
      <div style="display:flex;align-items:center;gap:12px;">
        <div style="font-size:22px;font-weight:700;color:${fuelColor};">${fuelPct}%</div>
        <div style="flex:1;"><div class="gauge-bar-wrap"><div class="gauge-bar" style="width:${fuelPct}%;background:${fuelColor};"></div></div></div>
      </div>
    </div>

    ${renderFireExtCard(v.fire_ext_expiry)}

    ${escSection}

    <div class="section-label">Description / Faults</div>
    <div class="field">
      <textarea id="detail-notes" style="min-height:100px;" placeholder="Notes or faults…">${v.notes || ''}</textarea>
    </div>

    <button class="btn btn-primary btn-full" style="margin-bottom:10px;" onclick="openUpdateModal()">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      Update Vehicle Record
    </button>
    <button class="btn btn-ghost btn-full" onclick="openHistory('${v.id}')" style="margin-bottom:10px;">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      View History
    </button>
    <button class="btn btn-full" onclick="driveOut('${v.id}')" style="background:rgba(192,57,43,.08);color:var(--danger);border:1px solid rgba(192,57,43,.25);font-weight:600;gap:8px;margin-bottom:24px;">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M19 17H5a2 2 0 0 1-2-2V7l2-3h12l2 3v8a2 2 0 0 1-2 2z"/><path d="M17 7l4 4-4 4"/></svg>
      Drive Out / Move Off
    </button>`;
}

// ══════════════════════════════════════════════
// CORE LOGIC FUNCTIONS
// ══════════════════════════════════════════════
async function openVehicle(id) {
  // Find vehicle in local list
  currentVehicle = allVehicles.find(x => String(x.id) === String(id));
  if (!currentVehicle) {
      console.warn("Vehicle not found in memory, attempting to load...");
      return;
  }

  // Fetch latest turret ESC log for this vehicle
  let latestEsc = null;
  try {
    const { data, error } = await sb
      .from('turret_esc_logs')
      .select('*')
      .eq('vehicle_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!error) latestEsc = data;
  } catch (e) {
    console.warn('Could not fetch turret ESC log:', e);
  }
  
  renderDetailScreen(currentVehicle, latestEsc);
  showScreen('detail');
}

// Consolidated into a single, clean function
async function openVehicleFromParking(id) {
    await openVehicle(id);
}

// ... rest of your code ...
