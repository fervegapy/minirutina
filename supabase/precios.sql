create table if not exists precios (
  producto text primary key,
  precio_impreso integer not null default 149000,
  precio_digital integer not null default 89000,
  updated_at timestamptz default now()
);

insert into precios (producto, precio_impreso, precio_digital) values
  ('rutinas',     149000, 89000),
  ('semana',      149000, 89000),
  ('recompensas', 129000, 79000)
on conflict (producto) do update set
  precio_impreso = excluded.precio_impreso,
  precio_digital = excluded.precio_digital,
  updated_at     = now();
