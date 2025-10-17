/* ----------------- Modelo de Dados (localStorage) ----------------- */
let CHAVES_ARMAZENAMENTO_LOCAL = {
  AEROPORTOS: 'aerodromos_v1',
  RELATORIOS: 'relatorios_v1'
};

function lerDoArmazenamentoLocal(chave, valorPadrao) {
  try {
    let valorConsultado = localStorage.getItem(chave);
    if (valorConsultado) {
      return JSON.parse(valorConsultado);
    } else {
      return valorPadrao;
    }
  } 
  catch (erro) {
    return valorPadrao;
  }
}

function gravarNoArmazenamentoLocal(chave, valor) {
  localStorage.setItem(chave, JSON.stringify(valor));
}

/* ----------------- Módulo do Supervisor (Mapa) ----------------- */
// Inicializa o Leaflet
let mapa = L.map('map', {
  gestureHandling: true
}).setView([-15.8, -47.9], 4);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap contributors'
}).addTo(mapa);

let marcadoresDoMapa = {};

function obterStatusDoAeroporto(icao) {
  let relatorios = lerDoArmazenamentoLocal(CHAVES_ARMAZENAMENTO_LOCAL.RELATORIOS, []);
  let relatoriosDoAeroporto = relatorios.filter(relatorio => relatorio.icao === icao);
  
  if (relatoriosDoAeroporto.length === 0) {
    return { nível: 0, relatorioRecente: null };
  }
  
  // O relatório com maior nível de impacto operacional prevalece
  let relatorioMaisGrave = relatoriosDoAeroporto.reduce(
    (max, relatório) => relatório.nívelDeImpactoOperacional > max.nívelDeImpactoOperacional ? relatório : max, relatoriosDoAeroporto[0]
  );
  
  return {
    nível: relatorioMaisGrave.nívelDeImpactoOperacional,
    relatorioRecente: relatorioMaisGrave
  };
}

function determinarCorDoMarcador(nívelDeSeveridade) {
  if (!nívelDeSeveridade || nívelDeSeveridade <= 1) {
    return 'green';
  }
  if (nívelDeSeveridade <= 3) {
    return 'orange';
  }
  return 'red';
}

function exibirMarcadoresNoMapa() {
  let aeroportos = lerDoArmazenamentoLocal(CHAVES_ARMAZENAMENTO_LOCAL.AEROPORTOS, {});
  
  // Limpa marcadores existentes
  for (let chave in marcadoresDoMapa) {
    mapa.removeLayer(marcadoresDoMapa[chave]);
    delete marcadoresDoMapa[chave];
  }
  
  Object.values(aeroportos).forEach(aeroporto => {
    let status = obterStatusDoAeroporto(aeroporto.icao);
    let cor = determinarCorDoMarcador(status.nível);
    let latitude = aeroporto.latitude || -15.8;
    let longitude = aeroporto.longitude || -47.9;
    
    let circulo = L.circle([latitude, longitude], {
      radius: 40000 / Math.max(1, Math.abs(status.nível || 1)),
      color: cor,
      fillColor: cor,
      fillOpacity: 0.35
    }).addTo(mapa);
    
    circulo.bindPopup(`<strong>${aeroporto.icao} — ${aeroporto.nome || ''}</strong><br>Status: ${status.nível || 0}<br>Relatório: ${status.relatorioRecente?.rotulo || 'Nenhum'}`);
    marcadoresDoMapa[aeroporto.icao] = circulo;
  });
}

document.getElementById('center-all').addEventListener('click', () => {
  let aeroportos = Object.values(lerDoArmazenamentoLocal(CHAVES_ARMAZENAMENTO_LOCAL.AEROPORTOS, {}));
  if (aeroportos.length === 0) {
    return;
  }
  
  let coordenadas = aeroportos
    .filter(aeroporto => aeroporto.latitude && aeroporto.longitude)
    .map(aeroporto => [aeroporto.latitude, aeroporto.longitude]);
    
  if (coordenadas.length === 0) {
    alert('Sem coordenadas definidas para centralizar');
    return;
  }
  
  let limites = L.latLngBounds(coordenadas);
  mapa.fitBounds(limites, { padding: [50, 50] });
});

document.getElementById('export-data').addEventListener('click', () => {
  let dados = {
    aeroportos: lerDoArmazenamentoLocal(CHAVES_ARMAZENAMENTO_LOCAL.AEROPORTOS, {}),
    relatorios: lerDoArmazenamentoLocal(CHAVES_ARMAZENAMENTO_LOCAL.RELATORIOS, [])
  };
  
  let blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
  let url = URL.createObjectURL(blob);
  let link = document.createElement('a');
  link.href = url;
  link.download = 'aerodromos_data.json';
  link.click();
  URL.revokeObjectURL(url);
});

// Renderização inicial
exibirMarcadoresNoMapa();
