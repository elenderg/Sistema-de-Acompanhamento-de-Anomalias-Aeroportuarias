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
}
gerarDadosDeExemplo();

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

// Renderização inicial
recarregarModuloGerente();
