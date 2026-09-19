-- Origen de cada pedido: primer y último contacto (UTMs, fbclid, referrer).
-- Lo guarda el checkout desde localStorage y el webhook de dLocal lo adjunta
-- a `pago_completado` en PostHog. Formato en lib/atribucion.ts.
-- El checkout funciona aunque esta columna no exista (reintenta sin ella),
-- pero hasta correr esto los pedidos se guardan sin origen.
alter table public.pedidos
  add column if not exists atribucion jsonb;
