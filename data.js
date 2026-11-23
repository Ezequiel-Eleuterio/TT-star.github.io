/* Dados compartilhados entre a Rota da Luz (index.html) e o T-star (tstar.html).
   r/c = linha/coluna da primeira letra no tabuleiro; d = H (horizontal) ou V (vertical).
   pista  -> pergunta curta usada nos três jogos (sem entregar a resposta)
   nome   -> nome completo do termo
   resumo -> o que o componente faz (aparece na mini caixa a cada acerto) */
const PALAVRAS = [
  {
    a: "CPU", r: 5, c: 10, d: "H",
    sigla: "CPU", nome: "Central Processing Unit (Unidade Central de Processamento)",
    pista: "Qual é o cérebro do computador?",
    resumo: "Busca, interpreta e executa as instruções dos programas."
  },
  {
    a: "ULA", r: 11, c: 9, d: "H",
    sigla: "ULA", nome: "Unidade Lógica e Aritmética",
    pista: "Quem faz as contas dentro da CPU?",
    resumo: "Faz somas, subtrações e comparações lógicas para a CPU."
  },
  {
    a: "UC", r: 14, c: 8, d: "V",
    sigla: "UC", nome: "Unidade de Controle",
    pista: "Quem dá as ordens dentro da CPU?",
    resumo: "Interpreta cada instrução e manda sinais para os outros componentes agirem."
  },
  {
    a: "REGISTRADORES", r: 3, c: 0, d: "H",
    sigla: "Registradores", nome: "Registradores da CPU",
    pista: "Quais são as memórias mais rápidas, dentro da CPU?",
    resumo: "Guardam os dados e resultados que a CPU está usando agora, com acesso imediato."
  },
  {
    a: "RAM", r: 7, c: 12, d: "V",
    sigla: "RAM", nome: "Random Access Memory (Memória de Acesso Aleatório)",
    pista: "Qual é a memória principal que apaga ao desligar?",
    resumo: "Guarda os programas e dados em uso; perde tudo quando falta energia."
  },
  {
    a: "ROM", r: 9, c: 10, d: "H",
    sigla: "ROM", nome: "Read-Only Memory (Memória Somente de Leitura)",
    pista: "Qual memória já vem gravada de fábrica e não muda?",
    resumo: "Guarda o firmware de inicialização e mantém o conteúdo sem energia."
  },
  {
    a: "EEPROM", r: 10, c: 0, d: "H",
    sigla: "EEPROM", nome: "Electrically Erasable Programmable Read-Only Memory",
    pista: "Qual memória permanente é regravada um byte por vez?",
    resumo: "Guarda configurações que podem ser trocadas byte a byte e não somem ao desligar."
  },
  {
    a: "FLASH", r: 0, c: 4, d: "V",
    sigla: "Flash", nome: "Memória Flash",
    pista: "Qual memória regravável em blocos está em pendrives e SSDs?",
    resumo: "Guarda dados sem energia e é apagada em blocos; é a base de pendrives e SSDs."
  },
  {
    a: "CACHE", r: 8, c: 0, d: "H",
    sigla: "Cache", nome: "Memória cache",
    pista: "Qual memória veloz guarda o que a CPU mais usa?",
    resumo: "Mantém por perto os dados mais usados para a CPU não esperar pela RAM."
  },
  {
    a: "MEMORIADEMASSA", r: 2, c: 1, d: "V",
    sigla: "Memória de massa", nome: "Memória de massa (armazenamento)",
    pista: "Qual componente guarda muitos dados de forma permanente, como HD e SSD?",
    resumo: "Guarda arquivos e programas por muito tempo e em grande quantidade."
  },
  {
    a: "DMA", r: 0, c: 9, d: "H",
    sigla: "DMA", nome: "Direct Memory Access (Acesso Direto à Memória)",
    pista: "Qual técnica transfere dados à RAM sem ocupar a CPU?",
    resumo: "Move dados entre periféricos e memória sozinho, deixando a CPU livre."
  },
  {
    a: "ADDRESSBUS", r: 0, c: 6, d: "V",
    sigla: "Address bus", nome: "Barramento de endereços",
    pista: "Qual via de mão única aponta a posição na memória?",
    resumo: "Leva da CPU o endereço da posição de memória que será lida ou escrita."
  },
  {
    a: "DATABUS", r: 12, c: 0, d: "H",
    sigla: "Data bus", nome: "Barramento de dados",
    pista: "Qual via de mão dupla leva o conteúdo entre CPU e memória?",
    resumo: "Leva os dados da memória para a CPU e da CPU para a memória."
  },
  {
    a: "MICROCONTROLADOR", r: 0, c: 10, d: "V",
    sigla: "Microcontrolador", nome: "Microcontrolador (MCU)",
    pista: "Qual chip único junta CPU, memória e portas de entrada e saída?",
    resumo: "É um computador completo em um só chip, comum em aparelhos e sensores."
  },
  {
    a: "DUALCORE", r: 3, c: 8, d: "V",
    sigla: "Dual core", nome: "Processador de dois núcleos",
    pista: "Qual processador tem um par de núcleos?",
    resumo: "Dois núcleos executam tarefas ao mesmo tempo, em paralelo."
  },
  {
    a: "QUADCORE", r: 15, c: 4, d: "H",
    sigla: "Quad core", nome: "Processador de quatro núcleos",
    pista: "Qual processador tem quatro núcleos?",
    resumo: "Quatro núcleos executam até quatro tarefas ao mesmo tempo."
  }
];

/* Tamanho do tabuleiro, calculado a partir das palavras. */
const TAB = (() => {
  let linhas = 0, colunas = 0;
  PALAVRAS.forEach(p => {
    const fr = p.r + (p.d === "V" ? p.a.length : 1);
    const fc = p.c + (p.d === "H" ? p.a.length : 1);
    linhas = Math.max(linhas, fr);
    colunas = Math.max(colunas, fc);
  });
  return { linhas, colunas };
})();

/* Mini caixa com a resposta e o resumo do componente (usada a cada acerto).
   opc.rotulo: texto do selo; opc.aoFechar: se informado, mostra o botão de fechar. */
function miniCaixa(p, opc) {
  opc = opc || {};
  const box = document.createElement("div");
  box.className = "mini";
  box.setAttribute("role", "status");

  const topo = document.createElement("div");
  topo.className = "mini-topo";
  const selo = document.createElement("span");
  selo.className = "mini-selo";
  selo.textContent = opc.rotulo || "✔ Resposta";
  topo.appendChild(selo);
  if (opc.aoFechar) {
    const x = document.createElement("button");
    x.type = "button";
    x.className = "mini-x";
    x.setAttribute("aria-label", "Fechar");
    x.textContent = "×";
    x.addEventListener("click", opc.aoFechar);
    topo.appendChild(x);
  }

  const resp = document.createElement("div");
  resp.className = "mini-resp";
  resp.textContent = p.sigla;

  const nome = document.createElement("div");
  nome.className = "mini-nome";
  nome.textContent = p.nome;

  const resumo = document.createElement("p");
  resumo.className = "mini-resumo";
  const forte = document.createElement("strong");
  forte.textContent = "O que faz: ";
  resumo.append(forte, document.createTextNode(p.resumo));

  box.append(topo, resp, nome, resumo);
  return box;
}
