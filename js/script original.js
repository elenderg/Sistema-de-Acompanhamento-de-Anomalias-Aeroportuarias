/* ----------------- Data model (localStorage) ----------------- */
let LS_KEYS = { AIRPORTS: 'aerodromos_v1', REPORTS: 'relatorios_v1' };

let DEFAULT_TILES = [
  { id: 'meteo', label: 'Condições Meteorológicas', icon: 'fa-cloud-sun', severity: 2 },
  { id: 'aux', label: 'Auxílios (VOR, NDB, ILS...)', icon: 'fa-location-dot', severity: 3 },
  { id: 'lights', label: 'Luzes / Balizamento', icon: 'fa-lightbulb', severity: 2 },
  { id: 'comm', label: 'Comunicação / Rádio', icon: 'fa-wifi', severity: 3 },
  { id: 'network', label: 'Internet / Transmissão', icon: 'fa-network-wired', severity: 2 },
  { id: 'runway', label: 'Pista / Incursão / Impraticável', icon: 'fa-road', severity: 4 },
  { id: 'accident', label: 'Acidente / Incidente', icon: 'fa-triangle-exclamation', severity: 5 },
  { id: 'other', label: 'Outro', icon: 'fa-ellipsis', severity: 1 }
];

function read(key, fallback) {
  try { let v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback }
  catch (e) { return fallback }
}
function write(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

// dados de exemplo
function ensureSample() {
  let airports = read(LS_KEYS.AIRPORTS, null);
  if (!airports) {
    airports = {
      'SBGR': { icao: 'SBGR', name: 'São Paulo/Guarulhos', lat: -23.4356, lon: -46.4731, aids: ['meteo', 'lights', 'comm', 'network', 'aux'] },
      'SBSP': { icao: 'SBSP', name: 'São Paulo/Congonhas', lat: -23.6261, lon: -46.6567, aids: ['meteo', 'lights', 'runway'] },
      'SBCF': { icao: 'SBCF', name: 'Cuiabá', lat: -15.6520, lon: -56.1160, aids: ['meteo', 'comm'] }
    };
    write(LS_KEYS.AIRPORTS, airports);
  }
  let reports = read(LS_KEYS.REPORTS, []);
  if (!reports) write(LS_KEYS.REPORTS, []);
}

ensureSample();

/* ----------------- UI wiring ----------------- */
let modules = {
  op: document.getElementById('module-operator'),
  ger: document.getElementById('module-manager'),
  sup: document.getElementById('module-supervisor')
};
document.getElementById('btn-op').addEventListener('click', () => showModule('op'));
document.getElementById('btn-ger').addEventListener('click', () => showModule('ger'));
document.getElementById('btn-sup').addEventListener('click', () => showModule('sup'));

function showModule(key) {
  for (let k in modules) modules[k].style.display = 'none';
  modules[key].style.display = '';
  if (key === 'op') refreshOperator();
  if (key === 'ger') refreshManager();
  if (key === 'sup') setTimeout(() => { map.invalidateSize(); renderMapMarkers(); }, 300);
}

// start on operator
document.addEventListener('DOMContentLoaded', () => {
  showModule('op');
});

/* ----------------- Operador ----------------- */
let tilesContainer = document.getElementById('tiles');
function renderTiles(availableIds = null) {
  tilesContainer.innerHTML = '';
  let airports = read(LS_KEYS.AIRPORTS, {});
  // if availableIds is null show all default
  let tilesToShow = DEFAULT_TILES.filter(t => !availableIds || availableIds.includes(t.id));
  tilesToShow.forEach(t => {
    let div = document.createElement('button');
    div.className = 'tile btn border text-start';
    div.dataset.id = t.id;
    div.innerHTML = `<div class="d-flex align-items-center w-100"><i class="fa ${t.icon} fa-2x me-3"></i><div><div class="label">${t.label}</div><small class="text-muted">gravidade ${t.severity}</small></div></div>`;
    div.addEventListener('click', () => {
      // toggle active
      Array.from(tilesContainer.children).forEach(c => c.classList.remove('border-primary'));
      div.classList.add('border-primary');
      div.dataset.selected = '1';
    });
    tilesContainer.appendChild(div);
  });
}

// populate operator ICAO select
function populateOperatorICAO() {
  let sel = document.getElementById('op-icao'); sel.innerHTML = '';
  let airports = read(LS_KEYS.AIRPORTS, {});
  Object.values(airports).forEach(a => {
    let opt = document.createElement('option'); opt.value = a.icao; opt.textContent = `${a.icao} — ${a.name || '—'}`; sel.appendChild(opt);
  });
}

document.getElementById('op-icao').addEventListener('change', () => {
  let icao = document.getElementById('op-icao').value; let airports = read(LS_KEYS.AIRPORTS, {});
  let a = airports[icao]; renderTiles(a?.aids || DEFAULT_TILES.map(t => t.id));
});

document.getElementById('report-btn').addEventListener('click', () => {
  let icao = document.getElementById('op-icao').value; if (!icao) { alert('Selecione um aeródromo'); return }
  let selected = Array.from(tilesContainer.children).find(c => c.dataset.selected === '1');
  if (!selected) { alert('Selecione uma categoria (tile)'); return }
  let tileId = selected.dataset.id; let desc = document.getElementById('op-desc').value;
  let reports = read(LS_KEYS.REPORTS, []);
  let tileMeta = DEFAULT_TILES.find(t => t.id === tileId) || { severity: 1, label: tileId };
  let report = { id: 'r_' + Date.now(), icao, tile: tileId, label: tileMeta.label, severity: tileMeta.severity, desc, ts: new Date().toISOString() };
  reports.push(report); write(LS_KEYS.REPORTS, reports);
  document.getElementById('op-desc').value = '';
  Array.from(tilesContainer.children).forEach(c => { c.classList.remove('border-primary'); delete c.dataset.selected });
  refreshReports(); renderMapMarkers();
  alert('Relatório salvo.');
});

document.getElementById('clear-btn').addEventListener('click', () => {
  document.getElementById('op-desc').value = ''; Array.from(tilesContainer.children).forEach(c => { c.classList.remove('border-primary'); delete c.dataset.selected });
});

function refreshOperator() { populateOperatorICAO(); let icao = document.getElementById('op-icao').value || Object.keys(read(LS_KEYS.AIRPORTS, {}))[0]; if (icao) document.getElementById('op-icao').value = icao; let airports = read(LS_KEYS.AIRPORTS, {}); renderTiles(airports[icao]?.aids || null); refreshReports(); }

/* ----------------- Reports list ----------------- */
function refreshReports() {
  let reports = read(LS_KEYS.REPORTS, []).slice().reverse();
  let cont = document.getElementById('reports-list'); cont.innerHTML = '';
  if (reports.length === 0) { cont.innerHTML = '<div class="text-muted">Nenhum relatório</div>'; return }
  let list = document.createElement('div'); list.className = 'list-group';
  reports.slice(0, 50).forEach(r => {
    let el = document.createElement('div'); el.className = 'list-group-item d-flex justify-content-between align-items-start';
    let left = document.createElement('div'); left.innerHTML = `<div><strong>${r.icao} — ${r.label}</strong></div><div class="text-muted small">${new Date(r.ts).toLocaleString()}</div><div>${r.desc || ''}</div>`;
    let right = document.createElement('div');
    let sevClass = r.severity >= 4 ? 'status-red' : (r.severity >= 3 ? 'status-yellow' : 'status-green');
    right.innerHTML = `<div class="p-2 rounded ${sevClass}">${r.severity}</div><div class="mt-2"><button class="btn btn-sm btn-outline-danger" data-id="${r.id}">Remover</button></div>`;
    el.appendChild(left); el.appendChild(right); list.appendChild(el);
  });
  cont.appendChild(list);
  // anexa eventos de remoção
  cont.querySelectorAll('button[data-id]').forEach(b => b.addEventListener('click', () => {
    let id = b.dataset.id; let reports = read(LS_KEYS.REPORTS, []); reports = reports.filter(r => r.id !== id); write(LS_KEYS.REPORTS, reports); refreshReports(); renderMapMarkers();
  }));
}

/* ----------------- Módulo do Gerente ----------------- */
let mgrAids = document.getElementById('mgr-aids');
function renderMgrAids() { mgrAids.innerHTML = ''; DEFAULT_TILES.forEach(t => { let id = 'c_' + t.id; let div = document.createElement('div'); div.innerHTML = `<div class="form-check"><input class="form-check-input" type="checkbox" id="${id}" data-id="${t.id}"><label class="form-check-label" for="${id}">${t.label}</label></div>`; mgrAids.appendChild(div); }); }

document.getElementById('save-airport').addEventListener('click', () => {
  let icao = document.getElementById('mgr-icao').value.trim().toUpperCase(); if (!icao || icao.length < 3) { alert('Código ICAO inválido'); return }
  let name = document.getElementById('mgr-name').value.trim(); let lat = parseFloat(document.getElementById('mgr-lat').value); let lon = parseFloat(document.getElementById('mgr-lon').value);
  let aids = Array.from(mgrAids.querySelectorAll('input[type=checkbox]:checked')).map(i => i.dataset.id);
  let airports = read(LS_KEYS.AIRPORTS, {});
  airports[icao] = { icao, name, lat: isFinite(lat) ? lat : null, lon: isFinite(lon) ? lon : null, aids };
  write(LS_KEYS.AIRPORTS, airports); refreshManager(); populateOperatorICAO(); renderMapMarkers(); alert('Aeródromo salvo');
});

document.getElementById('delete-airport').addEventListener('click', () => {
  let icao = document.getElementById('mgr-icao').value.trim().toUpperCase(); if (!icao) { alert('Digite ICAO para remover'); return }
  let airports = read(LS_KEYS.AIRPORTS, {}); if (!airports[icao]) { alert('Não existe'); return }
  if (!confirm('Remover aeródromo ' + icao + '?')) return;
  delete airports[icao]; write(LS_KEYS.AIRPORTS, airports); refreshManager(); populateOperatorICAO(); renderMapMarkers();
});

function refreshManager() {
  renderMgrAids();
  let airports = read(LS_KEYS.AIRPORTS, {});
  let list = document.getElementById('airports-list'); list.innerHTML = '';
  if (Object.keys(airports).length === 0) { list.innerHTML = '<div class="text-muted">Nenhum aeródromo cadastrado</div>'; return }
  let table = document.createElement('div'); table.className = 'table-responsive';
  let t = document.createElement('table'); t.className = 'table table-sm'; t.innerHTML = `<thead><tr><th>ICAO</th><th>Nome</th><th>Coords</th><th>Auxílios</th><th>Ações</th></tr></thead>`;
  let tbody = document.createElement('tbody'); Object.values(airports).forEach(a => {
    let tr = document.createElement('tr'); tr.innerHTML = `<td>${a.icao}</td><td>${a.name || ''}</td><td>${a.lat || ''} , ${a.lon || ''}</td><td>${(a.aids || []).join(', ')}</td><td><button class="btn btn-sm btn-primary sel-airport" data-icao="${a.icao}">Editar</button></td>`; tbody.appendChild(tr);
  }); t.appendChild(tbody); table.appendChild(t); list.appendChild(table);
  list.querySelectorAll('.sel-airport').forEach(b => b.addEventListener('click', () => {
    let icao = b.dataset.icao; let airports = read(LS_KEYS.AIRPORTS, {}); let a = airports[icao]; document.getElementById('mgr-icao').value = a.icao; document.getElementById('mgr-name').value = a.name || ''; document.getElementById('mgr-lat').value = a.lat || ''; document.getElementById('mgr-lon').value = a.lon || ''; // check aids
    mgrAids.querySelectorAll('input[type=checkbox]').forEach(ch => ch.checked = (a.aids || []).includes(ch.dataset.id));
  }));
}

/* ----------------- Supervisor (map) ----------------- */
// initialize leaflet
let map = L.map('map', { gestureHandling: true }).setView([-15.8, -47.9], 4);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap contributors' }).addTo(map);

let markers = {};

function getAirportStatus(icao) {
  let reports = read(LS_KEYS.REPORTS, []);
  let aReports = reports.filter(r => r.icao === icao);
  if (aReports.length === 0) return { level: 0, recent: null };
  // highest severity wins
  let high = aReports.reduce((m, r) => r.severity > m.severity ? r : m, aReports[0]);
  return { level: high.severity, recent: high };
}

function colorForSeverity(s) { 
  if (!s || s <= 1) {return 'green';}
  if (s <= 3) {return 'orange'; }
  return 'red';
}

function renderMapMarkers() {
  let airports = read(LS_KEYS.AIRPORTS, {});
  // clear existing
  for (let k in markers) { map.removeLayer(markers[k]); delete markers[k]; }
  Object.values(airports).forEach(a => {
    let status = getAirportStatus(a.icao);
    let col = colorForSeverity(status.level);
    let lat = a.lat || -15.8; 
    let lon = a.lon || -47.9;
    let circle = L.circle([lat, lon], { 
      radius: 40000 / Math.max(1, Math.abs(status.level || 1)), color: col, fillColor: col, fillOpacity: 0.35 }).addTo(map);
    
    circle.bindPopup(`<strong>${a.icao} — ${a.name || ''}</strong><br>Status: ${status.level || 0}<br>Relatório: ${status.recent?.label || 'Nenhum'}`);
    markers[a.icao] = circle;
  });
}

document.getElementById('center-all').addEventListener('click', () => {
  let airports = Object.values(read(LS_KEYS.AIRPORTS, {})); if (airports.length === 0) return; let latLngs = airports.filter(a => a.lat && a.lon).map(a => [a.lat, a.lon]); if (latLngs.length === 0) { alert('Sem coordenadas definidas'); return }
  let bounds = L.latLngBounds(latLngs); map.fitBounds(bounds, { padding: [50, 50] });
});

document.getElementById('export-data').addEventListener('click', () => {
  let data = { airports: read(LS_KEYS.AIRPORTS, {}), reports: read(LS_KEYS.REPORTS, []) };
  let blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  let url = URL.createObjectURL(blob); let a = document.createElement('a'); a.href = url; a.download = 'aerodromos_data.json'; a.click(); URL.revokeObjectURL(url);
});

// initial render
refreshOperator(); refreshManager(); renderMapMarkers();

// expose a small API in window for easy debugging
window._AERO = { read, write, LS_KEYS, renderMapMarkers, refreshReports };