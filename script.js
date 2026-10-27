/* ==========================================================================
   Rafaela Colussi — Tortas artesanais
   Índice: 1 Configuração · 2 Utilitários · 3 WhatsApp · 4 Foto ampliada
           5 Carrossel de fotos · 6 Foto de destaque · 7 Filtro e alternância esq./dir.
           8 Link direto e compartilhar · 9 Cabeçalho e botão flutuante · 10 Revelar ao rolar
   ========================================================================== */

/* ============ 1. CONFIGURAÇÃO (edite só aqui) ============ */
const WHATSAPP_NUMBER = "555491565117"; // 55 + DDD + número, só dígitos. CONFIRA se é este mesmo.
const AUTOPLAY_MS = 4000;               // tempo entre trocas automáticas de foto (0 desliga)

const MSG_DISPONIBILIDADE =
  "Olá, Rafaela! Vim pelo seu cardápio digital e gostaria de consultar a disponibilidade das tortas.";
const MSG_PRODUTO = (produto, preco) =>
  `Olá, Rafaela! Vim pelo seu cardápio digital e gostaria de consultar a disponibilidade da ${produto}, no valor de ${preco}.`;
const MSG_PRODUTO_SEM_PRECO = (produto) =>
  `Olá, Rafaela! Vim pelo seu cardápio digital e gostaria de consultar a disponibilidade da ${produto}.`;

/* ============ 2. UTILITÁRIOS ============ */
const $  = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const makeEl = (tag, className, attrs = {}) => {
  const el = document.createElement(tag);
  el.className = className;
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  return el;
};

const waLink = (msg) =>
  `https://wa.me/${WHATSAPP_NUMBER}` + (msg ? `?text=${encodeURIComponent(msg)}` : "");

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ============ 3. WHATSAPP ============ */
// Links fixos (seção de encomendas, contato e botão flutuante)
$$("[data-wa]").forEach((a) => {
  a.href = waLink(a.dataset.wa === "disponibilidade" ? MSG_DISPONIBILIDADE : "");
});

// Botões das tortas: o preço vem do próprio card, então nunca diverge
$$(".order-product").forEach((button) => {
  button.addEventListener("click", () => {
    const card = button.closest(".product-card");
    const priceEl = card && $(".product-meta strong", card);
    const product = button.dataset.product || (card && $("h3", card).textContent.trim());
    const msg = priceEl
      ? MSG_PRODUTO(product, priceEl.textContent.trim())
      : MSG_PRODUTO_SEM_PRECO(product);
    window.open(waLink(msg), "_blank", "noopener,noreferrer");
  });
});

/* ============ 4. FOTO AMPLIADA (tela cheia, com zoom) ============ */
const lightbox = (() => {
  let dlg = null, stage, img, prevBtn, nextBtn;
  let items = [], idx = 0;

  const show = () => {
    const item = items[idx];
    img.src = item.src;
    img.alt = item.alt;
    stage.classList.remove("is-zoomed");
    stage.scrollTo(0, 0);
    prevBtn.hidden = nextBtn.hidden = items.length < 2;
  };
  const step = (d) => { idx = (idx + d + items.length) % items.length; show(); };

  const build = () => {
    dlg = makeEl("dialog", "lightbox", { "aria-label": "Foto ampliada" });
    dlg.innerHTML =
      '<button type="button" class="lb-close" aria-label="Fechar">×</button>' +
      '<button type="button" class="lb-nav lb-prev" aria-label="Foto anterior">‹</button>' +
      '<button type="button" class="lb-nav lb-next" aria-label="Próxima foto">›</button>' +
      '<div class="lb-stage"><img alt=""></div>';
    stage = $(".lb-stage", dlg);
    img = $("img", stage);
    prevBtn = $(".lb-prev", dlg);
    nextBtn = $(".lb-next", dlg);

    $(".lb-close", dlg).addEventListener("click", () => dlg.close());
    prevBtn.addEventListener("click", () => step(-1));
    nextBtn.addEventListener("click", () => step(1));
    // Toque na foto: aproxima/afasta. Toque no fundo: fecha.
    stage.addEventListener("click", (e) => {
      if (e.target === img) stage.classList.toggle("is-zoomed");
      else dlg.close();
    });
    dlg.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    });
    dlg.addEventListener("close", () => { document.body.style.overflow = ""; });
    document.body.appendChild(dlg);
  };

  return {
    open(list, start) {
      if (!dlg) build();
      items = list;
      idx = start;
      show();
      document.body.style.overflow = "hidden";
      dlg.showModal();
    },
  };
})();

/* ============ 5. CARROSSEL DE FOTOS (um por torta) ============ */
const initPhotoArea = (photo) => {
  const gallery = $(".product-gallery", photo);
  const placeholder = $(".placeholder-content", photo);
  const images = gallery ? $$("img", gallery) : $$(":scope > img", photo);
  if (!images.length) return;

  const failed = new Set(); // imagens que deram erro (as "lazy" ainda não carregadas continuam válidas)
  const isStack = Boolean(gallery) && images.length > 1;
  let pos = 0;
  let animating = false;
  let restartAutoplay = () => {}; // definido abaixo, quando há autoplay
  let prevBtn = null, nextBtn = null, dotsEl = null;

  const available = () => images.filter((img) => !failed.has(img));

  // Desenha o estado atual (foto de cima, foto de baixo, pontinhos, espaço reservado)
  const render = () => {
    const list = available();
    const hasImage = list.length > 0;

    photo.classList.toggle("is-placeholder", !hasImage);
    if (placeholder) placeholder.style.display = hasImage ? "none" : "";
    images.forEach((img) => { img.style.display = failed.has(img) ? "none" : ""; });

    if (!isStack) return;
    pos = Math.min(pos, Math.max(list.length - 1, 0));

    list.forEach((img, i) => {
      const rel = (i - pos + list.length) % list.length;
      img.classList.toggle("is-top", rel === 0);
      img.classList.toggle("is-under", rel === 1 && list.length > 1);
      img.setAttribute("aria-hidden", String(rel !== 0));
    });

    const multiple = list.length > 1;
    prevBtn.hidden = nextBtn.hidden = dotsEl.hidden = !multiple;

    dotsEl.replaceChildren(...list.map((_, i) => {
      const dot = makeEl("button", "gallery-dot", {
        type: "button",
        "aria-label": `Ver foto ${i + 1} de ${list.length}`,
      });
      if (i === pos) dot.setAttribute("aria-current", "true");
      dot.addEventListener("click", () => fly(i > pos ? -1 : 1, i));
      return dot;
    }));
  };

  // A foto de cima sai para o lado (dir: -1 esquerda, 1 direita) e a de baixo assume o lugar
  const fly = (dir, target) => {
    const list = available();
    if (animating || list.length < 2) return;
    const topImg = list[pos];
    const incoming = list[target];
    if (!incoming || incoming === topImg) return;

    animating = true;
    restartAutoplay(); // qualquer troca (manual ou automática) zera a contagem
    topImg.style.transform = "";
    topImg.style.opacity = "";
    topImg.classList.add(dir < 0 ? "is-out-left" : "is-out-right");
    incoming.classList.add("is-promote");

    setTimeout(() => {
      // Troca de estado sem animação: a que saiu volta para baixo da pilha
      topImg.classList.add("no-anim");
      incoming.classList.add("no-anim");
      topImg.classList.remove("is-out-left", "is-out-right");
      incoming.classList.remove("is-promote");
      pos = target;
      render();
      void gallery.offsetWidth; // força o navegador a aplicar o estado antes de reativar a animação
      topImg.classList.remove("no-anim");
      incoming.classList.remove("no-anim");
      animating = false;
    }, 820);
  };

  const count = () => available().length;
  const next = () => fly(-1, (pos + 1) % count());
  const prev = () => fly(1, (pos - 1 + count()) % count());

  if (isStack) {
    gallery.classList.add("is-carousel");
    gallery.setAttribute("role", "group");
    gallery.setAttribute("aria-roledescription", "carrossel");
    gallery.setAttribute("aria-label", "Fotos da torta. Deslize para o lado para ver a próxima.");
    images.forEach((img) => { img.draggable = false; });

    prevBtn = makeEl("button", "gallery-btn gallery-prev", { type: "button", "aria-label": "Foto anterior" });
    nextBtn = makeEl("button", "gallery-btn gallery-next", { type: "button", "aria-label": "Próxima foto" });
    prevBtn.textContent = "‹";
    nextBtn.textContent = "›";
    dotsEl = makeEl("div", "gallery-dots");
    photo.append(prevBtn, nextBtn, dotsEl);

    prevBtn.addEventListener("click", prev);
    nextBtn.addEventListener("click", next);

    // Setas do teclado quando o foco está dentro da área de fotos
    photo.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft")  { prev(); e.preventDefault(); }
      if (e.key === "ArrowRight") { next(); e.preventDefault(); }
    });

    // Arrastar a foto de cima com o dedo ou o mouse
    let startX = null, dx = 0, dragging = false, dragImg = null, suppressClick = false;

    gallery.addEventListener("pointerdown", (e) => {
      if (animating || (e.pointerType === "mouse" && e.button !== 0)) return;
      startX = e.clientX;
      dx = 0;
    });
    gallery.addEventListener("pointermove", (e) => {
      if (startX === null) return;
      dx = e.clientX - startX;
      if (!dragging && Math.abs(dx) > 6) {
        dragging = true;
        dragImg = available()[pos];
        dragImg.classList.add("is-dragging");
        gallery.setPointerCapture(e.pointerId);
      }
      if (dragging && dragImg) {
        // a foto acompanha o dedo de leve e vai esmaecendo, revelando a de baixo
        const fade = Math.min(Math.abs(dx) / gallery.clientWidth, 1);
        dragImg.style.transform = `translateX(${dx * 0.5}px)`;
        dragImg.style.opacity = String(1 - fade * 0.9);
      }
    });
    const endDrag = () => {
      if (startX === null) return;
      startX = null;
      if (!dragging) return;
      dragging = false;
      suppressClick = true; // o fim de um arraste não deve abrir a foto ampliada
      setTimeout(() => { suppressClick = false; }, 80);
      dragImg.classList.remove("is-dragging");
      dragImg.style.transform = "";
      dragImg.style.opacity = ""; // com a animação ativa, volta ao lugar ou sai
      if (Math.abs(dx) > 40) (dx < 0 ? next : prev)(); // arrastou p/ esquerda = próxima; p/ direita = anterior
    };
    gallery.addEventListener("pointerup", endDrag);
    gallery.addEventListener("pointercancel", endDrag);

    // Clique na foto: abre ampliada
    gallery.addEventListener("click", () => {
      if (suppressClick || animating) return;
      const list = available();
      lightbox.open(list.map((i) => ({ src: i.currentSrc || i.src, alt: i.alt })), pos);
    });

    // Troca automática: pausa quando o cliente interage, a aba está oculta ou a foto fora da tela
    if (AUTOPLAY_MS > 0 && !prefersReducedMotion) {
      let timer = null;
      let paused = false;
      let visible = !("IntersectionObserver" in window);

      const stop = () => { clearInterval(timer); timer = null; };
      restartAutoplay = () => {
        stop();
        if (paused || !visible || document.hidden || count() < 2) return;
        timer = setInterval(() => { if (!animating) next(); }, AUTOPLAY_MS);
      };
      const pause = () => { paused = true; stop(); };
      const resume = () => { paused = false; restartAutoplay(); };

      photo.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") pause(); });
      photo.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") resume(); });
      photo.addEventListener("pointerdown",  (e) => { if (e.pointerType !== "mouse") pause(); });
      photo.addEventListener("pointerup",    (e) => { if (e.pointerType !== "mouse") resume(); });
      photo.addEventListener("pointercancel", resume);
      photo.addEventListener("focusin",  (e) => { if (e.target.matches(":focus-visible")) pause(); });
      photo.addEventListener("focusout", resume);
      document.addEventListener("visibilitychange", restartAutoplay);

      if ("IntersectionObserver" in window) {
        new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting;
          restartAutoplay();
        }, { threshold: 0.4 }).observe(photo);
      } else {
        restartAutoplay();
      }
    }
  }

  // Acompanha imagens que não carregaram (arquivo ausente ou nome errado)
  images.forEach((img) => {
    img.addEventListener("error", () => { failed.add(img); render(); });
    img.addEventListener("load",  () => { failed.delete(img); render(); });
    if (img.complete && img.naturalWidth === 0 && img.getAttribute("src")) failed.add(img);
  });

  render();
};

$$(".product-photo").forEach(initPhotoArea);

/* ============ 6. FOTO DE DESTAQUE ============ */
// Se faltar o arquivo, mostra o espaço reservado em vez do ícone de imagem quebrada
(() => {
  const heroPhoto = $(".hero-photo");
  const heroImg = heroPhoto && $("img", heroPhoto);
  if (!heroImg) return;
  const fail = () => { heroPhoto.classList.add("is-placeholder"); heroImg.style.display = "none"; };
  heroImg.addEventListener("error", fail);
  if (heroImg.complete && heroImg.naturalWidth === 0) fail();
})();

/* ============ 7. FILTRO POR CATEGORIA + ALTERNÂNCIA ESQUERDA/DIREITA ============ */
const productsSection = $("#cardapio");
const productCards = $$(".product-card");
const categoryChips = $$(".category-chip");
const filterStatus = $("#filter-status");

// Mostra só a categoria escolhida e REFAZ a alternância esquerda/direita dos cards visíveis:
// 1º visível = foto à esquerda, 2º = foto à direita, 3º = esquerda...
const applyFilter = (filter, scroll = false) => {
  let shown = 0;

  productCards.forEach((card) => {
    const match = filter === "todas" || card.dataset.category === filter;
    card.hidden = !match;
    if (!match) return;

    const reverse = shown % 2 === 1;
    shown++;
    card.classList.toggle("product-card-reverse", reverse);

    // Mantém a direção da animação de entrada coerente com o lado
    const photo = $(".product-photo", card);
    const info = $(".product-info", card);
    if (photo.classList.contains("reveal")) {
      photo.classList.toggle("reveal-right", reverse);
      photo.classList.toggle("reveal-left", !reverse);
      info.classList.toggle("reveal-left", reverse);
      info.classList.toggle("reveal-right", !reverse);
    }
  });

  categoryChips.forEach((chip) => {
    const on = chip.dataset.filter === filter;
    chip.classList.toggle("is-active", on);
    chip.setAttribute("aria-pressed", String(on));
  });

  if (filterStatus) filterStatus.textContent = `${shown} ${shown === 1 ? "item" : "itens"} no cardápio`;

  if (scroll && productsSection && productsSection.getBoundingClientRect().top < 0) {
    productsSection.scrollIntoView({ block: "start" });
  }
};

categoryChips.forEach((chip) =>
  chip.addEventListener("click", () => applyFilter(chip.dataset.filter, true))
);

// Roda já na abertura da página (não depende das classes escritas no HTML)
applyFilter("todas");

/* ============ 8. LINK DIRETO E COMPARTILHAR ============ */
// Link direto para uma torta (ex.: site.com/#torta-maracuja)
const openFromHash = () => {
  const id = decodeURIComponent(location.hash.slice(1));
  const card = id && productCards.find((c) => c.id === id);
  if (!card) return;
  if (card.hidden) applyFilter("todas");
  card.scrollIntoView({ block: "start" });
};
window.addEventListener("hashchange", openFromHash);
window.addEventListener("load", openFromHash);

// Botão "Compartilhar": menu do celular ou, no computador, copia o link
$$(".share-link").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const card = btn.closest(".product-card");
    const title = $("h3", card).textContent.trim();
    const url = `${location.href.split("#")[0]}#${card.id}`;

    try {
      if (navigator.share) {
        await navigator.share({ title, text: `Olha essa delícia da Rafaela Colussi: ${title}`, url });
        return;
      }
    } catch (err) {
      if (err.name === "AbortError") return; // a pessoa fechou o menu
    }

    try {
      await navigator.clipboard.writeText(url);
      btn.textContent = "Link copiado ✓";
      setTimeout(() => { btn.textContent = "Compartilhar"; }, 2200);
    } catch (err) {
      window.prompt("Copie o link:", url);
    }
  });
});

/* ============ 9. CABEÇALHO (sombra) E BOTÃO FLUTUANTE ============ */
(() => {
  const header = $(".site-header");
  const waFloat = $(".wa-float");
  if (!header && !waFloat) return;

  const onScroll = () => {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 10);
    // O botão do WhatsApp aparece depois que o cliente passa da primeira tela
    if (waFloat) waFloat.classList.toggle("is-visible", window.scrollY > 300);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
})();

/* ============ 10. REVELAR AO ROLAR ============ */
// Precisa rodar DEPOIS do applyFilter, pois lê o lado (reverse) de cada card
(() => {
  const root = document.documentElement;
  if (!root.classList.contains("js")) return;

  try {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        // Cards revelam foto e texto juntos
        (entry.target.revealTargets || [entry.target]).forEach((el) => el.classList.add("is-visible"));
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -5% 0px" });

    const reveal = (elements, direction = "", start = 0, step = 0.12) => {
      elements.forEach((el, i) => {
        el.classList.add("reveal");
        if (direction) el.classList.add(direction);
        el.style.setProperty("--delay", `${start + i * step}s`);
        observer.observe(el);
      });
    };

    reveal($$(".intro > *"));

    productCards.forEach((card) => {
      const reverse = card.classList.contains("product-card-reverse");
      const photo = $(".product-photo", card);
      const info = $(".product-info", card);
      photo.classList.add("reveal", reverse ? "reveal-right" : "reveal-left");
      info.classList.add("reveal", reverse ? "reveal-left" : "reveal-right");
      card.revealTargets = [photo, info];
      observer.observe(card);
    });

    reveal($$(".order-inner > .eyebrow, .order-inner > h2"));
    reveal($$(".order-details > div"), "", 0.1, 0.15);
    reveal($$(".order-inner > .button"), "", 0.2);
    reveal($$(".contact > *:not(.contact-links)"));
    reveal($$(".contact-links a"), "", 0.1, 0.15);
  } catch (err) {
    // Se algo falhar, mostra tudo normalmente em vez de deixar o conteúdo escondido
    root.classList.remove("js");
  }
})();