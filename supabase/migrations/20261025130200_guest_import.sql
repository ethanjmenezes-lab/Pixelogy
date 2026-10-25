alter table public.player_discoveries alter column catalog_id drop not null;
alter table public.player_discoveries add column legacy_metadata jsonb, add column imported_guest boolean not null default false;
alter table public.player_discoveries add constraint discovery_content check(catalog_id is not null or legacy_metadata is not null);
-- Guest imports are personal save backups, not verified leaderboard records.
create table public.guest_imports(source_id uuid primary key,user_id uuid not null references auth.users(id) on delete cascade,snapshot jsonb not null,player_xp integer not null,crab_xp integer not null,walking_mm bigint not null,snapshot_hash text not null);
alter table public.guest_imports enable row level security;
revoke all on public.guest_imports from public,anon,authenticated;
grant select on public.guest_imports to authenticated;
create policy owner_read on public.guest_imports for select to authenticated using((select auth.uid())=user_id);
create function public.import_guest(snapshot text) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=private.lock_player(); s jsonb; sid uuid; prior public.guest_imports; item jsonb; claim jsonb; row jsonb; cat public.collectible_catalog; did uuid; px integer; cx integer; mm bigint; overlap integer:=0; h text; fresh boolean; had_progress boolean; begin
 if snapshot is null or octet_length(snapshot)>3000000 then raise exception 'Guest save too large';end if;
 s:=snapshot::jsonb;sid:=(s->>'source')::uuid;
 if coalesce(sid is null or not (s ?& array['version','source','items','claims','player','progression','loadout','profile','story']) or s->>'version'<>'1' or jsonb_typeof(s->'items')<>'array' or jsonb_typeof(s->'claims')<>'array' or jsonb_typeof(s->'story'->'progress')<>'array' or jsonb_typeof(s->'story'->'watched')<>'array' or jsonb_array_length(s->'items')>10000,true) then raise exception 'Invalid guest save';end if;
 perform pg_advisory_xact_lock(hashtextextended(sid::text,1));
 select * into prior from public.guest_imports where source_id=sid;
 if found and prior.user_id<>u then raise exception 'This guest save already belongs to another account';end if;
 h:=encode(extensions.digest(convert_to(snapshot,'UTF8'),'sha256'),'hex');
 if prior.snapshot_hash=h then return jsonb_build_object('hash',h);end if;
 px:=(s->'player'->>'xp')::integer;cx:=(s->'progression'->>'xp')::integer;mm:=(s->'player'->>'distanceMm')::bigint;
 if px is null or cx is null or mm is null or px not between 0 and 10000000 or cx not between 0 and 10000000 or mm not between 0 and 100000000000 then raise exception 'Invalid progression';end if;
 had_progress:=exists(select 1 from public.player_discoveries where user_id=u) or exists(select 1 from public.player_profiles where user_id=u) or exists(select 1 from public.player_progression where user_id=u and (player_xp>0 or battle_xp>0));
 for item in select value from jsonb_array_elements(s->'items') loop
  if item->>'catalogId' is null then
   did:=(item->>'id')::uuid;
   if coalesce(jsonb_typeof(item)<>'object' or not (item ?& array['category','label','createdAtIso','rarity','gearBlueprintId']) or jsonb_typeof(item->'label')<>'string' or item->>'createdAtIso' is null or item->>'rarity' not in ('common','uncommon','rare','legendary') or item->>'category' not in ('plastic_bottle','aluminum_can','food_wrapper','disposable_cup','plastic_bag','bottle_cap','paper_cardboard','straw','other_litter') or length(item->>'label')>80 or (item->>'gearBlueprintId' is not null and not exists(select 1 from public.gear_definitions where id=item->>'gearBlueprintId')),true) then raise exception 'Invalid legacy item';end if;
   if exists(select 1 from public.scan_events where id=did and user_id<>u) then raise exception 'Discovery belongs to another account';end if;
   insert into public.scan_events(id,user_id,image_hash) values(did,u,encode(extensions.digest(convert_to('guest:'||did::text,'UTF8'),'sha256'),'hex')) on conflict do nothing;
   insert into public.player_discoveries(id,user_id,legacy_metadata,discovered_at,imported_guest) values(did,u,item,least((item->>'createdAtIso')::timestamptz,now()),true) on conflict do nothing;
   continue;
  end if;
  select * into cat from public.collectible_catalog where id=item->>'catalogId';if not found then raise exception 'Unknown guest collectible';end if;
  did:=(item->>'id')::uuid;
  if exists(select 1 from public.scan_events where id=did and user_id<>u) then raise exception 'Discovery belongs to another account';end if;
  if exists(select 1 from public.player_discoveries where id=did and catalog_id<>cat.id) then raise exception 'Conflicting discovery';end if;
  fresh:=not exists(select 1 from public.player_discoveries where id=did);
  insert into public.scan_events(id,user_id,image_hash,awarded_catalog_id) values(did,u,encode(extensions.digest(convert_to('guest:'||did::text,'UTF8'),'sha256'),'hex'),cat.id) on conflict do nothing;
  insert into public.player_discoveries(id,user_id,catalog_id,discovered_at,imported_guest) values(did,u,cat.id,least((item->>'createdAtIso')::timestamptz,now()),true) on conflict do nothing;
  if fresh then insert into public.player_inventory values(u,cat.id,1) on conflict(user_id,catalog_id) do update set quantity=player_inventory.quantity+1;end if;
 end loop;
 for claim in select value from jsonb_array_elements(s->'claims') loop
  did:=(claim->>'collectibleId')::uuid;
  select c.* into cat from public.player_discoveries d join public.collectible_catalog c on c.id=d.catalog_id where d.id=did and d.user_id=u;
  if not found and exists(select 1 from public.player_discoveries where id=did and user_id=u and legacy_metadata is not null) then select jsonb_build_object('gearCategory',legacy_metadata->>'category') into cat.metadata from public.player_discoveries where id=did;end if;
  if cat.metadata is not null then
   insert into public.cleanup_claims(id,discovery_id,user_id,category,xp,claimed_at,state_code,imported_guest) values((claim->>'eventId')::uuid,did,u,cat.metadata->>'gearCategory',case when claim->>'xpAwarded'='15' then 15 else 10 end,least((claim->>'confirmedAtIso')::timestamptz,now()),claim->>'stateCode',true) on conflict(discovery_id) do nothing;
  end if;
 end loop;
 for row in select value from jsonb_array_elements(s->'story'->'progress') loop
  if exists(select 1 from public.story_progress where user_id=u and stage_id=row->>'stage_id') and not exists(select 1 from jsonb_array_elements(coalesce(prior.snapshot->'story'->'progress','[]'::jsonb)) p where p->>'stage_id'=row->>'stage_id') then overlap:=overlap+case when row->>'stage_id' like '%-5' then 80 else 40 end;end if;
  insert into public.story_progress(user_id,stage_id,best_stars) values(u,row->>'stage_id',(row->>'best_stars')::integer) on conflict(user_id,stage_id) do update set best_stars=greatest(story_progress.best_stars,excluded.best_stars);
 end loop;
 for row in select value from jsonb_array_elements(s->'story'->'watched') loop insert into public.story_cinematics values(u,row#>>'{}') on conflict do nothing;end loop;
 update public.player_progression set player_xp=player_xp+greatest(0,px-coalesce(prior.player_xp,0)),battle_xp=battle_xp+greatest(0,cx-coalesce(prior.crab_xp,0)-overlap),walking_mm=walking_mm+greatest(0,mm-coalesce(prior.walking_mm,0)) where user_id=u;
 -- Existing account selections win. A new account adopts the guest loadout.
 if not had_progress then
  for row in select jsonb_build_object('slot',key,'id',value) from jsonb_each_text(s->'loadout') loop
   if exists(select 1 from public.player_discoveries where id=(row->>'id')::uuid and user_id=u) then perform public.equip_discovery(row->>'slot',(row->>'id')::uuid);end if;
  end loop;
  perform public.choose_move('main',s->'progression'->>'main');
  begin perform public.choose_move('special',s->'progression'->>'special');exception when others then perform private.reconcile_special(u);end;
  perform public.save_appearance(s->'profile');
 end if;
 insert into public.guest_imports values(sid,u,s,px,cx,mm,h) on conflict(source_id) do update set snapshot=excluded.snapshot,player_xp=greatest(guest_imports.player_xp,excluded.player_xp),crab_xp=greatest(guest_imports.crab_xp,excluded.crab_xp),walking_mm=greatest(guest_imports.walking_mm,excluded.walking_mm),snapshot_hash=excluded.snapshot_hash;
 return jsonb_build_object('hash',h);
end $$;
revoke all on function public.import_guest(text) from public,anon;
grant execute on function public.import_guest(text) to authenticated;

create or replace function private.reconcile_special(u uuid) returns void language plpgsql security definer set search_path='' as $$ declare selected text; first_move text; begin
 select special into selected from public.selected_moves where user_id=u;
 if exists(select 1 from public.crab_equipment e join public.player_discoveries d on d.id=e.discovery_id left join public.collectible_catalog c on c.id=d.catalog_id join public.move_definitions m on m.gear_id=coalesce(c.gear_id,d.legacy_metadata->>'gearBlueprintId') where e.user_id=u and m.id=selected) then return; end if;
 select m.id into first_move from public.crab_equipment e join public.player_discoveries d on d.id=e.discovery_id left join public.collectible_catalog c on c.id=d.catalog_id join public.move_definitions m on m.gear_id=coalesce(c.gear_id,d.legacy_metadata->>'gearBlueprintId') where e.user_id=u order by m.id limit 1;
 update public.selected_moves set special=coalesce(first_move,'tidal_slam') where user_id=u; end $$;
create or replace function public.equip_discovery(slot_name text, discovery uuid default null) returns void language plpgsql security definer set search_path='' as $$ declare u uuid:=private.lock_player(); begin
 if slot_name not in ('head','shell','main_claw','off_claw','feet') then raise exception 'Invalid slot'; end if;
 if discovery is null then delete from public.crab_equipment where user_id=u and slot=slot_name;
 else
 if not exists(select 1 from public.player_discoveries d left join public.collectible_catalog c on c.id=d.catalog_id join public.gear_definitions g on g.id=coalesce(c.gear_id,d.legacy_metadata->>'gearBlueprintId') where d.id=discovery and d.user_id=u and g.slot=slot_name) then raise exception 'Unowned or incompatible equipment'; end if;
 insert into public.crab_equipment(user_id,slot,discovery_id) values(u,slot_name,discovery) on conflict(user_id,slot) do update set discovery_id=excluded.discovery_id;
 end if; perform private.reconcile_special(u); end $$;
create or replace function public.choose_move(slot_name text, move_id text) returns void language plpgsql security definer set search_path='' as $$ declare u uuid:=private.lock_player(); xp integer; begin
 select battle_xp into xp from public.player_progression where user_id=u;
 if slot_name='main' then
 if not exists(select 1 from public.move_definitions where id=move_id and slot='main' and level_required <= 1+xp/100) then raise exception 'Main attack locked'; end if;
 update public.selected_moves set main=move_id where user_id=u;
 elsif slot_name='special' then
 perform private.reconcile_special(u);
 if move_id='tidal_slam' then
 if (select special from public.selected_moves where user_id=u)<>'tidal_slam' then raise exception 'Choose an equipped special'; end if;
 elsif not exists(select 1 from public.crab_equipment e join public.player_discoveries d on d.id=e.discovery_id left join public.collectible_catalog c on c.id=d.catalog_id join public.move_definitions m on m.gear_id=coalesce(c.gear_id,d.legacy_metadata->>'gearBlueprintId') where e.user_id=u and m.id=move_id and m.slot='special') then raise exception 'Special gear not equipped'; end if;
 update public.selected_moves set special=move_id where user_id=u;
 else raise exception 'Defend cannot be replaced'; end if; end $$;
create or replace function public.claim_cleanup(discovery uuid) returns jsonb language plpgsql security definer set search_path='' as $$ declare u uuid:=private.lock_player(); cat text; reward integer; result public.cleanup_claims; begin
 select * into result from public.cleanup_claims where discovery_id=discovery and user_id=u;
 if found then return to_jsonb(result); end if;
 select coalesce(c.metadata->>'gearCategory',d.legacy_metadata->>'category') into cat from public.player_discoveries d left join public.collectible_catalog c on c.id=d.catalog_id where d.id=discovery and d.user_id=u;
 if not found then raise exception 'Unowned discovery'; end if;
 reward:=case when exists(select 1 from public.cleanup_claims where user_id=u and category=cat) then 10 else 15 end;
 insert into public.cleanup_claims(discovery_id,user_id,category,xp,imported_guest) values(discovery,u,cat,reward,(select imported_guest from public.player_discoveries where id=discovery)) returning * into result;
 return to_jsonb(result); end $$;
