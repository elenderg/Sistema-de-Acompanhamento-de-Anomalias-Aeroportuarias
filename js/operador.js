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
    });
  });
}

// Renderização inicial
recarregarModuloOperador();
