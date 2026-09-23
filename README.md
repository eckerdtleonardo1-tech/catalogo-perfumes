# Catálogo de perfumes con pedidos por WhatsApp

HTML, CSS y JavaScript puro. Sin frameworks ni build. Supabase para datos, login y fotos.
Si todavía no hay Supabase, **todo funciona en modo demo** (tienda y panel).

```
index.html              Tienda
admin/index.html        Panel (/admin)
assets/js/config.js     ← lo único que hay que editar
assets/js/seed.js       Perfumes de ejemplo (demo)
assets/js/backend.js    Supabase o demo, misma interfaz
assets/js/tienda.js     Catálogo, modal, carrito, pedido
assets/js/admin.js      Panel
assets/img/og-image.jpg Imagen para compartir (1200x630)
supabase/schema.sql     Tablas, permisos, RLS, Storage y datos de ejemplo
vercel.json             Cache de /assets en 0 mientras iterás
```

## 1. Probar en modo demo (sin configurar nada)

Subí la carpeta a Vercel (o abrila con cualquier servidor estático) y entrá a:

- `/` la tienda con los perfumes de ejemplo.
- `/admin` el panel. La contraseña de demo aparece en la pantalla de login (`demo1234`, se cambia en `config.js`).
  Lo que cargues se guarda en ese navegador. El botón **Reiniciar demo** vuelve a los 6 de ejemplo.

Para una demo de venta, poné `mostrarCartelDemo: false` en `config.js` y desaparece el cartel
"Estás viendo productos de ejemplo".

## 2. Personalizar

En `assets/js/config.js`: nombre, WhatsApp, redes, zona de envío, horarios y dirección de retiro.

- **WhatsApp:** formato internacional, sólo números, sin `+` ni espacios. Argentina: `549` + área sin 0 + número sin 15.
  Ej: (011) 15 2345-6789 → `5491123456789`.
- **Nombre en metaetiquetas:** WhatsApp e Instagram leen el HTML sin ejecutar JavaScript. Cambiá también
  el nombre en el `<head>` de `index.html` y en `assets/img/og-image.jpg`.
- **Dominio:** reemplazá `https://tu-tienda.vercel.app` en `index.html` (og:url, og:image, twitter:image) por tu
  dominio real. og:image **tiene que ser una URL absoluta** o WhatsApp no muestra la imagen.

## 3. Conectar Supabase

1. Creá un proyecto en supabase.com.
2. **SQL Editor → New query**: pegá todo `supabase/schema.sql` y **Run**. Se puede volver a correr: no duplica nada.
3. **Authentication → Users → Add user → Create new user**: tu email y contraseña, tildando *Auto Confirm User*.
4. **⚠ Cerrá el registro público:** Authentication → Sign In / Providers → desactivá **Allow new users to sign up**.
   Supabase lo trae abierto de fábrica y, abierto, cualquiera podría crearse una cuenta y editar tu catálogo.
   El panel te muestra un cartel rojo mientras siga abierto.
5. **Project Settings → API**: copiá *Project URL* y la clave *anon public* en `config.js`
   (`supabaseUrl`, `supabaseAnonKey`). La clave anon es pública por diseño; **nunca** pongas la `service_role`.

Con credenciales cargadas, el modo demo se apaga solo.

## 4. Antes de lanzar

- En `vercel.json`, cuando termines de iterar, podés subir el cache de `/assets` (por ejemplo `max-age=3600`).
  Mientras está en 0, cada cambio se ve al instante en el celular.
- Probá el link en WhatsApp. Si cambiaste la imagen, podés forzar que WhatsApp la vuelva a leer agregando
  `?v=2` al link que compartís.

## Cómo funciona

- **Tamaños con precio propio:** en el panel, escribí `50 ml: 29900, 100 ml: 39900`. Sin `:` vale el precio general.
  Si hay un solo tamaño, la tienda no muestra el selector.
- **Carrito:** queda guardado en el navegador del cliente. Si un perfume se queda sin stock o se oculta, la próxima
  vez que entra se saca solo y se le avisa.
- **Fotos:** se achican en el celular antes de subir (1600 px, WebP). Al borrar un perfume o quitar fotos al editar,
  también se borran del Storage.
- **Demo y deploys:** los datos de la demo llevan una firma de `seed.js`. Si cambiás los perfumes de ejemplo,
  los navegadores que ya tenían la demo guardada cargan la versión nueva.
- **Sin movimiento:** si el sistema tiene "reducir movimiento" activado, se desactivan animaciones y scroll suave.
