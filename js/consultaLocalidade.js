/*<div>
  <span>Sua filial: </span>
  <strong id="localidade">Carregando...</strong>
</div>
<script>
</script>

*/

async function carregaLocalidade(emailDoUsuário) {
  try {
    const resposta = await fetch(`http://localhost:3000/localidade?email=${encodeURIComponent(emailDoUsuário)}`);
    if (!resposta.ok) {
      throw new Error("Falha na requisição");
    }
    const dados = await resposta.json();
    document.getElementById("localidade").textContent = dados.localidade;
  } catch (erro) {
    console.error(erro);
    document.getElementById("localidade").textContent = "Erro ao obter localidade";
  }
}

// Exemplo: e-mail do usuário obtido de login ou sessão
carregaLocalidade("nome.sobrenome@navbrasil.gov.br");
