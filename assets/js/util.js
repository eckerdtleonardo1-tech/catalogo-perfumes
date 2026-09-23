// Utilidades compartidas por la tienda y el panel.

export const CONFIG = window.TIENDA_CONFIG || {};

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const fmt = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });
/** 39900 → "$39.900" */
export const precio = (n) => "$" + fmt.format(Math.round(Number(n) || 0));

/** minúsculas y sin tildes, para buscar */
export const norm = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/** plural(1, "perfume", "perfumes") → "1 perfume" */
export const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

/** Separa "a, b ,c" → ["a","b","c"] */
export const lista = (s) => String(s ?? "").split(",").map((x) => x.trim()).filter(Boolean);

/**
 * Tamaños de un perfume. Cada tamaño puede traer su propio precio:
 * "50 ml: 129900". Si no lo trae, vale el precio general.
 */
export function tamaniosDe(p) {
  const out = (p.tamanios || [])
    .map((t) => {
      const [label, pr] = String(t).split(":");
      const n = pr ? Number(pr.replace(/\D/g, "")) : 0;
      return { label: label.trim(), precio: n > 0 ? n : Number(p.precio) || 0 };
    })
    .filter((t) => t.label);
  return out.length ? out : [{ label: "", precio: Number(p.precio) || 0 }];
}

export const precioMinimo = (p) => Math.min(...tamaniosDe(p).map((t) => t.precio));

/** "EDP · 100 ml · Tester" (omite lo que falte) */
export function detalleCorto(p) {
  const ts = tamaniosDe(p).map((t) => t.label).filter(Boolean);
  return [p.concentracion, ts.join(" / "), p.tipo && p.tipo !== "Sellado" ? p.tipo : ""].filter(Boolean).join(" · ");
}

export const nombreCompleto = (p) => [p.marca, p.nombre, p.concentracion].filter(Boolean).join(" ");

/** Número de wa.me: sólo dígitos, formato internacional sin "+". */
export const waNumero = (n) => String(n ?? "").replace(/\D/g, "");
export const waLink = (texto) => `https://wa.me/${waNumero(CONFIG.whatsapp)}?text=${encodeURIComponent(texto)}`;

export const ls = {
  get(k, def) {
    try {
      const v = localStorage.getItem(k);
      return v == null ? def : JSON.parse(v);
    } catch {
      return def;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
      return true;
    } catch {
      return false;
    }
  },
  del(k) {
    try {
      localStorage.removeItem(k);
    } catch {}
  }
};

/** Hash corto y estable (FNV-1a) para firmar los datos de ejemplo. */
export function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

export const reduceMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

export const FOTO_VACIA = "/assets/img/sin-foto.svg";

let toastTimer;
export function toast(msg, tipo = "") {
  let el = $("#toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    document.body.append(el);
  }
  el.className = "toast " + tipo;
  el.textContent = msg;
  requestAnimationFrame(() => el.classList.add("visible"));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("visible"), tipo === "largo" ? 6500 : 2800);
}

/** Si una foto no carga, muestra el frasco genérico en vez del ícono roto. */
export function fotoFallback(root = document) {
  root.addEventListener(
    "error",
    (e) => {
      const img = e.target;
      if (img.tagName === "IMG" && !img.dataset.fallback) {
        img.dataset.fallback = "1";
        img.src = FOTO_VACIA;
      }
    },
    true
  );
}

export const ICONOS = {
  wa: '<svg viewBox="0 0 24 24" aria-hidden="true" class="ico"><path fill="currentColor" d="M12.04 2a9.9 9.9 0 0 0-8.5 14.97L2 22l5.17-1.5A9.93 9.93 0 1 0 12.04 2Zm0 18.1a8.2 8.2 0 0 1-4.2-1.15l-.3-.18-3.07.9.92-3-.2-.31a8.2 8.2 0 1 1 6.85 3.74Zm4.5-6.14c-.25-.12-1.46-.72-1.69-.8-.23-.08-.39-.12-.56.12-.16.25-.64.8-.78.97-.14.16-.29.18-.53.06a6.7 6.7 0 0 1-3.34-2.92c-.25-.43.25-.4.72-1.34.08-.16.04-.3-.02-.43l-.76-1.83c-.2-.48-.4-.41-.56-.42h-.48a.92.92 0 0 0-.66.31 2.8 2.8 0 0 0-.87 2.07 4.84 4.84 0 0 0 1.02 2.57 11.1 11.1 0 0 0 4.25 3.75c1.58.68 2.2.74 2.99.62.48-.07 1.46-.6 1.67-1.18.2-.58.2-1.08.14-1.18-.06-.1-.22-.16-.47-.28Z"/></svg>',
  bolsa: '<svg viewBox="0 0 24 24" aria-hidden="true" class="ico"><path fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" d="M5 8h14l-1 12.5a1 1 0 0 1-1 .9H7a1 1 0 0 1-1-.9L5 8Z"/><path fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" d="M9 10V6.5a3 3 0 0 1 6 0V10"/></svg>',
  buscar: '<svg viewBox="0 0 24 24" aria-hidden="true" class="ico"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="m16 16 4.5 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  cerrar: '<svg viewBox="0 0 24 24" aria-hidden="true" class="ico"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  basura: '<svg viewBox="0 0 24 24" aria-hidden="true" class="ico"><path fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13M10 11v6M14 11v6"/></svg>',
  estrella: '<svg viewBox="0 0 24 24" aria-hidden="true" class="ico"><path fill="currentColor" d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8L12 3Z"/></svg>',
  ig: '<svg viewBox="0 0 24 24" aria-hidden="true" class="ico"><rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="17.2" cy="6.8" r="1" fill="currentColor"/></svg>',
  tt: '<svg viewBox="0 0 24 24" aria-hidden="true" class="ico"><path fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" d="M14 3.5v11.2a3.3 3.3 0 1 1-3.3-3.3M14 3.5c.4 2.6 2.1 4.2 4.8 4.4"/></svg>',
  fb: '<svg viewBox="0 0 24 24" aria-hidden="true" class="ico"><path fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" d="M14.5 8H16V4.8h-2a4 4 0 0 0-4 4V11H8v3.2h2V21h3.3v-6.8h2.3l.4-3.2h-2.7V9a1 1 0 0 1 1-1Z"/></svg>'
};
