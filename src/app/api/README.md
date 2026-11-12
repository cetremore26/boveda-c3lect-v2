# `src/app/api/` — acceso a la API de c3lect-api

Un archivo por bounded context del backend (`orders.ts` ↔ `modules/orders`,
`ventas.ts` ↔ `modules/ventas`…). Cada uno define **una sola vez** los tipos de
lo que ese contexto devuelve y las funciones para llamarlo.

Reglas (las verifica `scripts/check-architecture.mjs`, que corre en `pnpm typecheck`):

- `client.ts` (axios + renovación del token) solo se importa desde esta carpeta.
  Páginas, componentes y contextos llaman a las funciones de los módulos, nunca
  a axios directamente.
- Los tipos de respuesta se importan de aquí; no se redeclaran en las páginas.
- Aquí no hay reglas del negocio ni presentación (etiquetas, colores): solo el
  contrato HTTP.

Archivos con convenciones propias:

- `common.ts` contiene `params` (arma los query params sin los vacíos) y
  `mensajeDeError(err, fallback)`, la única forma de leer el mensaje de un
  error de la API en páginas y hooks: no se usa `catch (err: any)`.
- `auth.ts` maneja el registro con código y el 2FA del admin: `verificarOtp`
  devuelve `registrationToken` cuando el email no tiene cuenta, `registrar` lo
  envía, y `login` puede devolver `requiresSecondFactor` con un
  `challengeToken` que `loginSegundoFactor` canjea por la sesión.

El catálogo y las reseñas publicadas no pasan por aquí: se leen de las vistas
`catalogo_publico` y `resenas_publicas` de Supabase (ver `data/`). Escribir o
moderar una reseña sí pasa por la API (`resenas.ts`).
