/* =============================================================
   Chalés de Alfredo — lógica do site
   Sem dependências externas. Ordem: utilidades → render →
   comportamentos (header, menu, calendário, reserva, reveal).
   ============================================================= */
(function () {
  'use strict';

  var CFG = window.CONFIG;
  var DB = window.DATA;
  var REDUZ_MOVIMENTO = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ======================= UTILIDADES ======================= */
  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function el(tag, attrs, filhos) {
    var n = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'class') n.className = attrs[k];
        else if (k === 'html') n.innerHTML = attrs[k];
        else if (k === 'text') n.textContent = attrs[k];
        else if (attrs[k] !== null && attrs[k] !== undefined) n.setAttribute(k, attrs[k]);
      });
    }
    (filhos || []).forEach(function (f) { if (f) n.appendChild(f); });
    return n;
  }
  function icone(nome, classe) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', classe || 'ic');
    svg.setAttribute('viewBox', nome === 'coracoes' ? '0 0 40 26' : '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    var use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', '#ic-' + nome);
    svg.appendChild(use);
    return svg;
  }

  var fmtMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  function brl(v) { return fmtMoeda.format(v); }
  function num(v, casas) {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: casas || 0, maximumFractionDigits: casas || 0
    }).format(v);
  }

  /* --- datas (sempre locais, formato dd/mm/aaaa na interface) --- */
  function iso(d) {
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var dia = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + dia;
  }
  function deIso(s) {
    if (!s) return null;
    var p = s.split('-');
    if (p.length !== 3) return null;
    var d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    return isNaN(d.getTime()) ? null : d;
  }
  function maisDias(s, n) {
    var d = deIso(s);
    if (!d) return '';
    d.setDate(d.getDate() + n);
    return iso(d);
  }
  function noites(a, b) {
    var da = deIso(a), db = deIso(b);
    if (!da || !db) return 0;
    return Math.round((db - da) / 86400000);
  }
  function dataBR(s) {
    var d = deIso(s);
    if (!d) return '';
    return String(d.getDate()).padStart(2, '0') + '/' +
           String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
  }
  var fmtDataLonga = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
  var fmtMesAno = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' });
  /* "agosto de 2026" → "Agosto de 2026" (só a inicial, sem capitalizar o "de") */
  function mesAno(d) {
    var s = fmtMesAno.format(d);
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  var HOJE = iso(new Date());

  /* --- disponibilidade real, a partir de DB.reservas ---
     Todas as datas começam livres. Uma data só fica indisponível se cair
     dentro de um período já reservado de verdade em DB.reservas[chaleId]
     (ver assets/js/data.js). Atualize essa lista manualmente conforme as
     reservas forem confirmadas pelo WhatsApp. */
  function dataReservada(chaleId, dataIso) {
    var periodos = (DB.reservas && DB.reservas[chaleId]) || [];
    return periodos.some(function (p) { return dataIso >= p.inicio && dataIso < p.fim; });
  }
  function livre(chaleId, dataIso) {
    if (dataIso < HOJE) return false;
    return !dataReservada(chaleId, dataIso);
  }
  function livreQualquer(dataIso) {
    return DB.chales.some(function (c) { return livre(c.id, dataIso); });
  }
  /* primeiro período de N noites seguidas livres, a partir de uma data */
  function proximoPeriodoLivre(chaleId, aPartirDe, qtdNoites) {
    var inicio = (!aPartirDe || aPartirDe < HOJE) ? HOJE : aPartirDe;
    for (var i = 0; i < 150; i++) {
      var ci = maisDias(inicio, i);
      var co = maisDias(ci, qtdNoites);
      if (periodoLivre(chaleId, ci, co)) return { ci: ci, co: co };
    }
    return null;
  }

  /* todas as noites entre check-in (incl.) e check-out (excl.) */
  function periodoLivre(chaleId, ci, co) {
    var d = ci;
    var guarda = 0;
    while (d < co && guarda++ < 400) {
      if (chaleId ? !livre(chaleId, d) : !livreQualquer(d)) return false;
      d = maisDias(d, 1);
    }
    return true;
  }

  /* --- imagens (Unsplash com srcset) --- */
  function unsplash(id, w, h, q) {
    return 'https://images.unsplash.com/' + id +
           '?auto=format&fit=crop&w=' + w + '&h=' + h + '&q=' + (q || 70);
  }
  function srcset43(id) {
    return [480, 768, 1200].map(function (w) {
      return unsplash(id, w, Math.round(w * 0.75)) + ' ' + w + 'w';
    }).join(', ');
  }

  /* --- WhatsApp --- */
  function waLink(mensagem) {
    return 'https://wa.me/' + CFG.whatsapp.numero + '?text=' + encodeURIComponent(mensagem);
  }
  var MSGS = {
    hero: 'Olá! Vim pelo site dos ' + CFG.marca + ' e gostaria de saber sobre disponibilidade e valores.',
    menu: CFG.whatsapp.mensagemPadrao,
    contato: CFG.whatsapp.mensagemPadrao,
    flutuante: CFG.whatsapp.mensagemPadrao
  };

  /* ==================== RENDER: CHALÉS ====================== */
  var listaChales = qs('#listaChales');

  /* Carrossel de fotos do card: passa sozinho a cada 1s; os botões
     voltar/avançar trocam a foto na hora e pausam o avanço automático
     (a pessoa fica no controle depois que mexe). Pausa também ao passar
     o mouse ou levar o foco do teclado para dentro do carrossel. */
  function criaCarrosselFoto(c, fotos) {
    var fig = el('figure', { class: 'chale-figura chale-carrossel' });
    var img = el('img', {
      src: fotos[0].src,
      alt: fotos[0].alt,
      width: '768', height: '576',
      loading: 'lazy', decoding: 'async'
    });
    fig.appendChild(img);
    if (fotos.length <= 1) return fig;

    var indice = 0;
    var timer = null;
    var pausadoManual = false;
    var contador = el('span', { class: 'carrossel-contador', 'aria-hidden': 'true', text: '1 / ' + fotos.length });

    function preCarrega(i) {
      var f = fotos[(i + fotos.length) % fotos.length];
      if (f) { var pre = new Image(); pre.src = f.src; }
    }
    function mostra(novoIndice) {
      indice = (novoIndice + fotos.length) % fotos.length;
      img.src = fotos[indice].src;
      img.alt = fotos[indice].alt;
      contador.textContent = (indice + 1) + ' / ' + fotos.length;
      preCarrega(indice + 1);
    }
    function paraAuto() { if (timer) { clearInterval(timer); timer = null; } }
    function iniciaAuto() {
      if (timer || pausadoManual || REDUZ_MOVIMENTO) return;
      timer = setInterval(function () { mostra(indice + 1); }, 1000);
    }

    var btnAnt = el('button', {
      type: 'button', class: 'carrossel-nav carrossel-nav-ant',
      'aria-label': 'Foto anterior — ' + c.nome
    }, [icone('esq')]);
    var btnProx = el('button', {
      type: 'button', class: 'carrossel-nav carrossel-nav-prox',
      'aria-label': 'Próxima foto — ' + c.nome
    }, [icone('dir')]);

    btnAnt.addEventListener('click', function (ev) {
      ev.preventDefault(); pausadoManual = true; paraAuto(); mostra(indice - 1);
    });
    btnProx.addEventListener('click', function (ev) {
      ev.preventDefault(); pausadoManual = true; paraAuto(); mostra(indice + 1);
    });

    fig.addEventListener('mouseenter', paraAuto);
    fig.addEventListener('mouseleave', function () { if (!pausadoManual) iniciaAuto(); });
    fig.addEventListener('focusin', paraAuto);
    fig.addEventListener('focusout', function (ev) {
      if (!fig.contains(ev.relatedTarget) && !pausadoManual) iniciaAuto();
    });

    fig.appendChild(btnAnt);
    fig.appendChild(btnProx);
    fig.appendChild(contador);

    preCarrega(1);
    iniciaAuto();
    return fig;
  }

  function cardChale(c, indice) {
    var li = el('li', { class: 'chale-card reveal', 'data-chale': c.id });
    li.style.setProperty('--reveal-delay', Math.min(indice, 2) * 60 + 'ms');

    /* figura — c.fotos é uma lista [{src,alt}, ...]. Com mais de uma foto,
       vira um carrossel (passa sozinho a cada 1s, com botões voltar/avançar
       que pausam o avanço automático). c.foto (singular) ainda funciona como
       compatibilidade para uma foto só, { id, alt } (Unsplash) ou { src, alt }.
       Sem nenhuma foto, mostramos um espaço reservado até a foto real chegar. */
    var listaFotos = (c.fotos && c.fotos.length) ? c.fotos
      : (c.foto && c.foto.id) ? [{ src: unsplash(c.foto.id, 768, 576), alt: c.foto.alt }]
      : (c.foto && c.foto.src) ? [c.foto]
      : [];
    var fig = listaFotos.length ? criaCarrosselFoto(c, listaFotos)
      : el('figure', { class: 'chale-figura sem-foto' }, [
          icone('montanha'),
          el('span', { text: 'Fotos deste chalé chegando em breve' })
        ]);
    if (c.romantico) {
      var selo = el('span', { class: 'chale-selo' });
      selo.appendChild(icone('coracoes', ''));
      selo.appendChild(el('span', { text: 'Bom para casais' }));
      fig.appendChild(selo);
    }
    li.appendChild(fig);

    /* corpo */
    var corpo = el('div', { class: 'chale-corpo' });

    var topoFilhos = [el('h3', { class: 'chale-nome', id: 'chale-' + c.id, text: c.nome })];
    if (c.avaliacao != null) {
      var aval = el('p', { class: 'chale-avaliacao' });
      aval.appendChild(icone('estrela'));
      aval.appendChild(el('b', { text: num(c.avaliacao, 1) }));
      aval.appendChild(el('span', { text: '(' + c.avaliacoes + ' avaliações)' }));
      topoFilhos.push(aval);
    } else {
      topoFilhos.push(el('span', { class: 'chale-selo-novo', text: 'Novo na pousada' }));
    }
    var topo = el('div', { class: 'chale-topo' }, topoFilhos);
    corpo.appendChild(topo);
    corpo.appendChild(el('p', { class: 'chale-resumo', text: c.resumo }));

    var meta = el('ul', { class: 'chale-meta' });
    var metaItens = [['pessoas', 'Até ' + c.capacidade + ' pessoas']];
    if (c.metragem) metaItens.push(['chave', c.metragem + ' m²']);
    metaItens.push(['cama', c.camas]);
    metaItens.forEach(function (m) {
      var item = el('li');
      item.appendChild(icone(m[0]));
      item.appendChild(el('span', { text: m[1] }));
      meta.appendChild(item);
    });
    corpo.appendChild(meta);

    var chips = el('ul', { class: 'chale-chips' });
    c.comodidades.slice(0, 4).forEach(function (com) {
      var chip = el('li');
      chip.appendChild(icone(com.icone));
      chip.appendChild(el('span', { text: com.nome }));
      chips.appendChild(chip);
    });
    corpo.appendChild(chips);

    var preco = el('div', { class: 'chale-preco-bloco' }, [
      el('p', { class: 'chale-preco-linha', html:
        '<span class="chale-preco-rotulo">A partir de</span>' +
        '<span class="chale-preco">' + brl(c.precoNoite) + '</span>' +
        '<span class="chale-preco-unidade">/ noite</span>' })
    ]);
    var disp = el('p', { class: 'chale-disp', id: 'disp-' + c.id });
    preco.appendChild(disp);
    corpo.appendChild(preco);

    var btn = el('button', {
      class: 'btn btn-vinho btn-bloco',
      type: 'button',
      'data-abrir-reserva': c.id
    }, [document.createTextNode('Ver disponibilidade')]);
    btn.appendChild(el('span', { class: 'sr-only', text: ' do ' + c.nome }));
    corpo.appendChild(el('div', { class: 'chale-acoes' }, [btn]));

    li.appendChild(corpo);
    return li;
  }

  function renderChales() {
    listaChales.innerHTML = '';
    DB.chales.forEach(function (c, i) { listaChales.appendChild(cardChale(c, i)); });
  }

  /* ================= RENDER: OUTRAS SEÇÕES ================== */
  function renderExperiencias() {
    var ul = qs('#listaExperiencias');
    DB.experiencias.forEach(function (e, i) {
      var caixa = el('span', { class: 'exp-icone' });
      caixa.appendChild(icone(e.icone));
      var li = el('li', { class: 'exp-item reveal' }, [
        caixa,
        el('div', {}, [
          el('h3', { class: 'exp-titulo', text: e.titulo }),
          el('p', { class: 'exp-texto', text: e.texto })
        ])
      ]);
      li.style.setProperty('--reveal-delay', Math.min(i, 2) * 60 + 'ms');
      ul.appendChild(li);
    });
  }

  function renderNumeros() {
    var ul = qs('#listaNumeros');
    DB.numeros.forEach(function (n) {
      ul.appendChild(el('li', {}, [
        el('span', { class: 'numero-valor', text: n.valor }),
        el('span', { class: 'numero-rotulo', text: n.rotulo })
      ]));
    });
  }

  function renderDepoimentos() {
    var ul = qs('#listaDepoimentos');
    DB.depoimentos.forEach(function (d, i) {
      var estrelas = el('p', { class: 'depoimento-estrelas', role: 'img', 'aria-label': 'Cinco estrelas em cinco' });
      for (var k = 0; k < 5; k++) estrelas.appendChild(icone('estrela'));

      var fig = el('figure', { class: 'depoimento reveal' }, [
        el('span', { class: 'depoimento-rotulo', text: CFG.avisos.depoimento }),
        estrelas,
        el('blockquote', {}, [el('p', { text: '“' + d.texto + '”' })]),
        el('figcaption', { html: '<span class="depoimento-autor">' + d.autor + '</span>' + d.contexto })
      ]);
      fig.style.setProperty('--reveal-delay', Math.min(i, 2) * 60 + 'ms');
      ul.appendChild(el('li', {}, [fig]));
    });
  }

  function itemContato(ic, rotulo, valorHtml) {
    var li = el('li');
    li.appendChild(icone(ic));
    li.appendChild(el('div', {}, [
      el('span', { class: 'contato-rotulo', text: rotulo }),
      el('span', { class: 'contato-valor', html: valorHtml })
    ]));
    return li;
  }

  function renderContato() {
    var ul = qs('#contatoLista');
    var end = CFG.contato.endereco;
    ul.appendChild(itemContato('pin', 'Endereço',
      end.linha1 + '<br>' + end.linha2 + '<br><span class="contato-obs">' + end.referencia + '</span>'));
    ul.appendChild(itemContato('telefone', 'Telefone e WhatsApp',
      '<a href="tel:+' + CFG.whatsapp.numero + '">' + CFG.contato.telefoneExibicao + '</a>'));
    ul.appendChild(itemContato('relogio', 'Horários',
      'Check-in a partir das ' + CFG.contato.horarios.checkin +
      ' · Check-out até ' + CFG.contato.horarios.checkout +
      '<br><span class="contato-obs">' + CFG.contato.horarios.recepcao + '</span>'));

    /* FAQ */
    var faq = qs('#listaFaq');
    DB.faq.forEach(function (f) {
      faq.appendChild(el('details', {}, [
        el('summary', {}, [el('span', { text: f.pergunta })]),
        el('p', { text: f.resposta })
      ]));
    });

    /* rodapé — contato */
    var fc = qs('#footerContatoLista');
    [['telefone', CFG.contato.telefoneExibicao, 'tel:+' + CFG.whatsapp.numero],
     ['whatsapp', 'WhatsApp ' + CFG.whatsapp.numeroExibicao, waLink(CFG.whatsapp.mensagemPadrao)]
    ].forEach(function (c) {
      var li = el('li');
      li.appendChild(icone(c[0]));
      var a = el('a', { href: c[2] }, [document.createTextNode(c[1])]);
      if (c[0] === 'whatsapp') { a.setAttribute('target', '_blank'); a.setAttribute('rel', 'noopener'); }
      li.appendChild(a);
      fc.appendChild(li);
    });
    var liEnd = el('li');
    liEnd.appendChild(icone('pin'));
    liEnd.appendChild(el('span', { class: 'contato-sem-link',
      html: CFG.contato.endereco.linha1 + '<br>' + CFG.contato.endereco.complemento }));
    fc.appendChild(liEnd);

    /* rodapé — redes */
    var redes = qs('#footerRedes');
    [['instagram', 'Instagram', CFG.redes.instagram],
     ['facebook', 'Facebook', CFG.redes.facebook],
     ['youtube', 'YouTube', CFG.redes.youtube]].forEach(function (r) {
      var a = el('a', { href: r[2], target: '_blank', rel: 'noopener' });
      a.appendChild(icone(r[0]));
      a.appendChild(el('span', { class: 'sr-only', text: CFG.marca + ' no ' + r[1] }));
      redes.appendChild(el('li', {}, [a]));
    });

    qs('#anoAtual').textContent = String(new Date().getFullYear());
  }

  function aplicarLinksWa() {
    qsa('[data-wa]').forEach(function (a) {
      var chave = a.getAttribute('data-wa');
      a.href = waLink(MSGS[chave] || CFG.whatsapp.mensagemPadrao);
    });
  }

  /* ==================== CABEÇALHO STICKY ==================== */
  function iniHeader() {
    var header = qs('#cabecalho');
    var ativo = false;
    function aoRolar() {
      var deve = window.scrollY > 80;
      if (deve !== ativo) {
        ativo = deve;
        header.classList.toggle('is-compacto', deve);
      }
    }
    window.addEventListener('scroll', aoRolar, { passive: true });
    aoRolar();
  }

  /* ================= FOCO PRESO (menu/modal) ================ */
  var FOCAVEL = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';
  function focaveis(container) {
    return qsa(FOCAVEL, container).filter(function (n) {
      if (n.getAttribute('tabindex') === '-1') return false;      /* roving tabindex do calendário */
      if (n.hasAttribute('aria-disabled')) return false;
      return n.offsetWidth > 0 || n.offsetHeight > 0 || n === document.activeElement;
    });
  }
  function prender(container, ev) {
    if (ev.key !== 'Tab') return;
    var lista = focaveis(container);
    if (!lista.length) return;
    var primeiro = lista[0], ultimo = lista[lista.length - 1];
    if (ev.shiftKey && document.activeElement === primeiro) {
      ev.preventDefault(); ultimo.focus();
    } else if (!ev.shiftKey && document.activeElement === ultimo) {
      ev.preventDefault(); primeiro.focus();
    }
  }

  /* ====================== MENU MOBILE ======================= */
  function iniMenu() {
    var menu = qs('#menuMobile');
    var abrir = qs('#btnMenu');
    var fechar = qs('#btnFecharMenu');
    var anterior = null;

    function abre() {
      anterior = document.activeElement;
      menu.hidden = false;
      document.body.classList.add('tem-modal');
      abrir.setAttribute('aria-expanded', 'true');
      fechar.focus();
    }
    function fecha() {
      menu.hidden = true;
      document.body.classList.remove('tem-modal');
      abrir.setAttribute('aria-expanded', 'false');
      if (anterior && anterior.focus) anterior.focus();
    }
    abrir.addEventListener('click', abre);
    fechar.addEventListener('click', fecha);
    qsa('[data-fecha-menu]', menu).forEach(function (a) { a.addEventListener('click', fecha); });
    menu.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') { ev.preventDefault(); fecha(); return; }
      prender(menu, ev);
    });
    /* fecha ao passar para desktop */
    window.addEventListener('resize', function () {
      if (!menu.hidden && window.innerWidth >= 1024) fecha();
    });
  }

  /* ======================== STEPPERS ======================== */
  function ajusta(input, delta) {
    var min = Number(input.min || 1), max = Number(input.max || 8);
    var v = Number(input.value || min) + delta;
    v = Math.max(min, Math.min(max, v));
    input.value = String(v);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }
  function atualizaStepper(input) {
    var grupo = input.closest('.stepper');
    if (!grupo) return;
    var min = Number(input.min || 1), max = Number(input.max || 8), v = Number(input.value || min);
    qsa('.stepper-btn', grupo).forEach(function (b) {
      var passo = Number(b.getAttribute('data-passo'));
      var bloqueado = (passo < 0 && v <= min) || (passo > 0 && v >= max);
      b.disabled = bloqueado;
    });
  }
  function iniSteppers() {
    qsa('.stepper-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        var alvo = document.getElementById(b.getAttribute('data-alvo'));
        if (alvo) ajusta(alvo, Number(b.getAttribute('data-passo')));
      });
    });
    qsa('.stepper-valor').forEach(function (input) {
      atualizaStepper(input);
      input.addEventListener('input', function () { atualizaStepper(input); });
      input.addEventListener('blur', function () {
        var min = Number(input.min || 1), max = Number(input.max || 8);
        var v = Math.round(Number(input.value));
        if (!v || isNaN(v)) v = min;
        input.value = String(Math.max(min, Math.min(max, v)));
        atualizaStepper(input);
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });
  }

  /* ======================= AVISOS ========================== */
  function aviso(elemento, tipo, texto) {
    if (!elemento) return;
    elemento.innerHTML = '';
    if (!texto) { elemento.classList.remove('is-ativo'); elemento.removeAttribute('data-tipo'); return; }
    elemento.setAttribute('data-tipo', tipo);
    elemento.appendChild(icone(tipo === 'erro' ? 'alerta' : (tipo === 'ok' ? 'check' : 'alerta')));
    elemento.appendChild(el('span', { text: texto }));
    elemento.classList.add('is-ativo');
  }

  /* ====================== CALENDÁRIO ======================== */
  var SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  var SEMANA_LONGA = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];

  var ctxs = {
    busca: { checkin: '', checkout: '', chale: null, mes: null, foco: HOJE, focar: false, aviso: null, aoMudar: null },
    modal: { checkin: '', checkout: '', chale: null, mes: null, foco: HOJE, focar: false, aviso: null, aoMudar: null }
  };

  function primeiroDoMes(dataIso) {
    var d = deIso(dataIso) || new Date();
    return iso(new Date(d.getFullYear(), d.getMonth(), 1));
  }
  function mesDelta(mesIso, delta) {
    var d = deIso(mesIso);
    return iso(new Date(d.getFullYear(), d.getMonth() + delta, 1));
  }
  function mesmoMes(a, b) { return a.slice(0, 7) === b.slice(0, 7); }

  function garanteVisivel(ctx) {
    var base = ctx.mes || primeiroDoMes(HOJE);
    var focoMes = primeiroDoMes(ctx.foco);
    if (focoMes < base) base = focoMes;
    else if (focoMes > mesDelta(base, 1)) base = mesDelta(focoMes, -1);
    if (base < primeiroDoMes(HOJE)) base = primeiroDoMes(HOJE);
    ctx.mes = base;
  }

  function renderMes(ctx, mesIso, ehPrimeiro) {
    var d = deIso(mesIso);
    var ano = d.getFullYear(), mes = d.getMonth();
    var tituloId = 'calTitulo-' + ctx.nome + '-' + mesIso;
    /* nível do título acompanha a hierarquia da seção onde o calendário vive:
       busca (h2 "Ver disponibilidade") → h3;  modal (h3 "Datas disponíveis") → h4 */
    var nivel = ctx.nome === 'busca' ? 'h3' : 'h4';

    var titulo = el(nivel, { class: 'cal-titulo', id: tituloId, text: mesAno(d) });
    var topo = el('div', { class: 'cal-topo' });

    if (ehPrimeiro) {
      var prev = el('button', { class: 'cal-nav', type: 'button' });
      prev.appendChild(icone('esq'));
      prev.appendChild(el('span', { class: 'sr-only', text: 'Mês anterior' }));
      prev.disabled = mesIso <= primeiroDoMes(HOJE);
      prev.addEventListener('click', function () {
        ctx.mes = mesDelta(ctx.mes, -1);
        ctx.foco = ctx.mes;
        ctx.focar = true;
        desenhaCalendario(ctx);
      });
      topo.appendChild(prev);
    } else {
      topo.appendChild(el('span', { class: 'cal-nav-espaco', 'aria-hidden': 'true' }));
    }
    topo.appendChild(titulo);
    if (!ehPrimeiro) {
      var next = el('button', { class: 'cal-nav', type: 'button' });
      next.appendChild(icone('dir'));
      next.appendChild(el('span', { class: 'sr-only', text: 'Próximo mês' }));
      next.addEventListener('click', function () {
        ctx.mes = mesDelta(ctx.mes, 1);
        ctx.foco = ctx.mes;
        ctx.focar = true;
        desenhaCalendario(ctx);
      });
      topo.appendChild(next);
    } else {
      topo.appendChild(el('span', { class: 'cal-nav-espaco', 'aria-hidden': 'true' }));
    }

    /* tabela do mês */
    var tabela = el('table', { class: 'cal-tabela', 'aria-labelledby': tituloId });
    tabela.appendChild(el('caption', { class: 'sr-only',
      text: mesAno(d) + '. Use as setas do teclado para navegar entre os dias, Page Up e Page Down para trocar de mês e Enter para selecionar.' }));

    var thead = el('thead');
    var trh = el('tr');
    SEMANA.forEach(function (s, i) {
      trh.appendChild(el('th', { scope: 'col', html: '<span aria-hidden="true">' + s + '</span><span class="sr-only">' + SEMANA_LONGA[i] + '</span>' }));
    });
    thead.appendChild(trh);
    tabela.appendChild(thead);

    var tbody = el('tbody');
    var primeiroDia = new Date(ano, mes, 1).getDay();
    var totalDias = new Date(ano, mes + 1, 0).getDate();
    var tr = el('tr');
    var col = 0;

    for (var i = 0; i < primeiroDia; i++) {
      tr.appendChild(el('td', {}, [el('span', { class: 'cal-dia is-vazio', 'aria-hidden': 'true', text: '' })]));
      col++;
    }

    for (var dia = 1; dia <= totalDias; dia++) {
      if (col === 7) { tbody.appendChild(tr); tr = el('tr'); col = 0; }
      var dIso = iso(new Date(ano, mes, dia));
      tr.appendChild(el('td', {}, [celulaDia(ctx, dIso, dia)]));
      col++;
    }
    while (col < 7 && col > 0) {
      tr.appendChild(el('td', {}, [el('span', { class: 'cal-dia is-vazio', 'aria-hidden': 'true' })]));
      col++;
    }
    tbody.appendChild(tr);
    tabela.appendChild(tbody);

    return el('div', { class: 'cal-mes' }, [topo, tabela]);
  }

  function celulaDia(ctx, dIso, diaNum) {
    var passado = dIso < HOJE;
    var disponivel = ctx.chale ? livre(ctx.chale.id, dIso) : livreQualquer(dIso);
    var ehCheckin = ctx.checkin === dIso;
    var ehCheckout = ctx.checkout === dIso;
    var noIntervalo = ctx.checkin && ctx.checkout && dIso > ctx.checkin && dIso < ctx.checkout;

    var classes = ['cal-dia'];
    if (passado) classes.push('is-passado');
    else if (!disponivel) classes.push('is-ocupado');
    else classes.push('is-livre');
    if (dIso === HOJE) classes.push('is-hoje');
    if (noIntervalo) classes.push('is-intervalo');
    if (ehCheckin || ehCheckout) classes.push('is-selecionado');

    var rotulo = fmtDataLonga.format(deIso(dIso));
    if (passado) rotulo += ', data passada, indisponível';
    else if (!disponivel) rotulo += ', sem disponibilidade';
    else rotulo += ', disponível';
    if (ehCheckin) rotulo += ', selecionada como check-in';
    if (ehCheckout) rotulo += ', selecionada como check-out';

    var b = el('button', {
      type: 'button',
      class: classes.join(' '),
      'data-dia': dIso,
      tabindex: dIso === ctx.foco ? '0' : '-1',
      'aria-label': rotulo
    }, [document.createTextNode(String(diaNum))]);

    if (passado || !disponivel) b.setAttribute('aria-disabled', 'true');
    if (dIso === HOJE) b.setAttribute('aria-current', 'date');
    return b;
  }

  function escolheDia(ctx, dIso) {
    var passado = dIso < HOJE;
    var disponivel = ctx.chale ? livre(ctx.chale.id, dIso) : livreQualquer(dIso);
    if (passado) { aviso(ctx.aviso, 'erro', 'Essa data já passou. Escolha uma data a partir de hoje.'); return; }
    if (!disponivel) {
      aviso(ctx.aviso, 'erro', 'Dia ' + dataBR(dIso) + ' sem disponibilidade' + (ctx.chale ? ' neste chalé.' : '.'));
      return;
    }
    if (!ctx.checkin || ctx.checkout || dIso <= ctx.checkin) {
      ctx.checkin = dIso;
      ctx.checkout = '';
      aviso(ctx.aviso, 'info', 'Check-in em ' + dataBR(dIso) + '. Agora escolha a data de saída.');
    } else {
      if (!periodoLivre(ctx.chale ? ctx.chale.id : null, ctx.checkin, dIso)) {
        ctx.checkin = dIso;
        ctx.checkout = '';
        aviso(ctx.aviso, 'erro', 'Há dias ocupados no meio desse período. Recomeçamos a seleção em ' + dataBR(dIso) + '.');
      } else {
        ctx.checkout = dIso;
        aviso(ctx.aviso, 'ok', noites(ctx.checkin, dIso) + ' noite(s) de ' + dataBR(ctx.checkin) + ' a ' + dataBR(dIso) + '.');
      }
    }
    ctx.foco = dIso;
    ctx.focar = true;
    desenhaCalendario(ctx);
    if (ctx.aoMudar) ctx.aoMudar();
  }

  function desenhaCalendario(ctx) {
    garanteVisivel(ctx);
    var host = ctx.host;
    if (!host) return;
    host.innerHTML = '';
    host.appendChild(renderMes(ctx, ctx.mes, true));
    host.appendChild(renderMes(ctx, mesDelta(ctx.mes, 1), false));
    if (ctx.focar) {
      var alvo = qs('[data-dia="' + ctx.foco + '"]', host);
      if (alvo) alvo.focus();
      ctx.focar = false;
    }
  }

  function iniCalendario(nome, host, avisoEl, aoMudar) {
    var ctx = ctxs[nome];
    ctx.nome = nome;
    ctx.host = host;
    ctx.aviso = avisoEl;
    ctx.aoMudar = aoMudar;
    ctx.mes = primeiroDoMes(HOJE);

    host.addEventListener('click', function (ev) {
      var b = ev.target.closest('.cal-dia');
      if (!b || !b.hasAttribute('data-dia')) return;
      escolheDia(ctx, b.getAttribute('data-dia'));
    });

    host.addEventListener('keydown', function (ev) {
      var b = ev.target.closest('.cal-dia');
      if (!b || !b.hasAttribute('data-dia')) return;
      var atual = b.getAttribute('data-dia');
      var novo = null;
      switch (ev.key) {
        case 'ArrowLeft':  novo = maisDias(atual, -1); break;
        case 'ArrowRight': novo = maisDias(atual, 1); break;
        case 'ArrowUp':    novo = maisDias(atual, -7); break;
        case 'ArrowDown':  novo = maisDias(atual, 7); break;
        case 'Home':       novo = maisDias(atual, -deIso(atual).getDay()); break;
        case 'End':        novo = maisDias(atual, 6 - deIso(atual).getDay()); break;
        case 'PageUp':     novo = mesmoDiaOutroMes(atual, -1); break;
        case 'PageDown':   novo = mesmoDiaOutroMes(atual, 1); break;
        case 'Enter':
        case ' ':
          ev.preventDefault();
          escolheDia(ctx, atual);
          return;
        default: return;
      }
      ev.preventDefault();
      if (novo < HOJE) novo = HOJE;
      ctx.foco = novo;
      ctx.focar = true;
      desenhaCalendario(ctx);
    });

    desenhaCalendario(ctx);
    return ctx;
  }

  function mesmoDiaOutroMes(dIso, delta) {
    var d = deIso(dIso);
    var alvo = new Date(d.getFullYear(), d.getMonth() + delta, 1);
    var ultimo = new Date(alvo.getFullYear(), alvo.getMonth() + 1, 0).getDate();
    alvo.setDate(Math.min(d.getDate(), ultimo));
    return iso(alvo);
  }

  /* =================== BUSCA DE DISPONIBILIDADE ============= */
  var inCheckin, inCheckout, inHospedes, avisoBusca, statusChales;

  function sincronizaMinimos() {
    inCheckin.min = HOJE;
    inCheckout.min = inCheckin.value ? maisDias(inCheckin.value, 1) : maisDias(HOJE, 1);
  }

  /* Corrige check-out inválido e avisa por texto (nunca só por cor) */
  function corrigeDatas(silencioso) {
    var corrigiu = false;
    if (inCheckin.value && inCheckin.value < HOJE) {
      inCheckin.value = HOJE;
      corrigiu = true;
    }
    if (inCheckin.value && inCheckout.value && inCheckout.value <= inCheckin.value) {
      inCheckout.value = maisDias(inCheckin.value, 1);
      corrigiu = true;
      if (!silencioso) {
        aviso(avisoBusca, 'info',
          'A saída precisa ser depois da entrada. Ajustamos o check-out para ' +
          dataBR(inCheckout.value) + ' (mínimo de 1 noite).');
      }
    }
    sincronizaMinimos();
    return corrigiu;
  }

  function aplicaBuscaNoCalendario() {
    ctxs.busca.checkin = inCheckin.value || '';
    ctxs.busca.checkout = inCheckout.value || '';
    if (ctxs.busca.checkin) { ctxs.busca.foco = ctxs.busca.checkin; }
    desenhaCalendario(ctxs.busca);
  }

  function marcaDisponibilidade(ci, co, hospedes) {
    var livres = 0;
    DB.chales.forEach(function (c) {
      var alvo = qs('#disp-' + c.id);
      if (!alvo) return;
      alvo.innerHTML = '';
      alvo.classList.remove('is-ativo');
      if (!ci || !co) return;

      var cabe = c.capacidade >= hospedes;
      var temVaga = periodoLivre(c.id, ci, co);
      var estado = (cabe && temVaga) ? 'livre' : 'ocupado';
      var texto = !cabe
        ? 'Acomoda até ' + c.capacidade + ' pessoas'
        : (temVaga ? 'Livre de ' + dataBR(ci) + ' a ' + dataBR(co) : 'Sem disponibilidade nessas datas');

      alvo.setAttribute('data-estado', estado);
      alvo.appendChild(icone(estado === 'livre' ? 'check' : 'alerta'));
      alvo.appendChild(el('span', { text: texto }));
      alvo.classList.add('is-ativo');
      if (estado === 'livre') livres++;
    });
    return livres;
  }

  function iniBusca() {
    var form = qs('#formBusca');
    inCheckin = qs('#checkin');
    inCheckout = qs('#checkout');
    inHospedes = qs('#hospedes');
    avisoBusca = qs('#buscaAviso');
    statusChales = qs('#chalesStatus');

    inCheckin.value = maisDias(HOJE, 7);
    inCheckout.value = maisDias(HOJE, 9);
    sincronizaMinimos();

    inCheckin.addEventListener('change', function () { corrigeDatas(false); aplicaBuscaNoCalendario(); });
    inCheckout.addEventListener('change', function () { corrigeDatas(false); aplicaBuscaNoCalendario(); });

    /* calendário (≥768px) */
    var host = qs('[data-calendario="busca"]');
    iniCalendario('busca', host, avisoBusca, function () {
      if (ctxs.busca.checkin) inCheckin.value = ctxs.busca.checkin;
      if (ctxs.busca.checkout) inCheckout.value = ctxs.busca.checkout;
      else if (ctxs.busca.checkin) inCheckout.value = '';
      sincronizaMinimos();
    });
    aplicaBuscaNoCalendario();

    var popover = qs('#calendarioBusca');
    var gatilhos = qsa('[data-abrir-calendario]');
    function abreCal(gatilho) {
      popover.hidden = false;
      gatilhos.forEach(function (g) { g.setAttribute('aria-expanded', String(g === gatilho)); });
      var alvo = qs('.cal-dia[tabindex="0"]', popover);
      if (alvo) alvo.focus();
    }
    function fechaCal(devolveFoco) {
      if (popover.hidden) return;
      popover.hidden = true;
      gatilhos.forEach(function (g) { g.setAttribute('aria-expanded', 'false'); });
      if (devolveFoco) inCheckin.focus();
    }
    gatilhos.forEach(function (g) {
      g.addEventListener('click', function () {
        if (!popover.hidden && g.getAttribute('aria-expanded') === 'true') fechaCal(false);
        else abreCal(g);
      });
    });
    qsa('[data-fechar-calendario]', popover).forEach(function (b) {
      b.addEventListener('click', function () { fechaCal(true); });
    });
    popover.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') { ev.preventDefault(); fechaCal(true); }
    });

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var hospedes = Number(inHospedes.value) || 1;

      if (!inCheckin.value || !inCheckout.value) {
        aviso(avisoBusca, 'erro', 'Preencha as datas de check-in e check-out para ver a disponibilidade.');
        (!inCheckin.value ? inCheckin : inCheckout).setAttribute('aria-invalid', 'true');
        (!inCheckin.value ? inCheckin : inCheckout).focus();
        return;
      }
      inCheckin.removeAttribute('aria-invalid');
      inCheckout.removeAttribute('aria-invalid');
      corrigeDatas(false);

      var ci = inCheckin.value, co = inCheckout.value;
      var n = noites(ci, co);
      var livresQtd = marcaDisponibilidade(ci, co, hospedes);

      statusChales.classList.add('is-ativo');
      statusChales.textContent = livresQtd > 0
        ? livresQtd + ' de ' + DB.chales.length + ' chalés livres para ' + n + ' noite(s), de ' +
          dataBR(ci) + ' a ' + dataBR(co) + ', para ' + hospedes + ' hóspede(s).'
        : 'Nenhum chalé livre de ' + dataBR(ci) + ' a ' + dataBR(co) + ' para ' + hospedes +
          ' hóspede(s). Tente outras datas ou fale com a gente no WhatsApp.';

      if (!avisoBusca.classList.contains('is-ativo')) {
        aviso(avisoBusca, 'ok', 'Resultado atualizado na seção de chalés.');
      }
      document.getElementById('chales').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  /* ==================== MODAL DE RESERVA ==================== */
  var modal, fundo, mCheckin, mCheckout, mHospedes, avisoModal, resumoEl, btnWa, chaleAtual, focoAnterior;

  function calculaResumo(chale, ci, co, hospedes) {
    var n = noites(ci, co);
    if (!chale || !ci || !co || n <= 0) return null;
    var p = CFG.precos;
    var base = chale.precoNoite * n;
    var extras = Math.max(0, hospedes - p.hospedesInclusos) * p.valorHospedeExtraPorNoite * n;
    var total = base + extras;
    return {
      noites: n, base: base, extras: extras, extraHospedes: Math.max(0, hospedes - p.hospedesInclusos),
      total: total
    };
  }

  function pintaResumo() {
    var hospedes = Number(mHospedes.value) || 1;
    var ci = mCheckin.value, co = mCheckout.value;
    resumoEl.innerHTML = '';

    var r = calculaResumo(chaleAtual, ci, co, hospedes);
    if (!r) {
      resumoEl.appendChild(el('h3', { text: 'Resumo da reserva' }));
      resumoEl.appendChild(el('p', { class: 'resumo-vazio',
        text: 'Escolha as datas de entrada e saída para ver o valor.' }));
      btnWa.setAttribute('aria-disabled', 'true');
      btnWa.href = waLink(MSGS.hero);
      return;
    }

    var cabe = chaleAtual.capacidade >= hospedes;
    var temVaga = periodoLivre(chaleAtual.id, ci, co);

    resumoEl.appendChild(el('h3', { text: 'Resumo da reserva' }));

    var linhas = el('ul', { class: 'resumo-linhas' });
    function linha(rot, val, classe) {
      linhas.appendChild(el('li', { class: classe || '' }, [
        el('span', { text: rot }), el('b', { text: val })
      ]));
    }
    linha(chaleAtual.nome, r.noites + ' noite(s)');
    linha('Entrada · Saída', dataBR(ci) + ' · ' + dataBR(co));
    linha('Hóspedes', String(hospedes));
    linha(brl(chaleAtual.precoNoite) + ' × ' + r.noites + ' noite(s)', brl(r.base));
    if (r.extras > 0) {
      linha(r.extraHospedes + ' hóspede(s) extra × ' + r.noites + ' noite(s)', brl(r.extras));
    }
    resumoEl.appendChild(linhas);

    var total = el('p', { class: 'resumo-total' }, [
      el('span', { text: 'Total' }),
      el('b', { text: brl(r.total) })
    ]);
    resumoEl.appendChild(total);

    var nota = el('p', { class: 'resumo-aviso' });
    nota.appendChild(icone('alerta'));
    nota.appendChild(el('span', { text: CFG.avisos.valores }));
    resumoEl.appendChild(nota);

    if (!cabe) {
      aviso(avisoModal, 'erro', 'O ' + chaleAtual.nome + ' acomoda até ' + chaleAtual.capacidade +
        ' pessoas. Reduza o número de hóspedes ou escolha outro chalé.');
    } else if (!temVaga) {
      aviso(avisoModal, 'erro', 'Esse período tem dias ocupados no ' + chaleAtual.nome +
        '. Escolha outras datas no calendário.');
    }

    btnWa.removeAttribute('aria-disabled');
    btnWa.href = waLink(mensagemReserva(chaleAtual, ci, co, r, hospedes, cabe && temVaga));
  }

  function mensagemReserva(chale, ci, co, r, hospedes, disponivelNoSite) {
    var linhas = [
      'Olá! Vim pelo site dos ' + CFG.marca + ' e quero confirmar uma reserva.',
      '',
      'Chalé: ' + chale.nome,
      'Check-in: ' + dataBR(ci),
      'Check-out: ' + dataBR(co),
      'Noites: ' + r.noites,
      'Hóspedes: ' + hospedes,
      'Valor do site: ' + brl(r.total) + ' (sujeito à confirmação de disponibilidade)'
    ];
    if (!disponivelNoSite) {
      linhas.push('');
      linhas.push('Obs.: o simulador do site indicou indisponibilidade nesse período. Vocês conseguem verificar?');
    }
    linhas.push('');
    linhas.push('Podem confirmar disponibilidade e valores, por favor?');
    return linhas.join('\n');
  }

  /* Guarda o pedido no Supabase (melhor esforço — nunca bloqueia nem
     atrasa a abertura do WhatsApp, que é o canal real de confirmação). */
  function salvaPedidoReserva(chale, ci, co, hospedes, r, disponivelNoSite) {
    var sb = CFG.supabase;
    if (!sb || !sb.url || !sb.anonKey) return;
    var corpo = {
      chale_id: chale.id,
      chale_nome: chale.nome,
      checkin: ci,
      checkout: co,
      noites: r.noites,
      hospedes: hospedes,
      valor_total: r.total,
      disponivel_no_site: !!disponivelNoSite
    };
    fetch(sb.url + '/rest/v1/pedidos_reserva', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: sb.anonKey,
        Authorization: 'Bearer ' + sb.anonKey,
        Prefer: 'return=minimal'
      },
      body: JSON.stringify(corpo)
    }).catch(function () { /* sem conexão ou tabela indisponível — segue o fluxo normal */ });
  }

  function abreModal(chaleId) {
    chaleAtual = DB.chales.filter(function (c) { return c.id === chaleId; })[0];
    if (!chaleAtual) return;
    focoAnterior = document.activeElement;

    qs('#modalTitulo').textContent = chaleAtual.nome;
    qs('#modalEyebrow').textContent = 'Simulação de reserva · confirmação pelo WhatsApp';

    /* meta do chalé dentro do modal */
    var metaAntiga = qs('.modal-chale-meta', modal);
    if (metaAntiga) metaAntiga.remove();
    var meta = el('ul', { class: 'modal-chale-meta' });
    var metaModal = [['pessoas', 'Até ' + chaleAtual.capacidade + ' pessoas'],
     ['cama', chaleAtual.camas]];
    if (chaleAtual.avaliacao != null) {
      metaModal.push(['estrela', num(chaleAtual.avaliacao, 1) + ' (' + chaleAtual.avaliacoes + ' avaliações)']);
    }
    metaModal.push(['etiqueta', brl(chaleAtual.precoNoite) + ' / noite']);
    metaModal.forEach(function (m) {
      var li = el('li');
      li.appendChild(icone(m[0]));
      li.appendChild(el('span', { text: m[1] }));
      meta.appendChild(li);
    });
    qs('#formReserva').insertBefore(meta, qs('#formReserva').firstChild);

    aviso(avisoModal, null, '');

    /* datas herdadas da busca */
    mCheckin.value = inCheckin.value || maisDias(HOJE, 7);
    mCheckout.value = inCheckout.value || maisDias(HOJE, 9);

    /* se o período da busca não estiver livre neste chalé, sugerimos o próximo */
    var qtdNoites = Math.max(1, noites(mCheckin.value, mCheckout.value));
    if (!periodoLivre(chaleAtual.id, mCheckin.value, mCheckout.value)) {
      var sug = proximoPeriodoLivre(chaleAtual.id, mCheckin.value, qtdNoites);
      if (sug) {
        mCheckin.value = sug.ci;
        mCheckout.value = sug.co;
        aviso(avisoModal, 'info', 'O período da sua busca tem dias ocupados neste chalé. ' +
          'Sugerimos ' + dataBR(sug.ci) + ' a ' + dataBR(sug.co) +
          ' — você pode trocar no calendário abaixo.');
      } else {
        aviso(avisoModal, 'erro', 'Não encontramos ' + qtdNoites +
          ' noite(s) seguidas livres neste chalé nos próximos meses. Fale com a gente no WhatsApp.');
      }
    }

    mCheckin.min = HOJE;
    mCheckout.min = maisDias(mCheckin.value, 1);
    mHospedes.max = String(Math.min(CFG.precos.maximoHospedes, chaleAtual.capacidade));
    if (Number(mHospedes.value) > Number(mHospedes.max)) mHospedes.value = mHospedes.max;
    var vHosp = Number(inHospedes.value) || 2;
    mHospedes.value = String(Math.min(vHosp, Number(mHospedes.max)));
    atualizaStepper(mHospedes);
    qs('#mHospedesAjuda').textContent = 'Este chalé acomoda até ' + chaleAtual.capacidade + ' pessoas.';

    ctxs.modal.chale = chaleAtual;
    ctxs.modal.checkin = mCheckin.value;
    ctxs.modal.checkout = mCheckout.value;
    ctxs.modal.foco = mCheckin.value;
    ctxs.modal.mes = primeiroDoMes(mCheckin.value);
    desenhaCalendario(ctxs.modal);

    fundo.hidden = false;
    modal.hidden = false;
    document.body.classList.add('tem-modal');
    pintaResumo();
    qs('#btnFecharModal').focus();
  }

  function fechaModal() {
    modal.hidden = true;
    fundo.hidden = true;
    document.body.classList.remove('tem-modal');
    if (focoAnterior && focoAnterior.focus) focoAnterior.focus();
  }

  function iniModal() {
    modal = qs('#modalReserva');
    fundo = qs('#modalFundo');
    mCheckin = qs('#mCheckin');
    mCheckout = qs('#mCheckout');
    mHospedes = qs('#mHospedes');
    avisoModal = qs('#modalAviso');
    resumoEl = qs('#resumoReserva');
    btnWa = qs('#btnEnviarWa');

    btnWa.addEventListener('click', function () {
      if (btnWa.getAttribute('aria-disabled') === 'true' || !chaleAtual) return;
      var ci = mCheckin.value, co = mCheckout.value;
      var hospedes = Number(mHospedes.value) || 1;
      var r = calculaResumo(chaleAtual, ci, co, hospedes);
      if (!r) return;
      var disponivelNoSite = chaleAtual.capacidade >= hospedes && periodoLivre(chaleAtual.id, ci, co);
      salvaPedidoReserva(chaleAtual, ci, co, hospedes, r, disponivelNoSite);
    });

    iniCalendario('modal', qs('[data-calendario="modal"]'), avisoModal, function () {
      if (ctxs.modal.checkin) mCheckin.value = ctxs.modal.checkin;
      mCheckout.value = ctxs.modal.checkout || '';
      mCheckout.min = ctxs.modal.checkin ? maisDias(ctxs.modal.checkin, 1) : HOJE;
      pintaResumo();
    });

    document.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-abrir-reserva]');
      if (b) { ev.preventDefault(); abreModal(b.getAttribute('data-abrir-reserva')); }
    });

    qs('#btnFecharModal').addEventListener('click', fechaModal);
    fundo.addEventListener('click', fechaModal);
    modal.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') { ev.preventDefault(); fechaModal(); return; }
      prender(modal, ev);
    });

    function mudouData() {
      if (mCheckin.value < HOJE) mCheckin.value = HOJE;
      if (mCheckout.value && mCheckout.value <= mCheckin.value) {
        mCheckout.value = maisDias(mCheckin.value, 1);
        aviso(avisoModal, 'info', 'A saída precisa ser depois da entrada. Ajustamos o check-out para ' +
          dataBR(mCheckout.value) + ' (mínimo de 1 noite).');
      }
      mCheckout.min = maisDias(mCheckin.value, 1);
      ctxs.modal.checkin = mCheckin.value;
      ctxs.modal.checkout = mCheckout.value;
      ctxs.modal.foco = mCheckin.value;
      desenhaCalendario(ctxs.modal);
      pintaResumo();
    }
    mCheckin.addEventListener('change', mudouData);
    mCheckout.addEventListener('change', mudouData);
    mHospedes.addEventListener('change', pintaResumo);
    mHospedes.addEventListener('input', pintaResumo);

    qs('#formReserva').addEventListener('submit', function (ev) { ev.preventDefault(); });
  }

  /* ====================== NEWSLETTER ======================== */
  function iniNewsletter() {
    var form = qs('#formNewsletter');
    var input = qs('#emailNews');
    var status = qs('#newsStatus');
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var v = (input.value || '').trim();
      var ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
      if (!ok) {
        input.setAttribute('aria-invalid', 'true');
        status.textContent = 'Digite um e-mail válido, por exemplo nome@email.com.br.';
        input.focus();
        return;
      }
      input.removeAttribute('aria-invalid');
      status.textContent = 'Recebemos ' + v + '. (Demonstração: este site estático não envia nem armazena cadastros.)';
      input.value = '';
    });
  }

  /* ============ SCROLL REVEAL + LINHA DE SERRA ============== */
  function iniAnimacoes() {
    var reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* linha de serra */
    qsa('.serra-linha path').forEach(function (p) {
      var len = 0;
      try { len = p.getTotalLength(); } catch (e) { len = 3000; }
      p.style.setProperty('--serra-len', Math.ceil(len));
      if (!reduz) p.classList.add('serra-anim');
    });

    if (!('IntersectionObserver' in window) || reduz) {
      qsa('.reveal').forEach(function (n) { n.classList.add('is-visivel'); });
      qsa('.serra-linha path').forEach(function (n) { n.classList.add('is-visivel'); });
      return;
    }

    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-visivel');
        obs.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

    qsa('.reveal, .serra-linha path').forEach(function (n) { obs.observe(n); });
  }

  function marcaReveal() {
    qsa('.secao-cabecalho, .busca-card, .contato-info, .contato-mapa, .faixa-numeros .numeros')
      .forEach(function (n) { n.classList.add('reveal'); });
  }

  /* Mantém o texto em dd/mm/aaaa sobre os 4 campos de data nativos,
     já que o navegador exibe o próprio input conforme o idioma do
     sistema operacional (não dá para forçar isso só com CSS/atributos). */
  function iniciaTextoCamposData() {
    var alvos = [inCheckin, inCheckout, mCheckin, mCheckout].filter(Boolean);
    var ultimos = alvos.map(function () { return undefined; });
    function atualiza(input) {
      var overlay = input.parentElement && input.parentElement.querySelector('.campo-data-texto');
      if (!overlay) return;
      overlay.textContent = input.value ? dataBR(input.value) : 'dd/mm/aaaa';
      overlay.classList.toggle('campo-data-texto--vazio', !input.value);
    }
    function tick() {
      alvos.forEach(function (input, i) {
        if (input.value !== ultimos[i]) {
          ultimos[i] = input.value;
          atualiza(input);
        }
      });
      requestAnimationFrame(tick);
    }
    alvos.forEach(atualiza);
    requestAnimationFrame(tick);
  }

  /* ========================= INÍCIO ========================= */
  function iniciar() {
    if (!CFG || !DB) { return; }
    renderChales();
    renderExperiencias();
    renderNumeros();
    renderDepoimentos();
    renderContato();
    aplicarLinksWa();
    iniHeader();
    iniMenu();
    iniSteppers();
    iniBusca();
    iniModal();
    iniciaTextoCamposData();
    iniNewsletter();
    marcaReveal();
    iniAnimacoes();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
