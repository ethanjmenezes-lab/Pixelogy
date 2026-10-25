-- Full-campaign and legacy-save compatibility. All fixtures and signing changes roll back.
begin;
insert into auth.users(id,email) values ('a1111111-1111-4111-8111-111111111111','story-a@example.invalid'),('b2222222-2222-4222-8222-222222222222','story-b@example.invalid');
insert into private.server_secrets(name,value) values('tickets','transaction-test-only') on conflict(name) do update set value=excluded.value;
select set_config('request.jwt.claim.sub','a1111111-1111-4111-8111-111111111111',true);
do $$ declare s jsonb; p text; sig text; mid uuid; n integer; phase integer; sid text; keys text[]:=array['shellshore','rustport','neon','mangroves','headquarters']; begin
 -- Signed receipts still cannot bypass database gates.
 foreach sid in array array['shellshore-5','rustport-1','neon-1','mangroves-1','headquarters-1'] loop
 s:=jsonb_build_object('id',gen_random_uuid(),'mode','story','storyStageId',sid,'version',0,'status','active');
 p:=jsonb_build_object('purpose','story','userId','a1111111-1111-4111-8111-111111111111','expires',extract(epoch from now())::bigint+600,'expectedVersion',-1,'state',s,'stars',0)::text;
 sig:=encode(extensions.hmac(convert_to(p,'UTF8'),convert_to('transaction-test-only','UTF8'),'sha256'),'hex');
 set local role authenticated;
 begin perform public.apply_story(p,sig); raise exception 'Locked stage accepted'; exception when raise_exception then if sqlerrm not in ('Boss locked','Region locked') then raise;end if;end;
 reset role;
 end loop;
 -- Simulate an existing Shattered Tide save. Its IDs and earned XP are retained.
 insert into public.story_progress(user_id,stage_id,best_stars) select 'a1111111-1111-4111-8111-111111111111'::uuid,'shellshore-'||i,2 from generate_series(1,5) i;
 insert into public.player_progression(user_id,battle_xp) values('a1111111-1111-4111-8111-111111111111',240) on conflict(user_id) do update set battle_xp=240;
 insert into public.story_cinematics values('a1111111-1111-4111-8111-111111111111','opening');
 -- Replay legacy Shellshore, clear the later regions, then repeat the finale.
 for n in 1..26 loop
 mid:=gen_random_uuid();
 for phase in 0..1 loop
 s:=jsonb_build_object('id',mid,'mode','story','storyStageId',keys[(least(n,25)-1)/5+1]||'-'||((least(n,25)-1)%5+1),'version',phase,'status',case when phase=0 then 'active' else 'completed' end,'winnerId',case when phase=1 then 'player' else null end);
 p:=jsonb_build_object('purpose','story','userId','a1111111-1111-4111-8111-111111111111','expires',extract(epoch from now())::bigint+600,'expectedVersion',phase-1,'state',s,'stars',case when n=26 then 1 else 3 end)::text;
 sig:=encode(extensions.hmac(convert_to(p,'UTF8'),convert_to('transaction-test-only','UTF8'),'sha256'),'hex');
 set local role authenticated;
 perform public.apply_story(p,sig);
 perform public.apply_story(p,sig); -- transport retry must not award twice
 reset role;
 end loop;
 end loop;
 set local role authenticated;
 if (select battle_xp from public.player_progression)<>1200 then raise exception 'Duplicate XP or wrong first-clear total';end if;
 if (select count(*) from public.story_progress)<>25 then raise exception 'Missing stages';end if;
 if exists(select 1 from public.story_progress where best_stars<>3) then raise exception 'Best stars regressed';end if;
 if exists(select 1 from public.cleanup_claims) then raise exception 'Story granted cleanup';end if;
 perform public.watch_story('conspiracy-opening');perform public.watch_story('conspiracy-opening');
 if (select count(*) from public.story_cinematics where cinematic_id in ('opening','conspiracy-opening'))<>2 then raise exception 'Legacy preference was destroyed';end if;
 begin insert into public.story_progress values(auth.uid(),'shellshore-1',3,now());raise exception 'Direct progress accepted';exception when insufficient_privilege then null;end;
 begin perform public.apply_story(p,'forged');raise exception 'Forgery accepted';exception when raise_exception then if sqlerrm='Forgery accepted' then raise;end if;end;
 reset role;
 perform set_config('request.jwt.claim.sub','b2222222-2222-4222-8222-222222222222',true);
 set local role authenticated;
 if exists(select 1 from public.story_progress) or exists(select 1 from public.story_matches) or exists(select 1 from public.story_cinematics) then raise exception 'Cross-account read';end if;
 begin perform public.apply_story(p,sig);raise exception 'Cross-account receipt accepted';exception when raise_exception then if sqlerrm='Cross-account receipt accepted' then raise;end if;end;
 reset role;
end $$;
rollback;
