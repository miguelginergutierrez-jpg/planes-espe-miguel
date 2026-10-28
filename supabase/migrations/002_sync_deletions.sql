-- Actualización posterior a 001. No borra fichas ni cambia miembros o RLS.
-- Los borrados conservan una marca para no resucitar desde móviles sin conexión.
begin;
alter table public.planes_items add column if not exists deleted_at timestamptz;
comment on column public.planes_items.deleted_at is
  'Marca de borrado sincronizado; conservar la fila para dispositivos desconectados.';
commit;
