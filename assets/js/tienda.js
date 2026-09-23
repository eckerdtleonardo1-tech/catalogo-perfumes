import {
  CONFIG, $, $$, precio, norm, esc, plural, tamaniosDe, precioMinimo, detalleCorto, nombreCompleto,
  waLink, ls, toast, fotoFallback, reduceMotion, FOTO_VACIA, ICONOS
} from "./util.js";
import { getBackend, MODO_DEMO } from "./backend.js";

const CARRITO_KEY = "tienda_carrito";
const CLIENTE_KEY = "tienda_cliente";

const st = {
  perfumes: [],
  categorias: [],
  familias: [],
  cat: "todas",
  fam: "",
  q: "",
  orden: "destacados",
  cargado: false,
  carrito: limpiarCarrito(ls.get(CARRITO_KEY, []))
};

function limpiarCarrito(c) {
  return Array.isArray(c)
    ? c.filter((l) => l && l.id != null && Number(l.cantidad) > 0).map((l) => ({ id: l.id, tamanio: String(l.tamanio ?? ""), cantidad: Math.min(99, Math.floor(l.cantidad)), nombre: l.nombre || "" }))
    : [];
}

const porId = (id) => st.perfumes.find((p) => String(p.id) === String(id));
const nombreDe = (lista, id) => lista.find((x) => x.id === id)?.nombre || "";


const puntos = () => (Array.isArray(CONFIG.puntosEncuentro) ? CONFIG.puntosEncuentro : []).filter(Boolean);
/** ["A","B","C"] → "A, B o C" */
const enumerar = (xs, y = "y") => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} ${y} ${xs.at(-1)}`);

function aplicarConfig() {
  $$("[data-nombre-tienda]").forEach((el) => (el.textContent = CONFIG.nombre || "Perfumería"));
  $$("[data-eslogan]").forEach((el) => (el.textContent = CONFIG.eslogan || ""));
  $$("[data-puntos]").forEach((el) => (el.textContent = enumerar(puntos(), "o")));
  $$("[data-responsable]").forEach((el) => (el.textContent = CONFIG.responsable ? ` · ${CONFIG.responsable}` : ""));
  $$("[data-horarios]").forEach((el) => (el.textContent = CONFIG.horarios || ""));
  $("#anio").textContent = new Date().getFullYear();
  $("#puntos").insertAdjacentHTML("beforeend", puntos().map((p) => `<label class="opcion"><input type="radio" name="punto" value="${esc(p)}"> <span>${esc(p)}</span></label>`).join(""));

  const redes = [["instagram", "Instagram", ICONOS.ig], ["tiktok", "TikTok", ICONOS.tt], ["facebook", "Facebook", ICONOS.fb]];
  $("#redes").innerHTML = redes
    .filter(([k]) => CONFIG[k])
    .map(([k, n, ico]) => `<a href="${esc(CONFIG[k])}" target="_blank" rel="noopener" aria-label="${n}">${ico}</a>`)
    .join("");

  $("#wa-flotante").href = waLink(`Hola ${CONFIG.nombre}! Tengo una consulta.`);
  const rec = $("#btn-recomendacion");
  rec.innerHTML = `${ICONOS.wa} Pedir una recomendación`;
  rec.href = waLink("Hola! No sé qué perfume elegir, ¿me recomendás uno? Me gustan los aromas…");

  if (MODO_DEMO && CONFIG.mostrarCartelDemo !== false) $("#cartel-demo").hidden = false;
}

async function cargar() {
  const grilla = $("#grilla");
  try {
    const be = await getBackend();
    const [perfumes, categorias, familias] = await Promise.all([be.perfumesPublicos(), be.lista("categorias"), be.lista("familias")]);
    st.perfumes = perfumes.filter((p) => p.activo);
    st.categorias = categorias;
    st.familias = familias;
    st.cargado = true;
    validarCarrito();
    renderFiltros();
    renderGrilla();
    abrirDesdeHash();
  } catch (e) {
    console.warn("No se pudo cargar el catálogo:", e);
    grilla.removeAttribute("aria-busy");
    grilla.innerHTML = `<div class="vacio"><h3>No pudimos cargar el catálogo</h3>
      <p>Revisá tu conexión e intentá de nuevo. Mientras tanto, podés hacer tu pedido por WhatsApp.</p>
      <div class="acciones"><button class="btn btn-borde" id="reintentar">Reintentar</button>
      <a class="btn btn-wa" href="${waLink("Hola! Quiero ver el catálogo de perfumes.")}" target="_blank" rel="noopener">${ICONOS.wa} Escribinos</a></div></div>`;
    $("#reintentar").onclick = () => {
      grilla.innerHTML = '<div class="card esqueleto"></div><div class="card esqueleto"></div>';
      cargar();
    };
  }
}

/* ============================== Catálogo ============================== */

function renderFiltros() {
  // Sólo mostramos categorías que tienen perfumes.
  const usadas = new Set(st.perfumes.map((p) => p.categoria));
  const cats = st.categorias.filter((c) => usadas.has(c.id));
  if (st.cat !== "todas" && !cats.some((c) => String(c.id) === st.cat)) st.cat = "todas";
  $("#chips").innerHTML = [`<button class="chip" data-cat="todas" aria-pressed="${st.cat === "todas"}">Todos</button>`]
    .concat(cats.map((c) => `<button class="chip" data-cat="${c.id}" aria-pressed="${st.cat === String(c.id)}">${esc(c.nombre)}</button>`))
    .join("");

  const famUsadas = new Set(st.perfumes.map((p) => p.familia));
  $("#familia").innerHTML =
    '<option value="">Todas las familias</option>' +
    st.familias.filter((f) => famUsadas.has(f.id)).map((f) => `<option value="${f.id}">${esc(f.nombre)}</option>`).join("");
  $("#familia").value = st.fam;
}

const indices = new WeakMap();
function indice(p) {
  if (!indices.has(p)) {
    const n = p.notas || {};
    indices.set(p, norm([p.nombre, p.marca, p.concentracion, p.tipo, nombreDe(st.familias, p.familia), nombreDe(st.categorias, p.categoria), ...(n.salida || []), ...(n.corazon || []), ...(n.fondo || [])].join(" ")));
  }
  return indices.get(p);
}

function filtrados() {
  let r = st.perfumes;
  if (st.cat !== "todas") r = r.filter((p) => String(p.categoria) === st.cat);
  if (st.fam) r = r.filter((p) => String(p.familia) === st.fam);
  const terminos = norm(st.q).split(/\s+/).filter(Boolean);
  if (terminos.length) r = r.filter((p) => terminos.every((t) => indice(p).includes(t)));

  const fecha = (p) => p.fecha_creacion || "";
  const orden = {
    destacados: (a, b) => b.stock - a.stock || b.destacado - a.destacado || fecha(b).localeCompare(fecha(a)),
    novedades: (a, b) => fecha(b).localeCompare(fecha(a)),
    "precio-asc": (a, b) => precioMinimo(a) - precioMinimo(b),
    "precio-desc": (a, b) => precioMinimo(b) - precioMinimo(a)
  }[st.orden];
  return [...r].sort(orden);
}

function htmlPrecio(p, unitario) {
  const ts = tamaniosDe(p);
  const min = unitario ?? precioMinimo(p);
  const variosPrecios = unitario == null && new Set(ts.map((t) => t.precio)).size > 1;
  // El precio anterior es del precio general: no lo mostramos junto a un "desde" ni en otro tamaño.
  const aplica = unitario == null ? !variosPrecios : unitario === (Number(p.precio) || 0);
  const anterior = aplica && Number(p.precio_anterior) > min ? `<s>${precio(p.precio_anterior)}</s>` : "";
  const oferta = anterior || p.etiqueta === "Oferta";
  return `<p class="precio${oferta ? " oferta" : ""}">${variosPrecios ? '<span class="desde">desde</span>' : ""}<strong>${precio(min)}</strong>${anterior}</p>`;
}

const slug = (s) => norm(s).replace(/\s+/g, "-");
const htmlTag = (p) => (p.etiqueta ? `<span class="tag tag-${slug(p.etiqueta)}">${esc(p.etiqueta)}</span>` : "");

function renderGrilla() {
  const grilla = $("#grilla");
  const lista = filtrados();
  grilla.removeAttribute("aria-busy");
  $("#resultados").textContent = st.cargado ? plural(lista.length, "perfume", "perfumes") : "";

  // Tienda recién abierta, todavía sin productos cargados.
  if (!st.perfumes.length) {
    $("#resultados").textContent = "";
    grilla.innerHTML = `<div class="vacio"><h3>Estamos preparando el catálogo</h3>
      <p>Muy pronto vas a ver acá todos nuestros perfumes. Mientras tanto, preguntanos por WhatsApp.</p>
      <div class="acciones"><a class="btn btn-wa" target="_blank" rel="noopener" href="${waLink("Hola! Quería consultar qué perfumes tienen disponibles.")}">${ICONOS.wa} Consultar</a></div></div>`;
    return;
  }
  if (!lista.length) {
    const hayQ = st.q.trim();
    grilla.innerHTML = `<div class="vacio"><h3>${hayQ ? `Sin resultados para “${esc(hayQ)}”` : "No hay perfumes con estos filtros"}</h3>
      <p>Probá con otra marca o nota, o preguntanos: quizás lo conseguimos.</p>
      <div class="acciones"><button class="btn btn-borde" data-limpiar>Limpiar filtros</button>
      <a class="btn btn-wa" target="_blank" rel="noopener" href="${waLink(`Hola! Estoy buscando ${hayQ ? `"${hayQ}"` : "un perfume"}, ¿lo tienen?`)}">${ICONOS.wa} Preguntar</a></div></div>`;
    return;
  }

  grilla.innerHTML = lista
    .map((p, i) => {
      const foto = p.imagenes?.[0] || FOTO_VACIA;
      return `<article class="card${p.stock ? "" : " sin-stock"} reveal" data-id="${p.id}" style="transition-delay:${Math.min(i, 7) * 45}ms">
        <button class="card-media" data-abrir aria-label="Ver ${esc(nombreCompleto(p))}">
          <img src="${esc(foto)}" alt="${esc(nombreCompleto(p))}" loading="${i < 4 ? "eager" : "lazy"}" decoding="async" width="800" height="1000">
          ${htmlTag(p)}
          ${p.stock ? "" : '<span class="agotado">Sin stock</span>'}
        </button>
        <div class="card-body">
          <p class="marca">${esc(p.marca)}</p>
          <h3 class="nombre"><button data-abrir>${esc(p.nombre)}</button></h3>
          <p class="meta">${esc(detalleCorto(p))}</p>
          ${htmlPrecio(p)}
          ${p.stock
            ? `<button class="btn btn-bronce btn-sm" data-agregar>Agregar</button>`
            : `<a class="btn btn-wa btn-sm" data-consultar target="_blank" rel="noopener" href="${waLink(mensajeConsulta(p))}">${ICONOS.wa} Consultar por WhatsApp</a>`}
        </div>
      </article>`;
    })
    .join("");
  observarReveal(grilla);
}

const mensajeConsulta = (p) => `Hola! Quería consultar por el ${nombreCompleto(p)}, que figura sin stock. ¿Cuándo vuelve a entrar?`;

/* ============================== Modal ============================== */

const ESTELA = ["", "Íntima", "Suave", "Moderada", "Notable", "Intensa"];
function textoDuracion(h) {
  if (h < 4) return "Corta";
  if (h < 7) return "Moderada";
  if (h < 10) return "Prolongada";
  return "Muy prolongada";
}

let modalEstado = null;

function abrirModal(id) {
  const p = porId(id);
  if (!p) return;
  const ts = tamaniosDe(p);
  modalEstado = { p, tamanio: ts[0].label, cantidad: 1 };
  const fotos = p.imagenes?.length ? p.imagenes : [FOTO_VACIA];
  const n = p.notas || {};
  const filasNotas = [["Salida", n.salida], ["Corazón", n.corazon], ["Fondo", n.fondo]].filter(([, v]) => v?.length);
  const horas = Number(p.duracion_horas) || 0;
  const estela = Math.max(0, Math.min(5, Number(p.estela) || 0));
  const familia = nombreDe(st.familias, p.familia);

  $("#modal-contenido").innerHTML = `
    <button class="btn-icono modal-cerrar" data-cerrar aria-label="Cerrar">${ICONOS.cerrar}</button>
    <div class="pd-galeria">
      <div class="pd-track" id="pd-track" tabindex="0" aria-label="Fotos">
        ${fotos.map((f, i) => `<img src="${esc(f)}" alt="${esc(nombreCompleto(p))}${fotos.length > 1 ? `, foto ${i + 1}` : ""}" loading="${i ? "lazy" : "eager"}" decoding="async" width="800" height="1000">`).join("")}
      </div>
      ${fotos.length > 1 ? `<div class="pd-miniaturas">${fotos.map((f, i) => `<button data-foto="${i}" aria-label="Ver foto ${i + 1}" aria-current="${i === 0}"><img src="${esc(f)}" alt="" loading="lazy" width="80" height="100"></button>`).join("")}</div>` : ""}
    </div>
    <div class="pd-info">
      <p class="marca">${esc(p.marca)}</p>
      <h2 id="modal-titulo">${esc(p.nombre)}</h2>
      <p class="pd-sub">${[p.concentracion, p.tipo, familia && `Familia ${familia}`].filter(Boolean).map(esc).join(" · ")} ${htmlTag(p)}</p>
      <div id="pd-precio">${htmlPrecio(p, ts[0].precio)}</div>
      ${p.descripcion ? `<p class="pd-desc">${esc(p.descripcion)}</p>` : ""}

      ${filasNotas.length ? `<div class="pd-bloque"><p class="pd-titulo">Notas</p><dl class="piramide">
        ${filasNotas.map(([k, v]) => `<div><dt>${k}</dt><dd>${v.map((x) => `<span class="nota">${esc(x)}</span>`).join("")}</dd></div>`).join("")}
      </dl></div>` : ""}

      ${horas || estela ? `<div class="pd-bloque medidores">
        ${horas ? `<div class="medidor" role="img" aria-label="Duración: ${horas} horas, ${textoDuracion(horas).toLowerCase()}">
          <div class="medidor-cab"><span>Duración</span><strong>${String(horas).replace(".", ",")} h<small>${textoDuracion(horas)}</small></strong></div>
          <div class="barra"><i style="--v:${Math.min(100, (horas / 12) * 100)}%"></i></div>
          <div class="barra-marcas" aria-hidden="true"><span>0</span><span>4 h</span><span>8 h</span><span>12 h+</span></div>
        </div>` : ""}
        ${estela ? `<div class="medidor" role="img" aria-label="Estela: ${estela} de 5, ${ESTELA[estela].toLowerCase()}">
          <div class="medidor-cab"><span>Estela</span><strong>${estela}/5<small>${ESTELA[estela]}</small></strong></div>
          <div class="segmentos">${[1, 2, 3, 4, 5].map((i) => `<i class="${i <= estela ? "on" : ""}" style="--i:${i}"></i>`).join("")}</div>
        </div>` : ""}
      </div>` : ""}

      ${ts.length > 1 ? `<div class="pd-bloque"><p class="pd-titulo" id="lbl-tam">Tamaño</p>
        <div class="tamanios" role="radiogroup" aria-labelledby="lbl-tam">
          ${ts.map((t, i) => `<label><input type="radio" name="tamanio" value="${esc(t.label)}" ${i === 0 ? "checked" : ""} ${p.stock ? "" : "disabled"}><span><b>${esc(t.label)}</b><small>${precio(t.precio)}</small></span></label>`).join("")}
        </div></div>` : ""}

      ${p.stock
        ? `<div class="comprar">
            <div class="cantidad" aria-label="Cantidad">
              <button type="button" data-cant="-1" aria-label="Restar" disabled>−</button>
              <output id="pd-cant" aria-live="polite">1</output>
              <button type="button" data-cant="1" aria-label="Sumar">+</button>
            </div>
            <button class="btn btn-bronce" id="pd-agregar">Agregar al carrito</button>
          </div>`
        : `<div class="comprar solo"><p class="sin-stock-txt">Sin stock por el momento.</p>
            <a class="btn btn-wa btn-ancho" target="_blank" rel="noopener" href="${waLink(mensajeConsulta(p))}">${ICONOS.wa} Consultar por WhatsApp</a></div>`}
    </div>`;

  const dlg = $("#modal");
  if (!dlg.open) dlg.showModal();
  $("#modal-contenido").scrollTop = 0;
  $(".pd-info", dlg).scrollTop = 0;
  try {
    history.replaceState(null, "", `#perfume-${p.id}`);
  } catch {}

  const track = $("#pd-track");
  track.addEventListener("scroll", () => {
    const i = Math.round(track.scrollLeft / track.clientWidth);
    $$(".pd-miniaturas button", dlg).forEach((b, j) => b.setAttribute("aria-current", i === j));
  }, { passive: true });
}

function abrirDesdeHash() {
  const m = location.hash.match(/^#perfume-(.+)$/);
  if (m && porId(m[1])) abrirModal(m[1]);
}

function enlazarModal() {
  const dlg = $("#modal");
  dlg.addEventListener("click", (e) => {
    if (e.target === dlg || e.target.closest("[data-cerrar]")) return dlg.close();
    const foto = e.target.closest("[data-foto]");
    if (foto) {
      const track = $("#pd-track");
      track.scrollTo({ left: track.clientWidth * Number(foto.dataset.foto), behavior: reduceMotion() ? "auto" : "smooth" });
    }
    const cant = e.target.closest("[data-cant]");
    if (cant && modalEstado) {
      modalEstado.cantidad = Math.max(1, Math.min(99, modalEstado.cantidad + Number(cant.dataset.cant)));
      $("#pd-cant").textContent = modalEstado.cantidad;
      $('[data-cant="-1"]', dlg).disabled = modalEstado.cantidad <= 1;
    }
    if (e.target.closest("#pd-agregar") && modalEstado) {
      agregar(modalEstado.p.id, modalEstado.tamanio, modalEstado.cantidad);
      dlg.close();
    }
  });
  dlg.addEventListener("change", (e) => {
    if (e.target.name === "tamanio" && modalEstado) {
      modalEstado.tamanio = e.target.value;
      const t = tamaniosDe(modalEstado.p).find((x) => x.label === e.target.value);
      $("#pd-precio").innerHTML = htmlPrecio(modalEstado.p, t.precio);
    }
  });
  dlg.addEventListener("close", () => {
    modalEstado = null;
    try {
      if (location.hash.startsWith("#perfume-")) history.replaceState(null, "", location.pathname + location.search);
    } catch {}
  });
}

/* ============================== Carrito ============================== */

function guardarCarrito() {
  ls.set(CARRITO_KEY, st.carrito);
}

function agregar(id, tamanio, cantidad = 1) {
  const p = porId(id);
  if (!p || !p.stock) return;
  const linea = st.carrito.find((l) => String(l.id) === String(id) && l.tamanio === tamanio);
  if (linea) linea.cantidad = Math.min(99, linea.cantidad + cantidad);
  else st.carrito.push({ id: p.id, tamanio, cantidad, nombre: nombreCompleto(p) });
  guardarCarrito();
  renderCarrito();
  const c = $("#contador");
  c.classList.remove("pulso");
  void c.offsetWidth;
  c.classList.add("pulso");
  toast(`Agregado: ${p.nombre}${tamanio ? ` (${tamanio})` : ""}`);
}

/** Saca del carrito lo que quedó sin stock, inactivo o con un tamaño que ya no existe. */
function validarCarrito() {
  const quitados = [];
  st.carrito = st.carrito.filter((l) => {
    const p = porId(l.id);
    if (!p || !p.activo || !p.stock) {
      quitados.push(p ? nombreCompleto(p) : l.nombre || "un perfume");
      return false;
    }
    const ts = tamaniosDe(p);
    if (!ts.some((t) => t.label === l.tamanio)) {
      if (ts.length === 1) l.tamanio = ts[0].label;
      else {
        quitados.push(`${nombreCompleto(p)} (${l.tamanio})`);
        return false;
      }
    }
    l.nombre = nombreCompleto(p);
    return true;
  });
  if (quitados.length) {
    guardarCarrito();
    const msg =
      quitados.length === 1
        ? `Sacamos ${quitados[0]} de tu carrito porque ya no está disponible.`
        : `Sacamos ${quitados.length} productos de tu carrito porque ya no están disponibles: ${quitados.join(", ")}.`;
    const aviso = $("#aviso-carrito");
    aviso.textContent = msg;
    aviso.hidden = false;
    toast(msg, "largo");
  }
  renderCarrito();
}

function lineasDetalladas() {
  return st.carrito
    .map((l) => {
      const p = porId(l.id);
      if (!p) return null;
      const t = tamaniosDe(p).find((x) => x.label === l.tamanio) || tamaniosDe(p)[0];
      return { ...l, p, unitario: t.precio, subtotal: t.precio * l.cantidad };
    })
    .filter(Boolean);
}

function renderCarrito() {
  const cantidad = st.carrito.reduce((s, l) => s + l.cantidad, 0);
  const c = $("#contador");
  c.hidden = cantidad === 0;
  c.textContent = cantidad;
  $("#abrir-carrito").setAttribute("aria-label", cantidad ? `Abrir carrito, ${plural(cantidad, "producto", "productos")}` : "Abrir carrito");
  if (!st.cargado) return;

  const lineas = lineasDetalladas();
  $("#carrito-vacio").hidden = lineas.length > 0;
  $("#checkout").hidden = lineas.length === 0;
  $("#lineas").innerHTML = lineas
    .map((l, i) => `<li class="linea" data-i="${i}">
      <img src="${esc(l.p.imagenes?.[0] || FOTO_VACIA)}" alt="" width="64" height="80" loading="lazy">
      <div>
        <p class="marca">${esc(l.p.marca)}</p>
        <h3>${esc(l.p.nombre)}</h3>
        <p class="meta">${esc([l.p.concentracion, l.tamanio, l.p.tipo !== "Sellado" ? l.p.tipo : ""].filter(Boolean).join(" · "))} · ${precio(l.unitario)}</p>
        <div class="cantidad chica" aria-label="Cantidad">
          <button type="button" data-linea-cant="-1" aria-label="Restar" ${l.cantidad <= 1 ? "disabled" : ""}>−</button>
          <output>${l.cantidad}</output>
          <button type="button" data-linea-cant="1" aria-label="Sumar">+</button>
        </div>
      </div>
      <div class="linea-der">
        <button type="button" class="btn-icono" data-quitar aria-label="Quitar ${esc(l.p.nombre)}">${ICONOS.basura}</button>
        <strong>${precio(l.subtotal)}</strong>
      </div>
    </li>`)
    .join("");
  $("#total").textContent = precio(lineas.reduce((s, l) => s + l.subtotal, 0));
}

function mensajePedido({ nombre, punto }) {
  const lineas = lineasDetalladas();
  const total = lineas.reduce((s, l) => s + l.subtotal, 0);
  const detalle = lineas.map((l) => {
    const extra = [l.tamanio, l.p.tipo && l.p.tipo !== "Sellado" ? l.p.tipo : ""].filter(Boolean).join(" · ");
    return `• ${l.cantidad}x ${nombreCompleto(l.p)}${extra ? ` (${extra})` : ""} – ${precio(l.subtotal)}`;
  });
  return [
    "Hola! Quiero hacer este pedido:",
    ...detalle,
    `Total: ${precio(total)}`,
    `Nombre: ${nombre}`,
    `Entrega: punto de encuentro en ${punto}`
  ].join("\n");
}

function enlazarCarrito() {
  const dlg = $("#carrito");
  const form = $("#checkout");
  const cli = ls.get(CLIENTE_KEY, {});
  if (cli.nombre) form.nombre.value = cli.nombre;
  if (cli.punto && puntos().includes(cli.punto)) form.punto.value = cli.punto;

  $("#abrir-carrito").addEventListener("click", () => {
    renderCarrito();
    dlg.showModal();
  });
  dlg.addEventListener("click", (e) => {
    if (e.target === dlg || e.target.closest("[data-cerrar]")) {
      dlg.close();
      if (e.target.closest("[data-ir-catalogo]")) $("#catalogo").scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth" });
      return;
    }
    const li = e.target.closest(".linea");
    if (!li) return;
    const l = lineasDetalladas()[Number(li.dataset.i)];
    const real = st.carrito.find((x) => String(x.id) === String(l.id) && x.tamanio === l.tamanio);
    const b = e.target.closest("[data-linea-cant]");
    if (b) real.cantidad = Math.max(1, Math.min(99, real.cantidad + Number(b.dataset.lineaCant)));
    if (e.target.closest("[data-quitar]")) st.carrito = st.carrito.filter((x) => x !== real);
    if (b || e.target.closest("[data-quitar]")) {
      guardarCarrito();
      renderCarrito();
    }
  });
  dlg.addEventListener("close", () => ($("#aviso-carrito").hidden = true));

  // El envío es un enlace real (no window.open): funciona en cualquier navegador
  // y en las vistas embebidas que bloquean ventanas emergentes.
  const datosCliente = () => ({ nombre: form.nombre.value.trim(), punto: form.punto?.value || "" });
  function validar(datos) {
    const error = $("#error-checkout");
    error.textContent = "";
    if (!datos.nombre) {
      error.textContent = "Contanos tu nombre para armar el pedido.";
      form.nombre.focus();
      return false;
    }
    if (puntos().length && !datos.punto) {
      error.textContent = "Elegí dónde te queda mejor encontrarnos.";
      $("#puntos input")?.focus();
      return false;
    }
    return lineasDetalladas().length > 0;
  }
  $("#enviar-pedido").addEventListener("click", (e) => {
    const datos = datosCliente();
    if (!validar(datos)) return e.preventDefault();
    ls.set(CLIENTE_KEY, datos);
    e.currentTarget.href = waLink(mensajePedido(datos));
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (validar(datosCliente())) $("#enviar-pedido").click();
  });
  $("#vaciar").addEventListener("click", () => {
    st.carrito = [];
    guardarCarrito();
    renderCarrito();
  });
}

/* ============================== UI general ============================== */

function enlazarUI() {
  enlazarModal();
  enlazarCarrito();

  $("#chips").addEventListener("click", (e) => {
    const b = e.target.closest("[data-cat]");
    if (!b) return;
    st.cat = b.dataset.cat;
    $$("#chips .chip").forEach((c) => c.setAttribute("aria-pressed", c === b));
    renderGrilla();
  });
  $("#familia").addEventListener("change", (e) => {
    st.fam = e.target.value;
    renderGrilla();
  });
  $("#orden").addEventListener("change", (e) => {
    st.orden = e.target.value;
    renderGrilla();
  });

  let llevado = false;
  const buscar = $("#buscar");
  buscar.addEventListener("input", () => {
    st.q = buscar.value;
    renderGrilla();
    // La primera vez que escribe, lo llevamos al catálogo para que vea los resultados.
    const top = $("#catalogo").getBoundingClientRect().top;
    if (!llevado && (top > innerHeight * 0.6 || top < -$("#catalogo").offsetHeight + 200)) {
      llevado = true;
      $("#catalogo").scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth" });
    }
  });
  buscar.addEventListener("blur", () => (llevado = false));
  buscar.addEventListener("keydown", (e) => e.key === "Enter" && buscar.blur());

  $("#grilla").addEventListener("click", (e) => {
    if (e.target.closest("[data-limpiar]")) {
      Object.assign(st, { cat: "todas", fam: "", q: "" });
      buscar.value = "";
      renderFiltros();
      return renderGrilla();
    }
    const card = e.target.closest(".card[data-id]");
    if (!card) return;
    if (e.target.closest("[data-abrir]")) return abrirModal(card.dataset.id);
    if (e.target.closest("[data-agregar]")) {
      const p = porId(card.dataset.id);
      const ts = tamaniosDe(p);
      // Con varios tamaños, abrimos el detalle para que elija.
      if (ts.length > 1) abrirModal(p.id);
      else agregar(p.id, ts[0].label, 1);
    }
  });
}

let observador;
function observarReveal(root = document) {
  const els = $$(".reveal:not(.visto)", root);
  if (reduceMotion() || !("IntersectionObserver" in window)) return els.forEach((el) => el.classList.add("visto"));
  observador ??= new IntersectionObserver(
    (entradas) => entradas.forEach((en) => {
      if (en.isIntersecting) {
        const el = en.target;
        el.classList.add("visto");
        observador.unobserve(el);
        // Terminada la entrada, devolvemos a la tarjeta sus transiciones de hover.
        setTimeout(() => {
          el.classList.remove("reveal", "visto");
          el.style.transitionDelay = "";
        }, 1100);
      }
    }),
    { rootMargin: "0px 0px -8% 0px" }
  );
  els.forEach((el) => observador.observe(el));
}

/* ============================== Arranque (al final: todas las declaraciones ya existen) ============================== */

aplicarConfig();
fotoFallback();
enlazarUI();
renderCarrito();
observarReveal();
cargar();
