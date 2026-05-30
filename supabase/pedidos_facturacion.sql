-- Datos de facturación (opcionales) por pedido.
alter table public.pedidos
  add column if not exists ruc          text,
  add column if not exists razon_social text;
