-- =============================================================================
-- Migração: regras de acesso data-driven para servicos_pacotes
-- =============================================================================
-- Move as regras de acesso (antes fixas no código, em serviceCatalog.ts) para
-- o banco, de modo que qualquer pacote novo criado direto na tabela conceda o
-- acesso correto sem precisar de alteração de código.
--
-- Rode este script no SQL Editor do Supabase ANTES (ou junto) do deploy que usa
-- essas colunas. O backend é tolerante: se as colunas ainda não existirem, ele
-- cai no catálogo legado e nada quebra — mas o acesso só fica correto para os
-- pacotes novos depois que este script rodar.
--
-- concede_testes   = libera o questionário/testes de rastreio após a compra
-- concede_consulta = libera o agendamento de consulta após a compra
-- =============================================================================

alter table servicos_pacotes
  add column if not exists concede_testes boolean not null default false,
  add column if not exists concede_consulta boolean not null default false;

-- Backfill dos pacotes existentes (ajuste conforme a regra de negócio de cada um).
update servicos_pacotes set concede_testes = true,  concede_consulta = true
  where service_id = 'testes-consultas';

update servicos_pacotes set concede_testes = true,  concede_consulta = false
  where service_id = 'apenas-testes';

update servicos_pacotes set concede_testes = false, concede_consulta = true
  where service_id = 'apenas-consulta';

update servicos_pacotes set concede_testes = true,  concede_consulta = true
  where service_id = 'testes-consulta-laudo';

-- Pacote novo que motivou a correção (Testes + Consulta + Laudo + acompanhamento):
update servicos_pacotes set concede_testes = true,  concede_consulta = true
  where service_id = 'acompanhamento-completo';

-- Conferência:
-- select service_id, pacote, ativo, concede_testes, concede_consulta
-- from servicos_pacotes order by posicao;
