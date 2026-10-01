-- Kanban de contenido (redes sociales). Se administra en /admin/kanban.
-- Correr manualmente en el SQL editor de Supabase. Idempotente: sirve tanto
-- para crear la tabla como para migrar versiones anteriores.

create table if not exists public.contenido_kanban (
  id          uuid primary key default gen_random_uuid(),
  titulo      text not null,
  estado      text not null default 'ideas',
  formato     text,
  fecha       date,
  caption     text not null default '',
  inspo       text not null default '',
  contenido   text not null default '',
  orden       bigint not null default 0,
  created_at  timestamptz not null default now()
);

-- Migración desde versiones anteriores.
alter table public.contenido_kanban drop constraint if exists contenido_kanban_estado_check;
alter table public.contenido_kanban drop constraint if exists contenido_kanban_formato_check;
alter table public.contenido_kanban drop constraint if exists contenido_kanban_canal_check;
alter table public.contenido_kanban drop column if exists canal;
alter table public.contenido_kanban alter column estado set default 'ideas';
alter table public.contenido_kanban alter column formato drop not null;
alter table public.contenido_kanban alter column formato drop default;
alter table public.contenido_kanban alter column orden type bigint;
alter table public.contenido_kanban add column if not exists caption   text not null default '';
alter table public.contenido_kanban add column if not exists inspo     text not null default '';
alter table public.contenido_kanban add column if not exists contenido text not null default '';

do $$
begin
  -- v2: guion -> contenido; primer link -> inspo. Las columnas viejas (guion,
  -- links, notas) quedan sin usar para no perder datos.
  if exists (select 1 from information_schema.columns
             where table_name = 'contenido_kanban' and column_name = 'guion') then
    execute $q$update public.contenido_kanban set contenido = guion where contenido = '' and guion <> ''$q$;
  end if;
  if exists (select 1 from information_schema.columns
             where table_name = 'contenido_kanban' and column_name = 'links') then
    execute $q$update public.contenido_kanban set inspo = coalesce(links->0->>'url', '') where inspo = ''$q$;
  end if;
end $$;

update public.contenido_kanban set estado = 'ideas'      where estado = 'idea';
update public.contenido_kanban set estado = 'produccion' where estado = 'grabacion';
update public.contenido_kanban set estado = 'listo'      where estado = 'programado';
alter table public.contenido_kanban
  add constraint contenido_kanban_estado_check
  check (estado in ('ideas','guion','produccion','edicion','listo','publicado'));

create index if not exists contenido_kanban_estado_idx
  on public.contenido_kanban (estado, orden);

alter table public.contenido_kanban enable row level security;

drop policy if exists "contenido_kanban auth all" on public.contenido_kanban;
create policy "contenido_kanban auth all"
  on public.contenido_kanban for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
