create table if not exists public.compras_servicos (
  id uuid primary key,
  id_user uuid not null references auth.users(id) on delete cascade,
  customer_name text,
  customer_email text,
  service_id text not null,
  service_name text not null,
  service_price_cents integer not null,
  status text not null default 'pending' check (status in ('pending', 'paid')),
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

alter table public.compras_servicos enable row level security;

drop policy if exists "Usuarios leem suas compras" on public.compras_servicos;
create policy "Usuarios leem suas compras"
  on public.compras_servicos
  for select
  using (auth.uid() = id_user);

alter table public.servicos_pacotes
add column if not exists service_id text unique;

update public.servicos_pacotes
set service_id = case
  when lower(pacote) like '%testes%consultas%' then 'testes-consultas'
  when lower(pacote) like '%apenas%testes%' then 'apenas-testes'
  when lower(pacote) like '%apenas%consulta%' then 'apenas-consulta'
  else service_id
end
where service_id is null;

insert into public.servicos_pacotes (service_id, pacote, descricao, valor, posicao)
values
  (
    'testes-consultas',
    'Testes + Consultas',
    'Pacote completo com acesso aos testes de rastreio, resultado preliminar em PDF e consulta de orientação para interpretar os sinais observados e definir os próximos passos.',
    450.00,
    1
  ),
  (
    'apenas-testes',
    'Apenas Testes',
    'Libera o questionário de rastreio, cálculo da pontuação, classificação preliminar e geração do PDF com o resultado. Ideal para quem deseja iniciar pela triagem.',
    49.00,
    2
  ),
  (
    'apenas-consulta',
    'Apenas Consulta',
    'Consulta individual para análise dos sinais, orientação clínica e definição dos próximos encaminhamentos. Indicado para quem já possui resultados ou deseja conversar com um profissional.',
    400.00,
    3
  )
on conflict (service_id) do nothing;
