-- Ejecutar una vez en SQL Editor del proyecto nuevo.
-- No importa fichas ni crea usuarios. El acceso queda cerrado hasta autorizar
-- manualmente las dos cuentas en planes_members en un paso posterior.
begin;

create table public.planes_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  slot smallint not null unique check (slot in (1, 2))
);
alter table public.planes_members enable row level security;
revoke all on public.planes_members from anon, authenticated;
grant select on public.planes_members to authenticated;
create policy "Read own membership" on public.planes_members
  for select to authenticated using (user_id = (select auth.uid()));
-- No INSERT/UPDATE/DELETE grant or policy: clients cannot authorize themselves.

create table public.planes_items (
  id text primary key check (length(id) between 1 and 200),
  payload jsonb not null check (
    jsonb_typeof(payload) = 'object'
    and payload ? 'id' and payload->>'id' = id
    and payload ? 'kind'
    and payload->>'kind' in ('plan', 'restaurant', 'buy', 'inbox')
    and payload ? 'title' and length(trim(payload->>'title')) > 0
  ),
  revision bigint not null default 1,
  updated_at timestamptz not null default now()
);
alter table public.planes_items enable row level security;
revoke all on public.planes_items from anon, authenticated;
grant select, insert, update, delete on public.planes_items to authenticated;
create policy "Members read items" on public.planes_items
  for select to authenticated using (
    exists (select 1 from public.planes_members where user_id = (select auth.uid()))
  );
create policy "Members create items" on public.planes_items
  for insert to authenticated with check (
    exists (select 1 from public.planes_members where user_id = (select auth.uid()))
  );
create policy "Members edit items" on public.planes_items
  for update to authenticated using (
    exists (select 1 from public.planes_members where user_id = (select auth.uid()))
  ) with check (
    exists (select 1 from public.planes_members where user_id = (select auth.uid()))
  );
create policy "Members delete items" on public.planes_items
  for delete to authenticated using (
    exists (select 1 from public.planes_members where user_id = (select auth.uid()))
  );

create function public.planes_stamp_item() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := clock_timestamp();
  if TG_OP = 'INSERT' then new.revision := 1;
  else new.revision := old.revision + 1;
  end if;
  return new;
end;
$$;
revoke all on function public.planes_stamp_item() from public, anon, authenticated;
create trigger planes_stamp_item before insert or update on public.planes_items
  for each row execute function public.planes_stamp_item();

insert into storage.buckets (id, name, public, file_size_limit)
values ('planes-documents', 'planes-documents', false, 10485760);
create policy "Members read documents" on storage.objects
  for select to authenticated using (
    bucket_id = 'planes-documents' and
    exists (select 1 from public.planes_members where user_id = (select auth.uid()))
  );
create policy "Members upload documents" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'planes-documents' and
    exists (select 1 from public.planes_members where user_id = (select auth.uid()))
  );
create policy "Members update documents" on storage.objects
  for update to authenticated using (
    bucket_id = 'planes-documents' and
    exists (select 1 from public.planes_members where user_id = (select auth.uid()))
  ) with check (
    bucket_id = 'planes-documents' and
    exists (select 1 from public.planes_members where user_id = (select auth.uid()))
  );
create policy "Members delete documents" on storage.objects
  for delete to authenticated using (
    bucket_id = 'planes-documents' and
    exists (select 1 from public.planes_members where user_id = (select auth.uid()))
  );
commit;
