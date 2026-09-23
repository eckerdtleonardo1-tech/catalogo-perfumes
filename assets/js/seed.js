// Datos de ejemplo. Los usa el modo demo y son los mismos que carga supabase/schema.sql.
// Las rutas de las fotos empiezan con "/" porque este archivo lo leen la tienda (/)
// y el panel (/admin/): con rutas relativas las miniaturas del panel dan 404.
// Si cambiás algo acá, la firma de los datos cambia y los navegadores que tenían
// la demo guardada la recargan solos.

const img = (slug) => [`/assets/img/perfumes/${slug}-1.svg`, `/assets/img/perfumes/${slug}-2.svg`];

export const SEED = {
  categorias: [
    { id: 1, nombre: "Árabes", orden: 1 },
    { id: 2, nombre: "Femeninos", orden: 2 },
    { id: 3, nombre: "Masculinos", orden: 3 },
    { id: 4, nombre: "Unisex", orden: 4 },
    { id: 5, nombre: "Body splash", orden: 5 }
  ],
  familias: [
    { id: 1, nombre: "Oriental", orden: 1 },
    { id: 2, nombre: "Floral", orden: 2 },
    { id: 3, nombre: "Cítrico", orden: 3 },
    { id: 4, nombre: "Gourmand", orden: 4 },
    { id: 5, nombre: "Amaderado", orden: 5 },
    { id: 6, nombre: "Acuático", orden: 6 }
  ],
  perfumes: [
    {
      id: 1, nombre: "Yara", marca: "Lattafa", categoria: 1, familia: 4,
      concentracion: "EDP",
      notas: { salida: ["Orquídea", "Heliotropo", "Mandarina"], corazon: ["Acorde gourmand", "Frutas tropicales"], fondo: ["Vainilla", "Almizcle", "Sándalo"] },
      precio: 39900, precio_anterior: null,
      descripcion: "Dulce, cremoso y muy femenino. La vainilla y las frutas tropicales lo vuelven adictivo: es el árabe que más nos piden para regalar.",
      imagenes: img("lattafa-yara"), tamanios: ["100 ml"], tipo: "Sellado",
      duracion_horas: 8, estela: 4, stock: true, etiqueta: "Más vendido", destacado: true, activo: true,
      fecha_creacion: "2026-08-02T15:00:00.000Z"
    },
    {
      id: 2, nombre: "Odyssey Mandarin Sky", marca: "Armaf", categoria: 1, familia: 3,
      concentracion: "EDP",
      notas: { salida: ["Mandarina", "Naranja amarga"], corazon: ["Caramelo", "Canela"], fondo: ["Haba tonka", "Ámbar", "Vetiver"] },
      precio: 34900, precio_anterior: null,
      descripcion: "Una explosión de mandarina jugosa sobre un fondo dulce de tonka. Fresco de día, envolvente de noche.",
      imagenes: img("armaf-odyssey-mandarin-sky"), tamanios: ["100 ml"], tipo: "Sellado",
      duracion_horas: 9, estela: 4, stock: true, etiqueta: "Nuevo", destacado: true, activo: true,
      fecha_creacion: "2026-09-10T15:00:00.000Z"
    },
    {
      id: 3, nombre: "Khamrah", marca: "Lattafa", categoria: 1, familia: 1,
      concentracion: "EDP",
      notas: { salida: ["Canela", "Nuez moscada", "Bergamota"], corazon: ["Dátiles", "Praliné", "Nardos"], fondo: ["Vainilla", "Haba tonka", "Benjuí"] },
      precio: 45900, precio_anterior: 52900,
      descripcion: "Especiado, licoroso y cálido. Dátiles, canela y praliné en un perfume que se siente de lujo y dura todo el día.",
      imagenes: img("lattafa-khamrah"), tamanios: ["100 ml"], tipo: "Sellado",
      duracion_horas: 10, estela: 5, stock: true, etiqueta: "Oferta", destacado: false, activo: true,
      fecha_creacion: "2026-07-20T15:00:00.000Z"
    },
    {
      id: 4, nombre: "Good Girl", marca: "Carolina Herrera", categoria: 2, familia: 2,
      concentracion: "EDP",
      notas: { salida: ["Almendra", "Café"], corazon: ["Tuberosa", "Jazmín sambac"], fondo: ["Haba tonka", "Cacao"] },
      precio: 129900, precio_anterior: null,
      descripcion: "El icónico frasco stiletto. Luminoso y oscuro a la vez: flores blancas con un fondo de cacao y tonka.",
      imagenes: img("carolina-herrera-good-girl"), tamanios: ["50 ml: 129900", "80 ml: 159900"], tipo: "Sellado",
      duracion_horas: 7, estela: 3, stock: false, etiqueta: "Importado", destacado: false, activo: true,
      fecha_creacion: "2026-06-15T15:00:00.000Z"
    },
    {
      id: 5, nombre: "Sauvage", marca: "Dior", categoria: 3, familia: 5,
      concentracion: "EDT",
      notas: { salida: ["Bergamota de Calabria", "Pimienta"], corazon: ["Lavanda", "Pimienta de Sichuán", "Geranio"], fondo: ["Ambroxan", "Cedro", "Ládano"] },
      precio: 12900, precio_anterior: null,
      descripcion: "Decant del original fraccionado a mano. Ideal para probarlo a fondo antes de comprar el frasco completo.",
      imagenes: img("dior-sauvage"), tamanios: ["5 ml: 12900", "10 ml: 22900"], tipo: "Decant",
      duracion_horas: 7, estela: 4, stock: true, etiqueta: null, destacado: false, activo: true,
      fecha_creacion: "2026-08-25T15:00:00.000Z"
    },
    {
      id: 6, nombre: "Bare Vanilla", marca: "Victoria's Secret", categoria: 5, familia: 4,
      concentracion: null,
      notas: { salida: ["Vainilla batida"], corazon: ["Cachemira"], fondo: ["Almizcle suave"] },
      precio: 19900, precio_anterior: 24900,
      descripcion: "Body splash suave y cremoso para usar todos los días y retocar en la cartera.",
      imagenes: img("victorias-secret-bare-vanilla"), tamanios: ["250 ml"], tipo: "Sellado",
      duracion_horas: 3, estela: 2, stock: true, etiqueta: "Oferta", destacado: false, activo: true,
      fecha_creacion: "2026-05-30T15:00:00.000Z"
    }
  ]
};
