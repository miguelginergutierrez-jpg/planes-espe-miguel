-- Only new private list storage. Existing cards, members and access rules stay intact.
begin;
create table public.planes_lists (
 id text primary key check (length(id) between 1 and 200),
 payload jsonb not null,
 revision bigint not null default 1,
 updated_at timestamptz not null default now(),
 deleted_at timestamptz,
 check (jsonb_typeof(payload) = 'object' and payload->>'id' = id and payload ?& array['id','title','points'])
);
alter table public.planes_lists enable row level security;
revoke all on public.planes_lists from public, anon, authenticated;
grant select on public.planes_lists to authenticated;
create policy "Members read private lists" on public.planes_lists for select to authenticated
 using (exists (select 1 from public.planes_members where user_id = (select auth.uid())));
create trigger planes_stamp_list before insert or update on public.planes_lists
 for each row execute function public.planes_stamp_item();

-- Lock identifiers are not exposed through SELECT or direct browser writes.
create table public.planes_list_locks (
 list_id text primary key check (length(list_id) between 1 and 200),
 editor uuid, user_id uuid, until_at timestamptz,
 request_editor uuid, request_at timestamptz
);
alter table public.planes_list_locks enable row level security;
revoke all on public.planes_list_locks from public, anon, authenticated;

create function public.planes_lists_access(p_id text, p_editor uuid, p_action text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare l public.planes_list_locks%rowtype; owner_id uuid := auth.uid();
begin
 if owner_id is null or not exists(select 1 from public.planes_members where user_id = owner_id) then raise exception 'Acceso privado requerido.' using errcode='42501'; end if;
 if p_id is null or p_action is null or p_editor is null or length(p_id) not between 1 and 200 or p_action not in ('acquire','renew','release','status') then raise exception 'Solicitud de acceso no válida.'; end if;
 if p_action='acquire' then insert into public.planes_list_locks(list_id) values(p_id) on conflict do nothing; end if;
 select * into l from public.planes_list_locks where list_id=p_id for update;
 if p_action='status' then return jsonb_build_object('available',l.until_at is null or l.until_at<=clock_timestamp()); end if;
 if p_action='release' then
  if l.editor=p_editor and l.user_id=owner_id then update public.planes_list_locks set editor=null,user_id=null,until_at=null,request_editor=null,request_at=null where list_id=p_id; end if;
  return jsonb_build_object('released',true);
 end if;
 if p_action='renew' then
  if l.editor=p_editor and l.user_id=owner_id and l.until_at>clock_timestamp() then
   update public.planes_list_locks set until_at=clock_timestamp()+interval '45 seconds' where list_id=p_id;
   return jsonb_build_object('acquired',true,'requested',l.request_editor is not null);
  end if;
  return jsonb_build_object('acquired',false);
 end if;
 if l.until_at is null or l.until_at<=clock_timestamp() or (l.editor=p_editor and l.user_id=owner_id) then
  update public.planes_list_locks set editor=p_editor,user_id=owner_id,until_at=clock_timestamp()+interval '45 seconds',
   request_editor=case when l.editor=p_editor then l.request_editor else null end,
   request_at=case when l.editor=p_editor then l.request_at else null end where list_id=p_id;
  return jsonb_build_object('acquired',true,'requested',l.editor=p_editor and l.request_editor is not null);
 end if;
 update public.planes_list_locks set request_editor=p_editor,request_at=clock_timestamp() where list_id=p_id;
 return jsonb_build_object('acquired',false);
end;
$$;

create function public.planes_lists_save(p_id text, p_editor uuid, p_revision bigint, p_payload jsonb, p_deleted boolean default false)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare l public.planes_list_locks%rowtype; old_row public.planes_lists%rowtype; saved public.planes_lists%rowtype; clean jsonb; owner_id uuid := auth.uid();
begin
 if owner_id is null or not exists(select 1 from public.planes_members where user_id=owner_id) then raise exception 'Acceso privado requerido.' using errcode='42501'; end if;
 select * into l from public.planes_list_locks where list_id=p_id for update;
 if l.editor is distinct from p_editor or l.user_id is distinct from owner_id or l.until_at is null or l.until_at<=clock_timestamp() then raise exception 'Lista en uso o acceso caducado. Tu borrador se conserva.' using errcode='42501'; end if;
 select * into old_row from public.planes_lists where id=p_id for update;
 if p_revision is null or p_revision<0 or coalesce(old_row.revision,0)<>p_revision then raise exception 'La lista ha cambiado. Conserva tu borrador como otra lista.' using errcode='40001'; end if;
 if p_deleted then clean=jsonb_build_object('id',p_id,'title','Lista eliminada','points','[]'::jsonb);
 else
  if p_payload->>'id' is distinct from p_id or jsonb_typeof(p_payload->'title') is distinct from 'string' or length(trim(p_payload->>'title')) not between 1 and 160 or jsonb_typeof(p_payload->'points') is distinct from 'array' or pg_column_size(p_payload)>1200000 then raise exception 'Lista no válida.'; end if;
  if jsonb_array_length(p_payload->'points')>500 then raise exception 'Una lista admite hasta 500 puntos.'; end if;
  if exists(select 1 from jsonb_array_elements(p_payload->'points') p where jsonb_typeof(p->'id') is distinct from 'string' or length(p->>'id') not between 1 and 200 or jsonb_typeof(p->'text') is distinct from 'string' or length(trim(p->>'text')) not between 1 and 2000 or jsonb_typeof(p->'checked') is distinct from 'boolean') then raise exception 'Punto no válido.'; end if;
  if (select count(*) from jsonb_array_elements(p_payload->'points'))<>(select count(distinct p->>'id') from jsonb_array_elements(p_payload->'points') p) then raise exception 'Puntos duplicados.'; end if;
  select jsonb_build_object('id',p_id,'title',trim(p_payload->>'title'),'points',coalesce(jsonb_agg(jsonb_build_object('id',p->>'id','text',trim(p->>'text'),'checked',p->'checked') order by ordinal),'[]'::jsonb)) into clean from jsonb_array_elements(p_payload->'points') with ordinality as items(p,ordinal);
 end if;
 if old_row.id is null then insert into public.planes_lists(id,payload,deleted_at) values(p_id,clean,case when p_deleted then clock_timestamp() else null end) returning * into saved;
 else update public.planes_lists set payload=clean,deleted_at=case when p_deleted then clock_timestamp() else null end where id=p_id returning * into saved; end if;
 return jsonb_build_object('id',saved.id,'payload',saved.payload,'revision',saved.revision,'deleted_at',saved.deleted_at);
end;
$$;
revoke all on function public.planes_lists_access(text,uuid,text) from public,anon,authenticated;
revoke all on function public.planes_lists_save(text,uuid,bigint,jsonb,boolean) from public,anon,authenticated;
grant execute on function public.planes_lists_access(text,uuid,text) to authenticated;
grant execute on function public.planes_lists_save(text,uuid,bigint,jsonb,boolean) to authenticated;
commit;
