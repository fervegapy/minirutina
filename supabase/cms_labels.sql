-- Extiende productos_config con etiquetas editables.
-- Nullable: si están en null, /productos/[slug] usa el fallback de lib/productos.ts.

alter table public.productos_config
  add column if not exists nombre  text,
  add column if not exists tagline text;
