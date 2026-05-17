-- Add "list / before-discount" price columns to the precios table.
-- These are optional — when set, the landing + product detail show the
-- striken-through value next to the current precio_impreso / precio_digital
-- to communicate a discount. Null hides the strike-through.

alter table public.precios
  add column if not exists precio_anterior_impreso int,
  add column if not exists precio_anterior_digital int;

-- Seed defaults so the discount UI shows without admin needing to load
-- anything manually. Adjust later via /admin/cms.
update public.precios
   set precio_anterior_impreso = coalesce(precio_anterior_impreso, 199000),
       precio_anterior_digital = coalesce(precio_anterior_digital, 119000)
 where producto in ('rutinas', 'recompensas');

-- If a producto row doesn't exist yet, seed it.
insert into public.precios (producto, precio_impreso, precio_digital, precio_anterior_impreso, precio_anterior_digital)
values
  ('rutinas',     149000, 89000, 199000, 119000),
  ('recompensas', 149000, 89000, 199000, 119000)
on conflict (producto) do nothing;
