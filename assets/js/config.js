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
  supabaseUrl: "",
  supabaseAnonKey: "",

  // Modo demo
  demoPassword: "demo1234",
  // false = oculta el cartel "estás viendo productos de ejemplo" en la tienda
  // (para que en una demo de venta se vea como una tienda real).
  mostrarCartelDemo: true,

  // Footer
  instagram: "https://instagram.com/santalucia.parfums",
  tiktok: "",
  facebook: "",
  zonaEnvio: "Envíos a todo el país por correo.",
  horarios: "Lunes a viernes de 10 a 19 h · Sábados de 10 a 14 h",
  direccionRetiro: "Te pasamos la dirección por WhatsApp"
};
