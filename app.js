// ══════════════════════════════════════════════
// SUPABASE — single client, consistent naming
// ══════════════════════════════════════════════
const SUPABASE_URL = 'https://jzjjmpgonqbusumcryaj.supabase.co';
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
// INIT — auth check then load everything
// ══════════════════════════════════════════════
async function init() {
  // Safety message
  const day = Math.floor((new Date() - new Date(new Date().getFullYear(),0,0)) / 86400000);
  document.getElementById('safety-msg').textContent = SAFETY_MESSAGES[day % SAFETY_MESSAGES.length];
  document.getElementById('safety-date').textContent = new Date().toLocaleDateString('en-SG', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

  // Auth check
  try {
    const { data: { session }, error } = await sb.auth.getSession();
    if (error || !session) {
      window.location.href = 'login.html';
      return;
    }
    const user = session.user;
    currentUser = {
      id:         user.id,
      email:      user.email,
      name:       user.user_metadata?.name  || user.email.split('@')[0],
      phone:      user.user_metadata?.phone || '—',
      role:       user.user_metadata?.role  || 'viewer',
      depot:      user.user_metadata?.depot || '—',
      created_at: user.created_at?.slice(0,10) || '',
    };
  } catch (e) {
    console.error('Auth error:', e);
    window.location.href = 'login.html';
    return;
  }

  updateProfileUI();
  await loadDashboard();          // fetches vehicles, updates counts + recent list
  renderParkingOverview();
  setupSearch();

  // Show app, hide loader
  document.getElementById('loading-screen').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
}

// ══════════════════════════════════════════════
// DATA — single source of truth fetch
// ══════════════════════════════════════════════
async function loadDashboard() {
  try {
    const { data, error } = await sb.from('vehicles').select('*').order('check_in', { ascending: false });
    if (error) throw error;
    allVehicles = data || [];
  } catch (e) {
    console.error('Failed to load vehicles:', e);
    showToast('⚠ Could not load vehicle data');
    allVehicles = [];
  }

  // Counts
  const counts = { Workshop:0, L1:0, L2:0, L3:0 };
  allVehicles.forEach(v => { if (counts[v.level] !== undefined) counts[v.level]++; });
  document.getElementById('total-count').textContent = allVehicles.length;
  document.getElementById('chip-ws').textContent = counts.Workshop;
  document.getElementById('chip-l1').textContent = counts.L1;
  document.getElementById('chip-l2').textContent = counts.L2;
  document.getElementById('chip-l3').textContent = counts.L3;

  // Recent list (top 4)
  const recent = allVehicles.slice(0, 4);
  document.getElementById('recent-list').innerHTML = recent.length
    ? recent.map(renderVehItem).join('')
    : '<div class="empty"><p>No vehicles checked in yet</p></div>';

  // Refresh vehicle search list
  renderVehicleList(allVehicles);

  // Refresh parking overview if it's already been rendered
  renderParkingOverview();
}

// ══════════════════════════════════════════════
// NAVIGATION
// ══════════════════════════════════════════════
function goTab(tab) {
  closeSidebar(); // Ensure this function is defined!
  
  // 1. ADD THE TAB TO THIS LIST
  const allowed = ['home', 'search', 'parking', 'profile', 'driveout-history', 'turret-esc'];
  
  if (!allowed.includes(tab)) {
    console.warn("Tab not allowed:", tab); // This will tell you if it's blocked
    return;
  }
  
  currentTab = tab;
  
  // 2. CHECK IF THE SCREEN EXISTS
  const screen = document.getElementById('screen-' + tab);
  if (!screen) {
    console.error("Screen element not found: " + 'screen-' + tab);
    return;
  }
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  screen.classList.add('active');
  // 3. POPULATE IF IT'S THE TURRET TAB
  if (tab === 'turret-esc') {
    populateTurretDropdown();
  }
}
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + id).classList.add('active');
}
this is my current function for gotab can you update it for me

function goBack() {
  showScreen('search');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('nav-search').classList.add('active');
  currentTab = 'search';
}

// ══════════════════════════════════════════════
// VEHICLES LIST
// ══════════════════════════════════════════════
function setupSearch() {
  document.getElementById('search-input').addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    renderVehicleList(allVehicles.filter(v =>
      (v.plate||'').toLowerCase().includes(q) ||
      (v.driver||'').toLowerCase().includes(q) ||
      (v.variant||'').toLowerCase().includes(q)
    ));
  });
}

function renderVehicleList(vehicles) {
  const el = document.getElementById('vehicle-list');
  if (!vehicles.length) {
    el.innerHTML = '<div class="empty"><p>No vehicles found</p></div>';
    return;
  }
  el.innerHTML = vehicles.map(renderVehItem).join('');
}

function renderVehItem(v) {
  const ago = timeAgo(v.check_in);
  return `<div class="veh-item" onclick="openVehicle('${v.id}')">
    <div class="veh-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="18" height="18"><path d="M19 17H5a2 2 0 0 1-2-2V7l2-3h12l2 3v8a2 2 0 0 1-2 2z"/><path d="M7 17v2M17 17v2M3 11h18"/></svg>
    </div>
    <div style="flex:1;min-width:0;">
      <div class="veh-plate">${v.plate || '—'}</div>
      <div class="veh-meta">${v.variant || '—'} &nbsp;·&nbsp; ${v.level || '—'} – Lot ${v.lot || '—'}</div>
    </div>
    <div style="text-align:right;flex-shrink:0;">
      <div style="font-size:11px;color:var(--muted);">${ago}</div>
      <div style="font-size:11px;color:var(--muted);margin-top:2px;">${v.driver || '—'}</div>
    </div>
  </div>`;
}

// ══════════════════════════════════════════════
// VEHICLE DETAIL
// ══════════════════════════════════════════════
function openVehicle(id) {
  currentVehicle = allVehicles.find(v => String(v.id) === String(id));
  if (!currentVehicle) return;
  renderDetailScreen(currentVehicle);
  showScreen('detail');
}

function safe(val, fallback = '—') {
  return (val !== null && val !== undefined && val !== '') ? val : fallback;
}

function renderDetailScreen(v) {
  const fuelPct    = Number(v.fuel_pct)    || 0;
  const batPct     = Number(v.battery_pct) || 0;
  const fuelColor  = fuelPct > 50 ? 'var(--accent)' : fuelPct > 20 ? 'var(--warn)' : 'var(--danger)';
  const batColor   = batPct  > 50 ? 'var(--accent)' : batPct  > 20 ? 'var(--warn)' : 'var(--danger)';
  const dInitials  = (v.driver || 'UN').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();

  document.getElementById('detail-badge').innerHTML =
    `<span class="badge badge-green" style="font-size:11px;">${v.level} · Lot ${v.lot}</span>`;

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
  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
    <div style="font-size:12px; font-weight:600;">Starter</div>
    <div style="font-size:12px; color:var(--muted);">
       ${v.starter_v || '--'}V | ${v.starter_pct || 0}%
    </div>
  </div>
  <div style="display:flex; justify-content:space-between; align-items:center;">
    <div style="font-size:12px; font-weight:600;">Aux</div>
    <div style="font-size:12px; color:var(--muted);">
       ${v.aux_v || '--'}V | ${v.aux_pct || 0}%
    </div>
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
// UPDATE MODAL — saves to vehicles + history
// ══════════════════════════════════════════════
function openUpdateModal() {
 console.log("Button clicked, opening modal..."); // Add this line
  
  if (!currentVehicle) {
    console.error("currentVehicle is missing!");
    return;
  }
  const v = currentVehicle;
  
  // Existing header
  document.getElementById('modal-plate-sub').textContent = `${v.plate} · ${v.variant}`;
  
  // Basic info
  document.getElementById('up-plate').value          = v.plate           ?? '';
  document.getElementById('up-variant').value        = v.variant         ?? '';
  document.getElementById('up-driver').value         = v.driver          ?? '';
  document.getElementById('up-driver-phone').value   = v.driver_phone    ?? '';
  document.getElementById('up-driver-depot').value   = v.driver_depot    ?? '';
  document.getElementById('up-fire-expiry').value    = v.fire_ext_expiry ?? '';
  document.getElementById('up-level').value          = v.level           ?? 'Workshop';
  document.getElementById('up-lot').value            = v.lot             ?? '';
  document.getElementById('up-odometer').value       = v.odometer        ?? '';
  document.getElementById('up-engine-hours').value   = v.engine_hours    ?? '';
  
  // NEW BATTERY FIELDS
  document.getElementById('up-batt-starter-v').value   = v.starter_v   ?? '';
  document.getElementById('up-batt-starter-pct').value = v.starter_pct ?? '';
  document.getElementById('up-batt-aux-v').value       = v.aux_v       ?? '';
  document.getElementById('up-batt-aux-pct').value     = v.aux_pct     ?? '';
  
  // NEW FUEL FIELDS
  document.getElementById('up-fuel-l').value         = v.fuel_l        ?? '';
  document.getElementById('up-fuel-pct').value       = v.fuel_pct      ?? '';
  
  // Notes
  document.getElementById('up-notes').value          = v.notes         ?? '';
  
  openModal('update-modal');
}

async function submitUpdate() {
  const update = {
    plate:        document.getElementById('up-plate').value.trim()       || null,
    variant:      document.getElementById('up-variant').value.trim()     || null,
    driver:       document.getElementById('up-driver').value.trim()      || null,
    driver_phone: document.getElementById('up-driver-phone').value.trim()|| null,
    driver_depot: document.getElementById('up-driver-depot').value.trim()|| null,
    lot:          document.getElementById('up-lot').value.trim()         || null,
    odometer:        parseFloat(document.getElementById('up-odometer').value)       || null,
    engine_hours:    parseFloat(document.getElementById('up-engine-hours').value)   || null,
    // NEW DUAL-BATTERY FIELDS
    starter_v:       parseFloat(document.getElementById('up-batt-starter-v').value) || null,
    starter_pct:     parseInt(document.getElementById('up-batt-starter-pct').value) || null,
    aux_v:           parseFloat(document.getElementById('up-batt-aux-v').value)     || null,
    aux_pct:         parseInt(document.getElementById('up-batt-aux-pct').value)     || null,
    // NEW FUEL FIELDS
    fuel_l:          parseFloat(document.getElementById('up-fuel-l').value)         || null,
    fuel_pct:        parseInt(document.getElementById('up-fuel-pct').value)         || null,
    // REST OF FIELDS
    fire_ext_expiry: document.getElementById('up-fire-expiry').value              || null,
    notes:           document.getElementById('up-notes').value,
  };

  try {
    // 1. Write history record
    const historyRow = { 
        ...update, 
        vehicle_id: currentVehicle.id, 
        plate: currentVehicle.plate, 
        driver: currentVehicle.driver, 
        created_at: new Date().toISOString() 
    };
    const { error: hErr } = await sb.from('history').insert([historyRow]);
    if (hErr) console.warn('History insert failed:', hErr.message);

    // 2. Update vehicle record
    const { error: vErr } = await sb.from('vehicles')
        .update(update)
        .eq('id', currentVehicle.id);
    if (vErr) throw vErr;

    // 3. Sync local state
    Object.assign(currentVehicle, update);
    const idx = allVehicles.findIndex(v => v.id === currentVehicle.id);
    if (idx !== -1) allVehicles[idx] = { ...allVehicles[idx], ...update };

    closeModal('update-modal');
    renderDetailScreen(currentVehicle);
    showToast('✓ Record updated');
  } catch (e) {
    console.error('Update failed:', e);
    showToast('⚠ Update failed: ' + e.message);
  }
}
// ══════════════════════════════════════════════
// CHECK-IN MODAL — inserts to vehicles table
// ══════════════════════════════════════════════
function openCheckinModal() { openModal('checkin-modal'); }

async function submitCheckin() {
  const plate   = document.getElementById('ci-plate').value.toUpperCase().trim();
  const variant = document.getElementById('ci-variant').value.trim();
  const driver  = document.getElementById('ci-driver').value.trim();
  const dPhone  = document.getElementById('ci-driver-phone').value.trim();
  const dDepot  = document.getElementById('ci-driver-depot').value.trim();
  const level   = document.getElementById('ci-level').value;
  const lot     = document.getElementById('ci-lot').value.trim().toUpperCase();
  const odometer    = parseFloat(document.getElementById('ci-odometer').value) || null;
  const fuel_pct    = parseInt(document.getElementById('ci-fuel-pct').value)   || null;
  const fire_expiry = document.getElementById('ci-fire-expiry').value          || null;
  const notes       = document.getElementById('ci-notes').value               || null;
  const enginehours = document.getElementById('ci-engine-hours').value.trim() || null;
  const starterv = document.getElementById('ci-batt-starter-v').value.trim() || null;
  const starterpct = document.getElementById('ci-batt-starter-pct').value.trim() || null;
  const auxv= document.getElementById('ci-batt-aux-v').value.trim()           || null;
  const auxpct= document.getElementById('ci-batt-aux-pct').value.trim()       || null;
  const fuell = document.getElementById('ci-fuel-l').value.trim()             || null;
  if (!plate || !level || !lot) {
    showToast('⚠ Plate, Level and Lot are required');
    return;
  }

  try {
    const newRow = {
      plate, variant: variant || '—', driver, driver_phone: dPhone,
      driver_depot: dDepot, level, lot, odometer, fuel_pct,
      fire_ext_expiry: fire_expiry, notes,
      check_in: new Date().toISOString(),
    };

    const { data, error } = await sb.from('vehicles').insert([newRow]).select();
    if (error) throw error;

    // Prepend to local state immediately (no need to reload)
    if (data && data[0]) allVehicles.unshift(data[0]);

    closeModal('checkin-modal');
    ['ci-plate','ci-variant','ci-driver','ci-driver-phone','ci-driver-depot','ci-lot','ci-odometer','ci-fuel-pct','ci-notes','ci-fire-expiry']
      .forEach(id => { const el = document.getElementById(id); if(el) el.value=''; });

    await loadDashboard();
    showToast(`✓ ${plate} checked in → ${level} Lot ${lot}`);
  } catch (e) {
    console.error('Check-in failed:', e);
    showToast('⚠ Check-in failed: ' + e.message);
  }
}

// Add 'turret-select' to your goTab allowed list if needed
// Call this function whenever you open the 'turret-esc' tab
function populateTurretDropdown() {
    const select = document.getElementById('turret-vehicle-select');
    select.innerHTML = '<option value="">-- Choose a vehicle --</option>'; // Reset

    allVehicles.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v.id;
        opt.textContent = `${v.plate} (${v.variant || 'No Model'})`;
        select.appendChild(opt);
    });
}

// Update your save function to grab the vehicle info from the dropdown
async function saveTurretChecklist() {
    const select = document.getElementById('turret-vehicle-select');
    const vehicleId = select.value;
    
    if (!vehicleId) {
        showToast("⚠ Please select a vehicle first");
        return;
    }

    // Find vehicle details for the plate
    const v = allVehicles.find(x => String(x.id) === String(vehicleId));
    
    const data = {
        vehicle_id: vehicleId,
        plate: v.plate,
        user_name: currentUser?.name || 'Unknown',
        // ... (all your other boolean fields here)
    };

    const { error } = await sb.from('turret_esc_logs').insert([data]);
    
    if (error) {
        showToast('⚠ Error: ' + error.message);
    } else {
        showToast('✓ Turret Checklist Submitted');
        goTab('home');
    }
}

// ══════════════════════════════════════════════
// HISTORY — fetches from history table
// ══════════════════════════════════════════════
async function openHistory(vehicleId) {
  const v = allVehicles.find(x => String(x.id) === String(vehicleId));
  document.getElementById('history-plate-title').textContent = v ? v.plate : 'History';
  document.getElementById('history-list').innerHTML = '<div class="loading"><div class="spinner"></div>Loading…</div>';
  showScreen('history');

  try {
    const { data, error } = await sb.from('history').select('*').eq('vehicle_id', vehicleId).order('created_at', { ascending: false });
    if (error) throw error;
    renderHistory(data || []);
  } catch (e) {
    console.error('History fetch failed:', e);
    document.getElementById('history-list').innerHTML = '<div class="empty"><p>Could not load history</p></div>';
  }
}
function openTurretChecklist(vehicleId) {
    const v = allVehicles.find(x => String(x.id) === String(vehicleId));
    if (!v) return;

    currentVehicle = v; // Set global state so submit function knows which vehicle it is
    document.getElementById('turret-active-plate').textContent = v.plate;
    
    goTab('turret-esc');
}

async function saveTurretChecklist() {
  const select = document.getElementById('turret-vehicle-select');
  const vehicleId = select.value;

  if (!vehicleId) {
    showToast("⚠ Please select a vehicle first");
    return;
  }

  const v = allVehicles.find(x => String(x.id) === String(vehicleId));
  if (!v) {
    showToast("⚠ Vehicle not found");
    return;
  }

  const data = {
    vehicle_id: vehicleId,
    plate: v.plate,
    user_name: currentUser?.name || 'Unknown',

    // Boolean fields
    ics:              document.getElementById('chk-ics').checked,
    gsu:              document.getElementById('chk-gsu').checked,
    wim:              document.getElementById('chk-wim').checked,
    trav_actuator:    document.getElementById('chk-trav_actuator').checked,
    elev_actuator:    document.getElementById('chk-elev_actuator').checked,
    gcu:              document.getElementById('chk-gcu').checked,
    mdcu:             document.getElementById('chk-mdcu').checked,
    psu:              document.getElementById('chk-psu').checked,
    gun_gyro:         document.getElementById('chk-gun_gyro').checked,
    conv_ass:         document.getElementById('chk-conv_ass').checked,
    boost_box_ass:    document.getElementById('chk-boost_box_ass').checked,
    slip_ring:        document.getElementById('chk-slip_ring').checked,
    turr_estop:       document.getElementById('chk-turr_estop').checked,
    upplink_echute:   document.getElementById('chk-upplink_echute').checked,
    upplink_splate:   document.getElementById('chk-upplink_splate').checked,
    lowlink_splate:   document.getElementById('chk-lowlink_splate').checked,
    lowlink_echute:   document.getElementById('chk-lowlink_echute').checked,
    uppflex_chute:    document.getElementById('chk-uppflex_chute').checked,
    lowflex_chute:    document.getElementById('chk-lowflex_chute').checked,
    lws_comp:         document.getElementById('chk-lws_comp').checked,

    // Integer fields
    scu: parseInt(document.getElementById('chk-scu').value) || 0,
    dcu: parseInt(document.getElementById('chk-dcu').value) || 0,

    // Text fields
    fault_list: document.getElementById('chk-fault_list').value,
    notes:      document.getElementById('chk-notes').value,
  };

  const { error } = await sb.from('turret_esc_logs').insert([data]);

  if (error) {
    console.error("Turret checklist error:", error);
    showToast('⚠ Failed to save: ' + error.message);
  } else {
    showToast('✓ Checklist submitted successfully');
    goTab('home');
  }
}

function renderHistory(records) {
  const hl = document.getElementById('history-list');
  if (!records.length) {
    hl.innerHTML = '<div class="empty"><p>No history records yet</p></div>';
    return;
  }
  hl.innerHTML = records.map(r => `
    <div class="history-item">
      <div class="history-item-header">
        <div style="font-size:13px;font-weight:600;">${r.created_at ? formatDate(r.created_at) : '—'}</div>
        <div class="history-date">${r.driver || '—'}</div>
      </div>
      <div class="history-grid">
        <div class="history-field"><span>Odometer:</span> ${r.odometer != null ? Number(r.odometer).toLocaleString() : '—'} km</div>
        <div class="history-field"><span>Eng Hrs:</span> ${safe(r.engine_hours)} hrs</div>
        <div class="history-field"><span>Battery:</span> ${safe(r.battery_pct)}% · ${safe(r.battery_v)}V</div>
        <div class="history-field"><span>Fuel:</span> ${safe(r.fuel_pct)}% · ${safe(r.fuel_l)}L</div>
        ${r.fire_ext_expiry ? `<div class="history-field" style="grid-column:1/-1;"><span>🧯 Ext. Expiry:</span> ${formatDateOnly(r.fire_ext_expiry)} <span style="color:${fireExtStatus(r.fire_ext_expiry).color};font-weight:600;">(${fireExtStatus(r.fire_ext_expiry).label})</span></div>` : ''}
      </div>
      ${r.notes ? `<div style="margin-top:8px;font-size:12px;color:var(--muted);border-top:1px solid var(--border);padding-top:8px;">${r.notes}</div>` : ''}
    </div>`).join('');
}

// ══════════════════════════════════════════════
// PARKING OVERVIEW
// ══════════════════════════════════════════════
function renderParkingOverview() {
  const counts = { Workshop:0, L1:0, L2:0, L3:0 };
  allVehicles.forEach(v => { if (counts[v.level] !== undefined) counts[v.level]++; });
  document.getElementById('parking-zones').innerHTML = Object.keys(LEVEL_META).map(lvl => {
    const m = LEVEL_META[lvl]; const occ = counts[lvl] || 0;
    return `<div class="parking-zone-btn" onclick="openParkingLevel('${lvl}')">
      <div class="pz-left">
        <div class="pz-icon" style="${lvl==='Workshop'?'background:#FFF3E0;color:#D4860A;':''}">${m.icon}</div>
        <div><div class="pz-name">${m.label}</div><div class="pz-sub">${m.desc} · ${m.totalLots} lots</div></div>
      </div>
      <div class="pz-count"><div class="pz-num" style="${lvl==='Workshop'?'color:#D4860A;':''}">${occ}</div><div class="pz-lbl">/ ${m.totalLots}</div></div>
    </div>`;
  }).join('');
}

// ══════════════════════════════════════════════
// FLOOR PLAN — SVG helpers
// ══════════════════════════════════════════════
function occupiedLots(level) {
  const map = {};
  allVehicles.filter(v => v.level === level).forEach(v => { map[v.lot] = v; });
  return map;
}

function makeLotRect(svg, x, y, w, h, label, occupied, _unused, onClick) {
  const ns = 'http://www.w3.org/2000/svg';
  const g = document.createElementNS(ns, 'g');
  g.style.cursor = 'pointer';
  const rect = document.createElementNS(ns, 'rect');
  rect.setAttribute('x', x); rect.setAttribute('y', y);
  rect.setAttribute('width', w); rect.setAttribute('height', h); rect.setAttribute('rx', 3);
  rect.setAttribute('fill', occupied ? '#C8DFB0' : '#FFFFFF');
  rect.setAttribute('stroke', occupied ? '#5C7A3E' : '#C8CDB8');
  rect.setAttribute('stroke-width', '1.2');
  g.appendChild(rect);
  const txt = document.createElementNS(ns, 'text');
  txt.setAttribute('x', x+w/2); txt.setAttribute('y', y+h/2+1);
  txt.setAttribute('text-anchor','middle'); txt.setAttribute('dominant-baseline','middle');
  txt.setAttribute('font-size','8'); txt.setAttribute('font-family','Inter,sans-serif');
  txt.setAttribute('font-weight', occupied?'700':'500');
  txt.setAttribute('fill', occupied?'#3A5A20':'#6B7560');
  txt.textContent = label;
  g.appendChild(txt);
  g.addEventListener('click', () => onClick(label, occupied ? (allVehicles.find(v=>v.level===currentLevel && v.lot===label)||null) : null, rect));
  svg.appendChild(g);
  return { g, rect };
}

function makeRoomRect(svg, x, y, w, h, label, fill, textColor) {
  const ns = 'http://www.w3.org/2000/svg';
  const g = document.createElementNS(ns, 'g');
  const rect = document.createElementNS(ns, 'rect');
  rect.setAttribute('x',x); rect.setAttribute('y',y); rect.setAttribute('width',w); rect.setAttribute('height',h); rect.setAttribute('rx',4);
  rect.setAttribute('fill', fill||'#EEF0E8'); rect.setAttribute('stroke','#B8BEB0'); rect.setAttribute('stroke-width','1.2');
  g.appendChild(rect);
  const lines = label.split('\n'); const lineH = 9;
  const startY = y + h/2 - (lines.length-1)*lineH/2;
  lines.forEach((line,i) => {
    const t = document.createElementNS(ns,'text');
    t.setAttribute('x',x+w/2); t.setAttribute('y',startY+i*lineH);
    t.setAttribute('text-anchor','middle'); t.setAttribute('dominant-baseline','middle');
    t.setAttribute('font-size','7.5'); t.setAttribute('font-family','Inter,sans-serif');
    t.setAttribute('font-weight','600'); t.setAttribute('fill',textColor||'#5A6050');
    t.textContent=line; g.appendChild(t);
  });
  svg.appendChild(g);
}

function makeDrivewayLabel(svg, x, y, w, h, vertical) {
  const ns = 'http://www.w3.org/2000/svg';
  const t = document.createElementNS(ns,'text');
  t.setAttribute('x',x+w/2); t.setAttribute('y',y+h/2);
  t.setAttribute('text-anchor','middle'); t.setAttribute('dominant-baseline','middle');
  t.setAttribute('font-size','7'); t.setAttribute('font-family','Inter,sans-serif');
  t.setAttribute('fill','#A0A89A'); t.setAttribute('letter-spacing','1');
  if (vertical) t.setAttribute('transform',`rotate(-90,${x+w/2},${y+h/2})`);
  t.textContent='DRIVEWAY'; svg.appendChild(t);
}

function highlightLot(rect, occupied) {
  if (selectedLotRect) { selectedLotRect.setAttribute('fill',selectedLotOrigFill); selectedLotRect.setAttribute('stroke',selectedLotOrigStroke); }
  selectedLotRect = rect;
  selectedLotOrigFill   = occupied ? '#C8DFB0' : '#FFFFFF';
  selectedLotOrigStroke = occupied ? '#5C7A3E' : '#C8CDB8';
  rect.setAttribute('fill','#FFF3CD'); rect.setAttribute('stroke','#D4860A');
}

function openParkingLevel(level) {
  currentLevel = level;
  const m = LEVEL_META[level];
  document.getElementById('level-title').textContent = m.label;
  const occ = allVehicles.filter(v => v.level === level).length;
  document.getElementById('level-sub').textContent = `${occ} occupied · ${m.totalLots - occ} available`;
  document.getElementById('lot-detail-panel').innerHTML = '';
  selectedLotRect = null;
  const svg = document.getElementById('floor-plan-svg');
  svg.innerHTML = '';
  if (level === 'Workshop') drawWorkshop(svg);
  else if (level === 'L1')  drawL1(svg);
  else if (level === 'L2')  drawL2(svg);
  else                       drawL3(svg);
  showScreen('parking-level');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('nav-parking').classList.add('active');
}

// ── WORKSHOP ──
function drawWorkshop(svg) {
  const ns='http://www.w3.org/2000/svg', occ=occupiedLots('Workshop');
  const CW=52,CH=22,VGAP=3,ROWS=11,PAD=6,leftW=58,dwW=28,shutW=22;
  const xLeft=PAD,xDW=xLeft+leftW,xA=xDW+dwW,xB=xA+CW+4,xShut=xB+CW+6;
  const bHighH=3*(CH+VGAP), svgW=xShut+shutW+PAD, svgH=PAD+bHighH+ROWS*(CH+VGAP)+CH+PAD+30;
  svg.setAttribute('viewBox',`0 0 ${svgW} ${svgH}`); svg.setAttribute('width','100%'); svg.style.height='auto'; svg.style.maxWidth=svgW+'px';
  const bg=document.createElementNS(ns,'rect'); bg.setAttribute('x','0');bg.setAttribute('y','0');bg.setAttribute('width',svgW);bg.setAttribute('height',svgH);bg.setAttribute('rx','6');bg.setAttribute('fill','#F8F8F4');bg.setAttribute('stroke','#B8BEB0');bg.setAttribute('stroke-width','1.5');svg.appendChild(bg);
  const handler=(id,veh,rect)=>{highlightLot(rect,!!veh);selectLotById(id,veh);};
  const shutTopH=28;
  makeRoomRect(svg,xLeft,PAD,leftW,shutTopH,'SHUTTER','#FFF3E0','#B86A00');
  const rTop=PAD+shutTopH+4, rAvail=svgH-34-rTop, rH1=Math.floor(rAvail*.3), rH2=Math.floor(rAvail*.25), rH3=rAvail-rH1-rH2-8;
  makeRoomRect(svg,xLeft,rTop,leftW,rH1,'SPARE\nSTORE','#EEF0E8','#5A6050');
  makeRoomRect(svg,xLeft,rTop+rH1+4,leftW,rH2,'INNOVATION\nROOM','#EEF0E8','#5A6050');
  makeRoomRect(svg,xLeft,rTop+rH1+rH2+8,leftW,rH3,'SCRAP\nMETAL','#EEF0E8','#5A6050');
  makeDrivewayLabel(svg,xDW,PAD+bHighH+10,dwW,ROWS*(CH+VGAP),true);
  makeRoomRect(svg,xA,PAD,CW,bHighH-VGAP,'STES','#E8F0FF','#2A4A8A');
  ['B14','B13','B12'].forEach((lot,i)=>{ makeLotRect(svg,xB,PAD+i*(CH+VGAP),CW,CH,lot,!!occ[lot],false,handler); });
  const mY=PAD+bHighH;
  for(let n=11;n>=1;n--){const row=11-n,y=mY+row*(CH+VGAP);makeLotRect(svg,xA,y,CW,CH,'A'+n,!!occ['A'+n],false,handler);makeLotRect(svg,xB,y,CW,CH,'B'+n,!!occ['B'+n],false,handler);}
  makeRoomRect(svg,xShut,PAD+20,shutW,svgH-54,'SHUTTER','#FFF3E0','#B86A00');
  makeRoomRect(svg,xDW,svgH-28,CW*2+30,22,'SHUTTER','#FFF3E0','#B86A00');
}

// ── LEVEL 1 ──
function drawL1(svg) {
  const ns='http://www.w3.org/2000/svg', occ=occupiedLots('L1');
  const CW=30,CH=19,CGAP=2,COL_GAP=14,ROWS=15,PAD=8,ROW_GAP=2,PAIR_W=CW*2+CGAP;
  const xA=PAD,xBC=xA+CW+COL_GAP,xDE=xBC+PAIR_W+COL_GAP,xF=xDE+PAIR_W+COL_GAP;
  const svgW=xF+CW+PAD,svgH=PAD+ROWS*(CH+ROW_GAP)+PAD;
  svg.setAttribute('viewBox',`0 0 ${svgW} ${svgH}`);svg.setAttribute('width','100%');svg.style.height='auto';svg.style.maxWidth=svgW+'px';
  const bg=document.createElementNS(ns,'rect');bg.setAttribute('x','0');bg.setAttribute('y','0');bg.setAttribute('width',svgW);bg.setAttribute('height',svgH);bg.setAttribute('fill','#F8F8F4');bg.setAttribute('rx','6');svg.appendChild(bg);
  const handler=(id,veh,rect)=>{highlightLot(rect,!!veh);selectLotById(id,veh);};
  makeDrivewayLabel(svg,xA+CW+1,PAD+2,COL_GAP-2,ROWS*(CH+ROW_GAP),true);
  makeDrivewayLabel(svg,xBC+PAIR_W+1,PAD+2,COL_GAP-2,ROWS*(CH+ROW_GAP),true);
  makeDrivewayLabel(svg,xDE+PAIR_W+1,PAD+2,COL_GAP-2,ROWS*(CH+ROW_GAP),true);
  for(let row=0;row<ROWS;row++){
    const n=ROWS-row,y=PAD+row*(CH+ROW_GAP);
    makeLotRect(svg,xA,y,CW,CH,'A'+n,!!occ['A'+n],false,handler);
    makeLotRect(svg,xBC,y,CW,CH,'B'+n,!!occ['B'+n],false,handler);
    makeLotRect(svg,xBC+CW+CGAP,y,CW,CH,'C'+n,!!occ['C'+n],false,handler);
    makeLotRect(svg,xDE,y,CW,CH,'D'+n,!!occ['D'+n],false,handler);
    makeLotRect(svg,xDE+CW+CGAP,y,CW,CH,'E'+n,!!occ['E'+n],false,handler);
    // F1-F9 flush to top: F9→row0, F1→row8
    const fRow=9-n; if(fRow>=0) makeLotRect(svg,xF,PAD+fRow*(CH+ROW_GAP),CW,CH,'F'+n,!!occ['F'+n],false,handler);
  }
}

// ── LEVEL 2 ── F6-F1 flush top; Gunnery Training (top) + PETA Store (bottom) RIGHT of F col
// ── LEVEL 2 ── F6-F1 flush top; Gunnery Training & PETA Store below F1
function drawL2(svg) {
  const ns='http://www.w3.org/2000/svg', occ=occupiedLots('L2');
  const CW=30,CH=19,CGAP=2,COL_GAP=14,ROWS=15,PAD=8,ROW_GAP=2,PAIR_W=CW*2+CGAP;
  const xA=PAD,xBC=xA+CW+COL_GAP,xDE=xBC+PAIR_W+COL_GAP,xF=xDE+PAIR_W+COL_GAP;
  
  // Rooms RIGHT of F col, vertically aligned with F6 (top) → F1 (bottom)
  const roomGap = 4;
  const roomW = 56;
  const roomX = xF + CW + roomGap;
  // F6 is at PAD + 0*(CH+ROW_GAP), F1 is at PAD + 5*(CH+ROW_GAP)
  const bandTop = PAD;
  const bandBot = PAD + 5*(CH+ROW_GAP) + CH;
  const bandH   = bandBot - bandTop;
  const gunH  = Math.round(bandH * 0.5) - 2;
  const petaH = bandH - gunH - 3;

  const svgW = roomX + roomW + PAD;
  const svgH = PAD+ROWS*(CH+ROW_GAP)+PAD;
  
  svg.setAttribute('viewBox',`0 0 ${svgW} ${svgH}`);
  svg.setAttribute('width','100%');
  svg.style.height='auto';
  svg.style.maxWidth=svgW+'px';
  
  const bg=document.createElementNS(ns,'rect');
  bg.setAttribute('x','0');bg.setAttribute('y','0');
  bg.setAttribute('width',svgW);bg.setAttribute('height',svgH);
  bg.setAttribute('fill','#F8F8F4');bg.setAttribute('rx','6');
  svg.appendChild(bg);
  
  const handler=(id,veh,rect)=>{highlightLot(rect,!!veh);selectLotById(id,veh);};
  
  makeDrivewayLabel(svg,xA+CW+1,PAD+2,COL_GAP-2,ROWS*(CH+ROW_GAP),true);
  makeDrivewayLabel(svg,xBC+PAIR_W+1,PAD+2,COL_GAP-2,ROWS*(CH+ROW_GAP),true);
  makeDrivewayLabel(svg,xDE+PAIR_W+1,PAD+2,COL_GAP-2,ROWS*(CH+ROW_GAP),true);
  
  // A–E all 15 rows
  for(let row=0;row<ROWS;row++){
    const n=ROWS-row,y=PAD+row*(CH+ROW_GAP);
    makeLotRect(svg,xA,y,CW,CH,'A'+n,!!occ['A'+n],false,handler);
    makeLotRect(svg,xBC,y,CW,CH,'B'+n,!!occ['B'+n],false,handler);
    makeLotRect(svg,xBC+CW+CGAP,y,CW,CH,'C'+n,!!occ['C'+n],false,handler);
    makeLotRect(svg,xDE,y,CW,CH,'D'+n,!!occ['D'+n],false,handler);
    makeLotRect(svg,xDE+CW+CGAP,y,CW,CH,'E'+n,!!occ['E'+n],false,handler);
  }
  
  // F6→row0, F1→row5  (flush top)
  for(let fn=6;fn>=1;fn--){ 
    const fy=PAD+(6-fn)*(CH+ROW_GAP); 
    makeLotRect(svg,xF,fy,CW,CH,'F'+fn,!!occ['F'+fn],false,handler); 
  }
  
  // Rooms alongside F lots (same vertical band)
  makeRoomRect(svg, roomX, bandTop,          roomW, gunH,  'GUNNERY\nTRAINING', '#EEF5FF', '#2A4A8A');
  makeRoomRect(svg, roomX, bandTop+gunH+3,   roomW, petaH, 'PETA\nSTORE',       '#EEF5FF', '#2A4A8A');
}

// ── LEVEL 3 ── F6-F1 flush top; Armskote & Opstronic Store below F1
function drawL3(svg) {
  const ns='http://www.w3.org/2000/svg', occ=occupiedLots('L3');
  const CW=30,CH=19,CGAP=2,COL_GAP=14,ROWS=15,PAD=8,ROW_GAP=2,PAIR_W=CW*2+CGAP;
  const xA=PAD,xBC=xA+CW+COL_GAP,xDE=xBC+PAIR_W+COL_GAP,xF=xDE+PAIR_W+COL_GAP;
  
  // Rooms RIGHT of F col, vertically aligned with F6 (top) → F1 (bottom)
  const roomGap = 4;
  const roomW = 60;
  const roomX = xF + CW + roomGap;
  const bandTop = PAD;
  const bandBot = PAD + 5*(CH+ROW_GAP) + CH;
  const bandH   = bandBot - bandTop;
  const armH  = Math.round(bandH * 0.45) - 2;
  const opsH  = bandH - armH - 3;

  const svgW = roomX + roomW + PAD;
  const svgH = PAD+ROWS*(CH+ROW_GAP)+PAD;
  
  svg.setAttribute('viewBox',`0 0 ${svgW} ${svgH}`);
  svg.setAttribute('width','100%');
  svg.style.height='auto';
  svg.style.maxWidth=svgW+'px';
  
  const bg=document.createElementNS(ns,'rect');
  bg.setAttribute('x','0');bg.setAttribute('y','0');
  bg.setAttribute('width',svgW);bg.setAttribute('height',svgH);
  bg.setAttribute('fill','#F8F8F4');bg.setAttribute('rx','6');
  svg.appendChild(bg);
  
  const handler=(id,veh,rect)=>{highlightLot(rect,!!veh);selectLotById(id,veh);};
  
  makeDrivewayLabel(svg,xA+CW+1,PAD+2,COL_GAP-2,ROWS*(CH+ROW_GAP),true);
  makeDrivewayLabel(svg,xBC+PAIR_W+1,PAD+2,COL_GAP-2,ROWS*(CH+ROW_GAP),true);
  makeDrivewayLabel(svg,xDE+PAIR_W+1,PAD+2,COL_GAP-2,ROWS*(CH+ROW_GAP),true);
  
  for(let row=0;row<ROWS;row++){
    const n=ROWS-row,y=PAD+row*(CH+ROW_GAP);
    makeLotRect(svg,xA,y,CW,CH,'A'+n,!!occ['A'+n],false,handler);
    makeLotRect(svg,xBC,y,CW,CH,'B'+n,!!occ['B'+n],false,handler);
    makeLotRect(svg,xBC+CW+CGAP,y,CW,CH,'C'+n,!!occ['C'+n],false,handler);
    makeLotRect(svg,xDE,y,CW,CH,'D'+n,!!occ['D'+n],false,handler);
    makeLotRect(svg,xDE+CW+CGAP,y,CW,CH,'E'+n,!!occ['E'+n],false,handler);
  }
  
  // F6→row0, F1→row5 (flush top)
  for(let fn=6;fn>=1;fn--){ 
    const fy=PAD+(6-fn)*(CH+ROW_GAP); 
    makeLotRect(svg,xF,fy,CW,CH,'F'+fn,!!occ['F'+fn],false,handler); 
  }
  
  // Rooms alongside F lots (same vertical band)
  makeRoomRect(svg, roomX, bandTop,         roomW, armH, 'ARMSKOTE',         '#EEF5FF', '#2A4A8A');
  makeRoomRect(svg, roomX, bandTop+armH+3,  roomW, opsH, 'OPSTRONIC\nSTORE','#EEF5FF', '#2A4A8A');
}

// ── LOT SELECTION PANEL ──
function selectLotById(lotId, veh) {
  const panel = document.getElementById('lot-detail-panel');
  if (!veh) { panel.innerHTML = `<div class="card-sm" style="text-align:center;color:var(--muted);font-size:13px;">Lot <strong>${lotId}</strong> is empty</div>`; return; }
  const dInitials = (veh.driver||'UN').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
  panel.innerHTML = `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px;">
        <div><div style="font-family:'Syne',sans-serif;font-size:18px;font-weight:800;">${veh.plate}</div><div style="font-size:12px;color:var(--muted);">${veh.variant||'—'}</div></div>
        <span class="badge badge-green">Lot ${lotId}</span>
      </div>
      <div class="driver-card" style="margin-bottom:0;">
        <div class="driver-avatar-sm" style="width:34px;height:34px;font-size:12px;">${dInitials}</div>
        <div style="flex:1;min-width:0;">
          <div style="font-weight:600;font-size:13px;">${safe(veh.driver)}</div>
          <div style="font-size:11px;color:var(--muted);">${safe(veh.driver_depot)}</div>
          <a href="tel:${safe(veh.driver_phone,'')}" style="font-size:11px;color:var(--accent);text-decoration:none;font-weight:600;">${safe(veh.driver_phone)}</a>
        </div>
        <button class="btn btn-ghost" style="padding:6px 12px;font-size:12px;" onclick="openVehicleFromParking('${veh.id}')">View</button>
      </div>
    </div>`;
}

function openVehicleFromParking(id) {
  currentVehicle = allVehicles.find(v => String(v.id) === String(id));
  if (!currentVehicle) return;
  renderDetailScreen(currentVehicle);
  showScreen('detail');
}

// ══════════════════════════════════════════════
// PROFILE
// ══════════════════════════════════════════════
function updateProfileUI() {
  if (!currentUser) return;
  const initials = (currentUser.name||'U').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
  const roleMap = { viewer:['badge-blue','Viewer'], driver:['badge-green','Driver'], admin:['badge-yellow','Admin'] };
  const [cls, lbl] = roleMap[currentUser.role] || ['badge-blue','Unknown'];
  document.getElementById('profile-avatar').textContent = initials;
  document.getElementById('home-user-avatar').textContent = initials;
  document.getElementById('profile-name').textContent = currentUser.name;
  document.getElementById('profile-role-badge').innerHTML = `<span class="badge ${cls}">${lbl}</span>`;
  document.getElementById('pv-email').textContent = currentUser.email;
  document.getElementById('pv-phone').textContent = currentUser.phone;
  document.getElementById('pv-depot').textContent = currentUser.depot;
  document.getElementById('pv-role').innerHTML = `<span class="badge ${cls}">${lbl}</span>`;
}

function toggleEditProfile() {
  document.getElementById('profile-view').style.display = 'none';
  document.getElementById('profile-edit').style.display = 'block';
  document.getElementById('edit-profile-btn').style.display = 'none';
  document.getElementById('pe-name').value  = currentUser.name;
  document.getElementById('pe-email').value = currentUser.email;
  document.getElementById('pe-phone').value = currentUser.phone;
  document.getElementById('pe-depot').value = currentUser.depot;
  document.getElementById('pe-role').value  = currentUser.role;
}
function cancelEditProfile() {
  document.getElementById('profile-view').style.display = 'block';
  document.getElementById('profile-edit').style.display = 'none';
  document.getElementById('edit-profile-btn').style.display = 'inline-flex';
}
async function saveProfile() {
  const updates = {
    name:  document.getElementById('pe-name').value,
    phone: document.getElementById('pe-phone').value,
    depot: document.getElementById('pe-depot').value,
  };
  try {
    const { error } = await sb.auth.updateUser({ data: updates });
    if (error) throw error;
    Object.assign(currentUser, updates);
    updateProfileUI();
    cancelEditProfile();
    showToast('✓ Profile saved');
  } catch (e) {
    showToast('⚠ Save failed: ' + e.message);
  }
}

// ══════════════════════════════════════════════
// MODALS
// ══════════════════════════════════════════════
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
document.querySelectorAll('.modal-overlay').forEach(el => {
  el.addEventListener('click', function(e) { if (e.target === this) this.classList.remove('open'); });
});

// ══════════════════════════════════════════════
// FIRE EXTINGUISHER
// ══════════════════════════════════════════════
function fireExtStatus(d) {
  if (!d) return { label:'Unknown', color:'var(--muted)' };
  const days = Math.floor((new Date(d+'T00:00:00') - new Date().setHours(0,0,0,0)) / 86400000);
  if (days < 0)   return { label:`Expired ${Math.abs(days)}d ago`, color:'var(--danger)' };
  if (days <= 90) return { label:`Expires in ${days}d`,            color:'var(--warn)' };
  return { label:`Valid · ${days}d left`, color:'var(--accent)' };
}
function renderFireExtCard(d) {
  const s = fireExtStatus(d);
  const bg = d ? (fireExtStatus(d).color === 'var(--danger)' ? 'rgba(192,57,43,.07)' : fireExtStatus(d).color === 'var(--warn)' ? 'rgba(212,134,10,.07)' : 'var(--accent-lt)') : 'var(--surface2)';
  return `<div style="background:${bg};border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px 16px;margin-bottom:16px;display:flex;align-items:center;gap:14px;">
    <div style="font-size:26px;line-height:1;flex-shrink:0;">🧯</div>
    <div style="flex:1;min-width:0;">
      <div style="font-size:11px;color:var(--muted);font-weight:600;letter-spacing:.5px;text-transform:uppercase;margin-bottom:3px;">Fire Extinguisher</div>
      <div style="font-size:15px;font-weight:600;color:var(--text);">Expiry: ${d ? formatDateOnly(d) : 'Not recorded'}</div>
      <div style="font-size:12px;color:${s.color};font-weight:600;margin-top:2px;">${s.label}</div>
    </div>
  </div>`;
}

// ══════════════════════════════════════════════
// TOAST
// ══════════════════════════════════════════════
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}

// ══════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════
function timeAgo(iso) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso);
  const m = Math.floor(diff/60000);
  if (m < 1)  return 'just now';
  if (m < 60) return m+'m ago';
  const h = Math.floor(m/60);
  if (h < 24) return h+'h ago';
  return Math.floor(h/24)+'d ago';
}
function formatDate(iso) {
  return new Date(iso).toLocaleString('en-SG', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
}
function formatDateOnly(iso) {
  return new Date(iso+'T00:00:00').toLocaleDateString('en-SG', { day:'numeric', month:'short', year:'numeric' });
}

// ══════════════════════════════════════════════
// SIDEBAR
// ══════════════════════════════════════════════
function openSidebar() {
  document.getElementById('sidebar-overlay').classList.add('open');
}
function closeSidebar() {
  document.getElementById('sidebar-overlay').classList.remove('open');
}
function handleSidebarOverlayClick(e) {
  // close only if clicking the dark backdrop, not the panel itself
  if (e.target === document.getElementById('sidebar-overlay')) closeSidebar();
}
function goPage(page) {
  // Placeholder: extend this as new pages are added
  closeSidebar();
  showToast('🚧 ' + page + ' page coming soon');
}

// ══════════════════════════════════════════════
// LOGOUT
// ══════════════════════════════════════════════
async function logout() {
  try {
    await sb.auth.signOut();
  } catch(e) { /* ignore */ }
  window.location.href = 'login.html';
}

// ══════════════════════════════════════════════
// DRIVE OUT — removes vehicle from active list
// ══════════════════════════════════════════════
// ══════════════════════════════════════════════
// DRIVE OUT — removes vehicle from active list
// ══════════════════════════════════════════════
function driveOut(vehicleId) {
  const v = allVehicles.find(x => String(x.id) === String(vehicleId));
  if (!v) { showToast('⚠ Vehicle not found'); return; }

  // Show inline confirmation instead of confirm() which is blocked on mobile
  const panel = document.getElementById('lot-detail-panel') || document.getElementById('detail-body');
  const confirmHtml = `
    <div class="card" style="border:1px solid rgba(192,57,43,.3);background:rgba(192,57,43,.05);margin-top:12px;" id="driveout-confirm-panel">
      <div style="font-weight:700;color:var(--danger);margin-bottom:6px;">⚠ Confirm Drive-Out</div>
      <div style="font-size:13px;color:var(--muted);margin-bottom:14px;">
        <strong>${v.plate}</strong> will be removed from active parking and logged to history.
      </div>
      <div style="display:flex;gap:10px;">
        <button class="btn btn-ghost" style="flex:1;" onclick="document.getElementById('driveout-confirm-panel').remove()">Cancel</button>
        <button class="btn" style="flex:1;background:var(--danger);color:#fff;font-weight:600;" onclick="confirmDriveOut('${v.id}')">Yes, Drive Out</button>
      </div>
    </div>`;

  // Remove any existing confirm panel then append
  const existing = document.getElementById('driveout-confirm-panel');
  if (existing) existing.remove();
  document.getElementById('detail-body').insertAdjacentHTML('beforeend', confirmHtml);
}

async function confirmDriveOut(vehicleId) {
  const v = allVehicles.find(x => String(x.id) === String(vehicleId));
  if (!v) { showToast('⚠ Vehicle not found'); return; }

  // Remove confirm panel immediately so user can't double-tap
  const panel = document.getElementById('driveout-confirm-panel');
  if (panel) panel.remove();

  showToast('Processing drive-out…');

  try {
    const checkOutTime = new Date().toISOString();

    // 1. Build full history row
    const histRow = {
      vehicle_id:      v.id,
      plate:           v.plate,
      variant:         v.variant,
      level:           v.level,
      lot:             v.lot,
      check_in:        v.check_in,
      check_out:       checkOutTime,
      driver:          currentUser?.name     || v.driver,
      driver_phone:    currentUser?.phone    || v.driver_phone,
      driver_depot:    currentUser?.depot    || v.driver_depot,
      odometer:        v.odometer,
      engine_hours:    v.engine_hours,
      starter_v:       v.starter_v,
      starter_pct:     v.starter_pct,
      aux_v:           v.aux_v,
      aux_pct:         v.aux_pct,
      fuel_l:          v.fuel_l,
      fuel_pct:        v.fuel_pct,
      fire_ext_expiry: v.fire_ext_expiry,
      notes:           v.notes,
      created_at:      checkOutTime,
    };

    // 2. Insert to history
    const { error: hErr } = await sb.from('history').insert([histRow]);
    if (hErr) throw new Error('History insert failed: ' + hErr.message);

    // 3. Delete from vehicles (frees the lot)
    const { error: dErr } = await sb.from('vehicles').delete().eq('id', vehicleId);
    if (dErr) throw new Error('Vehicle delete failed: ' + dErr.message);

    // 4. Update local state
    allVehicles = allVehicles.filter(x => String(x.id) !== String(vehicleId));

    // 5. Refresh dashboard
    await loadDashboard();

    // 6. Go back and confirm
    goBack();
    showToast('✓ ' + v.plate + ' has been driven out');

  } catch (e) {
    console.error('Drive-out failed:', e);
    showToast('⚠ Drive-out failed: ' + e.message);
  }
}

// ══════════════════════════════════════════════
// DRIVE-OUT HISTORY — fetches history table rows that have check_out set
// ══════════════════════════════════════════════
let allDriveoutRecords = [];

async function loadDriveoutHistory() {
  document.getElementById('driveout-list').innerHTML =
    '<div class="loading"><div class="spinner"></div>Loading…</div>';
  try {
    // Rows in history that have a check_out timestamp are drive-out records
    const { data, error } = await sb
      .from('history')
      .select('*')
      .not('check_out', 'is', null)
      .order('check_out', { ascending: false });
    if (error) throw error;
    allDriveoutRecords = data || [];
    renderDriveoutList(allDriveoutRecords);
    setupDriveoutSearch();
  } catch(e) {
    console.error('Driveout history fetch failed:', e);
    document.getElementById('driveout-list').innerHTML =
      '<div class="empty"><p>Could not load drive-out history</p></div>';
  }
}

let driveoutSearchSetup = false;
function setupDriveoutSearch() {
  if (driveoutSearchSetup) return;
  driveoutSearchSetup = true;
  document.getElementById('driveout-search-input').addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    renderDriveoutList(allDriveoutRecords.filter(r =>
      (r.plate||'').toLowerCase().includes(q) ||
      (r.driver||'').toLowerCase().includes(q) ||
      (r.variant||'').toLowerCase().includes(q)
    ));
  });
}

function renderDriveoutList(records) {
  const el = document.getElementById('driveout-list');
  if (!records.length) {
    el.innerHTML = '<div class="empty"><p>No drive-out records found</p></div>';
    return;
  }
  el.innerHTML = records.map(r => `
    <div class="veh-item" onclick="openDriveoutDetail('${r.id}')">
      <div class="veh-icon" style="background:#FEF0F0;color:var(--danger);">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="18" height="18">
          <path d="M19 17H5a2 2 0 0 1-2-2V7l2-3h12l2 3v8a2 2 0 0 1-2 2z"/>
          <path d="M7 17v2M17 17v2M3 11h18"/>
          <path d="M17 7l4 4-4 4"/>
        </svg>
      </div>
      <div style="flex:1;min-width:0;">
        <div class="veh-plate">${r.plate || '—'}</div>
        <div class="veh-meta">${r.variant || '—'} &nbsp;·&nbsp; ${r.level || '—'} – Lot ${r.lot || '—'}</div>
      </div>
      <div style="text-align:right;flex-shrink:0;">
        <div style="font-size:11px;color:var(--danger);font-weight:600;">OUT ${r.check_out ? timeAgo(r.check_out) : '—'}</div>
        <div style="font-size:11px;color:var(--muted);margin-top:2px;">${r.driver || '—'}</div>
      </div>
    </div>`).join('');
}

function openDriveoutDetail(recordId) {
  const r = allDriveoutRecords.find(x => String(x.id) === String(recordId));
  if (!r) return;
  renderDriveoutDetailScreen(r);
  showScreen('driveout-detail');
}

function renderDriveoutDetailScreen(r) {
  const fuelPct = Number(r.fuel_pct) || 0;
  const fuelColor = fuelPct > 50 ? 'var(--accent)' : fuelPct > 20 ? 'var(--warn)' : 'var(--danger)';
  const dInitials = (r.driver || 'UN').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();

  document.getElementById('driveout-detail-badge').innerHTML =
    `<span class="badge badge-red" style="font-size:11px;">Checked Out</span>`;

  document.getElementById('driveout-detail-body').innerHTML = `
    <div style="margin-bottom:18px;">
      <div style="font-family:'Syne',sans-serif;font-size:28px;font-weight:800;letter-spacing:-.5px;">${safe(r.plate)}</div>
      <div style="font-size:13px;color:var(--muted);margin-top:2px;">${safe(r.variant)}</div>
    </div>

    <!-- Timing -->
    <div class="card" style="margin-bottom:14px;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div>
          <div style="font-size:11px;color:var(--muted);font-weight:600;letter-spacing:.4px;text-transform:uppercase;margin-bottom:3px;">Checked In</div>
          <div style="font-size:13px;font-weight:600;">${r.check_in ? formatDate(r.check_in) : '—'}</div>
        </div>
        <div>
          <div style="font-size:11px;color:var(--danger);font-weight:600;letter-spacing:.4px;text-transform:uppercase;margin-bottom:3px;">Checked Out</div>
          <div style="font-size:13px;font-weight:600;">${r.check_out ? formatDate(r.check_out) : '—'}</div>
        </div>
      </div>
      ${r.check_in && r.check_out ? `
      <div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border);font-size:12px;color:var(--muted);">
        Duration: <strong style="color:var(--text);">${durationBetween(r.check_in, r.check_out)}</strong>
        &nbsp;·&nbsp; Parked at <strong style="color:var(--text);">${r.level} – Lot ${r.lot}</strong>
      </div>` : ''}
    </div>

    <!-- Driver who checked out -->
    <div class="section-label">Checked Out By</div>
    <div class="driver-card">
      <div class="driver-avatar-sm">${dInitials}</div>
      <div style="flex:1;min-width:0;">
        <div style="font-weight:600;font-size:15px;">${safe(r.driver)}</div>
        <div style="font-size:12px;color:var(--muted);margin-top:1px;">${safe(r.driver_depot)}</div>
        <a href="tel:${safe(r.driver_phone,'')}" style="font-size:12px;color:var(--accent);text-decoration:none;margin-top:2px;display:block;font-weight:600;">${safe(r.driver_phone)}</a>
      </div>
    </div>

    <!-- Readings at checkout -->
    <div class="section-label">Readings at Check-Out</div>
    <div class="stat-grid" style="margin-bottom:12px;">
      <div class="stat-cell"><div class="stat-label">Odometer</div><div class="stat-value">${r.odometer != null ? Number(r.odometer).toLocaleString() : '—'} <span class="stat-unit">km</span></div></div>
      <div class="stat-cell"><div class="stat-label">Engine Hours</div><div class="stat-value">${safe(r.engine_hours)} <span class="stat-unit">hrs</span></div></div>
    </div>

    <div class="card-sm" style="margin-bottom:10px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
        <div style="font-size:12px;font-weight:600;">Starter Battery</div>
        <div style="font-size:12px;color:var(--muted);">${safe(r.starter_v,'—')}V | ${safe(r.starter_pct,'—')}%</div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div style="font-size:12px;font-weight:600;">Aux Battery</div>
        <div style="font-size:12px;color:var(--muted);">${safe(r.aux_v,'—')}V | ${safe(r.aux_pct,'—')}%</div>
      </div>
    </div>

    <div class="card-sm" style="margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <div style="font-size:12px;color:var(--muted);">Fuel Level</div>
        <div style="font-size:12px;color:var(--muted);">${safe(r.fuel_l,'—')}L</div>
      </div>
      <div style="display:flex;align-items:center;gap:12px;">
        <div style="font-size:22px;font-weight:700;color:${fuelColor};">${fuelPct}%</div>
        <div style="flex:1;"><div class="gauge-bar-wrap"><div class="gauge-bar" style="width:${fuelPct}%;background:${fuelColor};"></div></div></div>
      </div>
    </div>

    ${renderFireExtCard(r.fire_ext_expiry)}

    ${r.notes ? `
    <div class="section-label">Notes / Faults</div>
    <div class="card-sm" style="font-size:13px;color:var(--text);white-space:pre-wrap;">${r.notes}</div>` : ''}
  `;
}

// Duration helper: returns human-readable string between two ISO timestamps
function durationBetween(isoA, isoB) {
  const ms = new Date(isoB) - new Date(isoA);
  if (ms < 0) return '—';
  const totalMin = Math.floor(ms / 60000);
  const days = Math.floor(totalMin / 1440);
  const hrs  = Math.floor((totalMin % 1440) / 60);
  const mins = totalMin % 60;
  if (days > 0) return `${days}d ${hrs}h ${mins}m`;
  if (hrs  > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}


// ══════════════════════════════════════════════
// START
// ══════════════════════════════════════════════
init();
