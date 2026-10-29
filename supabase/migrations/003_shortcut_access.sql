-- Permiso revocable de solo alta para Atajos. No cambia las políticas existentes.
begin;
create table if not exists public.planes_shortcut_tokens (
 user_id uuid primary key references public.planes_members(user_id) on delete cascade,
 token_hash text not null unique,
 expires_at timestamptz not null,
 window_start timestamptz not null default now(),
 used integer not null default 0
);
alter table public.planes_shortcut_tokens enable row level security;
revoke all on public.planes_shortcut_tokens from public, anon, authenticated;

create or replace function public.planes_shortcut_create() returns text
language plpgsql security definer set search_path='' as $$
declare t text; u uuid := auth.uid();
begin
 if not exists(select 1 from public.planes_members where user_id=u) then
  raise exception 'Acceso no autorizado' using errcode='42501'; end if;
 t := replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-','');
 insert into public.planes_shortcut_tokens(user_id,token_hash,expires_at)
 values(u,encode(sha256(convert_to(t,'UTF8')),'hex'),now()+interval '1 year')
 on conflict(user_id) do update set token_hash=excluded.token_hash,expires_at=excluded.expires_at,window_start=now(),used=0;
 return t;
end; $$;

create or replace function public.planes_shortcut_revoke() returns void
language plpgsql security definer set search_path='' as $$
begin delete from public.planes_shortcut_tokens where user_id=auth.uid(); end; $$;

create or replace function public.planes_shortcut_check(p_token text) returns boolean
language sql stable security definer set search_path='' as $$
 select length(p_token)=64 and exists(
  select 1 from public.planes_shortcut_tokens t join public.planes_members m using(user_id)
  where t.token_hash=encode(sha256(convert_to(p_token,'UTF8')),'hex') and t.expires_at>now()
 );
$$;

create or replace function public.planes_shortcut_save(p_token text,p_url text,p_payload jsonb) returns text
language plpgsql security definer set search_path='' as $$
declare t public.planes_shortcut_tokens%rowtype; item jsonb; item_id text; stamp text;
begin
 if length(p_token)<>64 then raise exception 'Permiso no válido' using errcode='42501'; end if;
 select * into t from public.planes_shortcut_tokens where
 token_hash=encode(sha256(convert_to(p_token,'UTF8')),'hex') and expires_at>now() for update;
 if not found or not exists(select 1 from public.planes_members where user_id=t.user_id) then
  raise exception 'Permiso no válido' using errcode='42501'; end if;
 if p_url is null or length(p_url)>8000 or p_url !~ '^https?://[^[:space:]]+$'
  or p_url ~ '^https?://[^/]*@' or p_payload is null or jsonb_typeof(p_payload)<>'object'
  or octet_length(p_payload::text)>64000 then raise exception 'Enlace no válido'; end if;
 if t.window_start<now()-interval '1 minute' then t.used:=0; t.window_start:=now(); end if;
 if t.used>=8 then raise exception 'Espera un minuto antes de compartir más enlaces'; end if;
 update public.planes_shortcut_tokens set used=t.used+1,window_start=t.window_start where user_id=t.user_id;
 -- Serialize shortcut inserts from both members. Never overwrite an existing card.
 perform pg_advisory_xact_lock(481274103);
 if exists(select 1 from public.planes_items where deleted_at is null and payload->>'url'=p_url) then return 'duplicate'; end if;
 select coalesce(jsonb_object_agg(key,value),'{}'::jsonb) into item from jsonb_each(p_payload)
 where key=any(array['title','kind','city','summary','image','date','endDate','time','address','venue',
 'price','cuisine','category','room','lead','dimensions','shop','phone','website','googleRating',
 'googleReviews','mapsUrl','activityType','workTitle','occurrences','analysisVersion','analysisUrl',
 'summarySource','aiStatus','verification','source','originalTitle','summaryEvidenceUrl']);
 if coalesce(item->>'kind','') not in ('plan','restaurant','buy','inbox')
 or length(trim(coalesce(item->>'title','')))=0 then raise exception 'Ficha no válida'; end if;
 item_id:='shared-'||gen_random_uuid()::text;
 stamp:=to_char(clock_timestamp() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
 item:=item||jsonb_build_object('id',item_id,'url',p_url,'created',stamp,'updated',stamp,
 'attachments','[]'::jsonb,'manualFields','[]'::jsonb,'status','Pendiente','hidden',false);
 insert into public.planes_items(id,payload) values(item_id,item);
 return 'saved';
end; $$;

revoke all on function public.planes_shortcut_create() from public,anon,authenticated;
revoke all on function public.planes_shortcut_revoke() from public,anon,authenticated;
revoke all on function public.planes_shortcut_check(text) from public,anon,authenticated;
revoke all on function public.planes_shortcut_save(text,text,jsonb) from public,anon,authenticated;
grant execute on function public.planes_shortcut_create() to authenticated;
grant execute on function public.planes_shortcut_revoke() to authenticated;
grant execute on function public.planes_shortcut_check(text) to anon,authenticated;
grant execute on function public.planes_shortcut_save(text,text,jsonb) to anon,authenticated;
commit;
