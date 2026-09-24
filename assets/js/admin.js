import { CONFIG, $, $$, precio, norm, esc, plural, lista, toast, fotoFallback, FOTO_VACIA, ICONOS } from "./util.js";
import { getBackend, MODO_DEMO } from "./backend.js";

const st = { be: null, perfumes: [], categorias: [], familias: [], q: "", cat: "", editando: null, fotos: [], quitadas: [] };

$$("[data-nombre-tienda]").forEach((el) => (el.textContent = CONFIG.nombre || "Perfumería"));
fotoFallback();
iniciar();

async function iniciar() {
  try {
    st.be = await getBackend();
  } catch (e) {
    console.warn(e);
    mostrarLogin();
    $("#login-error").textContent = "No se pudo conectar con Supabase: " + e.message + " Recargá la página para reintentar.";
    return;
  }
  if (await st.be.sesion()) entrar();
  else mostrarLogin();
}

/* ================================ Login ================================ */

function mostrarLogin() {
  $("#vista-panel").hidden = true;
  $("#vista-login").hidden = false;
  if (MODO_DEMO) {
    const aviso = $("#login-demo");
    aviso.hidden = false;
    aviso.innerHTML = `<b>Modo demostración.</b> Todavía no hay Supabase configurado: los cambios se guardan en este navegador.<br>Contraseña de demo: <strong>${esc(CONFIG.demoPassword)}</strong>`;
    $("#campo-email").hidden = true;
  }
}

$("#form-login").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.target;
  const err = $("#login-error");
  err.textContent = "";
  if (!st.be) return iniciar();
  if (!MODO_DEMO && !f.email.value.trim()) return (err.textContent = "Ingresá tu email.");
  if (!f.password.value) return (err.textContent = "Ingresá la contraseña.");
  f.classList.add("guardando");
  try {
    await st.be.login(f.email.value.trim(), f.password.value);
    f.password.value = "";
    entrar();
  } catch (ex) {
    err.textContent = ex.message;
  } finally {
    f.classList.remove("guardando");
  }
});

async function entrar() {
  // Tener usuario no alcanza: el email tiene que estar en la tabla "admins".
  let autorizado = false;
  try {
    autorizado = await st.be.esAdmin();
  } catch (ex) {
    console.warn(ex);
  }
  if (!autorizado) {
    const email = await st.be.emailSesion();
    await st.be.logout();
    mostrarLogin();
    $("#login-error").textContent = `${email || "Este usuario"} no está autorizado para usar el panel. En Supabase → SQL Editor corré: insert into public.admins (email) values ('${email || "tu@email.com"}');`;
    return;
  }
  $("#vista-login").hidden = true;
  $("#vista-panel").hidden = false;
  $("#reiniciar-demo").hidden = !MODO_DEMO;
  const avisos = [];
  if (MODO_DEMO) avisos.push(`<div class="aviso info"><b>Modo demostración:</b> lo que cargues se guarda sólo en este navegador. Para usar la tienda de verdad, completá las credenciales de Supabase en <code>assets/js/config.js</code>.</div>`);
  $("#avisos").innerHTML = avisos.join("");
  await recargar();
  if (!MODO_DEMO && (await st.be.registroAbierto())) {
    $("#avisos").insertAdjacentHTML("afterbegin", `<div class="aviso"><strong>⚠ El registro de usuarios de Supabase está ABIERTO.</strong> Cualquiera podría crearse una cuenta y editar tu catálogo. Cerralo en Supabase → Authentication → Sign In / Providers → desactivá <b>“Allow new users to sign up”</b>.</div>`);
  }
}

$("#salir").addEventListener("click", async () => {
  await st.be.logout();
  location.reload();
});

$("#reiniciar-demo").addEventListener("click", async () => {
  if (!(await confirmar("¿Reiniciar la demo?", "Se borran los cambios de este navegador y vuelven los perfumes de ejemplo.", "Reiniciar"))) return;
  st.be.reiniciar();
  await recargar();
  toast("Demo reiniciada");
});

async function recargar() {
  try {
    const [perfumes, categorias, familias] = await Promise.all([st.be.perfumesTodos(), st.be.lista("categorias"), st.be.lista("familias")]);
    Object.assign(st, { perfumes, categorias, familias });
  } catch (e) {
    toast(e.message, "error largo");
    console.warn(e);
  }
  renderTodo();
}

function renderTodo() {
  renderMetricas();
  renderFiltroCategorias();
  renderFilas();
  renderTaxo("categorias");
  renderTaxo("familias");
}

/* ================================ Pestañas ================================ */

$(".tabs").addEventListener("click", (e) => {
  const b = e.target.closest("[data-tab]");
  if (!b) return;
  $$(".tabs [data-tab]").forEach((x) => x.setAttribute("aria-selected", x === b));
  $("#tab-perfumes").hidden = b.dataset.tab !== "perfumes";
  $("#tab-taxonomias").hidden = b.dataset.tab !== "taxonomias";
});

/* ================================ Listado ================================ */

function renderMetricas() {
  const p = st.perfumes;
  const m = [
    [p.length, "perfume", "perfumes"],
    [p.filter((x) => x.activo).length, "visible", "visibles"],
    [p.filter((x) => !x.stock).length, "sin stock", "sin stock", true],
    [p.filter((x) => x.destacado).length, "destacado", "destacados"]
  ];
  $("#metricas").innerHTML = m
    .map(([n, uno, varios, alerta]) => `<div class="metrica${alerta && n ? " alerta" : ""}"><strong>${n}</strong><span>${n === 1 ? uno : varios}</span></div>`)
    .join("");
}

function renderFiltroCategorias() {
  const sel = $("#a-categoria");
  sel.innerHTML = '<option value="">Todas las categorías</option>' + st.categorias.map((c) => `<option value="${c.id}">${esc(c.nombre)}</option>`).join("") + '<option value="sin">Sin categoría</option>';
  sel.value = st.cat;
}

function renderFilas() {
  const q = norm(st.q);
  const filas = st.perfumes.filter((p) => {
    if (st.cat === "sin" ? p.categoria != null : st.cat && String(p.categoria) !== st.cat) return false;
    return !q || norm(`${p.nombre} ${p.marca}`).includes(q);
  });
  const ul = $("#filas");
  if (!filas.length) {
    ul.innerHTML = `<li class="vacio-a">${st.perfumes.length ? "No hay perfumes con ese filtro." : "Todavía no cargaste perfumes. Tocá “+ Nuevo perfume”."}</li>`;
    return;
  }
  const cat = (id) => st.categorias.find((c) => c.id === id)?.nombre || "Sin categoría";
  ul.innerHTML = filas
    .map((p) => `<li class="fila${p.activo ? "" : " inactiva"}" data-id="${p.id}">
      <img class="mini" src="${esc(p.imagenes?.[0] || FOTO_VACIA)}" alt="" width="64" height="80" loading="lazy">
      <div class="fila-info">
        <p class="marca">${esc(p.marca)}</p>
        <h3>${esc(p.nombre)}</h3>
        <p>${esc(cat(p.categoria))}${p.concentracion ? " · " + esc(p.concentracion) : ""}${p.tipo !== "Sellado" ? " · " + esc(p.tipo) : ""}</p>
        <p><span class="pr">${precio(p.precio)}</span>${p.etiqueta ? " · " + esc(p.etiqueta) : ""}</p>
      </div>
      <div class="fila-acciones">
        <button class="pill" data-toggle="activo" aria-pressed="${!!p.activo}">${p.activo ? "Visible" : "Oculto"}</button>
        <button class="pill stock" data-toggle="stock" aria-pressed="${!!p.stock}">${p.stock ? "Con stock" : "Sin stock"}</button>
        <button class="pill dest" data-toggle="destacado" aria-pressed="${!!p.destacado}" aria-label="Destacado">${ICONOS.estrella}${p.destacado ? "Destacado" : "Destacar"}</button>
        <span class="sep"></span>
        <button class="btn btn-borde" data-editar>Editar</button>
        <button class="btn btn-borde" data-duplicar aria-label="Duplicar ${esc(p.nombre)}">Duplicar</button>
        <button class="btn btn-borde borrar" data-borrar aria-label="Borrar ${esc(p.nombre)}">Borrar</button>
      </div>
    </li>`)
    .join("");
}

$("#a-buscar").addEventListener("input", (e) => {
  st.q = e.target.value;
  renderFilas();
});
$("#a-categoria").addEventListener("change", (e) => {
  st.cat = e.target.value;
  renderFilas();
});
$("#nuevo").addEventListener("click", () => abrirForm(null));

$("#filas").addEventListener("click", async (e) => {
  const li = e.target.closest(".fila");
  if (!li) return;
  const p = st.perfumes.find((x) => String(x.id) === li.dataset.id);
  const tg = e.target.closest("[data-toggle]");
  if (tg) {
    const campo = tg.dataset.toggle;
    const valor = !p[campo];
    tg.disabled = true;
    try {
      Object.assign(p, await st.be.actualizar(p.id, { [campo]: valor }));
      renderMetricas();
      renderFilas();
      const txt = { activo: valor ? "Visible en la tienda" : "Oculto de la tienda", stock: valor ? "Marcado con stock" : "Marcado sin stock", destacado: valor ? "Destacado" : "Ya no está destacado" };
      toast(`${p.nombre}: ${txt[campo]}`);
    } catch (ex) {
      toast(ex.message, "error largo");
      tg.disabled = false;
    }
    return;
  }
  if (e.target.closest("[data-editar]")) return abrirForm(p);
  if (e.target.closest("[data-duplicar]")) return abrirForm(p, true);
  if (e.target.closest("[data-borrar]")) {
    const ok = await confirmar(`¿Borrar ${p.nombre}?`, `Se borra el perfume y ${plural(p.imagenes?.length || 0, "foto", "fotos")}. No se puede deshacer. Si sólo querés sacarlo de la tienda, usá “Oculto”.`, "Borrar");
    if (!ok) return;
    try {
      await st.be.borrarPerfume(p.id);
      await st.be.borrarImagenes(sinUso(p.imagenes || [], p)).catch((ex) => console.warn("No se pudieron borrar algunas fotos:", ex));
      st.perfumes = st.perfumes.filter((x) => x !== p);
      renderMetricas();
      renderFilas();
      toast("Perfume borrado");
    } catch (ex) {
      toast(ex.message, "error largo");
    }
  }
});

/* ================================ Formulario ================================ */

const form = $("#form-perfume");
const dlgForm = $("#dlg-form");

function opciones(lista, valor) {
  return '<option value="">—</option>' + lista.map((x) => `<option value="${x.id}" ${x.id === valor ? "selected" : ""}>${esc(x.nombre)}</option>`).join("");
}

/** Fotos que ningún otro perfume usa (un duplicado comparte las fotos del original). */
const sinUso = (urls, excepto) => urls.filter((u) => !st.perfumes.some((x) => x !== excepto && x.imagenes?.includes(u)));

/** p = perfume a editar; con duplicar=true, arranca un perfume NUEVO con sus datos. */
function abrirForm(p, duplicar = false) {
  st.editando = duplicar ? null : p;
  st.quitadas = [];
  st.fotos = (p?.imagenes || []).map((url) => ({ url, preview: url }));
  form.reset();
  $("#form-error").textContent = "";
  $("#form-titulo").textContent = duplicar ? `Duplicar ${p.nombre}` : p ? `Editar ${p.nombre}` : "Nuevo perfume";
  form.categoria.innerHTML = opciones(st.categorias, p?.categoria ?? null);
  form.familia.innerHTML = opciones(st.familias, p?.familia ?? null);
  const v = p || { tipo: "Sellado", stock: true, activo: true, destacado: false, duracion_horas: 8, estela: 3, tamanios: ["100 ml"], concentracion: "EDP" };
  form.nombre.value = duplicar ? `${v.nombre} (copia)` : v.nombre || "";
  form.marca.value = v.marca || "";
  form.concentracion.value = v.concentracion || "";
  form.tipo.value = v.tipo || "Sellado";
  form.descripcion.value = v.descripcion || "";
  form.precio.value = v.precio ?? "";
  form.precio_anterior.value = v.precio_anterior ?? "";
  form.tamanios.value = (v.tamanios || []).join(", ");
  form.notas_salida.value = (v.notas?.salida || []).join(", ");
  form.notas_corazon.value = (v.notas?.corazon || []).join(", ");
  form.notas_fondo.value = (v.notas?.fondo || []).join(", ");
  form.duracion_horas.value = v.duracion_horas ?? 8;
  form.querySelector(`[name=estela][value="${v.estela || 3}"]`).checked = true;
  form.etiqueta.value = v.etiqueta || "";
  form.stock.checked = !!v.stock;
  form.destacado.checked = !!v.destacado;
  form.activo.checked = v.activo !== false;
  syncDuracion();
  renderFotos();
  dlgForm.showModal();
  $(".hoja-cuerpo", dlgForm).scrollTop = 0;
}

const syncDuracion = () => ($("#out-duracion").textContent = `${String(form.duracion_horas.value).replace(".", ",")} h`);
form.duracion_horas.addEventListener("input", syncDuracion);

dlgForm.addEventListener("click", (e) => {
  if (e.target.closest("[data-cerrar]")) return dlgForm.close();
  const b = e.target.closest("[data-foto]");
  if (!b) return;
  const i = Number(b.dataset.foto);
  if (b.dataset.accion === "quitar") {
    const [f] = st.fotos.splice(i, 1);
    if (f.url) st.quitadas.push(f.url);
    else if (f.preview.startsWith("blob:")) URL.revokeObjectURL(f.preview);
  } else if (b.dataset.accion === "principal") {
    st.fotos.unshift(...st.fotos.splice(i, 1));
  }
  renderFotos();
});

function renderFotos() {
  $("#fotos").innerHTML = st.fotos
    .map((f, i) => `<div class="foto"><img src="${esc(f.preview)}" alt="Foto ${i + 1}">
      <div class="foto-btns">
        ${i ? `<button type="button" data-foto="${i}" data-accion="principal" aria-label="Usar como principal" title="Usar como principal">★</button>` : ""}
        <button type="button" class="x" data-foto="${i}" data-accion="quitar" aria-label="Quitar foto ${i + 1}">✕</button>
      </div></div>`)
    .join("");
}

$("#input-fotos").addEventListener("change", async (e) => {
  const files = [...e.target.files];
  e.target.value = "";
  for (const file of files) {
    if (!file.type.startsWith("image/")) continue;
    try {
      const blob = await achicar(file, MODO_DEMO ? 720 : 1200);
      st.fotos.push({ blob, preview: URL.createObjectURL(blob) });
    } catch (ex) {
      console.warn(ex);
      toast(`No se pudo leer ${file.name}`, "error");
    }
  }
  renderFotos();
});

/** Achica la foto del celular (4–8 MB) a algo liviano antes de subirla. */
/**
 * Prepara la foto del celular para la tienda: la lleva al formato de la tarjeta
 * (4:5) sin cortar el frasco y la achica para que pese poco.
 * - Si ya viene casi en 4:5, se recorta apenas.
 * - Si no, va entera al centro y el resto se rellena con la misma foto desenfocada.
 */
async function achicar(file, ancho) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((ok, mal) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => mal(new Error("Formato de imagen no soportado"));
      i.src = url;
    });
    const iw = img.naturalWidth, ih = img.naturalHeight;
    const W = ancho, H = Math.round(ancho * 1.25);
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const x = c.getContext("2d");
    x.imageSmoothingQuality = "high";
    const cubrir = Math.max(W / iw, H / ih);

    if (Math.abs(iw / ih / 0.8 - 1) < 0.06) {
      x.drawImage(img, (W - iw * cubrir) / 2, (H - ih * cubrir) / 2, iw * cubrir, ih * cubrir);
    } else {
      // Fondo desenfocado: se achica a una miniatura y se vuelve a agrandar
      // (funciona en todos los celulares, incluso donde no existe ctx.filter).
      const mini = document.createElement("canvas");
      mini.width = 24;
      mini.height = 30;
      const mx = mini.getContext("2d");
      const km = Math.max(24 / iw, 30 / ih) * 1.15;
      mx.drawImage(img, (24 - iw * km) / 2, (30 - ih * km) / 2, iw * km, ih * km);
      x.drawImage(mini, 0, 0, W, H);
      x.fillStyle = "rgba(20, 12, 18, .45)";
      x.fillRect(0, 0, W, H);
      const k = Math.min(W / iw, H / ih);
      const w = iw * k, h = ih * k;
      x.shadowColor = "rgba(0, 0, 0, .5)";
      x.shadowBlur = W * 0.05;
      x.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
    }
    const tipo = MODO_DEMO ? "image/jpeg" : "image/webp";
    let blob = await new Promise((ok) => c.toBlob(ok, tipo, MODO_DEMO ? 0.78 : 0.85));
    if (!blob || blob.type !== tipo) blob = await new Promise((ok) => c.toBlob(ok, "image/jpeg", 0.82));
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}

const numero = (s) => {
  const n = Number(String(s).replace(/[^\d,]/g, "").replace(",", "."));
  return Number.isFinite(n) && String(s).trim() !== "" ? Math.round(n) : null;
};

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const err = $("#form-error");
  err.textContent = "";
  const precioN = numero(form.precio.value);
  const anterior = numero(form.precio_anterior.value);
  if (!form.nombre.value.trim()) return fallo("Falta el nombre.", form.nombre);
  if (!form.marca.value.trim()) return fallo("Falta la marca.", form.marca);
  if (precioN == null || precioN <= 0) return fallo("Poné un precio válido (sólo números, ej: 39900).", form.precio);

  const datos = {
    nombre: form.nombre.value.trim(),
    marca: form.marca.value.trim(),
    categoria: form.categoria.value ? Number(form.categoria.value) : null,
    familia: form.familia.value ? Number(form.familia.value) : null,
    concentracion: form.concentracion.value || null,
    tipo: form.tipo.value,
    descripcion: form.descripcion.value.trim(),
    precio: precioN,
    precio_anterior: anterior && anterior > 0 ? anterior : null,
    tamanios: lista(form.tamanios.value),
    notas: { salida: lista(form.notas_salida.value), corazon: lista(form.notas_corazon.value), fondo: lista(form.notas_fondo.value) },
    duracion_horas: Number(form.duracion_horas.value) || null,
    estela: Number(form.querySelector("[name=estela]:checked")?.value) || null,
    etiqueta: form.etiqueta.value || null,
    stock: form.stock.checked,
    destacado: form.destacado.checked,
    activo: form.activo.checked
  };
  if (st.editando) datos.id = st.editando.id;

  const caja = $(".hoja-caja", dlgForm);
  caja.classList.add("guardando");
  const subidas = [];
  try {
    for (const f of st.fotos) {
      if (!f.url) {
        f.url = await st.be.subirImagen(f.blob);
        subidas.push(f.url);
      }
    }
    datos.imagenes = st.fotos.map((f) => f.url);
    const guardado = await st.be.guardarPerfume(datos);
    // Recién con el perfume guardado borramos del Storage las fotos que se quitaron.
    await st.be.borrarImagenes(sinUso(st.quitadas, st.editando)).catch((ex) => console.warn(ex));
    if (st.editando) Object.assign(st.editando, guardado);
    else st.perfumes.unshift(guardado);
    dlgForm.close();
    renderMetricas();
    renderFilas();
    toast(st.editando ? "Cambios guardados" : "Perfume creado");
  } catch (ex) {
    st.fotos.forEach((f) => subidas.includes(f.url) && (f.url = null));
    await st.be.borrarImagenes(subidas).catch(() => {});
    fallo(ex.message);
  } finally {
    caja.classList.remove("guardando");
  }

  function fallo(msg, campo) {
    err.textContent = msg;
    if (campo) campo.focus();
    else err.scrollIntoView({ block: "center" });
  }
});

/* ============================ Categorías y familias ============================ */

function renderTaxo(tabla) {
  const caja = $(`.taxo[data-tabla="${tabla}"]`);
  const items = st[tabla];
  const campo = tabla === "categorias" ? "categoria" : "familia";
  $(".taxo-lista", caja).innerHTML = items
    .map((x, i) => {
      const n = st.perfumes.filter((p) => p[campo] === x.id).length;
      return `<li data-id="${x.id}">
        <input value="${esc(x.nombre)}" aria-label="Nombre" maxlength="40" data-renombrar>
        <button type="button" class="btn-icono" data-mover="-1" aria-label="Subir" ${i === 0 ? "disabled" : ""}>↑</button>
        <button type="button" class="btn-icono" data-mover="1" aria-label="Bajar" ${i === items.length - 1 ? "disabled" : ""}>↓</button>
        <button type="button" class="btn-icono" data-quitar aria-label="Borrar ${esc(x.nombre)}">${ICONOS.basura}</button>
        <span class="cuenta">${plural(n, "perfume", "perfumes")}</span>
      </li>`;
    })
    .join("");
}

$$(".taxo").forEach((caja) => {
  const tabla = caja.dataset.tabla;
  const guardar = async (fn, msg) => {
    caja.classList.add("guardando");
    try {
      await fn();
      if (msg) toast(msg);
    } catch (ex) {
      toast(ex.message, "error largo");
    }
    st[tabla] = await st.be.lista(tabla).catch(() => st[tabla]);
    caja.classList.remove("guardando");
    renderTaxo(tabla);
    renderFiltroCategorias();
  };

  $(".taxo-nuevo", caja).addEventListener("submit", (e) => {
    e.preventDefault();
    const nombre = e.target.nombre.value.trim();
    if (!nombre) return;
    const orden = st[tabla].reduce((m, x) => Math.max(m, x.orden ?? 0), 0) + 1;
    e.target.reset();
    guardar(() => st.be.guardarItem(tabla, { nombre, orden }), `Agregado: ${nombre}`);
  });

  caja.addEventListener("change", (e) => {
    if (!e.target.matches("[data-renombrar]")) return;
    const id = Number(e.target.closest("li").dataset.id);
    const item = st[tabla].find((x) => x.id === id);
    const nombre = e.target.value.trim();
    if (!nombre || nombre === item.nombre) return (e.target.value = item.nombre);
    guardar(() => st.be.guardarItem(tabla, { ...item, nombre }), "Nombre actualizado");
  });
  caja.addEventListener("keydown", (e) => e.key === "Enter" && e.target.matches("[data-renombrar]") && e.target.blur());

  caja.addEventListener("click", async (e) => {
    const li = e.target.closest("li[data-id]");
    if (!li) return;
    const i = st[tabla].findIndex((x) => x.id === Number(li.dataset.id));
    const item = st[tabla][i];
    const mover = e.target.closest("[data-mover]");
    if (mover) {
      const j = i + Number(mover.dataset.mover);
      const orden = [...st[tabla]];
      [orden[i], orden[j]] = [orden[j], orden[i]];
      // Renumeramos todo para que el orden quede prolijo aunque hubiera empates.
      return guardar(async () => {
        for (const [k, x] of orden.entries()) if (x.orden !== k + 1) await st.be.guardarItem(tabla, { ...x, orden: k + 1 });
      });
    }
    if (e.target.closest("[data-quitar]")) {
      const campo = tabla === "categorias" ? "categoria" : "familia";
      const n = st.perfumes.filter((p) => p[campo] === item.id).length;
      const extra = n ? ` ${plural(n, "perfume queda", "perfumes quedan")} sin ${campo}.` : "";
      if (!(await confirmar(`¿Borrar “${item.nombre}”?`, `Los perfumes no se borran.${extra}`, "Borrar"))) return;
      await guardar(() => st.be.borrarItem(tabla, item.id), "Borrado");
      if (n) {
        st.perfumes.forEach((p) => p[campo] === item.id && (p[campo] = null));
        renderFilas();
      }
    }
  });
});

/* ================================ Confirmación ================================ */

function confirmar(titulo, texto, boton = "Confirmar") {
  const d = $("#dlg-confirmar");
  $("#conf-titulo").textContent = titulo;
  $("#conf-texto").textContent = texto;
  $("#conf-si").textContent = boton;
  d.showModal();
  // Resolvemos con el clic mismo (no con el evento "close", que el navegador
  // puede demorar si la pestaña está en segundo plano).
  return new Promise((ok) => {
    const fin = (v) => {
      d.removeEventListener("click", clic);
      d.removeEventListener("cancel", cancelar);
      if (d.open) d.close();
      ok(v);
    };
    const clic = (e) => {
      const b = e.target.closest("button[value]");
      if (b) {
        e.preventDefault();
        fin(b.value === "si");
      } else if (e.target === d) fin(false);
    };
    const cancelar = (e) => {
      e.preventDefault();
      fin(false);
    };
    d.addEventListener("click", clic);
    d.addEventListener("cancel", cancelar);
  });
}
