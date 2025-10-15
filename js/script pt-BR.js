/* ----------------- Modelo de Dados (localStorage) ----------------- */
let CHAVES_ARMAZENAMENTO_LOCAL = {
  AEROPORTOS: 'aerodromos_v1',
  RELATORIOS: 'relatorios_v1'
};

let BOTOES_PRINCIPAIS = [{
  id: 'meteo',
  rotulo: 'Condições Meteorológicas',
  icone: 'fa-cloud-sun',
  nívelDeImpactoOperacional: 2
}, {
  id: 'aux',
  rotulo: 'Auxílios (VOR, NDB, ILS...)',
  icone: 'fa-location-dot',
  nívelDeImpactoOperacional: 3
}, {
  id: 'luzes',
  rotulo: 'Luzes (Balizamento, Farol)',
  icone: 'fa-lightbulb',
  nívelDeImpactoOperacional: 2
}, {
  id: 'comunicacao',
  rotulo: 'Comunicação / Rádio',
  icone: 'fa-wifi',
  nívelDeImpactoOperacional: 3
}, {
  id: 'rede',
  rotulo: 'Internet / Transmissão',
  icone: 'fa-network-wired',
  nívelDeImpactoOperacional: 2
}, {
  id: 'pista',
  rotulo: 'Pista (Incursão / Impraticabilidade)',
  icone: 'fa-road',
  nívelDeImpactoOperacional: 4
}, {
  id: 'acidente',
  rotulo: 'Acidente / Incidente',
  icone: 'fa-triangle-exclamation',
  nívelDeImpactoOperacional: 5
}, {
  id: 'outro',
  rotulo: 'Outro',
  icone: 'fa-ellipsis',
  nívelDeImpactoOperacional: 1
}];

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

// Dados de exemplo
function gerarDadosDeExemplo() {
  let aeroportos = lerDoArmazenamentoLocal(CHAVES_ARMAZENAMENTO_LOCAL.AEROPORTOS, null);
  if (aeroportos) {
    aeroportos = {
      'SBGR': {
        icao: 'SBGR',
        nome: 'São Paulo/Guarulhos',
        latitude: -23.4356,
        longitude: -46.4731,
        recursosDisponiveis: ['meteo', 'luzes', 'comunicacao', 'rede', 'aux']
      },
      'SBSP': {
        icao: 'SBSP',
        nome: 'São Paulo/Congonhas',
        latitude: -23.6261,
        longitude: -46.6567,
        recursosDisponiveis: ['meteo', 'luzes', 'pista']
      },
      'SBCF': {
        icao: 'SBCF',
        nome: 'Cuiabá',
        latitude: -15.6520,
        longitude: -56.1160,
        recursosDisponiveis: ['meteo', 'comunicacao']
      }
    };
    gravarNoArmazenamentoLocal(CHAVES_ARMAZENAMENTO_LOCAL.AEROPORTOS, aeroportos);
  }
  
  let relatorios = lerDoArmazenamentoLocal(CHAVES_ARMAZENAMENTO_LOCAL.RELATORIOS, []);
  if (!relatorios) {
    gravarNoArmazenamentoLocal(CHAVES_ARMAZENAMENTO_LOCAL.RELATORIOS, []);
  }
}
gerarDadosDeExemplo();

/* ----------------- Definições da Interface de Usuário ----------------- */
let modulos = {
  operador: document.getElementById('módulo-operador'),
  gerente: document.getElementById('módulo-gerente'),
  supervisor: document.getElementById('módulo-supervisor')
};

document.getElementById('btn-operador').addEventListener('click', () => exibirModulo('operador'));
document.getElementById('btn-gerente').addEventListener('click', () => exibirModulo('gerente'));
document.getElementById('btn-supervisor').addEventListener('click', () => exibirModulo('supervisor'));

function exibirModulo(chave) {
  for (let chaveModulo in modulos) {
    modulos[chaveModulo].style.display = 'none';
  }
  modulos[chave].style.display = '';

  if (chave === 'operador') {
    recarregarModuloOperador();
  }
  if (chave === 'gerente') {
    recarregarModuloGerente();
  }
  if (chave === 'supervisor') {
    setTimeout(() => {
        mapa.invalidateSize();
        exibirMarcadoresNoMapa();
      }, 300
    );
  }
}

// O site começa exibindo o módulo do operador
document.addEventListener('DOMContentLoaded', () => {
  exibirModulo('operador');
});

/* ----------------- Módulo do Operador ----------------- */
let grupoDeBotoes = document.getElementById('tiles');

function exibirBotoes(idsDisponiveis = null) {
  grupoDeBotoes.innerHTML = '';
  // Se idsDisponiveis for nulo, mostra todos os botões
  let botoesParaExibir = BOTOES_PRINCIPAIS.filter(bloco => !idsDisponiveis || idsDisponiveis.includes(bloco.id));
  
  botoesParaExibir.forEach(bloco => {
    let botao = document.createElement('button');
    botao.className = 'tile btn border text-start';
    botao.dataset.id = bloco.id;
    botao.innerHTML = `<div class="d-flex align-items-center w-100"><i class="fa ${bloco.icone} fa-2x me-3"></i><div><div class="label">${bloco.rotulo}</div><small class="text-muted">gravidade ${bloco.nívelDeImpactoOperacional}</small></div></div>`;
    
    botao.addEventListener('click', () => {
      // Alterna a classe 'ativa'
      Array.from(grupoDeBotoes.children).forEach(c => c.classList.remove('border-primary'));
      botao.classList.add('border-primary');
      botao.dataset.selected = '1';
    });
    grupoDeBotoes.appendChild(botao);
  });
}

// Preenche o seletor de aeródromos com o código ICAO
function preencherSeletorDeAerodromos() {
  let seletor = document.getElementById('operador-icao');
  seletor.innerHTML = '';
  let aeroportos = lerDoArmazenamentoLocal(CHAVES_ARMAZENAMENTO_LOCAL.AEROPORTOS, {});
  
  Object.values(aeroportos).forEach(aeroporto => {
    let opcao = document.createElement('option');
    opcao.value = aeroporto.icao;
    opcao.textContent = `${aeroporto.icao} — ${aeroporto.nome || '—'}`;
    seletor.appendChild(opcao);
  });
}

document.getElementById('operador-icao').addEventListener('change', () => {
  let icao = document.getElementById('operador-icao').value;
  let aeroportos = lerDoArmazenamentoLocal(CHAVES_ARMAZENAMENTO_LOCAL.AEROPORTOS, {});
  let aeroporto = aeroportos[icao];
  
  if (aeroporto && aeroporto.recursosDisponiveis) {
    exibirBotoes(aeroporto.recursosDisponiveis);
  } else {
    // Se o aeroporto não for encontrado ou não tiver recursos, exibe todos os botões
    exibirBotoes(BOTOES_PRINCIPAIS.map(bloco => bloco.id));
  }
});

document.getElementById('botão_relatório').addEventListener('click', () => {
  let icao = document.getElementById('operador-icao').value;
  if (!icao) {
    alert('Selecione um aeródromo');
    return;
  }
  
  let botaoSelecionado = Array.from(grupoDeBotoes.children).find(el => el.dataset.selected === '1');
  if (!botaoSelecionado) {
    alert('Selecione uma categoria');
    return;
  }
  
  let idDoBloco = botaoSelecionado.dataset.id;
  let descricao = document.getElementById('operador-desc').value;
  let relatorios = lerDoArmazenamentoLocal(CHAVES_ARMAZENAMENTO_LOCAL.RELATORIOS, []);
  
  let metadadosDoBloco = BOTOES_PRINCIPAIS.find(bloco => bloco.id === idDoBloco) || {
    nívelDeImpactoOperacional: 1,
    rotulo: idDoBloco
  };
  
  let relatorio = {
    id: 'r_' + Date.now(),
    icao,
    bloco: idDoBloco,
    rotulo: metadadosDoBloco.rotulo,
    nívelDeImpactoOperacional: metadadosDoBloco.nívelDeImpactoOperacional,
    descricao: descricao,
    timestamp: new Date().toISOString()
  };
  
  relatorios.push(relatorio);
  gravarNoArmazenamentoLocal(CHAVES_ARMAZENAMENTO_LOCAL.RELATORIOS, relatorios);
  
  document.getElementById('operador-desc').value = '';
  Array.from(grupoDeBotoes.children).forEach(el => {
    el.classList.remove('border-primary');
    delete el.dataset.selected;
  });
  
  recarregarListaDeRelatorios();
  exibirMarcadoresNoMapa();
  alert('Relatório salvo.');
});

document.getElementById('clear-btn').addEventListener('click', () => {
  document.getElementById('operador-desc').value = '';
  Array.from(grupoDeBotoes.children).forEach(el => {
    el.classList.remove('border-primary');
    delete el.dataset.selected;
  });
});

function recarregarModuloOperador() {
  preencherSeletorDeAerodromos();
  let aeroportos = lerDoArmazenamentoLocal(CHAVES_ARMAZENAMENTO_LOCAL.AEROPORTOS, {});
  let icao = document.getElementById('operador-icao').value || Object.keys(aeroportos)[0];
  
  if (icao) {
    document.getElementById('operador-icao').value = icao;
  }
  
  let aeroporto = aeroportos[icao];
  if (aeroporto && aeroporto.recursosDisponiveis) {
    exibirBotoes(aeroporto.recursosDisponiveis);
  } else {
    exibirBotoes(); // Exibe todos se não houver aeroporto ou recursos
  }
  
  recarregarListaDeRelatorios();
}

/* ----------------- Lista de Relatórios ----------------- */
function recarregarListaDeRelatorios() {
  let relatorios = lerDoArmazenamentoLocal(CHAVES_ARMAZENAMENTO_LOCAL.RELATORIOS, []).slice().reverse();
  let container = document.getElementById('relatórios-lista');
  container.innerHTML = '';
  
  if (relatorios.length === 0) {
    container.innerHTML = '<div class="text-muted">Nenhum relatório</div>';
    return;
  }
  
  let lista = document.createElement('div');
  lista.className = 'lista-group';
  
  relatorios.slice(0, 50).forEach(relatorio => {
    let item = document.createElement('div');
    item.className = 'lista-group-item d-flex justify-content-between align-items-start';
    
    let conteudoEsquerda = document.createElement('div');
    conteudoEsquerda.innerHTML = `<div><strong>${relatorio.icao} — ${relatorio.rotulo}</strong></div><div class="text-muted small">${new Date(relatorio.timestamp).toLocaleString()}</div><div>${relatorio.descricao || ''}</div>`;
    
    let conteudoDireita = document.createElement('div');
    let classeStatus = relatorio.nívelDeImpactoOperacional >= 4 ? 'status-red' : relatorio.nívelDeImpactoOperacional >= 3 ? 'status-yellow' : 'status-green';
    conteudoDireita.innerHTML = `<div class="p-2 rounded ${classeStatus}">${relatorio.nívelDeImpactoOperacional}</div><div class="mt-2"><button class="btn btn-sm btn-outline-danger" data-id="${relatorio.id}">Remover</button></div>`;
    
    item.appendChild(conteudoEsquerda);
    item.appendChild(conteudoDireita);
    lista.appendChild(item);
  });
  
  container.appendChild(lista);
  
  // Anexa eventos de remoção
  container.querySelectorAll('button[data-id]').forEach(botao => {
    botao.addEventListener('click', () => {
      let idParaRemover = botao.dataset.id;
      let relatoriosAtuais = lerDoArmazenamentoLocal(CHAVES_ARMAZENAMENTO_LOCAL.RELATORIOS, []);
      let relatoriosFiltrados = relatoriosAtuais.filter(r => r.id !== idParaRemover);
      gravarNoArmazenamentoLocal(CHAVES_ARMAZENAMENTO_LOCAL.RELATORIOS, relatoriosFiltrados);
      recarregarListaDeRelatorios();
      exibirMarcadoresNoMapa();
    });
  });
}

/* ----------------- Módulo do Gerente ----------------- */
let containerRecursos = document.getElementById('gerente-recursos_disponíveis');

function exibirOpcoesDeRecursos() {
  containerRecursos.innerHTML = '';
  BOTOES_PRINCIPAIS.forEach(bloco => {
    let idCheckbox = 'c_' + bloco.id;
    let div = document.createElement('div');
    div.innerHTML = `<div class="form-check"><input class="form-check-input" type="checkbox" id="${idCheckbox}" data-id="${bloco.id}"><label class="form-check-label" for="${idCheckbox}">${bloco.rotulo}</label></div>`;
    containerRecursos.appendChild(div);
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
  let recursosDisponiveis = Array.from(containerRecursos.querySelectorAll('input[type=checkbox]:checked')).map(i => i.dataset.id);
  
  let aeroportos = lerDoArmazenamentoLocal(CHAVES_ARMAZENAMENTO_LOCAL.AEROPORTOS, {});
  aeroportos[icao] = {
    icao,
    nome: nome,
    latitude: isFinite(latitude) ? latitude : null,
    longitude: isFinite(longitude) ? longitude : null,
    recursosDisponiveis
  };
  
  gravarNoArmazenamentoLocal(CHAVES_ARMAZENAMENTO_LOCAL.AEROPORTOS, aeroportos);
  recarregarModuloGerente();
  preencherSeletorDeAerodromos();
  exibirMarcadoresNoMapa();
  alert('Aeródromo salvo');
});

document.getElementById('delete-airport').addEventListener('click', () => {
  let icao = document.getElementById('gerente-icao').value.trim().toUpperCase();
  if (!icao) {
    alert('Digite o ICAO para remover');
    return;
  }
  
  let aeroportos = lerDoArmazenamentoLocal(CHAVES_ARMAZENAMENTO_LOCAL.AEROPORTOS, {});
  if (!aeroportos[icao]) {
    alert('Aeródromo não encontrado');
    return;
  }
  
  if (!confirm('Remover aeródromo ' + icao + '?')) return;
  
  delete aeroportos[icao];
  gravarNoArmazenamentoLocal(CHAVES_ARMAZENAMENTO_LOCAL.AEROPORTOS, aeroportos);
  recarregarModuloGerente();
  preencherSeletorDeAerodromos();
  exibirMarcadoresNoMapa();
});

function recarregarModuloGerente() {
  exibirOpcoesDeRecursos();
  let aeroportos = lerDoArmazenamentoLocal(CHAVES_ARMAZENAMENTO_LOCAL.AEROPORTOS, {});
  let listaContainer = document.getElementById('airports-lista');
  listaContainer.innerHTML = '';
  
  if (Object.keys(aeroportos).length === 0) {
    listaContainer.innerHTML = '<div class="text-muted">Nenhum aeródromo cadastrado</div>';
    return;
  }
  
  let divTabela = document.createElement('div');
  divTabela.className = 'table-responsive';
  let tabela = document.createElement('table');
  tabela.className = 'table table-sm';
  tabela.innerHTML = `<thead><tr><th>ICAO</th><th>Nome</th><th>Coords</th><th>Auxílios</th><th>Ações</th></tr></thead>`;
  
  let corpoTabela = document.createElement('tbody');
  Object.values(aeroportos).forEach(aeroporto => {
    let linha = document.createElement('tr');
    linha.innerHTML = `<td>${aeroporto.icao}</td><td>${aeroporto.nome || ''}</td><td>${aeroporto.latitude || ''} , ${aeroporto.longitude || ''}</td><td>${(aeroporto.recursosDisponiveis || []).join(', ')}</td><td><button class="btn btn-sm btn-primary sel-airport" data-icao="${aeroporto.icao}">Editar</button></td>`;
    corpoTabela.appendChild(linha);
  });
  
  tabela.appendChild(corpoTabela);
  divTabela.appendChild(tabela);
  listaContainer.appendChild(divTabela);
  
  listaContainer.querySelectorAll('.sel-airport').forEach(botao => {
    botao.addEventListener('click', () => {
      let icao = botao.dataset.icao;
      let aeroportos = lerDoArmazenamentoLocal(CHAVES_ARMAZENAMENTO_LOCAL.AEROPORTOS, {});
      let aeroporto = aeroportos[icao];
      
      document.getElementById('gerente-icao').value = aeroporto.icao;
      document.getElementById('gerente-name').value = aeroporto.nome || '';
      document.getElementById('gerente-latitude').value = aeroporto.latitude || '';
      document.getElementById('gerente-longitude').value = aeroporto.longitude || '';
      
      // Marca os checkboxes dos recursos disponíveis
      containerRecursos.querySelectorAll('input[type=checkbox]').forEach(ch => {
        ch.checked = (aeroporto.recursosDisponiveis || []).includes(ch.dataset.id);
      });
    });
  });
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
recarregarModuloOperador();
recarregarModuloGerente();
exibirMarcadoresNoMapa();

// Expõe uma pequena API na janela para facilitar a depuração
window._AERO = {
  ler: lerDoArmazenamentoLocal,
  gravar: gravarNoArmazenamentoLocal,
  CHAVES_ARMAZENAMENTO_LOCAL,
  renderizarMarcadoresMapa: exibirMarcadoresNoMapa,
  recarregarRelatorios: recarregarListaDeRelatorios
};