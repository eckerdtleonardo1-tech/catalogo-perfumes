// Datos de ejemplo. Los usa el modo demo y son los mismos que carga supabase/schema.sql.
// Las rutas de las fotos empiezan con "/" porque este archivo lo leen la tienda (/)
// y el panel (/admin/): con rutas relativas las miniaturas del panel dan 404.
// Si cambiás algo acá, la firma de los datos cambia y los navegadores que tenían
// la demo guardada la recargan solos.

const img = (slug) => [`/assets/img/perfumes/${slug}.jpg`];

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
      id: 1, nombre: "Liquid Brun", marca: "French Avenue", categoria: 3, familia: 1,
      concentracion: "EDP",
      notas: { salida: ["Canela", "Cardamomo", "Azahar", "Bergamota"], corazon: ["Vainilla bourbon", "Praliné", "Elemí"], fondo: ["Almizcle", "Guayaco", "Ámbar"] },
      precio: 38900, precio_anterior: null,
      descripcion: "Cálido, especiado y envolvente. La canela y el praliné sobre un fondo de maderas y ámbar lo vuelven ideal para la noche.",
      imagenes: img("french-avenue-liquid-brun"), tamanios: ["100 ml"], tipo: "Sellado",
      duracion_horas: 9, estela: 4, stock: true, etiqueta: "Nuevo", destacado: true, activo: true,
      fecha_creacion: "2026-09-15T15:00:00.000Z"
    },
    {
      id: 2, nombre: "Eclaire", marca: "Lattafa", categoria: 2, familia: 4,
      concentracion: "EDP",
      notas: { salida: ["Caramelo", "Leche", "Azúcar"], corazon: ["Miel", "Flores blancas"], fondo: ["Vainilla", "Praliné", "Almizcle"] },
      precio: 42900, precio_anterior: null,
      descripcion: "Un postre en frasco: caramelo, leche y miel sobre vainilla. Dulce y cremoso. También lo tenemos en decant para probarlo.",
      imagenes: img("lattafa-eclaire"), tamanios: ["Decant 10 ml: 9900", "100 ml: 42900"], tipo: "Sellado",
      duracion_horas: 8, estela: 4, stock: true, etiqueta: null, destacado: true, activo: true,
      fecha_creacion: "2026-09-05T15:00:00.000Z"
    },
    {
      id: 3, nombre: "Yara", marca: "Lattafa", categoria: 2, familia: 4,
      concentracion: "EDP",
      notas: { salida: ["Orquídea", "Heliotropo", "Mandarina"], corazon: ["Acorde gourmand", "Frutas tropicales"], fondo: ["Vainilla", "Almizcle", "Sándalo"] },
      precio: 39900, precio_anterior: null,
      descripcion: "Dulce, cremoso y muy femenino. La vainilla y las frutas tropicales lo vuelven adictivo: es el árabe que más nos piden para regalar.",
      imagenes: img("lattafa-yara"), tamanios: ["100 ml"], tipo: "Sellado",
      duracion_horas: 8, estela: 4, stock: true, etiqueta: "Más vendido", destacado: true, activo: true,
      fecha_creacion: "2026-08-02T15:00:00.000Z"
    },
    {
      id: 4, nombre: "Khamrah", marca: "Lattafa", categoria: 4, familia: 1,
      concentracion: "EDP",
      notas: { salida: ["Canela", "Nuez moscada", "Bergamota"], corazon: ["Dátiles", "Praliné", "Nardos"], fondo: ["Vainilla", "Haba tonka", "Benjuí"] },
      precio: 45900, precio_anterior: 52900,
      descripcion: "Especiado, licoroso y cálido. Dátiles, canela y praliné en un perfume que se siente de lujo y dura todo el día.",
      imagenes: img("lattafa-khamrah"), tamanios: ["100 ml"], tipo: "Sellado",
      duracion_horas: 10, estela: 5, stock: true, etiqueta: "Oferta", destacado: false, activo: true,
      fecha_creacion: "2026-07-20T15:00:00.000Z"
    },
    {
      id: 5, nombre: "Ajwad", marca: "Lattafa", categoria: 4, familia: 2,
      concentracion: "EDP",
      notas: { salida: ["Pistacho", "Bergamota"], corazon: ["Rosa", "Jazmín"], fondo: ["Vainilla", "Almizcle", "Sándalo"] },
      precio: 34900, precio_anterior: null,
      descripcion: "Frutal y floral con un fondo suave de vainilla. Viene en su caja de colección, ideal para regalar.",
      imagenes: img("lattafa-ajwad"), tamanios: ["60 ml"], tipo: "Sellado",
      duracion_horas: 7, estela: 3, stock: false, etiqueta: "Importado", destacado: false, activo: true,
      fecha_creacion: "2026-06-15T15:00:00.000Z"
    }
  ]
};
