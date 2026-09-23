/* ==========================================================================
   CONFIGURACIÓN DE LA TIENDA
   Es el único archivo que hace falta tocar para poner la tienda en marcha.
   (El nombre también figura en las metaetiquetas de index.html: cambialo ahí
   también, porque WhatsApp e Instagram leen el HTML sin ejecutar JavaScript.)
   ========================================================================== */
window.TIENDA_CONFIG = {
  nombre: "santalucia.parfums",
  eslogan: "Perfumes árabes, de diseñador y body splash",

  // Formato internacional SIN "+", sin espacios ni guiones.
  // Argentina celular: 54 + 9 + código de área sin 0 + número sin 15.
  // Ej: (011) 15 2345-6789  →  "5491123456789"
  whatsapp: "5493329534029",

  // Supabase. Si quedan vacíos, la tienda y el panel funcionan en MODO DEMO
  // (con los perfumes de ejemplo, guardando los cambios en el navegador).
  supabaseUrl: "https://lkhnmghcylqngdnsdylr.supabase.co",
  // Clave pública ("anon"): puede estar en el código. NUNCA pongas acá la service_role.
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxraG5tZ2hjeWxxbmdkbnNkeWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNzgyMTcsImV4cCI6MjEwNTc1NDIxN30.j2_Bz2sdzAvntNWRfa277iiklnUye_rlCYgWxYrsLAM",

  // Modo demo
  demoPassword: "demo1234",
  // false = oculta el cartel "estás viendo productos de ejemplo" en la tienda
  // (para que en una demo de venta se vea como una tienda real).
  mostrarCartelDemo: true,

  // Footer
  instagram: "https://instagram.com/santalucia.parfums",
  tiktok: "",
  facebook: "",
  // Entregas: no hay envíos, se coordina un punto de encuentro por WhatsApp.
  puntosEncuentro: ["Santa Lucía", "Doyle", "San Pedro"],
  horarios: "Coordinamos día y horario por WhatsApp",
  responsable: "Maximiliano Abraham"
};
