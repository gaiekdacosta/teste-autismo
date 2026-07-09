-- =============================================================================
-- Verificação de chaves estrangeiras usadas pela exclusão de usuários/testes
-- =============================================================================
-- Rode no SQL Editor do Supabase. Confirma se as premissas do backend
-- (services/repositories) sobre ON DELETE das FKs estão corretas.
--
-- Premissas do código de exclusão:
--   1. respostas.id_teste       -> testes.id       = CASCADE
--        (adminDelete de um teste apaga o teste direto; as respostas precisam
--         cair por cascade, senão a exclusão falha por violação de FK)
--   2. compras_servicos.id_user -> auth.users.id   = CASCADE
--        (ao excluir a conta no Auth, as compras devem ser removidas junto)
--   3. agendamentos.id_teste    -> testes.id       = SET NULL (recomendado)
--        (excluir um teste não deve ser bloqueado por um agendamento)
--
-- Observação: testes.id_user, avaliados.id_user e agendamentos.id_user NÃO
-- precisam de CASCADE — o backend apaga essas linhas explicitamente, na ordem
-- correta, ANTES de excluir a conta no Auth.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- [1] Checagem objetiva das premissas (olhe a coluna "status")
-- -----------------------------------------------------------------------------
with fks as (
  select
    con.conname                                as constraint_name,
    child_ns.nspname                           as child_schema,
    child.relname                              as child_table,
    (
      select att.attname
      from unnest(con.conkey) as k(attnum)
      join pg_attribute att
        on att.attrelid = con.conrelid and att.attnum = k.attnum
      limit 1
    )                                          as child_col,
    parent.relname                             as parent_table,
    con.confdeltype                            as del_code
  from pg_constraint con
  join pg_class child      on child.oid = con.conrelid
  join pg_namespace child_ns on child_ns.oid = child.relnamespace
  join pg_class parent     on parent.oid = con.confrelid
  where con.contype = 'f'
)
select
  esperado.descricao                                   as verificacao,
  f.child_table || '.' || f.child_col
    || ' -> ' || f.parent_table                        as fk,
  case f.del_code
    when 'a' then 'NO ACTION'
    when 'r' then 'RESTRICT'
    when 'c' then 'CASCADE'
    when 'n' then 'SET NULL'
    when 'd' then 'SET DEFAULT'
  end                                                  as on_delete_atual,
  case esperado.code
    when 'c' then 'CASCADE'
    when 'n' then 'SET NULL'
  end                                                  as esperado,
  case
    when f.del_code = esperado.code then 'OK'
    else 'VERIFICAR'
  end                                                  as status
from (values
  ('respostas',        'id_teste', 'testes', 'c', '1. respostas caem ao excluir teste'),
  ('compras_servicos', 'id_user',  'users',  'c', '2. compras caem ao excluir usuário'),
  ('agendamentos',     'id_teste', 'testes', 'n', '3. agendamento não bloqueia excluir teste')
) as esperado(child_table, child_col, parent_table, code, descricao)
left join fks f
  on f.child_table  = esperado.child_table
 and f.child_col    = esperado.child_col
 and f.parent_table = esperado.parent_table
order by esperado.descricao;
-- Se aparecer "VERIFICAR" (ou on_delete_atual em branco = FK não existe),
-- veja as recomendações no rodapé deste arquivo.


-- -----------------------------------------------------------------------------
-- [2] Panorama: todas as FKs das tabelas envolvidas na exclusão
-- -----------------------------------------------------------------------------
select
  con.conname                                          as constraint_name,
  child_ns.nspname || '.' || child.relname             as tabela_filha,
  (
    select string_agg(att.attname, ', ' order by u.ord)
    from unnest(con.conkey) with ordinality as u(attnum, ord)
    join pg_attribute att
      on att.attrelid = con.conrelid and att.attnum = u.attnum
  )                                                    as colunas_filha,
  parent_ns.nspname || '.' || parent.relname           as tabela_pai,
  case con.confdeltype
    when 'a' then 'NO ACTION'
    when 'r' then 'RESTRICT'
    when 'c' then 'CASCADE'
    when 'n' then 'SET NULL'
    when 'd' then 'SET DEFAULT'
  end                                                  as on_delete
from pg_constraint con
join pg_class child        on child.oid = con.conrelid
join pg_namespace child_ns on child_ns.oid = child.relnamespace
join pg_class parent       on parent.oid = con.confrelid
join pg_namespace parent_ns on parent_ns.oid = parent.relnamespace
where con.contype = 'f'
  and (
    (parent_ns.nspname, parent.relname) in (
      ('public', 'testes'), ('public', 'avaliados'),
      ('public', 'compras_servicos'), ('auth', 'users')
    )
    or (child_ns.nspname, child.relname) in (
      ('public', 'respostas'), ('public', 'agendamentos'),
      ('public', 'testes'), ('public', 'avaliados'),
      ('public', 'compras_servicos')
    )
  )
order by tabela_pai, tabela_filha, constraint_name;


-- -----------------------------------------------------------------------------
-- [3] agendamentos.id_teste deve ser anulável (is_nullable = YES)
--     para que SET NULL funcione ao excluir um teste.
-- -----------------------------------------------------------------------------
select table_name, column_name, is_nullable, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'agendamentos'
  and column_name in ('id_teste', 'id_user')
order by column_name;


-- =============================================================================
-- RECOMENDAÇÕES (rode apenas o que o passo [1] apontar como "VERIFICAR")
-- =============================================================================
-- Descubra o nome exato da constraint no resultado do passo [2] e recrie-a.
--
-- 1) respostas.id_teste sem CASCADE:
--    alter table public.respostas
--      drop constraint <nome_da_constraint>,
--      add constraint <nome_da_constraint>
--        foreign key (id_teste) references public.testes(id) on delete cascade;
--
-- 2) compras_servicos.id_user sem CASCADE:
--    alter table public.compras_servicos
--      drop constraint <nome_da_constraint>,
--      add constraint <nome_da_constraint>
--        foreign key (id_user) references auth.users(id) on delete cascade;
--
-- 3) agendamentos.id_teste sem SET NULL:
--    alter table public.agendamentos
--      drop constraint <nome_da_constraint>,
--      add constraint <nome_da_constraint>
--        foreign key (id_teste) references public.testes(id) on delete set null;
-- =============================================================================
