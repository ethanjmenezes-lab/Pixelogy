-- Run after both migrations as a database owner. Everything rolls back.
-- No email is sent; these transaction-only auth fixtures are not real accounts.
begin;
insert into auth.users(id,email) values
 ('a1111111-1111-4111-8111-111111111111','pixelogy-rls-a@example.invalid'),
 ('b2222222-2222-4222-8222-222222222222','pixelogy-rls-b@example.invalid');
insert into private.server_secrets(name,value) values('tickets','transaction-test-only')
 on conflict(name) do update set value=excluded.value;
select set_config('request.jwt.claim.sub','a1111111-1111-4111-8111-111111111111',true);
set local role authenticated;
select set_config('pixelogy.scan',public.begin_scan(repeat('a',64))::text,true);
reset role;
select set_config('pixelogy.payload',jsonb_build_object('purpose','discovery','userId','a1111111-1111-4111-8111-111111111111','scanId',current_setting('pixelogy.scan'),'candidates',jsonb_build_array('grocery-bag'),'expires',extract(epoch from now())::bigint+600)::text,true);
select set_config('pixelogy.signature',encode(extensions.hmac(convert_to(current_setting('pixelogy.payload'),'UTF8'),convert_to('transaction-test-only','UTF8'),'sha256'),'hex'),true);
set local role authenticated;
select public.award_discovery(current_setting('pixelogy.payload'),current_setting('pixelogy.signature'),'grocery-bag');
select public.award_discovery(current_setting('pixelogy.payload'),current_setting('pixelogy.signature'),'grocery-bag');
select public.equip_discovery('head',current_setting('pixelogy.scan')::uuid);
select public.claim_cleanup(current_setting('pixelogy.scan')::uuid);
select public.claim_cleanup(current_setting('pixelogy.scan')::uuid);
do $$ begin
 if (select quantity from public.player_inventory where catalog_id='grocery-bag')<>1 then raise exception 'Replay inflated quantity';end if;
 if (select count(*) from public.player_discoveries)<>1 then raise exception 'Replay duplicated discovery';end if;
 if exists(select 1 from public.cleanup_claims where id=discovery_id) then raise exception 'Cleanup event identity must be separate';end if;
 if (select sum(xp) from public.cleanup_claims)<>15 then raise exception 'Cleanup was not idempotent';end if;
 if (select special from public.selected_moves)<>'bag_snare' then raise exception 'Equipment special not synchronized';end if;
 begin
 perform public.award_discovery(current_setting('pixelogy.payload'),'forged','grocery-bag');
 raise exception 'Forged receipt accepted';
 exception when raise_exception then
 if sqlerrm='Forged receipt accepted' then raise;end if;
 end;
 begin
 perform public.equip_discovery('feet',current_setting('pixelogy.scan')::uuid);
 raise exception 'Wrong slot accepted';
 exception when raise_exception then
 if sqlerrm='Wrong slot accepted' then raise;end if;
 end;
 begin
 update public.player_progression set battle_xp=999999;
 raise exception 'Direct progression write accepted';
 exception when insufficient_privilege then null;
 end;
end $$;
-- Account B cannot see or mutate A, even with A's valid signed receipt.
reset role;
select set_config('request.jwt.claim.sub','b2222222-2222-4222-8222-222222222222',true);
set local role authenticated;
do $$ begin
 if exists(select 1 from public.player_discoveries) or exists(select 1 from public.player_inventory) or exists(select 1 from public.crab_equipment) then raise exception 'RLS leaked another account';end if;
 begin
 perform public.award_discovery(current_setting('pixelogy.payload'),current_setting('pixelogy.signature'),'grocery-bag');
 raise exception 'Cross-account receipt accepted';
 exception when raise_exception then
 if sqlerrm='Cross-account receipt accepted' then raise;end if;
 end;
 begin
 perform public.equip_discovery('head',current_setting('pixelogy.scan')::uuid);
 raise exception 'Foreign equipment accepted';
 exception when raise_exception then
 if sqlerrm='Foreign equipment accepted' then raise;end if;
 end;
 begin
 update public.collectible_catalog set rarity='legendary';
 raise exception 'Catalog write accepted';
 exception when insufficient_privilege then null;
 end;
end $$;
reset role;
rollback;
