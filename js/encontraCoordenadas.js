/**
 * Lê o arquivo aeroportos.json e retorna latitude e longitude
 * do aeroporto cujo código ICAO for informado.
 * 
 * @param {string} icao - Código ICAO do aeroporto (ex: "SBAE").
 * @returns {Promise<{latitude: number, longitude: number} | null>}
 */
async function obterCoordenadasPorICAO(icao) {
  try {
    // Carrega o arquivo JSON (deve estar no mesmo diretório do site)
    const response = await fetch('aeroportos.json');

    if (!response.ok) {
      throw new Error(`Erro ao carregar aeroportos.json (status ${response.status})`);
    }

    // Converte o conteúdo em objeto JavaScript
    const aeroportos = await response.json();

    // Normaliza o código ICAO (ex: "sbae" -> "SBAE")
    const codigo = icao.trim().toUpperCase();

    // Busca o aeroporto correspondente
    const aeroporto = aeroportos.find(a => a.ICAO === codigo);

    if (!aeroporto) {
      console.warn(`Aeroporto com ICAO '${codigo}' não encontrado.`);
      return null;
    }

    return {
      latitude: aeroporto.latitude,
      longitude: aeroporto.longitude
    };

  } catch (erro) {
    console.error("Erro ao obter coordenadas:", erro);
    return null;
  }
}

// Exemplo de uso:
/*
obterCoordenadasPorICAO("SBAE").then(coords => {
  if (coords) {
    console.log(`Latitude: ${coords.latitude}, Longitude: ${coords.longitude}`);
  } else {
    console.log("Aeroporto não encontrado ou erro na leitura do arquivo.");
  }
});
*/

// Você pode chamar obterCoordenadasPorICAO() com qualquer código ICAO válido.