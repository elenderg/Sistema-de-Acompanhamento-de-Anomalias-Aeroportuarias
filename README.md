# Sistema de Anomalias — Aeródromos

Este projeto é um **dashboard web responsivo** para registro e supervisão de anomalias em aeródromos, pensado para uso por **operadores, gerentes e supervisores**.  

O site é construído com **HTML, CSS (Bootstrap 5), FontAwesome e JavaScript puro**. Ele pode ser hospedado facilmente na **Netlify** ou qualquer serviço de hospedagem estática.

---

## Funcionalidades

### 1. Módulo Operador
- Seleção do aeródromo pelo código ICAO.  
- Registro de **anomalias** (equipamentos, condições meteorológicas, pista, acidentes, etc.).  
- Interface de botões estilo Metro, com ícones representativos.  
- Campo de descrição opcional.  
- Lista de relatórios recentes.  

### 2. Módulo Gerente
- Cadastro de aeródromos e suas coordenadas.  
- Seleção de auxílios disponíveis no aeródromo (apenas os marcados aparecem para operadores).  
- Edição e remoção de aeródromos.  
- Lista completa de aeródromos cadastrados.  

### 3. Módulo Supervisão
- Mapa interativo usando **Leaflet + OpenStreetMap**.  
- Círculos coloridos indicam status de cada aeródromo:  
  - Verde → tudo funcionando  
  - Amarelo → anomalia média  
  - Vermelho → anomalia crítica  
- Centralização de todos os aeródromos e exportação de dados em JSON.

---

## Tecnologias
- **HTML5 / CSS3**  
- **Bootstrap 5** — layout responsivo  
- **FontAwesome** — ícones  
- **JavaScript Puro** — todas as interações, sem frameworks  
- **Leaflet** — mapa interativo com OpenStreetMap  
- **LocalStorage** — armazenamento local para demonstração (fácil de trocar por API)

---

## Estrutura do Projeto

│   index.html  --  página inicial do projeto  
│   LICENSE     --  arquivo de licença
│   README.md   --  este arquivo  
│  
│───css  
│       styles.css  -- folha de estilos  
│  
│───js  
        script.js  -- scripts para o site  
---

## Como usar

1. Clone este repositório:
```bash
git clone https://github.com/seu-usuario/aerodromos-dashboard.git
```
2. Abra index.html no navegador para testar localmente.
3. Para deploy na Netlify:
Faça login em Netlify
Clique em "New Site from Git"
Selecione o repositório e finalize o deploy.
4. Ao abrir o site, você pode alternar entre Operador, Gerente e Supervisão pelos botões do topo.
