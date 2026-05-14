create table if not exists public.compras_servicos (
  id uuid primary key,
  id_user uuid not null references auth.users(id) on delete cascade,
  customer_name text,
  customer_email text,
  service_id text not null,
  service_name text not null,
  service_price_cents integer not null check (service_price_cents >= 0),
  status text not null check (status in ('pending', 'paid')),
  checkout_url text,
  order_nsu text not null unique,
  invoice_slug text,
  transaction_nsu text,
  capture_method text,
  receipt_url text,
  notified_admin_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists compras_servicos_id_user_idx
  on public.compras_servicos(id_user);

create index if not exists compras_servicos_status_idx
  on public.compras_servicos(status);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists compras_servicos_set_updated_at on public.compras_servicos;

create trigger compras_servicos_set_updated_at
before update on public.compras_servicos
for each row
execute function public.set_updated_at();

alter table public.compras_servicos enable row level security;

drop policy if exists "Usuarios visualizam suas compras" on public.compras_servicos;

create policy "Usuarios visualizam suas compras"
on public.compras_servicos
for select
using (auth.uid() = id_user);
