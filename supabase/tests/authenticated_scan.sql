-- Authenticated bottle persistence/RLS test. No emails; no committed users or data.
begin;
insert into private.server_secrets(name,value) values('tickets','local-test-only') on conflict(name) do nothing;
insert into auth.users(id,email) values
 ('c3333333-3333-4333-8333-333333333333','pixelogy-scan-test@example.invalid'),
 ('d4444444-4444-4444-8444-444444444444','pixelogy-scan-other@example.invalid');
select set_config('request.jwt.claim.sub','c3333333-3333-4333-8333-333333333333',true);
set local role authenticated;
select set_config('pixelogy.scan',public.begin_scan(repeat('e',64))::text,true);
reset role;
-- Sign with the existing private secret in the database, never return its value.
do $$ declare payload text; secret text; begin
 select value into secret from private.server_secrets where name='tickets';
 if secret is null then raise exception 'Missing receipt signing secret';end if;
 payload:=jsonb_build_object('purpose','discovery','userId','c3333333-3333-4333-8333-333333333333','scanId',current_setting('pixelogy.scan'),'candidates',jsonb_build_array('water-bottle'),'expires',extract(epoch from now())::bigint+600)::text;
 perform set_config('pixelogy.payload',payload,true);
 perform set_config('pixelogy.signature',encode(extensions.hmac(convert_to(payload,'UTF8'),convert_to(secret,'UTF8'),'sha256'),'hex'),true);
end $$;
set local role authenticated;
do $$ declare first_award jsonb; repeated jsonb; begin
 first_award:=public.award_discovery(current_setting('pixelogy.payload'),current_setting('pixelogy.signature'),'water-bottle');
 repeated:=public.award_discovery(current_setting('pixelogy.payload'),current_setting('pixelogy.signature'),'water-bottle');
 if not (first_award->>'isNew')::boolean or not (repeated->>'replayed')::boolean then raise exception 'Incorrect discovery/replay result';end if;
 if (select count(*) from public.player_discoveries)<>1 or (select quantity from public.player_inventory where catalog_id='water-bottle')<>1 then raise exception 'Duplicate bottle award';end if;
 if exists(select 1 from public.cleanup_claims) then raise exception 'Discovery incorrectly awarded cleanup';end if;
 begin
 perform public.begin_scan(repeat('e',64));
 raise exception 'Collected image accepted again';
 exception when raise_exception then if sqlerrm='Collected image accepted again' then raise;end if;end;
end $$;
reset role;
select set_config('request.jwt.claim.sub','d4444444-4444-4444-8444-444444444444',true);
set local role authenticated;
do $$ begin
 if exists(select 1 from public.player_discoveries) or exists(select 1 from public.player_inventory) then raise exception 'Cross-account RLS leak';end if;
 begin
 perform public.award_discovery(current_setting('pixelogy.payload'),current_setting('pixelogy.signature'),'water-bottle');
 raise exception 'Foreign receipt accepted';
 exception when raise_exception then if sqlerrm='Foreign receipt accepted' then raise;end if;end;
end $$;
reset role;
select set_config('request.jwt.claim.sub','c3333333-3333-4333-8333-333333333333',true);
set local role authenticated;
do $$ begin
 if (select count(*) from public.player_discoveries)<>1 then raise exception 'Discovery lost after switching account';end if;
end $$;
reset role;
set local role anon;
do $$ begin
 begin perform public.begin_scan(repeat('f',64)); raise exception 'Anonymous scan permitted'; exception when insufficient_privilege then null;end;
 begin perform public.award_discovery('{}','invalid','water-bottle'); raise exception 'Anonymous award permitted'; exception when insufficient_privilege then null;end;
end $$;
reset role;
rollback;
