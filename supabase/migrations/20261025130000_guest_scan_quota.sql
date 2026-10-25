-- Anonymous analysis has a shared durable quota, accessible only with server HMAC.
create table private.guest_scan_quota(day date not null,bucket text not null, attempts integer not null,primary key(day,bucket));
revoke all on private.guest_scan_quota from public,anon,authenticated;
create table private.guest_scan_photos(day date not null,bucket text not null,image_hash text not null,id uuid not null default gen_random_uuid(),primary key(day,bucket,image_hash));
revoke all on private.guest_scan_photos from public,anon,authenticated;
create function public.reserve_guest_scan(payload text,signature text) returns uuid language plpgsql security definer set search_path='' as $$
declare scan_id uuid; secret text; d jsonb; today date:=(clock_timestamp() at time zone 'UTC')::date; begin
 select value into secret from private.server_secrets where name='tickets';
 if secret is null or payload is null or signature is null or length(payload)>2000 or encode(extensions.hmac(convert_to(payload,'UTF8'),convert_to(secret,'UTF8'),'sha256'),'hex')<>signature then raise exception 'Invalid quota ticket';end if;
 d:=payload::jsonb;
 if coalesce(d->>'imageHash','') !~ '^[a-f0-9]{64}$' or d->>'purpose' is distinct from 'guest-quota' or coalesce(d->>'bucket','') !~ '^[a-f0-9]{64}$' or (d->>'expires')::bigint < extract(epoch from now()) or d->>'expires' is null then raise exception 'Invalid quota ticket';end if;
 perform pg_advisory_xact_lock(hashtextextended('guest-scan-quota',0));
 if coalesce((select attempts from private.guest_scan_quota where day=today and bucket=d->>'bucket'),0)>=20 or coalesce((select sum(attempts) from private.guest_scan_quota where day=today),0)>=1000 then raise exception 'Scan allowance reached';end if;
 insert into private.guest_scan_quota values(today,d->>'bucket',1) on conflict(day,bucket) do update set attempts=guest_scan_quota.attempts+1;
 delete from private.guest_scan_quota where day<today-2;
 insert into private.guest_scan_photos(day,bucket,image_hash) values(today,d->>'bucket',d->>'imageHash') on conflict do nothing;
 select id into scan_id from private.guest_scan_photos where day=today and bucket=d->>'bucket' and image_hash=d->>'imageHash';
 delete from private.guest_scan_photos where day<today-2;
 return scan_id;
end $$;
revoke all on function public.reserve_guest_scan(text,text) from public;
grant execute on function public.reserve_guest_scan(text,text) to anon,authenticated;
