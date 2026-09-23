// Capa de datos. La tienda y el panel hablan siempre con la misma interfaz;
// por debajo es Supabase (si hay credenciales) o el navegador (modo demo).
import { CONFIG, ls, hash } from "./util.js";
import { SEED } from "./seed.js";

export const MODO_DEMO = !(CONFIG.supabaseUrl && CONFIG.supabaseAnonKey);

// Se carga con import dinámico: si el CDN no responde, la página no queda en
// blanco; sólo falla esta promesa y se muestra un aviso con "Reintentar".
const SUPABASE_CDN = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

let promesa;
export function getBackend() {
  if (!promesa) {
    promesa = (MODO_DEMO ? Promise.resolve(crearDemo()) : crearSupabase()).catch((e) => {
      promesa = null; // permite reintentar
      throw e;
    });
  }
  return promesa;
}

const ordenar = (arr) => [...arr].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0) || a.id - b.id);

/* =============================== MODO DEMO =============================== */

const DEMO_KEY = "tienda_demo_db";
const DEMO_SESION = "tienda_demo_sesion";
// Firma de los datos de ejemplo: si seed.js cambia en un deploy, los navegadores
// que ya tenían la demo guardada descartan la copia vieja y cargan la nueva.
const FIRMA = hash(JSON.stringify(SEED));

function crearDemo() {
  let memoria = null; // por si localStorage no está disponible (modo privado, etc.)

  const db = () => {
    const guardada = ls.get(DEMO_KEY, null);
    if (guardada && guardada.firma === FIRMA) return guardada;
    if (memoria && memoria.firma === FIRMA) return memoria;
    memoria = { firma: FIRMA, ...structuredClone(SEED) };
    ls.set(DEMO_KEY, memoria);
    return memoria;
  };
  const guardar = (d) => {
    memoria = d;
    if (!ls.set(DEMO_KEY, d)) {
      throw new Error("El navegador se quedó sin espacio para la demo. Usá fotos más livianas o reiniciá la demo.");
    }
  };
  const nuevoId = (arr) => arr.reduce((m, x) => Math.max(m, x.id), 0) + 1;

  return {
    modo: "demo",
    async perfumesPublicos() {
      return db().perfumes.filter((p) => p.activo);
    },
    async perfumesTodos() {
      return [...db().perfumes].sort((a, b) => b.fecha_creacion.localeCompare(a.fecha_creacion));
    },
    async lista(tabla) {
      return ordenar(db()[tabla]);
    },
    async guardarPerfume(p) {
      const d = db();
      if (p.id) {
        const i = d.perfumes.findIndex((x) => x.id === p.id);
        if (i < 0) throw new Error("Ese perfume ya no existe.");
        d.perfumes[i] = { ...d.perfumes[i], ...p };
      } else {
        p = { ...p, id: nuevoId(d.perfumes), fecha_creacion: new Date().toISOString() };
        d.perfumes.push(p);
      }
      guardar(d);
      return p;
    },
    async actualizar(id, campos) {
      const d = db();
      const p = d.perfumes.find((x) => x.id === id);
      if (!p) throw new Error("Ese perfume ya no existe.");
      Object.assign(p, campos);
      guardar(d);
      return p;
    },
    async borrarPerfume(id) {
      const d = db();
      d.perfumes = d.perfumes.filter((x) => x.id !== id);
      guardar(d);
    },
    // En la demo las fotos quedan como data URL dentro del navegador.
    async subirImagen(blob) {
      return await new Promise((ok, mal) => {
        const r = new FileReader();
        r.onload = () => ok(r.result);
        r.onerror = () => mal(new Error("No se pudo leer la foto."));
        r.readAsDataURL(blob);
      });
    },
    async borrarImagenes() {},
    async guardarItem(tabla, item) {
      const d = db();
      const nombre = item.nombre.trim();
      if (d[tabla].some((x) => x.id !== item.id && x.nombre.toLowerCase() === nombre.toLowerCase())) {
        throw new Error(`Ya existe "${nombre}".`);
      }
      if (item.id) Object.assign(d[tabla].find((x) => x.id === item.id), { ...item, nombre });
      else d[tabla].push({ ...item, nombre, id: nuevoId(d[tabla]) });
      guardar(d);
    },
    async borrarItem(tabla, id) {
      const d = db();
      d[tabla] = d[tabla].filter((x) => x.id !== id);
      const campo = tabla === "categorias" ? "categoria" : "familia";
      d.perfumes.forEach((p) => {
        if (p[campo] === id) p[campo] = null;
      });
      guardar(d);
    },
    async login(_email, pass) {
      if (pass !== CONFIG.demoPassword) throw new Error("Contraseña incorrecta.");
      try {
        sessionStorage.setItem(DEMO_SESION, "1");
      } catch {}
      return true;
    },
    async sesion() {
      try {
        return sessionStorage.getItem(DEMO_SESION) === "1";
      } catch {
        return false;
      }
    },
    async logout() {
      try {
        sessionStorage.removeItem(DEMO_SESION);
      } catch {}
    },
    async registroAbierto() {
      return false;
    },
    async esAdmin() {
      return true;
    },
    async emailSesion() {
      return "";
    },
    reiniciar() {
      memoria = null;
      ls.del(DEMO_KEY);
    }
  };
}

/* ================================ SUPABASE ================================ */

function traducir(error) {
  const m = error?.message || String(error);
  if (error?.code === "42501" || /permission denied/i.test(m))
    return new Error("Supabase respondió \"permission denied\": falta correr el SQL completo (los GRANT y las políticas).");
  if (error?.code === "23505") return new Error("Ya existe un registro con ese nombre.");
  if (/Invalid login credentials/i.test(m)) return new Error("Email o contraseña incorrectos.");
  if (/Failed to fetch|NetworkError/i.test(m)) return new Error("No hay conexión con Supabase. Revisá internet y la URL del proyecto.");
  return new Error(m);
}
const ok = ({ data, error }) => {
  if (error) throw traducir(error);
  return data;
};

async function crearSupabase() {
  const tiempo = new Promise((_, mal) => setTimeout(() => mal(new Error("La librería de Supabase no respondió.")), 10000));
  const { createClient } = await Promise.race([import(SUPABASE_CDN), tiempo]);
  // Acepta la URL con o sin "/rest/v1/" al final (así aparece en algunas pantallas de Supabase).
  const url = CONFIG.supabaseUrl.trim().replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
  const sb = createClient(url, CONFIG.supabaseAnonKey);
  const MARCA = "/storage/v1/object/public/perfumes/";

  return {
    modo: "supabase",
    async perfumesPublicos() {
      // Filtramos activo=true también acá: si el panel está logueado en este
      // navegador, la política del admin devolvería los inactivos.
      return ok(await sb.from("perfumes").select("*").eq("activo", true).order("fecha_creacion", { ascending: false }));
    },
    async perfumesTodos() {
      return ok(await sb.from("perfumes").select("*").order("fecha_creacion", { ascending: false }));
    },
    async lista(tabla) {
      return ok(await sb.from(tabla).select("*").order("orden").order("id"));
    },
    async guardarPerfume(p) {
      const { id, fecha_creacion, ...campos } = p;
      if (id) return ok(await sb.from("perfumes").update(campos).eq("id", id).select().single());
      return ok(await sb.from("perfumes").insert(campos).select().single());
    },
    async actualizar(id, campos) {
      return ok(await sb.from("perfumes").update(campos).eq("id", id).select().single());
    },
    async borrarPerfume(id) {
      ok(await sb.from("perfumes").delete().eq("id", id));
    },
    async subirImagen(blob) {
      const ext = (blob.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
      const ruta = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      ok(await sb.storage.from("perfumes").upload(ruta, blob, { contentType: blob.type, cacheControl: "31536000" }));
      return sb.storage.from("perfumes").getPublicUrl(ruta).data.publicUrl;
    },
    /** Borra del Storage sólo las fotos que viven en el bucket (no las de /assets). */
    async borrarImagenes(urls = []) {
      const rutas = urls.filter((u) => u.includes(MARCA)).map((u) => decodeURIComponent(u.split(MARCA)[1].split("?")[0]));
      if (rutas.length) ok(await sb.storage.from("perfumes").remove(rutas));
    },
    async guardarItem(tabla, item) {
      const { id, ...campos } = item;
      campos.nombre = campos.nombre.trim();
      if (id) ok(await sb.from(tabla).update(campos).eq("id", id));
      else ok(await sb.from(tabla).insert(campos));
    },
    async borrarItem(tabla, id) {
      ok(await sb.from(tabla).delete().eq("id", id));
    },
    async login(email, pass) {
      ok(await sb.auth.signInWithPassword({ email, password: pass }));
      return true;
    },
    async sesion() {
      const { data } = await sb.auth.getSession();
      return !!data.session;
    },
    async logout() {
      await sb.auth.signOut();
    },
    /** Sólo los emails cargados en la tabla "admins" pueden editar (ver schema.sql). */
    async esAdmin() {
      const { data, error } = await sb.rpc("es_admin");
      if (error) throw traducir(error);
      return data === true;
    },
    async emailSesion() {
      const { data } = await sb.auth.getSession();
      return data.session?.user?.email || "";
    },
    /** Supabase trae el registro por email abierto de fábrica: lo detectamos. */
    async registroAbierto() {
      try {
        const r = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: CONFIG.supabaseAnonKey } });
        const s = await r.json();
        return s.disable_signup === false && s.external?.email !== false;
      } catch {
        return false;
      }
    },
    reiniciar() {}
  };
}
