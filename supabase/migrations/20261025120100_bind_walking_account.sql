-- Bind durable outbox events to their original account across session switches.
alter function public.credit_walk(uuid,integer,integer) set schema private;
revoke all on function private.credit_walk(uuid,integer,integer) from public,anon,authenticated;
create function public.credit_walk(expected_user uuid,event_id uuid,distance_mm integer,duration_ms integer) returns jsonb language plpgsql security definer set search_path='' as $$ begin
 if auth.uid() is null or auth.uid() is distinct from expected_user then raise exception 'Walking account changed';end if;
 return private.credit_walk(event_id,distance_mm,duration_ms);
end $$;
revoke all on function public.credit_walk(uuid,uuid,integer,integer) from public,anon;
grant execute on function public.credit_walk(uuid,uuid,integer,integer) to authenticated;
