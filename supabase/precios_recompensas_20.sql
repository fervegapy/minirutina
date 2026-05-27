-- Recompensas has two cantidades (10 or 20 stickers) at different prices.
-- The existing precio_impreso / precio_digital columns become the prices
-- for the cantidad=10 variant. The new _20 columns hold the cantidad=20
-- prices. For Rutinas the _20 columns stay null (not applicable).
--
-- Rationale for leaving precio_anterior_* columns in place: keeping them
-- non-destructively in case we re-introduce the discount UI later. The
-- admin no longer surfaces them in the form.

alter table public.precios
  add column if not exists precio_impreso_20 int,
  add column if not exists precio_digital_20 int;

-- Seed sensible defaults for recompensas so the +20 variant has a value
-- from day one (admin can edit from /admin/cms).
update public.precios
   set precio_impreso_20 = coalesce(precio_impreso_20, 189000),
       precio_digital_20 = coalesce(precio_digital_20, 109000)
 where producto = 'recompensas';
