/* ----------------- Data model (localStorage) ----------------- */
let LS_CHAVES = {
  AEROPORTOS: 'aerodromos_v1',
  RELATÓRIOS: 'relatorios_v1'
};
let BOTÕES_PRINCIPAIS = [{
  id: 'meteo',
  label: 'Condições Meteorológicas',
  ícone: 'fa-cloud-sun',
  nível_de_impacto_operacional: 2
}, {
  id: 'aux',
  label: 'Auxílios (VOR, NDB, ILS...)',
  ícone: 'fa-location-dot',
  nível_de_impacto_operacional: 3
}, {
  id: 'lights',
  label: 'Luzes (Balizamento, Farol)',
  ícone: 'fa-lightbulb',
  nível_de_impacto_operacional: 2
}, {
  id: 'comm',
  label: 'Comunicação / Rádio',
  ícone: 'fa-wifi',
  nível_de_impacto_operacional: 3
}, {
  id: 'network',
  label: 'Internet / Transmissão',
  ícone: 'fa-network-wired',
  nível_de_impacto_operacional: 2
}, {
  id: 'runway',
  label: 'Pista (Incursão / Impraticabilidade)',
  ícone: 'fa-road',
  nível_de_impacto_operacional: 4
}, {
  id: 'accident',
  label: 'Acidente / Incidente',
  ícone: 'fa-triangle-exclamation',
  nível_de_impacto_operacional: 5
}, {
  id: 'other',
  label: 'Outro',
  ícone: 'fa-ellipsis',
  nível_de_impacto_operacional: 1
}];
function ler(chave, valor_padrão) {
  try {
    let valor_consultado = localStorage.getItem(chave);
    if (valor_consultado) {
      return JSON.parse(valor_consultado);
    } else {
      return valor_padrão;
    }
  } 
  catch (erro) {
    return valor_padrão;
  }
}
function gravar(chave, valor) {
  localStorage.setItem(chave, JSON.stringify(valor));
}

// dados de exemplo
function geraDadosDeExemplo() {
  let aeroportos = ler(LS_CHAVES.AEROPORTOS, null);
  if (!aeroportos) {
    aeroportos = {
      'SBGR': {
        icao: 'SBGR',
        name: 'São Paulo/Guarulhos',
        latitude: -23.4356,
        longitude: -46.4731,
        recursos_disponíveis: ['meteo', 'lights', 'comm', 'network', 'aux']
      },
      'SBSP': {
        icao: 'SBSP',
        name: 'São Paulo/Congonhas',
        latitude: -23.6261,
        longitude: -46.6567,
        recursos_disponíveis: ['meteo', 'lights', 'runway']
      },
      'SBCF': {
        icao: 'SBCF',
        name: 'Cuiabá',
        latitude: -15.6520,
        longitude: -56.1160,
        recursos_disponíveis: ['meteo', 'comm']
      }
    };
    gravar(LS_CHAVES.AEROPORTOS, aeroportos);
  }
  let relatórios = ler(LS_CHAVES.RELATÓRIOS, []);
  if (!relatórios) {
    gravar(LS_CHAVES.RELATÓRIOS, []);

  }
}
geraDadosDeExemplo();

/* ----------------- Definições de Interface de Usuário ----------------- */
let módulos = {
  operador: document.getElementById('módulo-operador'),
  gerente: document.getElementById('módulo-gerente'),
  supervisor: document.getElementById('módulo-supervisor')
};
document.getElementById('btn-operador').addEventListener('click', () => showModule('operador'));
document.getElementById('btn-gerente').addEventListener('click', () => showModule('gerente'));
document.getElementById('btn-supervisor').addEventListener('click', () => showModule('supervisor'));

function showModule(key) {
  for (let chave in módulos) {
    módulos[chave].style.display = 'none';
  }
  módulos[key].style.display = '';

  if (key === 'operador') {
    recarregaOperator();
  }
  if (key === 'gerente') {
    recarregaManager();
  }
  if (key === 'supervisor') {
    setTimeout(
      () => {
        mapa.invalidateSize();
        exibeMarcadoresNoMapa();
      }, 300
    );
  }
  ;
}

// o site começa exibindo o módulo do operador
document.addEventListener('DOMContentLoaded', () => {
  showModule('operador');
});

/* ----------------- Operador ----------------- */
let grupoDeBotões = document.getElementById('tiles');

function exibeBotões(idsDisponíveis = null) { // REFAZER A FUNÇÃO DEPOIS
  // A função irá ser apagada
  grupoDeBotões.innerHTML = '';
  let aeroportos = ler(LS_CHAVES.AEROPORTOS, {});
  // se idsDisponíveis for null, mostra todos
  let botõesExibidos = BOTÕES_PRINCIPAIS.filter(t => !idsDisponíveis || idsDisponíveis.includes(t.id));
  botõesExibidos.forEach(tile => {
    let botão = document.createElement('button');
    botão.className = 'tile btn border text-start';
    botão.dataset.id = tile.id;
    botão.innerHTML = `<div class="d-flex align-items-center w-100"><i class="fa ${tile.ícone} fa-2x me-3"></i><div><div class="label">${tile.label}</div><small class="text-muted">gravidade ${tile.nível_de_impacto_operacional}</small></div></div>`;
    botão.addEventListener('click', () => {
      // toggle active
      Array.from(grupoDeBotões.children).forEach(c => c.classList.remove('border-primary'));
      botão.classList.add('border-primary');
      botão.dataset.selected = '1';
    });
    grupoDeBotões.appendChild(botão);
  });
}

// preenche o ICAO do aeródromo
function preencheCódigoICAO() {
  let seleção = document.getElementById('operador-icao');
  seleção.innerHTML = '';
  let aeroportos = ler(LS_CHAVES.AEROPORTOS, {});
  Object.values(aeroportos).forEach(aeroporto => {
    let opção = document.createElement('option');
    opção.value = aeroporto.icao;
    opção.textContent = `${aeroporto.icao} — ${aeroporto.name || '—'}`;
    seleção.appendChild(opção);
  });
}

document.getElementById('operador-icao').addEventListener('change', () => {
  let icao = document.getElementById('operador-icao').value;
  let aeroportos = ler(LS_CHAVES.AEROPORTOS, {});
  let aeroporto = aeroportos[icao];
  console.log('Aeroporto selecionado:', aeroporto);
  let aeroporto_carregado = false;
  if (aeroporto === null) {
    //exibeBotões(BOTÕES_PRINCIPAIS.map(tile => tile.id));
    aeroporto_carregado = false;
    console.log('Aeroporto nulo');
  }
  if (aeroporto === undefined) {
    aeroporto_carregado = false;
    console.log('Aeroporto indefinido');
  } 
  if (!aeroporto.recursos_disponíveis) {
    aeroporto_carregado = false;
  }
  if(aeroporto_carregado === true) {
    console.log('Aeroporto carregado'); 
    exibeBotões(
      BOTÕES_PRINCIPAIS.map(tile => tile.id)
    );
  }
});

document.getElementById('botão_relatório').addEventListener('click', () => {
  let icao = document.getElementById('operador-icao').value;
  if (!icao) {
    alert('Selecione um aeródromo');
    return;
  }
  let selecionado = Array.from(grupoDeBotões.children).find(escolha => escolha.dataset.selected === '1');
  if (!selecionado) {
    alert('Selecione uma categoria (tile)');
    return;
  }
  let tileId = selecionado.dataset.id;
  let descrição = document.getElementById('operador-desc').value;
  let relatórios = ler(LS_CHAVES.RELATÓRIOS, []);
  let tileMeta = BOTÕES_PRINCIPAIS.find(tile => tile.id === tileId) || {
    nível_de_impacto_operacional: 1,
    label: tileId
  };
  let relatório = {
    id: 'r_' + Date.now(),
    icao,
    tile: tileId,
    label: tileMeta.label,
    nível_de_impacto_operacional: tileMeta.nível_de_impacto_operacional,
    desc: descrição,
    ts: new Date().toISOString()
  };
  relatórios.push(relatório);
  gravar(LS_CHAVES.RELATÓRIOS, relatórios);
  document.getElementById('operador-desc').value = '';
  Array.from(grupoDeBotões.children).forEach(escolha => {
    escolha.classList.remove('border-primary');
    delete escolha.dataset.selected;
  });
  recarregaRelatórios();
  exibeMarcadoresNoMapa();
  alert('Relatório salvo.');
});
document.getElementById('clear-btn').addEventListener('click', () => {
  document.getElementById('operador-desc').value = '';
  Array.from(grupoDeBotões.children).forEach(escolha => {
    escolha.classList.remove('border-primary');
    delete escolha.dataset.selected;
  });
});
function recarregaOperator() {
  var _airports$icao;
  preencheCódigoICAO();
  let icao = document.getElementById('operador-icao').value || Object.keys(ler(LS_CHAVES.AEROPORTOS, {}))[0];
  if (icao) {document.getElementById('operador-icao').value = icao;}
  let aeroportos = ler(LS_CHAVES.AEROPORTOS, {});
  let aeroportoPossuiCódigo = true;
  if (!aeroportos[icao]) {
    aeroportoPossuiCódigo = false;
  }
  if (!aeroportos[icao]?.recursos_disponíveis) {
    aeroportoPossuiCódigo = false;
  }
  if(aeroportoPossuiCódigo) {
    exibeBotões(
      aeroportos[icao].recursos_disponíveis
    );
  }
  recarregaRelatórios();
}

/* ----------------- Relatórios lista ----------------- */
function recarregaRelatórios() {
  let relatórios = ler(LS_CHAVES.RELATÓRIOS, []).slice().reverse();
  let conteúdo = document.getElementById('relatórios-lista');
  conteúdo.innerHTML = '';
  if (relatórios.length === 0) {
    conteúdo.innerHTML = '<div class="text-muted">Nenhum relatório</div>';
    return;
  }
  let lista = document.createElement('div');
  lista.className = 'lista-group';
  relatórios.slice(0, 50).forEach(r => {
    let elemento = document.createElement('div');
    elemento.className = 'lista-group-item d-flex justify-content-between align-items-start';
    let esquerda = document.createElement('div');
    esquerda.innerHTML = `<div><strong>${r.icao} — ${r.label}</strong></div><div class="text-muted small">${new Date(r.ts).toLocaleString()}</div><div>${r.desc || ''}</div>`;
    let direita = document.createElement('div');
    let sevClass = r.nível_de_impacto_operacional >= 4 ? 'status-red' : r.nível_de_impacto_operacional >= 3 ? 'status-yellow' : 'status-green';
    direita.innerHTML = `<div class="p-2 rounded ${sevClass}">${r.nível_de_impacto_operacional}</div><div class="mt-2"><button class="btn btn-sm btn-outline-danger" data-id="${r.id}">Remover</button></div>`;
    elemento.appendChild(esquerda);
    elemento.appendChild(direita);
    lista.appendChild(elemento);
  });
  conteúdo.appendChild(lista);
  // anexa eventos de remoção
  conteúdo.querySelectorAll('button[data-id]').forEach(b => b.addEventListener('click', () => {
    let id = b.dataset.id;
    let relatórios = ler(LS_CHAVES.RELATÓRIOS, []);
    relatórios = relatórios.filter(r => r.id !== id);
    gravar(LS_CHAVES.RELATÓRIOS, relatórios);
    recarregaRelatórios();
    exibeMarcadoresNoMapa();
  }));
}

/* ----------------- Módulo do Gerente ----------------- */
let recursosDaDNB = document.getElementById('gerente-recursos_disponíveis');
function exibeAuxíliosDaDNB() {
  recursosDaDNB.innerHTML = '';
  BOTÕES_PRINCIPAIS.forEach(t => {
    let identificador = 'c_' + t.id;
    let divisão = document.createElement('div');
    divisão.innerHTML = `<div class="form-check"><input class="form-check-input" type="checkbox" id="${identificador}" data-id="${t.id}"><label class="form-check-label" for="${identificador}">${t.label}</label></div>`;
    recursosDaDNB.appendChild(divisão);
  });
}
document.getElementById('save-airport').addEventListener('click', () => {
  let icao = document.getElementById('gerente-icao').value.trim().toUpperCase();
  if (!icao || icao.length < 3) {
    alert('Código ICAO inválido');
    return;
  }
  let nome = document.getElementById('gerente-name').value.trim();
  let latitude = parseFloat(document.getElementById('gerente-latitude').value);
  let longitude = parseFloat(document.getElementById('gerente-longitude').value);
  let recursos_disponíveis = Array.from(recursosDaDNB.querySelectorAll('input[type=checkbox]:checked')).map(i => i.dataset.id);
  let aeroportos = ler(LS_CHAVES.AEROPORTOS, {});
  aeroportos[icao] = {
    icao,
    name: nome,
    latitude: isFinite(latitude) ? latitude : null,
    longitude: isFinite(longitude) ? longitude : null,
    recursos_disponíveis
  };
  gravar(LS_CHAVES.AEROPORTOS, aeroportos);
  recarregaManager();
  preencheCódigoICAO();
  exibeMarcadoresNoMapa();
  alert('Aeródromo salvo');
});
document.getElementById('delete-airport').addEventListener('click', () => {
  let icao = document.getElementById('gerente-icao').value.trim().toUpperCase();
  if (!icao) {
    alert('Digite ICAO para remover');
    return;
  }
  let aeroportos = ler(LS_CHAVES.AEROPORTOS, {});
  if (!aeroportos[icao]) {
    alert('Não existe');
    return;
  }
  if (!confirm('Remover aeródromo ' + icao + '?')) return;
  delete aeroportos[icao];
  gravar(LS_CHAVES.AEROPORTOS, aeroportos);
  recarregaManager();
  preencheCódigoICAO();
  exibeMarcadoresNoMapa();
});
function recarregaManager() {
  exibeAuxíliosDaDNB();
  let aeroportos = ler(LS_CHAVES.AEROPORTOS, {});
  let lista = document.getElementById('airports-lista');
  lista.innerHTML = '';
  if (Object.keys(aeroportos).length === 0) {
    lista.innerHTML = '<div class="text-muted">Nenhum aeródromo cadastrado</div>';
    return;
  }
  let divisão = document.createElement('div');
  divisão.className = 'table-responsive';
  let tabela = document.createElement('table');
  tabela.className = 'table table-sm';
  tabela.innerHTML = `<thead><tr><th>ICAO</th><th>Nome</th><th>Coords</th><th>Auxílios</th><th>Ações</th></tr></thead>`;
  let corpo_da_tabela = document.createElement('tbody');
  Object.values(aeroportos).forEach(a => {
    let linha_da_tabela = document.createElement('tr');
    linha_da_tabela.innerHTML = `<td>${a.icao}</td><td>${a.name || ''}</td><td>${a.latitude || ''} , ${a.longitude || ''}</td><td>${(a.recursos_disponíveis || []).join(', ')}</td><td><button class="btn btn-sm btn-primary sel-airport" data-icao="${a.icao}">Editar</button></td>`;
    corpo_da_tabela.appendChild(linha_da_tabela);
  });
  tabela.appendChild(corpo_da_tabela);
  divisão.appendChild(tabela);
  lista.appendChild(divisão);
  lista.querySelectorAll('.sel-airport').forEach(b => b.addEventListener('click', () => {
    let icao = b.dataset.icao;
    let airports = ler(LS_CHAVES.AEROPORTOS, {});
    let aeroporto = airports[icao];
    document.getElementById('gerente-icao').value = aeroporto.icao;
    document.getElementById('gerente-name').value = aeroporto.name || '';
    document.getElementById('gerente-latitude').value = aeroporto.latitude || '';
    document.getElementById('gerente-longitude').value = aeroporto.longitude || ''; // check recursos_disponíveis
    recursosDaDNB.querySelectorAll('input[type=checkbox]').forEach(ch => ch.checked = (aeroporto.recursos_disponíveis || []).includes(ch.dataset.id));
  }));
}

/* ----------------- Supervisor (map) ----------------- */
// initialize leaflet
let mapa = L.map('map', {
  gestureHandling: true
}).setView([-15.8, -47.9], 4);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap contributors'
}).addTo(mapa);
let marcadores = {};

function getAirportStatus(icao) {
  let relatórios = ler(LS_CHAVES.RELATÓRIOS, []);
  let aRelatórios = relatórios.filter(relatório => relatório.icao === icao);
  if (aRelatórios.length === 0) return {
    level: 0,
    recent: null
  };
  // highest nível_de_impacto_operacional wins
  let alto = aRelatórios.reduce((m, r) => r.nível_de_impacto_operacional > m.nível_de_impacto_operacional ? r : m, aRelatórios[0]);
  return {
    level: alto.nível_de_impacto_operacional,
    recent: alto
  };
}
function determinaCorDoMarcador(grau_de_severidade) {
  if (!grau_de_severidade || grau_de_severidade <= 1) {
    return 'green';
  }
  if (grau_de_severidade <= 3) {
    return 'orange';
  }
  return 'red';
}
function exibeMarcadoresNoMapa() {
  let aeroportos = ler(LS_CHAVES.AEROPORTOS, {});
  // clear existing
  for (let chave in marcadores) {
    mapa.removeLayer(marcadores[chave]);
    delete marcadores[chave];
  }
  Object.values(aeroportos).forEach(aeroporto => {
    var _status$recent;
    let status = getAirportStatus(aeroporto.icao);
    let col = determinaCorDoMarcador(status.level);
    let latitude = aeroporto.latitude || -15.8;
    let longitude = aeroporto.longitude || -47.9;
    let círculo = L.circle([latitude, longitude], {
      radius: 40000 / Math.max(1, Math.abs(status.level || 1)),
      color: col,
      fillColor: col,
      fillOpacity: 0.35
    }).addTo(mapa);
    círculo.bindPopup(`<strong>${aeroporto.icao} — ${aeroporto.name || ''}</strong><br>Status: ${status.level || 0}<br>Relatório: ${((_status$recent = status.recent) === null || _status$recent === void 0 ? void 0 : _status$recent.label) || 'Nenhum'}`);
    marcadores[aeroporto.icao] = círculo;
  });
}
document.getElementById('center-all').addEventListener('click', () => {
  let aeroportos = Object.values(ler(LS_CHAVES.AEROPORTOS, {}));
  if (aeroportos.length === 0) return;
  let latLngs = aeroportos.filter(a => a.latitude && a.longitude).map(a => [a.latitude, a.longitude]);
  if (latLngs.length === 0) {
    alert('Sem coordenadas definidas');
    return;
  }
  let limites = L.latLngBounds(latLngs);
  mapa.fitBounds(limites, {
    padding: [50, 50]
  });
});
document.getElementById('export-data').addEventListener('click', () => {
  let dados = {
    airports: ler(LS_CHAVES.AEROPORTOS, {}),
    relatórios: ler(LS_CHAVES.RELATÓRIOS, [])
  };
  let blob = new Blob([JSON.stringify(dados, null, 2)], {
    type: 'application/json'
  });
  let url = URL.createObjectURL(blob);
  let a = document.createElement('a');
  a.href = url;
  a.download = 'aerodromos_data.json';
  a.click();
  URL.revokeObjectURL(url);
});

// initial render
recarregaOperator();
recarregaManager();
exibeMarcadoresNoMapa();

// expose a small API in window for easy debugging
window._AERO = {
  read: ler,
  write: gravar,
  LS_CHAVES,
  renderMapMarkers: exibeMarcadoresNoMapa,
  recarregaRelatórios
};