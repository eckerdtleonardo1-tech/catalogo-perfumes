-- =============================================================================
--  OPCIONAL · Perfumes de ejemplo
--  Carga los 5 perfumes de la demo, sólo si la tabla está vacía.
--  Correlo DESPUÉS de schema.sql. Las fotos apuntan a /assets/img/perfumes/ del sitio.
-- =============================================================================
insert into public.perfumes
  (nombre, marca, categoria, familia, concentracion, notas, precio, precio_anterior, descripcion,
   imagenes, tamanios, tipo, duracion_horas, estela, stock, etiqueta, destacado, activo, fecha_creacion)
select
  v.nombre, v.marca,
  (select c.id from public.categorias c where c.nombre = v.cat),
  (select f.id from public.familias f where f.nombre = v.fam),
  v.concentracion, v.notas, v.precio, v.precio_anterior, v.descripcion,
  v.imagenes, v.tamanios, v.tipo, v.duracion_horas, v.estela, v.stock, v.etiqueta, v.destacado, v.activo, v.fecha
from (values
  ('Liquid Brun', 'French Avenue', 'Masculinos', 'Oriental', 'EDP', '{"salida":["Canela","Cardamomo","Azahar","Bergamota"],"corazon":["Vainilla bourbon","Praliné","Elemí"],"fondo":["Almizcle","Guayaco","Ámbar"]}'::jsonb, 38900, null::numeric, 'Cálido, especiado y envolvente. La canela y el praliné sobre un fondo de maderas y ámbar lo vuelven ideal para la noche.', array['/assets/img/perfumes/french-avenue-liquid-brun.jpg']::text[], array['100 ml']::text[], 'Sellado', 9, 4, true, 'Nuevo', true, true, '2026-09-15T15:00:00.000Z'::timestamptz),
  ('Eclaire', 'Lattafa', 'Femeninos', 'Gourmand', 'EDP', '{"salida":["Caramelo","Leche","Azúcar"],"corazon":["Miel","Flores blancas"],"fondo":["Vainilla","Praliné","Almizcle"]}'::jsonb, 42900, null::numeric, 'Un postre en frasco: caramelo, leche y miel sobre vainilla. Dulce y cremoso. También lo tenemos en decant para probarlo.', array['/assets/img/perfumes/lattafa-eclaire.jpg']::text[], array['Decant 10 ml: 9900', '100 ml: 42900']::text[], 'Sellado', 8, 4, true, null, true, true, '2026-09-05T15:00:00.000Z'::timestamptz),
  ('Yara', 'Lattafa', 'Femeninos', 'Gourmand', 'EDP', '{"salida":["Orquídea","Heliotropo","Mandarina"],"corazon":["Acorde gourmand","Frutas tropicales"],"fondo":["Vainilla","Almizcle","Sándalo"]}'::jsonb, 39900, null::numeric, 'Dulce, cremoso y muy femenino. La vainilla y las frutas tropicales lo vuelven adictivo: es el árabe que más nos piden para regalar.', array['/assets/img/perfumes/lattafa-yara.jpg']::text[], array['100 ml']::text[], 'Sellado', 8, 4, true, 'Más vendido', true, true, '2026-08-02T15:00:00.000Z'::timestamptz),
  ('Khamrah', 'Lattafa', 'Unisex', 'Oriental', 'EDP', '{"salida":["Canela","Nuez moscada","Bergamota"],"corazon":["Dátiles","Praliné","Nardos"],"fondo":["Vainilla","Haba tonka","Benjuí"]}'::jsonb, 45900, 52900, 'Especiado, licoroso y cálido. Dátiles, canela y praliné en un perfume que se siente de lujo y dura todo el día.', array['/assets/img/perfumes/lattafa-khamrah.jpg']::text[], array['100 ml']::text[], 'Sellado', 10, 5, true, 'Oferta', false, true, '2026-07-20T15:00:00.000Z'::timestamptz),
  ('Ajwad', 'Lattafa', 'Unisex', 'Floral', 'EDP', '{"salida":["Pistacho","Bergamota"],"corazon":["Rosa","Jazmín"],"fondo":["Vainilla","Almizcle","Sándalo"]}'::jsonb, 34900, null::numeric, 'Frutal y floral con un fondo suave de vainilla. Viene en su caja de colección, ideal para regalar.', array['/assets/img/perfumes/lattafa-ajwad.jpg']::text[], array['60 ml']::text[], 'Sellado', 7, 3, false, 'Importado', false, true, '2026-06-15T15:00:00.000Z'::timestamptz)
) as v(nombre, marca, cat, fam, concentracion, notas, precio, precio_anterior, descripcion,
       imagenes, tamanios, tipo, duracion_horas, estela, stock, etiqueta, destacado, activo, fecha)
where not exists (select 1 from public.perfumes);
