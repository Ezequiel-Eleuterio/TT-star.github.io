(function () {
  "use strict";

  const MAX = 4;          // tentativas por pergunta
  const TROCAS_MAX = 5;   // vezes que dá para sair de uma pergunta sem resolvê-la
  const DICAS_MAX = 2;    // dicas por partida
  const total = PALAVRAS.length;
  const $ = (id) => document.getElementById(id);

  const elGrid = $("t-grid");
  const elPergunta = $("t-pergunta");
  const elTamanho = $("t-tamanho");
  const elMsg = $("t-msg");
  const elResultado = $("t-resultado");
  const elFinal = $("t-final");
  const elTeclado = $("t-teclado");
  const elPos = $("t-posicao");
  const elTent = $("t-tentativa");
  const elTrocas = $("t-trocas");
  const elAcertos = $("t-acertos");
  const elPontos = $("t-pontos");
  const elDicasTxt = $("t-dicas");
  const btnAnt = $("t-ant");
  const btnProx = $("t-prox");
  const btnDica = $("t-dica");
  const elDicaN = $("t-dica-n");

  const embaralha = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const PRIORIDADE = { ausente: 1, presente: 2, certa: 3 };

  let ordem = [];
  let rodadas = []; // por pergunta: { tent: [{texto,res}], atual, fim, venceu, teclas, dicas: [{pos,letra}] }
  let idx = 0;
  let bloqueado = false;
  let trocas = TROCAS_MAX;
  let dicas = DICAS_MAX;
  let L = 0;
  let alvo = "";

  /* ---------- Teclado na tela ---------- */
  const FILAS = [
    "QWERTYUIOP".split(""),
    "ASDFGHJKL".split(""),
    ["ENTER", ..."ZXCVBNM".split(""), "DEL"],
  ];
  FILAS.forEach((teclas) => {
    const div = document.createElement("div");
    div.className = "fila";
    teclas.forEach((t) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "tecla" + (t.length > 1 ? " larga" : "");
      b.dataset.tecla = t;
      b.textContent = t === "ENTER" ? "Enter" : t === "DEL" ? "⌫" : t;
      b.setAttribute("aria-label", t === "ENTER" ? "Enviar" : t === "DEL" ? "Apagar" : t);
      b.addEventListener("mousedown", (e) => e.preventDefault());
      b.addEventListener("click", () => { b.blur(); tratarTecla(t); });
      div.appendChild(b);
    });
    elTeclado.appendChild(div);
  });

  function pintarTeclado(r) {
    elTeclado.querySelectorAll(".tecla").forEach((b) => {
      const s = r.teclas[b.dataset.tecla];
      b.classList.remove("certa", "presente", "ausente");
      if (s) b.classList.add(s);
    });
  }

  /* ---------- Carrossel ---------- */
  function montarPontos() {
    elPontos.innerHTML = "";
    ordem.forEach((_, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "ponto";
      b.setAttribute("aria-label", `Ir para a pergunta ${i + 1}`);
      b.addEventListener("click", (e) => { if (e.detail > 0) b.blur(); irPara(i); });
      elPontos.appendChild(b);
    });
  }

  function pintarPontos(podeSair) {
    [...elPontos.children].forEach((b, i) => {
      const r = rodadas[i];
      b.classList.toggle("certa", r.fim && r.venceu);
      b.classList.toggle("errada", r.fim && !r.venceu);
      b.classList.toggle("atual", i === idx);
      b.disabled = !podeSair && i !== idx;
    });
  }

  /* Sair de uma pergunta que ainda não foi resolvida gasta uma troca.
     Depois de resolvida (acerto ou fim das tentativas), passar para outra é livre. */
  function irPara(i) {
    if (bloqueado) return;
    const destino = (i + total) % total;
    if (destino === idx) return;
    const r = rodadas[idx];
    if (!r.fim) {
      if (trocas <= 0) {
        mensagem("Sem trocas restantes. Termine esta pergunta para continuar.", "erro");
        return;
      }
      trocas--;
    }
    idx = destino;
    render();
  }

  btnAnt.addEventListener("click", (e) => { if (e.detail > 0) btnAnt.blur(); irPara(idx - 1); });
  btnProx.addEventListener("click", (e) => { if (e.detail > 0) btnProx.blur(); irPara(idx + 1); });

  /* ---------- Tabuleiro ---------- */
  function ajustarTamanho() {
    // largura disponível = área do jogo menos o botão de dica (que fica à direita das caixas)
    const area = elGrid.parentElement.clientWidth - (btnDica.offsetWidth || 58) - 8;
    const larg = Math.min(area > 0 ? area : window.innerWidth - 100, 600);
    const gap = L > 10 ? 3 : 5; // palavras longas: espaçamento menor para caber no celular
    const c = Math.floor((larg - gap * (L - 1)) / L);
    document.documentElement.style.setProperty("--gap", gap + "px");
    document.documentElement.style.setProperty("--cell", Math.max(13, Math.min(52, c)) + "px");
  }

  function pintarLinha(linha, texto, res, fixo) {
    [...linha.children].forEach((t, i) => {
      t.textContent = texto[i] || "";
      t.classList.remove("cheio", "ativo");
      if (res) {
        t.classList.add(res[i]);
        if (fixo) t.classList.add("fixo");
      }
    });
  }

  function montarGrade(r) {
    elGrid.innerHTML = "";
    for (let i = 0; i < MAX; i++) {
      const linha = document.createElement("div");
      linha.className = "linha";
      linha.style.setProperty("--n", L);
      linha.setAttribute("role", "row");
      for (let c = 0; c < L; c++) {
        const t = document.createElement("div");
        t.className = "tile";
        t.setAttribute("role", "gridcell");
        linha.appendChild(t);
      }
      elGrid.appendChild(linha);
      if (r.tent[i]) pintarLinha(linha, r.tent[i].texto, r.tent[i].res, true);
    }
    ajustarTamanho();
  }

  /* Linha atual: letras digitadas; casas ainda vazias mostram a letra da dica, se houver. */
  function desenharAtual() {
    const r = rodadas[idx];
    const linha = elGrid.children[r.tent.length];
    if (!linha) return;
    const dicaPos = new Map(r.dicas.map((d) => [d.pos, d.letra]));
    [...linha.children].forEach((t, i) => {
      const ch = r.atual[i] || "";
      const mostrarDica = !ch && !r.fim && dicaPos.has(i);
      t.textContent = ch || (mostrarDica ? dicaPos.get(i) : "");
      t.classList.toggle("cheio", !!ch);
      t.classList.toggle("dica", mostrarDica);
      t.classList.toggle("ativo", !r.fim && i === r.atual.length);
    });
  }

  function avaliar(palpite, resposta) {
    const res = Array(resposta.length).fill("ausente");
    const resto = {};
    for (let i = 0; i < resposta.length; i++) {
      if (palpite[i] === resposta[i]) res[i] = "certa";
      else resto[resposta[i]] = (resto[resposta[i]] || 0) + 1;
    }
    for (let i = 0; i < resposta.length; i++) {
      if (res[i] !== "certa" && resto[palpite[i]] > 0) {
        res[i] = "presente";
        resto[palpite[i]]--;
      }
    }
    return res;
  }

  /* ---------- Dica ---------- */
  function usarDica() {
    const r = rodadas[idx];
    if (r.fim || bloqueado) return;
    if (dicas <= 0) {
      mensagem(`Suas ${DICAS_MAX} dicas desta partida já foram usadas.`, "erro");
      return;
    }
    const conhecidas = new Set();
    r.tent.forEach((t) => t.res.forEach((x, i) => { if (x === "certa") conhecidas.add(i); }));
    const jaDica = new Set(r.dicas.map((d) => d.pos));
    const candidatas = [...Array(L).keys()].filter((i) => !conhecidas.has(i) && !jaDica.has(i));
    if (!candidatas.length) {
      mensagem("Você já conhece todas as letras desta pergunta.");
      return;
    }
    const pos = candidatas[Math.floor(Math.random() * candidatas.length)];
    r.dicas.push({ pos, letra: alvo[pos] });
    dicas--;
    render();
    mensagem(`Dica: a letra ${pos + 1} é ${alvo[pos]}.`);
  }

  btnDica.addEventListener("mousedown", (e) => e.preventDefault());
  btnDica.addEventListener("click", () => { btnDica.blur(); usarDica(); });

  /* ---------- Render geral ---------- */
  function mensagem(texto, tipo) {
    elMsg.textContent = texto;
    elMsg.style.color = tipo === "erro" ? "#ff9b9f" : "";
  }

  function acertosTotal() {
    return rodadas.filter((r) => r.fim && r.venceu).length;
  }

  function render() {
    const r = rodadas[idx];
    const p = PALAVRAS[ordem[idx]];
    alvo = p.a;
    L = alvo.length;
    const podeSair = r.fim || trocas > 0;

    elPergunta.textContent = p.pista;
    elTamanho.textContent = `${L} letras · ${MAX} tentativas`;
    elPos.textContent = `Pergunta ${idx + 1} de ${total}`;
    elTent.textContent = `Tentativa ${Math.min(r.tent.length + (r.fim ? 0 : 1), MAX)} de ${MAX}`;
    elTrocas.textContent = `Trocas: ${trocas}`;
    elAcertos.textContent = `Acertos: ${acertosTotal()}`;
    mensagem(podeSair ? "" : "Sem trocas restantes. Termine esta pergunta para continuar.", podeSair ? "" : "erro");

    btnAnt.disabled = !podeSair;
    btnProx.disabled = !podeSair;
    const dica = r.fim ? "" : "Trocar de pergunta gasta 1 troca enquanto esta não for resolvida";
    btnAnt.title = dica;
    btnProx.title = dica;

    btnDica.disabled = r.fim || dicas <= 0;
    elDicaN.textContent = `${dicas}/${DICAS_MAX}`;
    elDicasTxt.textContent = r.dicas.length && !r.fim
      ? "Dica: " + [...r.dicas].sort((a, b) => a.pos - b.pos).map((d) => `letra ${d.pos + 1} = ${d.letra}`).join(" · ")
      : "";

    montarGrade(r);
    desenharAtual();
    pintarTeclado(r);
    pintarPontos(podeSair);

    elResultado.innerHTML = "";
    if (r.fim) {
      const av = document.createElement("div");
      av.className = "aviso " + (r.venceu ? "acerto" : "erro");
      av.setAttribute("role", "status");
      av.textContent = r.venceu
        ? `✅ Acertou em ${r.tent.length} ${r.tent.length === 1 ? "tentativa" : "tentativas"}!`
        : `❌ Acabaram as tentativas. A resposta era ${p.sigla}.`;
      elResultado.appendChild(av);
      elResultado.appendChild(miniCaixa(p, { rotulo: r.venceu ? "✔ Resposta" : "Resposta revelada" }));
      const b = document.createElement("button");
      b.type = "button";
      b.className = "btn btn-ouro";
      b.textContent = "Próxima pergunta →";
      b.addEventListener("click", () => irPara(idx + 1));
      elResultado.appendChild(b);
    }

    elFinal.innerHTML = "";
    if (rodadas.every((x) => x.fim)) {
      const av = document.createElement("div");
      av.className = "aviso acerto";
      av.textContent = `🎉 Fim de jogo: você acertou ${acertosTotal()} de ${total} perguntas.`;
      const b = document.createElement("button");
      b.type = "button";
      b.className = "btn btn-vermelho";
      b.textContent = "Jogar de novo";
      b.addEventListener("click", novoJogo);
      elFinal.append(av, b);
    }
  }

  function novoJogo() {
    ordem = embaralha(PALAVRAS.map((_, i) => i));
    rodadas = ordem.map(() => ({ tent: [], atual: "", fim: false, venceu: false, teclas: {}, dicas: [] }));
    idx = 0;
    bloqueado = false;
    trocas = TROCAS_MAX;
    dicas = DICAS_MAX;
    montarPontos();
    render();
    window.scrollTo({ top: 0 });
  }

  /* ---------- Entrada ---------- */
  function tratarTecla(t) {
    const r = rodadas[idx];
    if (r.fim || bloqueado) return;
    if (t === "ENTER") return enviar();
    if (t === "DEL") {
      r.atual = r.atual.slice(0, -1);
    } else if (/^[A-Z]$/.test(t) && r.atual.length < L) {
      r.atual += t;
    }
    mensagem("");
    desenharAtual();
  }

  function enviar() {
    const r = rodadas[idx];
    if (r.atual.length < L) {
      const linha = elGrid.children[r.tent.length];
      linha.classList.remove("tremer");
      void linha.offsetWidth;
      linha.classList.add("tremer");
      mensagem(`Faltam ${L - r.atual.length} letra(s).`, "erro");
      return;
    }
    const palpite = r.atual;
    const res = avaliar(palpite, alvo);
    const linha = elGrid.children[r.tent.length];
    const passo = L > 8 ? 60 : 140;
    [...linha.children].forEach((t, i) => {
      t.classList.remove("cheio", "ativo", "dica");
      t.style.setProperty("--i", i);
      t.style.animationDelay = i * passo + "ms";
      t.classList.add(res[i]);
    });
    r.tent.push({ texto: palpite, res });
    r.atual = "";
    bloqueado = true;
    elTent.textContent = `Tentativa ${Math.min(r.tent.length + 1, MAX)} de ${MAX}`;

    setTimeout(() => {
      palpite.split("").forEach((ch, i) => {
        const s = r.teclas[ch];
        if (!s || PRIORIDADE[res[i]] > PRIORIDADE[s]) r.teclas[ch] = res[i];
      });
      bloqueado = false;
      if (palpite === alvo) { r.fim = true; r.venceu = true; }
      else if (r.tent.length >= MAX) { r.fim = true; r.venceu = false; }
      render();
    }, L * passo + 450);
  }

  /* ---------- Teclado físico ---------- */
  document.addEventListener("keydown", (ev) => {
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
    const r = rodadas[idx];
    const naoBotao = !(ev.target instanceof HTMLElement && ev.target.closest("button, a"));
    if (ev.key === "ArrowRight") { ev.preventDefault(); irPara(idx + 1); return; }
    if (ev.key === "ArrowLeft") { ev.preventDefault(); irPara(idx - 1); return; }
    if (ev.key === "Enter") {
      if (!naoBotao) return;
      ev.preventDefault();
      if (r.fim) irPara(idx + 1); else tratarTecla("ENTER");
      return;
    }
    if (ev.key === "Backspace") { ev.preventDefault(); tratarTecla("DEL"); return; }
    const letra = ev.key.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase();
    if (/^[A-Z]$/.test(letra)) tratarTecla(letra);
  });

  window.addEventListener("resize", () => { if (L) ajustarTamanho(); });

  novoJogo();
})();
