-- Ejecutar solo tras crear la cuenta propia en Authentication > Users.
-- Sustituir el marcador en el editor de Supabase, nunca guardar el correo real en Git.
do $$
declare target_user uuid; target_email text := 'ESCRIBE_AQUI_EL_CORREO_DE_ESPE';
begin
 if target_email='ESCRIBE_AQUI_EL_CORREO_DE_ESPE' then raise exception 'Sustituye el marcador por el correo de Espe.'; end if;
 if (select count(*) from auth.users where lower(email)=lower(trim(target_email)))<>1 then raise exception 'No hay una única cuenta con ese correo. Revisa Authentication > Users.'; end if;
 select id into target_user from auth.users where lower(email)=lower(trim(target_email));
 if exists(select 1 from public.planes_members where user_id=target_user and slot=1) then raise exception 'Ese correo corresponde a la primera cuenta. Usa el de Espe.'; end if;
 if exists(select 1 from public.planes_members where slot=2 and user_id<>target_user) then raise exception 'El segundo acceso ya está ocupado. No se ha cambiado nada.'; end if;
 insert into public.planes_members(user_id,slot) values(target_user,2) on conflict(user_id) do nothing;
end;
$$;
select 'Segundo acceso preparado' as resultado;
