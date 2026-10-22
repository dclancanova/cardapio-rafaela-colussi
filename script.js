/* ============ CONFIGURAÇÃO (edite só aqui) ============ */
const WHATSAPP_NUMBER = "5554997037334"; // 55 + DDD 54 + 99703-7334
const MSG_DISPONIBILIDADE = "Olá, Rafaela! Vim pelo seu cardápio digital e gostaria de consultar a disponibilidade das tortas.";
const MSG_PRODUTO = (produto, preco) =>
  `Olá, Rafaela! Vim pelo seu cardápio digital e gostaria de consultar a disponibilidade da ${produto}, no valor de ${preco}.`;

const waLink = (msg) =>
  `https://wa.me/${WHATSAPP_NUMBER}` + (msg ? `?text=${encodeURIComponent(msg)}` : "");

/* ============ WHATSAPP ============ */
// Links fixos (seção de pedido e contato)
document.querySelectorAll("[data-wa]").forEach((a) => {
  a.href = waLink(a.dataset.wa === "disponibilidade" ? MSG_DISPONIBILIDADE : "");
});

// Botões das tortas: o preço vem do próprio card, então nunca diverge
document.querySelectorAll(".order-product").forEach((button) => {
  button.addEventListener("click", () => {
    const card = button.closest(".product-card");
    const priceEl = card && card.querySelector(".product-meta strong");
    const product = button.dataset.product || (card && card.querySelector("h3").textContent.trim());
    const url = priceEl
      ? waLink(MSG_PRODUTO(product, priceEl.textContent.trim()))
      : waLink(`Olá, Rafaela! Vim pelo seu cardápio digital e gostaria de consultar a disponibilidade da ${product}.`);
    window.open(url, "_blank", "noopener,noreferrer");
  });
});

/* ============ FOTOS: mostra o espaço reservado se a imagem não existir ============ */
document.querySelectorAll(".photo-placeholder img").forEach((img) => {
  const showPlaceholder = () => {
    img.style.display = "none";
    img.parentElement.classList.add("is-placeholder");
  };
  img.addEventListener("error", showPlaceholder);
  if (img.complete && img.naturalWidth === 0) showPlaceholder();
});

/* ============ HEADER: sombra ao rolar ============ */
const header = document.querySelector(".site-header");
const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 10);
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

/* ============ REVELAR AO ROLAR ============ */
(() => {
  const root = document.documentElement;
  if (!root.classList.contains("js")) return;

  try {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Cards de torta revelam foto e texto juntos
          (entry.target.revealTargets || [entry.target]).forEach((el) => el.classList.add("is-visible"));
          observer.unobserve(entry.target);
        }
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

    reveal(document.querySelectorAll(".intro > *"));
    document.querySelectorAll(".product-card").forEach((card) => {
      const reverse = card.classList.contains("product-card-reverse");
      const photo = card.querySelector(".product-photo");
      const info = card.querySelector(".product-info");
      photo.classList.add("reveal", reverse ? "reveal-right" : "reveal-left");
      info.classList.add("reveal", reverse ? "reveal-left" : "reveal-right");
      card.revealTargets = [photo, info];
      observer.observe(card);
    });
    reveal(document.querySelectorAll(".order-inner > .eyebrow, .order-inner > h2"));
    reveal(document.querySelectorAll(".order-details > div"), "", 0.1, 0.15);
    reveal(document.querySelectorAll(".order-inner > .button"), "", 0.2);
    reveal(document.querySelectorAll(".contact > *:not(.contact-links)"));
    reveal(document.querySelectorAll(".contact-links a"), "", 0.1, 0.15);
  } catch (err) {
    // Se algo falhar, mostra tudo normalmente em vez de deixar o conteúdo escondido
    root.classList.remove("js");
  }
})();