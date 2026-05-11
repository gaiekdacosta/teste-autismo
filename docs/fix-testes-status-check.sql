alter table public.testes
  drop constraint if exists testes_status_check;

alter table public.testes
  add constraint testes_status_check
  check (status in ('em_andamento', 'concluido'));
