begin;
insert into auth.users values('11111111-aaaa-4111-8111-111111111111','guest-test@example.invalid'),('22222222-bbbb-4222-8222-222222222222','other-test@example.invalid');
insert into private.server_secrets values('tickets','guest-test-secret') on conflict(name) do update set value=excluded.value;
select set_config('request.jwt.claim.sub','11111111-aaaa-4111-8111-111111111111',true);
select set_config('test.snapshot','{"version":1,"source":"33333333-cccc-4333-8333-333333333333","items":[{"id":"44444444-dddd-4444-8444-444444444444","catalogId":"grocery-bag","createdAtIso":"2026-01-01T00:00:00Z"}],"claims":[{"eventId":"55555555-eeee-4555-8555-555555555555","collectibleId":"44444444-dddd-4444-8444-444444444444","xpAwarded":15,"stateCode":"TX","confirmedAtIso":"2026-01-01T00:00:00Z"}],"player":{"xp":208,"distanceMm":2600000},"progression":{"xp":240,"main":"shell_slam","special":"bag_snare"},"loadout":{"head":"44444444-dddd-4444-8444-444444444444"},"profile":{"nickname":"Guest","skin":1,"hair":0,"clothing":4,"hairStyle":"short","hat":"none","motion":"system"},"story":{"progress":[{"stage_id":"shellshore-1","best_stars":3}],"watched":["opening"]}}',true);
set local role authenticated;
select public.import_guest(current_setting('test.snapshot'));
select public.import_guest(current_setting('test.snapshot'));
do $$begin
 if not exists(select 1 from public.player_progression where player_xp=208 and battle_xp=240 and walking_mm=2600000) then raise exception 'Wrong imported XP';end if;
 if (select count(*) from public.player_discoveries)<>1 or (select quantity from public.player_inventory)<>1 then raise exception 'Duplicate discovery';end if;
 if not exists(select 1 from public.cleanup_claims where state_code='TX' and imported_guest) then raise exception 'State/provenance missing';end if;
 if (select main from public.selected_moves)<>'shell_slam' or (select special from public.selected_moves)<>'bag_snare' then raise exception 'Moves lost';end if;
 if (select count(*) from public.crab_equipment)<>1 then raise exception 'Gear lost';end if;
 if (select best_stars from public.story_progress)<>3 then raise exception 'Story lost';end if;
 perform public.claim_cleanup_state('44444444-dddd-4444-8444-444444444444','OK');
 if (select state_code from public.cleanup_claims)<>'TX' then raise exception 'Replay moved cleanup';end if;
 begin perform public.import_guest(replace(current_setting('test.snapshot'),'"TX"','"ZZ"'));raise exception 'Bad state accepted';exception when check_violation then null;end;
end $$;
-- An existing account keeps its selected equipment and moves; overlapping story XP is not counted twice.
select public.import_guest(replace(replace(replace(replace(current_setting('test.snapshot'),'33333333-cccc-4333-8333-333333333333','66666666-aaaa-4666-8666-666666666666'),'44444444-dddd-4444-8444-444444444444','77777777-bbbb-4777-8777-777777777777'),'55555555-eeee-4555-8555-555555555555','88888888-cccc-4888-8888-888888888888'),'"main":"shell_slam"','"main":"pinch"'));
do $$begin
 if (select player_xp from public.player_progression)<>416 or (select battle_xp from public.player_progression)<>440 then raise exception 'Merge inflated overlapping story rewards';end if;
 if (select discovery_id from public.crab_equipment)<>'44444444-dddd-4444-8444-444444444444'::uuid or (select main from public.selected_moves)<>'shell_slam' then raise exception 'Existing selections overwritten';end if;
end $$;
-- Legacy pixel-art items remain usable without inventing a catalog identity.
select set_config('test.legacy',jsonb_build_object('version',1,'source','99999999-dddd-4999-8999-999999999999','items',jsonb_build_array(jsonb_build_object('id','aaaaaaaa-eeee-4aaa-8aaa-aaaaaaaaaaaa','category','plastic_bottle','label','Old bottle','rarity','rare','gearBlueprintId','bottle_blade','createdAtIso','2026-01-01T00:00:00Z','sprite',jsonb_build_object('thumbnailBlobKey','old','width',256,'height',256))),'claims','[]'::jsonb,'player',jsonb_build_object('xp',0,'distanceMm',0),'progression',jsonb_build_object('xp',0,'main','pinch','special','tidal_slam'),'loadout','{}'::jsonb,'profile',(current_setting('test.snapshot')::jsonb)->'profile','story',jsonb_build_object('progress','[]'::jsonb,'watched','[]'::jsonb))::text,true);
select public.import_guest(current_setting('test.legacy'));
select public.equip_discovery('main_claw','aaaaaaaa-eeee-4aaa-8aaa-aaaaaaaaaaaa');
select public.claim_cleanup_state('aaaaaaaa-eeee-4aaa-8aaa-aaaaaaaaaaaa','CA');
do $$begin
 if not exists(select 1 from public.player_discoveries where legacy_metadata->>'label'='Old bottle' and catalog_id is null) then raise exception 'Legacy lost';end if;
 if not exists(select 1 from public.cleanup_claims where state_code='CA' and category='plastic_bottle' and imported_guest) then raise exception 'Legacy cleanup origin lost';end if;
 begin perform public.import_guest((current_setting('test.legacy')::jsonb #- '{items,0,label}')::text);raise exception 'Malformed legacy accepted';exception when raise_exception then if sqlerrm='Malformed legacy accepted' then raise;end if;end;
end $$;
reset role;
select set_config('request.jwt.claim.sub','22222222-bbbb-4222-8222-222222222222',true);
set local role authenticated;
do $$begin
 if exists(select 1 from public.guest_imports) or exists(select 1 from public.cleanup_claims) then raise exception 'Private save leaked';end if;
 begin perform public.import_guest(current_setting('test.snapshot'));raise exception 'Cross-account import accepted';exception when raise_exception then if sqlerrm='Cross-account import accepted' then raise;end if;end;
end $$;
reset role;
select set_config('test.quota',jsonb_build_object('purpose','guest-quota','imageHash',repeat('b',64),'bucket',repeat('a',64),'expires',extract(epoch from now())::bigint+600)::text,true);
select set_config('test.signature',encode(extensions.hmac(convert_to(current_setting('test.quota'),'UTF8'),convert_to('guest-test-secret','UTF8'),'sha256'),'hex'),true);
set local role anon;
do $$begin
 begin perform public.reserve_guest_scan(current_setting('test.quota'),'forged');raise exception 'Quota forgery accepted';exception when raise_exception then if sqlerrm='Quota forgery accepted' then raise;end if;end;
 for i in 1..20 loop perform public.reserve_guest_scan(current_setting('test.quota'),current_setting('test.signature'));end loop;
 begin perform public.reserve_guest_scan(current_setting('test.quota'),current_setting('test.signature'));raise exception 'Quota bypass';exception when raise_exception then if sqlerrm='Quota bypass' then raise;end if;end;
 begin perform public.import_guest(current_setting('test.snapshot'));raise exception 'Anonymous import accepted';exception when insufficient_privilege then null;end;
end $$;
reset role;
update private.guest_scan_quota set attempts=1000;
select set_config('test.quota',replace(current_setting('test.quota'),repeat('a',64),repeat('c',64)),true);
select set_config('test.signature',encode(extensions.hmac(convert_to(current_setting('test.quota'),'UTF8'),convert_to('guest-test-secret','UTF8'),'sha256'),'hex'),true);
set local role anon;
do $$begin
 begin perform public.reserve_guest_scan(current_setting('test.quota'),current_setting('test.signature'));raise exception 'Global quota bypass';exception when raise_exception then if sqlerrm='Global quota bypass' then raise;end if;end;
end $$;
rollback;
