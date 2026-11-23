(function () {
  "use strict";

  const total = PALAVRAS.length;
  const $ = (id) => document.getElementById(id);
  const normaliza = (s) =>
    s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z]/g, "").toUpperCase();

  /* Regras de dificuldade da tela "Descobrir a palavra" */
  const MAX_TENTATIVAS = 3;
  const MAX_DICAS = 1;

  /* Respostas alternativas aceitas na tela "Descobrir a palavra". */
  const ALIAS = {
    UC: ["UNIDADEDECONTROLE"],
    ULA: ["UNIDADELOGICAEARITMETICA", "ALU"],
    CPU: ["PROCESSADOR", "UNIDADECENTRALDEPROCESSAMENTO"],
    ADDRESSBUS: ["BARRAMENTODEENDERECO", "BARRAMENTODEENDERECOS", "BARRAMENTOENDERECO"],
    DATABUS: ["BARRAMENTODEDADOS", "BARRAMENTODADOS"],
    MEMORIADEMASSA: ["ARMAZENAMENTO", "MEMORIADEARMAZENAMENTO", "MEMORIAMASSA"],
    MICROCONTROLADOR: ["MCU"],
    CACHE: ["MEMORIACACHE"],
    FLASH: ["MEMORIAFLASH"],
  };

  /* ================= ABAS ================= */
  const abaCruzada = $("aba-cruzada");
  const abaDescobrir = $("aba-descobrir");
  const telaCruzada = $("tela-cruzada");
  const telaDescobrir = $("tela-descobrir");

  function mostrarTela(qual) {
    const cruz = qual === "cruzada";
    telaCruzada.hidden = !cruz;
    telaDescobrir.hidden = cruz;
    abaCruzada.setAttribute("aria-selected", String(cruz));
    abaDescobrir.setAttribute("aria-selected", String(!cruz));
    if (!cruz) $("d-resposta").focus({ preventScroll: true });
  }
  abaCruzada.addEventListener("click", () => mostrarTela("cruzada"));
  abaDescobrir.addEventListener("click", () => mostrarTela("descobrir"));

  /* ================= ROTA DA LUZ (CRUZADINHA) ================= */
  const celulas = new Map(); // "r,c" -> { el, input, r, c, pal: {H, V}, num }
  const chave = (r, c) => r + "," + c;

  PALAVRAS.forEach((p, i) => {
    p.i = i;
    p.celulas = [];
    for (let k = 0; k < p.a.length; k++) {
      const r = p.r + (p.d === "V" ? k : 0);
      const c = p.c + (p.d === "H" ? k : 0);
      const key = chave(r, c);
      if (!celulas.has(key)) celulas.set(key, { r, c, pal: {}, letra: p.a[k], travada: false });
      celulas.get(key).pal[p.d] = i;
      p.celulas.push(key);
    }
  });

  // Numeração: ordem de leitura (linha, depois coluna) das casas onde começa uma palavra.
  const inicios = [...new Set(PALAVRAS.map((p) => chave(p.r, p.c)))].sort((a, b) => {
    const [ra, ca] = a.split(",").map(Number);
    const [rb, cb] = b.split(",").map(Number);
    return ra - rb || ca - cb;
  });
  inicios.forEach((key, n) => { celulas.get(key).num = n + 1; });
  PALAVRAS.forEach((p) => { p.num = celulas.get(chave(p.r, p.c)).num; });

  const tabuleiro = $("tabuleiro");
  tabuleiro.style.gridTemplateColumns = `repeat(${TAB.colunas}, var(--cell))`;
  tabuleiro.setAttribute("aria-rowcount", TAB.linhas);
  tabuleiro.setAttribute("aria-colcount", TAB.colunas);

  const estado = { key: null, dir: "H" };
  let alternarAoClicar = false;

  /* Estado de cada palavra depois de conferida: "certa", "errada" (tinha letras erradas)
     ou "incompleta" (sem erros, mas faltam letras). Chave = índice da palavra. */
  const estadoPal = new Map();
  const qtdCertas = () => [...estadoPal.values()].filter((v) => v === "certa").length;

  for (let r = 0; r < TAB.linhas; r++) {
    for (let c = 0; c < TAB.colunas; c++) {
      const key = chave(r, c);
      const cel = celulas.get(key);
      if (!cel) {
        const v = document.createElement("div");
        v.className = "vazio";
        v.setAttribute("aria-hidden", "true");
        tabuleiro.appendChild(v);
        continue;
      }
      const el = document.createElement("div");
      el.className = "celula";
      el.setAttribute("role", "gridcell");
      if (cel.num) {
        const n = document.createElement("span");
        n.className = "num";
        n.textContent = cel.num;
        el.appendChild(n);
      }
      const input = document.createElement("input");
      input.type = "text";
      input.maxLength = 2;
      input.autocomplete = "off";
      input.autocapitalize = "characters";
      input.spellcheck = false;
      input.setAttribute("aria-label", `Linha ${r + 1}, coluna ${c + 1}` + (cel.num ? `, início da palavra ${cel.num}` : ""));
      el.appendChild(input);
      tabuleiro.appendChild(el);
      cel.el = el;
      cel.input = input;
      ligarCelula(key, cel);
    }
  }

  /* Editar uma letra invalida a confirmação das palavras que passam por ela. */
  function invalidar(cel) {
    let mudou = false;
    Object.values(cel.pal).forEach((i) => {
      if (estadoPal.delete(i)) mudou = true;
    });
    if (mudou) repintar();
  }

  function ligarCelula(key, cel) {
    const { input } = cel;

    input.addEventListener("pointerdown", () => { alternarAoClicar = estado.key === key; });
    input.addEventListener("click", () => {
      if (alternarAoClicar && cel.pal.H !== undefined && cel.pal.V !== undefined) {
        selecionar(key, estado.dir === "H" ? "V" : "H");
      }
      alternarAoClicar = false;
    });
    input.addEventListener("focus", () => {
      selecionar(key);
      input.select();
    });

    input.addEventListener("input", () => {
      const v = normaliza(input.value);
      input.value = v.slice(-1);
      invalidar(cel);
      if (input.value) mover(1);
    });

    input.addEventListener("keydown", (ev) => {
      const setas = {
        ArrowRight: [0, 1, "H"],
        ArrowLeft: [0, -1, "H"],
        ArrowDown: [1, 0, "V"],
        ArrowUp: [-1, 0, "V"],
      };
      if (setas[ev.key]) {
        ev.preventDefault();
        const [dr, dc, d] = setas[ev.key];
        let r = cel.r + dr, c = cel.c + dc;
        while (r >= 0 && c >= 0 && r < TAB.linhas && c < TAB.colunas) {
          const alvo = celulas.get(chave(r, c));
          if (alvo) {
            estado.dir = alvo.pal[d] !== undefined ? d : estado.dir;
            alvo.input.focus();
            return;
          }
          r += dr; c += dc;
        }
      } else if (ev.key === "Backspace") {
        // Em casa vazia ou travada, volta para a casa anterior livre e apaga a letra dela.
        if (cel.travada || input.value === "") {
          ev.preventDefault();
          const ant = mover(-1);
          if (ant) { ant.input.value = ""; invalidar(ant); }
        }
      } else if (cel.travada && ev.key.length === 1 && /\S/.test(ev.key) && !ev.ctrlKey && !ev.metaKey && !ev.altKey) {
        // Letra certa travada: não aceita digitação, o cursor segue para a próxima casa livre.
        ev.preventDefault();
        mover(1);
      } else if (ev.key === " ") {
        ev.preventDefault();
        if (cel.pal.H !== undefined && cel.pal.V !== undefined) {
          selecionar(key, estado.dir === "H" ? "V" : "H");
        }
      } else if (ev.key === "Enter") {
        ev.preventDefault();
        conferirPalavra(palavraAtiva());
      }
    });
  }

  /* Move o foco dentro da palavra ativa. Retorna a célula alcançada (ou null). */
  function mover(passo) {
    const cel = celulas.get(estado.key);
    if (!cel) return null;
    const p = PALAVRAS[cel.pal[estado.dir]];
    let idx = p.celulas.indexOf(estado.key) + passo;
    // pula as casas travadas (letras certas)
    while (idx >= 0 && idx < p.celulas.length && celulas.get(p.celulas[idx]).travada) idx += passo;
    if (idx < 0 || idx >= p.celulas.length) return null;
    const alvo = celulas.get(p.celulas[idx]);
    alvo.input.focus();
    return alvo;
  }

  function palavraAtiva() {
    const cel = celulas.get(estado.key);
    return PALAVRAS[cel.pal[estado.dir]];
  }

  function selecionar(key, dir) {
    const cel = celulas.get(key);
    if (!cel) return;
    dir = dir || estado.dir;
    if (cel.pal[dir] === undefined) dir = dir === "H" ? "V" : "H";
    estado.key = key;
    estado.dir = dir;
    destacar();
  }

  function destacar() {
    celulas.forEach((c) => c.el.classList.remove("ativa", "foco"));
    const cel = celulas.get(estado.key);
    if (!cel) return;
    const p = PALAVRAS[cel.pal[estado.dir]];
    p.celulas.forEach((k) => celulas.get(k).el.classList.add("ativa"));
    cel.el.classList.add("foco");
    // mantém o carrossel de pistas sincronizado com a palavra selecionada
    idxPista = ordemPistas.indexOf(p);
    renderPista();
  }

  /* ---------- Carrossel de pistas ---------- */
  const porNum = (a, b) => a.num - b.num;
  // Horizontais primeiro, depois Verticais (cada grupo em ordem numérica)
  const ordemPistas = [
    ...PALAVRAS.filter((p) => p.d === "H").sort(porNum),
    ...PALAVRAS.filter((p) => p.d === "V").sort(porNum),
  ];
  let idxPista = 0;
  const pEl = {
    dir: $("p-dir"), pos: $("p-pos"), num: $("p-num"),
    texto: $("p-texto"), estado: $("p-estado"), resumo: $("p-resumo"),
  };
  const ROTULO_ESTADO = {
    certa: "✔ Palavra confirmada",
    errada: "✘ Havia letras erradas (foram removidas)",
    incompleta: "… Incompleta: as letras certas ficaram",
  };
  const chipsPistas = { H: $("chips-h"), V: $("chips-v") };

  ordemPistas.forEach((p) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "num-chip";
    b.textContent = p.num;
    b.dataset.i = p.i;
    b.setAttribute("aria-label", `Pista ${p.num} ${p.d === "H" ? "horizontal" : "vertical"}`);
    b.addEventListener("click", () => irParaPista(ordemPistas.indexOf(p)));
    chipsPistas[p.d].appendChild(b);
  });

  function renderPista() {
    const p = ordemPistas[idxPista];
    if (!p) return;
    const st = estadoPal.get(p.i) || "";
    pEl.dir.textContent = p.d === "H" ? "Horizontal" : "Vertical";
    pEl.pos.textContent = `${idxPista + 1} de ${total}`;
    pEl.num.textContent = p.num;
    pEl.texto.textContent = p.pista;
    pEl.estado.textContent = ROTULO_ESTADO[st] || "";
    pEl.estado.className = "pista-estado " + st;
    pEl.resumo.hidden = st !== "certa";
    document.querySelectorAll(".num-chip").forEach((b) => {
      const i = Number(b.dataset.i);
      const s = estadoPal.get(i) || "";
      b.classList.toggle("certa", s === "certa");
      b.classList.toggle("errada", s === "errada");
      b.classList.toggle("incompleta", s === "incompleta");
      b.classList.toggle("ativa", i === p.i);
    });
  }

  function irParaPista(i) {
    idxPista = (i + total) % total;
    const p = ordemPistas[idxPista];
    estado.dir = p.d;
    const livre =
      p.celulas.find((k) => { const c = celulas.get(k); return !c.travada && c.input.value === ""; }) ||
      p.celulas.find((k) => !celulas.get(k).travada) ||
      p.celulas[0];
    celulas.get(livre).input.focus();
    renderPista();
  }

  $("p-ant").addEventListener("click", () => irParaPista(idxPista - 1));
  $("p-prox").addEventListener("click", () => irParaPista(idxPista + 1));
  pEl.resumo.addEventListener("click", () => mostrarMini(ordemPistas[idxPista]));

  /* ---------- Pintura, contador e status ---------- */
  const contador = $("contador");
  const statusCruz = $("status-cruzada");

  function dizer(texto, tipo) {
    statusCruz.textContent = texto;
    statusCruz.className = "status" + (tipo ? " " + tipo : "");
  }

  function repintar() {
    celulas.forEach((c) => c.el.classList.toggle("travada", c.travada));
    contador.textContent = `${qtdCertas()} de ${total} palavras`;
    renderPista();
  }

  /* ---------- Letras certas ficam, letras erradas saem ---------- */
  function trava(c) { c.travada = true; c.input.readOnly = true; }
  function destravar(c) { c.travada = false; c.input.readOnly = false; }

  function piscar(c) {
    c.el.classList.remove("limpada");
    void c.el.offsetWidth;
    c.el.classList.add("limpada");
    setTimeout(() => c.el.classList.remove("limpada"), 1000);
  }

  /* Avalia sem alterar nada: quantas letras erradas e quantas vazias a palavra tem. */
  function avaliarPalavra(p) {
    let erradas = 0, vazias = 0;
    p.celulas.forEach((k) => {
      const c = celulas.get(k);
      const v = c.input.value;
      if (!v) vazias++;
      else if (v !== c.letra) erradas++;
    });
    return { erradas, vazias, st: erradas > 0 ? "errada" : vazias > 0 ? "incompleta" : "certa" };
  }

  /* Letra certa na posição certa: trava. Letra errada: é removida. Retorna quantas removeu. */
  function aplicarEmCelulas(keys) {
    let removidas = 0;
    keys.forEach((k) => {
      const c = celulas.get(k);
      const v = c.input.value;
      if (!v) return;
      if (v === c.letra) {
        trava(c);
      } else {
        c.input.value = "";
        piscar(c);
        removidas++;
        Object.values(c.pal).forEach((i) => estadoPal.delete(i));
      }
    });
    return removidas;
  }

  const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;

  /* ---------- Mini caixa flutuante ---------- */
  const miniFlut = $("mini-flutuante");
  let miniTimer = null;

  function esconderMini() {
    miniFlut.hidden = true;
    clearTimeout(miniTimer);
  }

  function mostrarMini(p) {
    miniFlut.replaceChildren(miniCaixa(p, { rotulo: "✔ Palavra " + p.num + " certa", aoFechar: esconderMini }));
    miniFlut.hidden = false;
    clearTimeout(miniTimer);
    miniTimer = setTimeout(esconderMini, 12000);
  }

  /* ---------- Conferir palavra por palavra ---------- */
  function nomeDaPalavra(p) {
    return `${p.num} ${p.d === "H" ? "horizontal" : "vertical"}`;
  }

  function conferirPalavra(p) {
    const av = avaliarPalavra(p);
    aplicarEmCelulas(p.celulas);
    estadoPal.set(p.i, av.st);
    repintar();
    if (av.st === "certa") {
      dizer(`Palavra ${nomeDaPalavra(p)} confirmada!`, "ok");
      mostrarMini(p);
    } else if (av.st === "errada") {
      dizer(
        `Palavra ${nomeDaPalavra(p)}: ${plural(av.erradas, "letra errada foi removida", "letras erradas foram removidas")}. ` +
        "As letras certas ficaram no lugar.",
        "erro"
      );
    } else {
      dizer(`Palavra ${nomeDaPalavra(p)}: nenhuma letra errada, mas ainda ${av.vazias === 1 ? "falta 1 letra" : "faltam " + av.vazias + " letras"}.`);
    }
  }

  /* ---------- Conferir tudo / Reiniciar ---------- */
  function conferirTudo() {
    const antes = new Set([...estadoPal].filter(([, v]) => v === "certa").map(([i]) => i));
    const res = PALAVRAS.map(avaliarPalavra); // avalia antes de mexer nas casas
    const removidas = aplicarEmCelulas([...celulas.keys()]);
    estadoPal.clear();
    PALAVRAS.forEach((p, i) => estadoPal.set(p.i, res[i].st));
    repintar();

    const certas = qtdCertas();
    const novas = PALAVRAS.filter((p) => estadoPal.get(p.i) === "certa" && !antes.has(p.i));
    if (certas === total) {
      dizer("Parabéns! Você completou a Rota da Luz.", "ok");
    } else {
      dizer(
        `Você acertou ${certas} de ${total} palavras. ` +
        (removidas > 0
          ? `${plural(removidas, "letra errada foi removida", "letras erradas foram removidas")}; as certas ficaram no lugar.`
          : "Nenhuma letra errada encontrada; continue preenchendo."),
        certas === 0 && removidas > 0 ? "erro" : ""
      );
    }
    if (novas.length === 1) mostrarMini(novas[0]);
    else if (novas.length > 1) statusCruz.textContent += " Use \"Ver resumo\" na pista de cada palavra certa.";
  }

  function reiniciar() {
    celulas.forEach((c) => {
      c.input.value = "";
      destravar(c);
      c.el.classList.remove("limpada");
    });
    estadoPal.clear();
    repintar();
    dizer("");
    esconderMini();
    const primeira = ordemPistas[0];
    estado.dir = primeira.d;
    selecionar(primeira.celulas[0], primeira.d);
  }

  $("btn-palavra").addEventListener("click", () => conferirPalavra(palavraAtiva()));
  $("btn-conferir").addEventListener("click", conferirTudo);
  $("btn-reiniciar").addEventListener("click", reiniciar);
  contador.textContent = `0 de ${total} palavras`;
  (function inicial() {
    const primeira = ordemPistas[0];
    estado.key = primeira.celulas[0];
    estado.dir = primeira.d;
    destacar();
  })();

  /* ================= DESCOBRIR A PALAVRA ================= */
  const elPos = $("d-posicao");
  const elTent = $("d-tent");
  const elPlacar = $("d-placar");
  const elPista = $("d-pista");
  const elDica = $("d-dica");
  const form = $("d-form");
  const elResp = $("d-resposta");
  const btnEnviar = $("d-enviar");
  const btnDica = $("d-dica-btn");
  const btnProxima = $("d-proxima");
  const elAviso = $("d-aviso");
  const elInfo = $("d-info");
  const elChips = $("d-chips");
  const cartaoJogo = $("cartao-jogo");
  const blocoAcoes = document.querySelector("#cartao-jogo .acoes");

  const embaralha = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  let ordem = embaralha(PALAVRAS.map((_, i) => i));
  let atual = ordem[0];
  let achadas = new Set();
  let reveladas = new Set();
  let tentativas = 0;
  let dicasUsadas = 0;
  let respondida = false;

  function montarChips() {
    elChips.innerHTML = "";
    PALAVRAS.forEach((p, i) => {
      const b = document.createElement("button");
      b.type = "button";
      const feita = achadas.has(i) || reveladas.has(i);
      b.className = "chip" + (achadas.has(i) ? " achada" : "") + (reveladas.has(i) ? " revelada" : "") +
        (i === atual && !respondida ? " atual" : "");
      b.textContent = feita ? p.sigla : "?";
      b.disabled = !feita;
      if (feita) {
        b.setAttribute("aria-label", `Rever o resumo de ${p.sigla}`);
        b.addEventListener("click", () => {
          elAviso.innerHTML = "";
          elInfo.replaceChildren(miniCaixa(p, { rotulo: achadas.has(i) ? "✔ Resposta" : "Resposta revelada" }));
        });
      } else {
        b.setAttribute("aria-label", "Palavra ainda não resolvida");
      }
      elChips.appendChild(b);
    });
  }

  function padraoDica() {
    const a = PALAVRAS[atual].a;
    return a.split("").map((ch, k) => (k < dicasUsadas ? ch : "_")).join(" ");
  }

  function atualizarPlacar() {
    elPlacar.textContent = `${achadas.size} de ${total} descobertas`;
    const restam = MAX_TENTATIVAS - tentativas;
    elTent.textContent = `${restam} ${restam === 1 ? "tentativa" : "tentativas"}`;
  }

  function mostrar(i) {
    atual = i;
    tentativas = 0;
    dicasUsadas = 0;
    respondida = false;
    const p = PALAVRAS[i];
    elPos.textContent = `Palavra ${ordem.indexOf(i) + 1} de ${total}`;
    elPista.textContent = p.pista;
    elDica.textContent = `${padraoDica()}  (${p.a.length} letras)`;
    elResp.value = "";
    elResp.disabled = false;
    btnEnviar.disabled = false;
    btnDica.disabled = false;
    btnProxima.hidden = true;
    elAviso.innerHTML = "";
    elInfo.innerHTML = "";
    atualizarPlacar();
    montarChips();
    elResp.focus({ preventScroll: true });
  }

  function aceita(txt) {
    const n = normaliza(txt);
    if (!n) return false;
    const p = PALAVRAS[atual];
    return n === p.a || (ALIAS[p.a] || []).includes(n);
  }

  function aviso(tipo, texto) {
    elAviso.innerHTML = "";
    const d = document.createElement("div");
    d.className = "aviso " + tipo;
    d.setAttribute("role", "status");
    d.textContent = texto;
    elAviso.appendChild(d);
  }

  function encerrarPalavra() {
    respondida = true;
    elResp.disabled = true;
    btnEnviar.disabled = true;
    btnDica.disabled = true;
    const faltam = PALAVRAS.length - achadas.size - reveladas.size;
    btnProxima.hidden = false;
    btnProxima.textContent = faltam === 0 ? "Ver resultado" : "Próxima palavra →";
    btnProxima.focus({ preventScroll: true });
    atualizarPlacar();
    montarChips();
  }

  form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    if (respondida) return;
    if (!normaliza(elResp.value)) { aviso("erro", "Digite uma resposta primeiro."); return; }
    const p = PALAVRAS[atual];
    if (aceita(elResp.value)) {
      achadas.add(atual);
      aviso("acerto", `✅ Acertou! A resposta é ${p.sigla}.`);
      elInfo.replaceChildren(miniCaixa(p));
      encerrarPalavra();
    } else {
      tentativas++;
      elInfo.innerHTML = "";
      if (tentativas >= MAX_TENTATIVAS) {
        reveladas.add(atual);
        aviso("erro", `❌ Acabaram as tentativas. A resposta era ${p.sigla}.`);
        elInfo.replaceChildren(miniCaixa(p, { rotulo: "Resposta revelada" }));
        encerrarPalavra();
      } else {
        const restam = MAX_TENTATIVAS - tentativas;
        aviso("erro", `❌ Ainda não é essa. Restam ${restam} ${restam === 1 ? "tentativa" : "tentativas"}.`);
        atualizarPlacar();
        elResp.select();
      }
    }
  });

  btnDica.addEventListener("click", () => {
    if (dicasUsadas >= MAX_DICAS) return;
    dicasUsadas++;
    elDica.textContent = `${padraoDica()}  (${PALAVRAS[atual].a.length} letras)`;
    btnDica.disabled = dicasUsadas >= MAX_DICAS;
    elResp.focus({ preventScroll: true });
  });

  function proximaPendente() {
    const n = ordem.length;
    const inicio = ordem.indexOf(atual);
    for (let k = 1; k <= n; k++) {
      const i = ordem[(inicio + k) % n];
      if (!achadas.has(i) && !reveladas.has(i)) return i;
    }
    return null;
  }

  function fimDeJogo() {
    [elPista, elDica, form, blocoAcoes, elAviso, elInfo].forEach((e) => { e.hidden = true; });
    elPos.textContent = "Fim de jogo";
    let fim = $("d-fim");
    if (!fim) {
      fim = document.createElement("div");
      fim.id = "d-fim";
      fim.className = "fim-jogo";
      const h = document.createElement("h2");
      const sub = document.createElement("p");
      sub.className = "suave";
      sub.textContent = "Clique nas palavras de \"Seu progresso\" para rever o resumo de cada uma.";
      const b = document.createElement("button");
      b.type = "button";
      b.className = "btn btn-ouro";
      b.style.marginTop = "12px";
      b.textContent = "Jogar de novo";
      b.addEventListener("click", recomecar);
      fim.append(h, sub, b);
      cartaoJogo.appendChild(fim);
    }
    fim.querySelector("h2").textContent = `Você descobriu ${achadas.size} de ${total} palavras!`;
    fim.hidden = false;
    montarChips();
  }

  function recomecar() {
    achadas = new Set();
    reveladas = new Set();
    ordem = embaralha(PALAVRAS.map((_, i) => i));
    const fim = $("d-fim");
    if (fim) fim.hidden = true;
    [elPista, elDica, form, blocoAcoes, elAviso, elInfo].forEach((e) => { e.hidden = false; });
    mostrar(ordem[0]);
  }

  btnProxima.addEventListener("click", () => {
    const prox = proximaPendente();
    if (prox === null) fimDeJogo(); else mostrar(prox);
  });

  mostrar(atual);
  // O foco automático acima não deve abrir o teclado na tela inicial (a cruzadinha aparece primeiro).
  if (document.activeElement === elResp) elResp.blur();
})();
