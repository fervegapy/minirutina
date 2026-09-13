-- Región internacional: precios en USD (fijados a mano, sin conversión),
-- FAQs por región y trazabilidad de moneda en el pedido.
-- Correr manualmente en el SQL editor de Supabase. Todo es aditivo — no
-- rompe filas ni código existente.

-- Precios digitales en USD, fijados por el admin (NO se calculan a partir
-- del precio en Gs.). NULL = todavía no configurado → el producto no se
-- ofrece en el exterior hasta que se cargue un precio.
alter table public.precios
  add column if not exists precio_digital_usd    numeric,
  add column if not exists precio_digital_20_usd  numeric;

-- FAQs visibles según región. 'ambas' = default, no rompe las FAQs ya
-- cargadas.
alter table public.faqs
  add column if not exists region text not null default 'ambas';

alter table public.faqs drop constraint if exists faqs_region_check;
alter table public.faqs
  add constraint faqs_region_check check (region in ('py', 'intl', 'ambas'));

-- Región y moneda del pedido — se fija al crear el pedido (antes de pagar),
-- así el admin distingue un pedido de Gs. de uno de USD aunque el pago
-- todavía esté pendiente.
alter table public.pedidos
  add column if not exists region        text not null default 'py',
  add column if not exists moneda_pedido text not null default 'PYG';

alter table public.pedidos drop constraint if exists pedidos_region_check;
alter table public.pedidos
  add constraint pedidos_region_check check (region in ('py', 'intl'));

-- Precio en USD por ítem del carrito (paralelo a precio_pyg, que para los
-- pedidos del exterior queda en 0).
alter table public.pedido_items
  add column if not exists precio_usd numeric;
