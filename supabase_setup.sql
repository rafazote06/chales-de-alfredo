-- Chalés de Alfredo — configuração inicial do Supabase
-- Rode isso uma vez em: Supabase Dashboard > SQL Editor > New query > Run

-- 1) Tabela de pedidos de reserva (todo pedido enviado pelo WhatsApp
--    também fica salvo aqui, como histórico/backup). JÁ RODADA.
create table public.pedidos_reserva (
  id bigint generated always as identity primary key,
  criado_em timestamptz not null default now(),
  chale_id text not null,
  chale_nome text not null,
  checkin date not null,
  checkout date not null,
  noites integer not null,
  hospedes integer not null,
  valor_total numeric not null,
  disponivel_no_site boolean not null default true
);

alter table public.pedidos_reserva enable row level security;

create policy "site pode criar pedidos"
  on public.pedidos_reserva
  for insert
  to anon
  with check (true);

-- 2) Permite listar os arquivos do bucket "chales" (fotos dos chalés).
--    O bucket público já deixa qualquer um BAIXAR uma foto pelo link
--    direto, mas listar todos os arquivos de uma pasta é uma permissão
--    separada. Sem risco: é só o bucket de fotos de divulgação, nada
--    privado. Isso deixa eu buscar tudo que você já subiu de uma vez.
create policy "listar fotos do bucket chales"
  on storage.objects
  for select
  to anon
  using (bucket_id = 'chales');
