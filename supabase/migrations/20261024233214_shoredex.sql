create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create extension if not exists pgcrypto with schema extensions;
create table private.scan_attempts(user_id uuid not null references auth.users(id) on delete cascade, attempted_at timestamptz not null default now());
create index on private.scan_attempts(user_id,attempted_at);
create table private.server_secrets (name text primary key, value text not null);
create table public.gear_definitions (id text primary key, slot text not null check(slot in ('head','shell','main_claw','off_claw','feet')), metadata jsonb not null);
create table public.move_definitions (id text primary key, slot text not null, level_required integer, gear_id text references public.gear_definitions(id), metadata jsonb not null);
create table public.collectible_catalog (id text primary key, number integer unique not null check(number>0), name text not null, category text not null, material text not null, rarity text not null check(rarity in ('common','uncommon','rare','legendary')), gear_id text references public.gear_definitions(id), metadata jsonb not null);
create table public.player_profiles (user_id uuid primary key references auth.users(id) on delete cascade, appearance jsonb not null default '{}'::jsonb);
create table public.player_progression (user_id uuid primary key references auth.users(id) on delete cascade, battle_xp integer not null default 0 check(battle_xp>=0));
create table public.selected_moves (user_id uuid primary key references auth.users(id) on delete cascade, main text not null default 'pinch' references public.move_definitions(id), special text not null default 'tidal_slam' references public.move_definitions(id));
create table public.scan_events (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, image_hash text not null check(length(image_hash)=64), created_at timestamptz not null default now(), awarded_catalog_id text references public.collectible_catalog(id), unique(user_id,image_hash));
create table public.player_discoveries (id uuid primary key references public.scan_events(id), user_id uuid not null references auth.users(id) on delete cascade, catalog_id text not null references public.collectible_catalog(id), discovered_at timestamptz not null default now());
create table public.player_inventory (user_id uuid references auth.users(id) on delete cascade, catalog_id text references public.collectible_catalog(id), quantity integer not null check(quantity>0), primary key(user_id,catalog_id));
create table public.crab_equipment (user_id uuid references auth.users(id) on delete cascade, slot text not null check(slot in ('head','shell','main_claw','off_claw','feet')), discovery_id uuid not null references public.player_discoveries(id), primary key(user_id,slot), unique(user_id,discovery_id));
create table public.cleanup_claims (id uuid unique not null default gen_random_uuid(), discovery_id uuid primary key references public.player_discoveries(id), user_id uuid not null references auth.users(id) on delete cascade, category text not null, xp integer not null check(xp in (10,15)), claimed_at timestamptz not null default now(), self_reported boolean not null default true check(self_reported));
create table public.practice_matches (id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade, state jsonb not null, version integer not null, awarded_xp integer not null default 0, created_at timestamptz not null default now());
-- Public metadata is immutable to players. All private rows are owner-readable;
-- mutation occurs only through narrowly scoped, authenticated RPCs below.
do $$ declare t text; begin
 foreach t in array array['gear_definitions','move_definitions','collectible_catalog'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon, authenticated',t);
 execute format('grant select on public.%I to anon, authenticated',t);
 execute format('create policy catalog_read on public.%I for select to anon, authenticated using (true)',t);
 end loop;
 foreach t in array array['player_profiles','player_progression','selected_moves','scan_events','player_discoveries','player_inventory','crab_equipment','cleanup_claims','practice_matches'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon, authenticated',t);
 execute format('grant select on public.%I to authenticated',t);
 execute format('create policy owner_read on public.%I for select to authenticated using ((select auth.uid()) = user_id)',t);
 execute format('create index on public.%I(user_id)',t);
 end loop;
end $$;
create function private.lock_player() returns uuid language plpgsql security definer set search_path='' as $$ declare u uuid:=auth.uid(); begin
 if u is null then raise exception 'Sign in required'; end if;
 perform pg_advisory_xact_lock(hashtextextended(u::text,0));
 insert into public.player_progression(user_id) values(u) on conflict do nothing;
 insert into public.selected_moves(user_id) values(u) on conflict do nothing;
 return u; end $$;
create function private.verify_ticket(payload text, signature text, purpose text) returns jsonb language plpgsql security definer set search_path='' as $$ declare data jsonb; secret text; begin
 select value into secret from private.server_secrets where name='tickets';
 if secret is null or payload is null or signature is null or length(payload)>100000 or encode(extensions.hmac(convert_to(payload,'UTF8'),convert_to(secret,'UTF8'),'sha256'),'hex') <> signature then raise exception 'Invalid server receipt'; end if;
 data:=payload::jsonb;
 if data->>'purpose' is distinct from purpose or data->>'expires' is null or (data->>'userId')::uuid is distinct from auth.uid() or (data->>'expires')::bigint < extract(epoch from now()) then raise exception 'Expired or invalid receipt'; end if;
 return data; end $$;
create function public.begin_scan(image_hash text) returns uuid language plpgsql security definer set search_path='' as $$ declare u uuid:=private.lock_player(); event_id uuid; begin
 if length(image_hash)<>64 or image_hash !~ '^[a-f0-9]+$' then raise exception 'Invalid photo hash'; end if;
 if (select count(*) from private.scan_attempts where user_id=u and attempted_at>now()-interval '1 hour')>=20 then raise exception 'Scan limit reached. Try later.'; end if;
 if exists(select 1 from public.scan_events s where s.user_id=u and s.image_hash=begin_scan.image_hash and awarded_catalog_id is not null) then raise exception 'This photo was already collected. Take a new photo.'; end if;
 -- Failed analyses can retry with the same image, but remain rate limited by age.
 select id into event_id from public.scan_events s where s.user_id=u and s.image_hash=begin_scan.image_hash;
 if event_id is not null then
   if exists(select 1 from public.scan_events where id=event_id and created_at>now()-interval '30 seconds') then raise exception 'Wait 30 seconds before retrying this photo'; end if;
   update public.scan_events set created_at=now() where id=event_id;
 else insert into public.scan_events(user_id,image_hash) values(u,image_hash) returning id into event_id; end if;
 insert into private.scan_attempts(user_id) values(u);
 return event_id; end $$;
create function public.award_discovery(payload text, signature text, catalog_id text) returns jsonb language plpgsql security definer set search_path='' as $$ declare u uuid:=private.lock_player(); data jsonb:=private.verify_ticket(payload,signature,'discovery'); event_id uuid:=(data->>'scanId')::uuid; existing text; is_new boolean; begin
 if not coalesce(((data->'candidates') ? catalog_id),false) or not exists(select 1 from public.collectible_catalog c where c.id=catalog_id) then raise exception 'Not a validated catalog candidate'; end if;
 select awarded_catalog_id into existing from public.scan_events where id=event_id and user_id=u for update;
 if not found then raise exception 'Unknown scan'; end if;
 if existing is not null then
   if existing<>catalog_id then raise exception 'Scan already consumed'; end if;
   return jsonb_build_object('id',event_id,'catalogId',existing,'isNew',false,'replayed',true);
 end if;
 is_new:=not exists(select 1 from public.player_inventory i where i.user_id=u and i.catalog_id=award_discovery.catalog_id);
 update public.scan_events set awarded_catalog_id=catalog_id where id=event_id;
 insert into public.player_discoveries(id,user_id,catalog_id) values(event_id,u,catalog_id);
 insert into public.player_inventory(user_id,catalog_id,quantity) values(u,catalog_id,1) on conflict on constraint player_inventory_pkey do update set quantity=public.player_inventory.quantity+1;
 return jsonb_build_object('id',event_id,'catalogId',catalog_id,'isNew',is_new,'replayed',false); end $$;
create function private.reconcile_special(u uuid) returns void language plpgsql security definer set search_path='' as $$ declare selected text; first_move text; begin
 select special into selected from public.selected_moves where user_id=u;
 if exists(select 1 from public.crab_equipment e join public.player_discoveries d on d.id=e.discovery_id join public.collectible_catalog c on c.id=d.catalog_id join public.move_definitions m on m.gear_id=c.gear_id where e.user_id=u and m.id=selected) then return; end if;
 select m.id into first_move from public.crab_equipment e join public.player_discoveries d on d.id=e.discovery_id join public.collectible_catalog c on c.id=d.catalog_id join public.move_definitions m on m.gear_id=c.gear_id where e.user_id=u order by m.id limit 1;
 update public.selected_moves set special=coalesce(first_move,'tidal_slam') where user_id=u; end $$;
create function public.equip_discovery(slot_name text, discovery uuid default null) returns void language plpgsql security definer set search_path='' as $$ declare u uuid:=private.lock_player(); begin
 if slot_name not in ('head','shell','main_claw','off_claw','feet') then raise exception 'Invalid slot'; end if;
 if discovery is null then delete from public.crab_equipment where user_id=u and slot=slot_name;
 else
 if not exists(select 1 from public.player_discoveries d join public.collectible_catalog c on c.id=d.catalog_id join public.gear_definitions g on g.id=c.gear_id where d.id=discovery and d.user_id=u and g.slot=slot_name) then raise exception 'Unowned or incompatible equipment'; end if;
 insert into public.crab_equipment(user_id,slot,discovery_id) values(u,slot_name,discovery) on conflict(user_id,slot) do update set discovery_id=excluded.discovery_id;
 end if; perform private.reconcile_special(u); end $$;
create function public.choose_move(slot_name text, move_id text) returns void language plpgsql security definer set search_path='' as $$ declare u uuid:=private.lock_player(); xp integer; begin
 select battle_xp into xp from public.player_progression where user_id=u;
 if slot_name='main' then
 if not exists(select 1 from public.move_definitions where id=move_id and slot='main' and level_required <= 1+xp/100) then raise exception 'Main attack locked'; end if;
 update public.selected_moves set main=move_id where user_id=u;
 elsif slot_name='special' then
 perform private.reconcile_special(u);
 if move_id='tidal_slam' then
 if (select special from public.selected_moves where user_id=u)<>'tidal_slam' then raise exception 'Choose an equipped special'; end if;
 elsif not exists(select 1 from public.crab_equipment e join public.player_discoveries d on d.id=e.discovery_id join public.collectible_catalog c on c.id=d.catalog_id join public.move_definitions m on m.gear_id=c.gear_id where e.user_id=u and m.id=move_id and m.slot='special') then raise exception 'Special gear not equipped'; end if;
 update public.selected_moves set special=move_id where user_id=u;
 else raise exception 'Defend cannot be replaced'; end if; end $$;
create function public.claim_cleanup(discovery uuid) returns jsonb language plpgsql security definer set search_path='' as $$ declare u uuid:=private.lock_player(); cat text; reward integer; result public.cleanup_claims; begin
 select * into result from public.cleanup_claims where discovery_id=discovery and user_id=u;
 if found then return to_jsonb(result); end if;
 select c.metadata->>'gearCategory' into cat from public.player_discoveries d join public.collectible_catalog c on c.id=d.catalog_id where d.id=discovery and d.user_id=u;
 if not found then raise exception 'Unowned discovery'; end if;
 reward:=case when exists(select 1 from public.cleanup_claims where user_id=u and category=cat) then 10 else 15 end;
 insert into public.cleanup_claims(discovery_id,user_id,category,xp) values(discovery,u,cat,reward) returning * into result;
 return to_jsonb(result); end $$;
create function public.save_appearance(appearance jsonb) returns void language plpgsql security definer set search_path='' as $$ declare u uuid:=private.lock_player(); begin
 if octet_length(appearance::text)>2000 then raise exception 'Profile too large'; end if;
 insert into public.player_profiles(user_id,appearance) values(u,appearance) on conflict(user_id) do update set appearance=excluded.appearance; end $$;
create function public.apply_practice(payload text, signature text) returns jsonb language plpgsql security definer set search_path='' as $$ declare u uuid:=private.lock_player(); data jsonb:=private.verify_ticket(payload,signature,'battle'); new_state jsonb:=data->'state'; match_id uuid:=(new_state->>'id')::uuid; old_state jsonb; old_version integer; reward integer:=0; begin
 select state,version into old_state,old_version from public.practice_matches where id=match_id and user_id=u for update;
 if not found then
 if (data->>'expectedVersion')::integer<>-1 or (new_state->>'version')::integer not in (0,1) then raise exception 'Unknown match'; end if;
 if (select count(*) from public.practice_matches where user_id=u and created_at>now()-interval '1 hour')>=30 then raise exception 'Practice limit reached'; end if;
 insert into public.practice_matches(id,user_id,state,version) values(match_id,u,new_state,(new_state->>'version')::integer);
 else
 if old_version<>(data->>'expectedVersion')::integer or old_state->>'status'<>'active' then return old_state; end if;
 if new_state->>'status'='completed' then reward:=case when new_state->>'winnerId'='player' then 40 else 15 end; end if;
 update public.practice_matches set state=new_state, version=(new_state->>'version')::integer, awarded_xp=reward where id=match_id;
 update public.player_progression set battle_xp=battle_xp+reward where user_id=u;
 end if; return new_state; end $$;
revoke all on function private.lock_player(),private.verify_ticket(text,text,text),private.reconcile_special(uuid) from public, anon, authenticated;
revoke all on function public.begin_scan(text),public.award_discovery(text,text,text),public.equip_discovery(text,uuid),public.choose_move(text,text),public.claim_cleanup(uuid),public.save_appearance(jsonb),public.apply_practice(text,text) from public, anon;
grant execute on function public.begin_scan(text),public.award_discovery(text,text,text),public.equip_discovery(text,uuid),public.choose_move(text,text),public.claim_cleanup(uuid),public.save_appearance(jsonb),public.apply_practice(text,text) to authenticated;
