# Rota da Luz

Cruzadinha de Arquitetura Computacional, feita em HTML, CSS e JavaScript puros para treinar os termos da aula de Tópicos de Arquitetura Computacional (Sprint 3). O projeto tem ainda dois minijogos: **Descobrir a palavra** e **T-star** (estilo [Termo](https://term.ooo/)).

**Site publicado:** https://SEU-USUARIO.github.io/arqcomp-cruzadinha/

## Telas

| Tela | Arquivo | O que faz |
|---|---|---|
| Rota da Luz (cruzadinha) | `index.html` | Tabuleiro com as 16 palavras cruzadas. As pistas ficam num **carrossel** (setas ‹ ›) que leva você de uma pista à outra, primeiro as Horizontais e depois as Verticais. Botões **Conferir palavra**, **Conferir tudo** e **Reiniciar**, e contador "X de 16 palavras". |
| Descobrir a palavra | `index.html` (aba) | Uma pergunta, uma caixa de texto e **3 tentativas** por palavra, com **1 dica** (uma letra). Cada acerto abre uma mini caixa com a resposta e o resumo do componente. |
| T-star | `tstar.html` | Uma pergunta por vez, em carrossel. Cada pergunta tem uma casa por letra e **4 tentativas**. Há **5 trocas** de pergunta e **2 dicas** por partida, além de um teclado virtual logo abaixo das caixas. |

## Como jogar

**Rota da Luz**
1. Clique numa casa e digite direto no tabuleiro (sem acento e sem espaço).
2. Use as setas ‹ › do carrossel para visitar as pistas uma a uma. Cada pista leva você até a palavra no tabuleiro. Os números abaixo do carrossel (Horizontais e Verticais) também levam direto a cada pista.
3. Aperte **Enter** ou clique em **Conferir palavra** para confirmar a palavra selecionada:
   - **letras certas ficam travadas na posição** (verde);
   - **letras erradas são removidas** (piscam em vermelho e somem);
   - se a palavra inteira estiver certa, abre uma mini caixa com a resposta e o resumo.
4. **Conferir tudo** faz o mesmo em todas as palavras de uma vez. **Reiniciar** limpa o tabuleiro e destrava as letras.
5. Setas do teclado movem o cursor e a barra de espaço troca entre horizontal e vertical.

**Descobrir a palavra**
1. Leia a pergunta e digite a resposta. Você tem 3 tentativas.
2. Acertou: aparece o aviso de acerto e a mini caixa com a resposta e o resumo.
3. Errou 3 vezes: a resposta é revelada e a palavra não conta como descoberta.

**T-star**
1. Leia a pergunta. O número de casas da linha é o número de letras da resposta.
2. Digite pelo teclado do computador ou pelo **teclado virtual** (passe o mouse sobre ele para ver para que serve) e confirme com **Enter**.
3. O botão **Dica** (à direita das caixas) revela a letra de uma posição. São **2 dicas por partida**.
4. Use as setas ‹ › (ou as setas do teclado) para trocar de pergunta. Sair de uma pergunta ainda não resolvida gasta **1 das 5 trocas**; depois de resolvida (acerto ou fim das tentativas), passar para a próxima não gasta troca. Sem trocas, é preciso terminar a pergunta atual.

## Estrutura do projeto

```
index.html   Rota da Luz + tela "Descobrir a palavra"
tstar.html   T-star
data.js      palavras, posições no tabuleiro, perguntas, resumos e a mini caixa
script.js    lógica da Rota da Luz e do "Descobrir a palavra"
tstar.js     lógica do T-star
style.css    estilos: tema roxo azulado com fundo em gradiente branco (Rota da Luz)
             e tema escuro inspirado em Marvel vs Capcom 2 (T-star)
```

## Palavras e pistas

| Nº | Palavra | Pista |
|---|---|---|
| 1 | CPU | Qual é o cérebro do computador? |
| 2 | ULA | Quem faz as contas dentro da CPU? |
| 3 | UC | Quem dá as ordens dentro da CPU? |
| 4 | REGISTRADORES | Quais são as memórias mais rápidas, dentro da CPU? |
| 5 | RAM | Qual é a memória principal que apaga ao desligar? |
| 6 | ROM | Qual memória já vem gravada de fábrica e não muda? |
| 7 | EEPROM | Qual memória permanente é regravada um byte por vez? |
| 8 | FLASH | Qual memória regravável em blocos está em pendrives e SSDs? |
| 9 | CACHE | Qual memória veloz guarda o que a CPU mais usa? |
| 10 | MEMORIADEMASSA | Qual componente guarda muitos dados de forma permanente, como HD e SSD? |
| 11 | DMA | Qual técnica transfere dados à RAM sem ocupar a CPU? |
| 12 | ADDRESSBUS | Qual via de mão única aponta a posição na memória? |
| 13 | DATABUS | Qual via de mão dupla leva o conteúdo entre CPU e memória? |
| 14 | MICROCONTROLADOR | Qual chip único junta CPU, memória e portas de entrada e saída? |
| 15 | DUALCORE | Qual processador tem um par de núcleos? |
| 16 | QUADCORE | Qual processador tem quatro núcleos? |

> A numeração acima segue a lista da atividade. No tabuleiro, os números das pistas seguem a ordem de leitura (de cima para baixo, da esquerda para a direita).

## Ajustar a dificuldade

- T-star: constantes `MAX` (tentativas), `TROCAS_MAX` e `DICAS_MAX` no início de `tstar.js`.
- Descobrir a palavra: constantes `MAX_TENTATIVAS` e `MAX_DICAS` no início de `script.js`.

## Publicação

Repositório público `arqcomp-cruzadinha`, publicado com GitHub Pages (Settings → Pages → Deploy from a branch → `main` → `/ (root)`).
