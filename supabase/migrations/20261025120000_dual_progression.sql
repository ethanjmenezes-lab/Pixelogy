-- Additive progression: battle_xp remains the sole Crab XP balance.
alter table public.player_progression
 add column player_xp integer not null default 0 check(player_xp>=0),
 add column walking_mm bigint not null default 0 check(walking_mm>=0),
 add column player_level integer generated always as (1+player_xp/100) stored,
 add column crab_level integer generated always as (1+battle_xp/100) stored;
-- One-time legacy explorer preservation. Future cleanups never alter Player XP.
insert into public.player_progression(user_id,player_xp)
 select user_id,sum(xp)::integer from public.cleanup_claims group by user_id
 on conflict(user_id) do update set player_xp=excluded.player_xp;
create table private.progression_rules (id boolean primary key default true check(id), config jsonb not null);
insert into private.progression_rules(config) values ('{"xpPerLevel":100,"milestoneMm":100000,"playerXp":8,"crabXp":5,"dailyCapMm":10000000,"minSpeed":0.3,"maxSpeed":2.7,"maxAccuracy":20,"minDistance":5,"maxGapMs":30000,"maxBatchMs":120000,"syncMs":10000}'::jsonb);
create table public.walking_rewards (
 user_id uuid not null references auth.users(id) on delete cascade,
 event_id uuid not null,
 requested_mm integer not null,
 duration_ms integer not null,
 accepted_mm integer not null,
 player_xp integer not null,
 crab_xp integer not null,
 credited_at timestamptz not null default clock_timestamp(),
 primary key(user_id,event_id)
);
alter table public.walking_rewards enable row level security;
revoke all on public.walking_rewards from public,anon,authenticated;
grant select on public.walking_rewards to authenticated;
create policy owner_read on public.walking_rewards for select to authenticated using ((select auth.uid())=user_id);
create index on public.walking_rewards(user_id,credited_at);
create table private.walking_clocks(user_id uuid primary key references auth.users(id) on delete cascade, consumed_until timestamptz not null);
revoke all on private.walking_clocks, private.progression_rules from public,anon,authenticated;
create function public.begin_walk() returns void language plpgsql security definer set search_path='' as $$
declare u uuid:=private.lock_player(); begin
 insert into private.walking_clocks values(u,clock_timestamp()) on conflict do nothing;
end $$;
-- Browser summaries are not proof of physical walking. Enforce server-time,
-- quantity, daily cap and replay constraints without storing precise coordinates.
create function public.credit_walk(event_id uuid,distance_mm integer,duration_ms integer) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=private.lock_player(); cfg jsonb; prior public.walking_rewards; used_at timestamptz; t timestamptz:=clock_timestamp(); used_today bigint; accepted integer; old_total bigint; milestones integer; px integer; cx integer; begin
 select * into prior from public.walking_rewards w where w.user_id=u and w.event_id=credit_walk.event_id;
 if found then
  if prior.requested_mm<>distance_mm or prior.duration_ms<>credit_walk.duration_ms then raise exception 'Walking event already used'; end if;
  return jsonb_build_object('playerXp',0,'crabXp',0,'replayed',true);
 end if;
 select config into cfg from private.progression_rules;
 if event_id is null or distance_mm is null or duration_ms is null or duration_ms<1000 or duration_ms>(cfg->>'maxBatchMs')::integer or distance_mm<=0 or distance_mm::numeric/duration_ms not between (cfg->>'minSpeed')::numeric and (cfg->>'maxSpeed')::numeric then raise exception 'Invalid walking summary'; end if;
 select consumed_until into used_at from private.walking_clocks where user_id=u for update;
 if not found then raise exception 'Start walking online first'; end if;
 if (select count(*) from public.walking_rewards where user_id=u and credited_at>t-interval '1 hour')>=3600 then raise exception 'Walking sync limit reached'; end if;
 used_at:=greatest(used_at,t-make_interval(secs=>(cfg->>'maxBatchMs')::numeric/1000));
 if used_at+make_interval(secs=>duration_ms::numeric/1000)>t then raise exception 'Walking sync is ahead of server time. Retry shortly.'; end if;
 select coalesce(sum(accepted_mm),0) into used_today from public.walking_rewards where user_id=u and credited_at>=date_trunc('day',t at time zone 'UTC') at time zone 'UTC';
 accepted:=greatest(0,least(distance_mm,(cfg->>'dailyCapMm')::bigint-used_today));
 select walking_mm into old_total from public.player_progression where user_id=u;
 milestones:=((old_total+accepted)/(cfg->>'milestoneMm')::bigint)-(old_total/(cfg->>'milestoneMm')::bigint);
 px:=milestones*(cfg->>'playerXp')::integer;cx:=milestones*(cfg->>'crabXp')::integer;
 insert into public.walking_rewards values(u,event_id,distance_mm,duration_ms,accepted,px,cx,t);
 update private.walking_clocks set consumed_until=used_at+make_interval(secs=>duration_ms::numeric/1000) where user_id=u;
 update public.player_progression set walking_mm=walking_mm+accepted,player_xp=player_xp+px,battle_xp=battle_xp+cx where user_id=u;
 return jsonb_build_object('playerXp',px,'crabXp',cx,'acceptedMm',accepted,'replayed',false);
end $$;
create or replace function public.save_appearance(appearance jsonb) returns void language plpgsql security definer set search_path='' as $$
declare u uuid:=private.lock_player(); lv integer; begin
 select player_level into lv from public.player_progression where user_id=u;
 if coalesce(appearance is null or jsonb_typeof(appearance)<>'object' or jsonb_typeof(appearance->'nickname')<>'string' or exists(select 1 from jsonb_each(appearance) where value='null'::jsonb) or octet_length(appearance::text)>2000 or length(trim(appearance->>'nickname')) not between 1 and 24
 or not (appearance ?& array['nickname','skin','hair','clothing','hairStyle','hat','motion'])
 or (appearance->>'skin') !~ '^[0-3]$' or (appearance->>'hair') !~ '^[0-3]$' or (appearance->>'clothing') !~ '^[0-5]$'
 or (appearance->>'hairStyle') not in ('short','long','bun') or (appearance->>'hat') not in ('none','cap') or (appearance->>'motion') not in ('system','reduced')
 or coalesce(appearance->>'outfit','plain') not in ('plain','beach','explorer') or coalesce(appearance->>'accessory','none') not in ('none','sunglasses'),true) then raise exception 'Invalid appearance';end if;
 if ((appearance->>'clothing')::integer>=4 and lv<2) or (appearance->>'hairStyle'='bun' and lv<3) or (appearance->>'outfit'='beach' and lv<5) or (appearance->>'accessory'='sunglasses' and lv<8) or (appearance->>'outfit'='explorer' and lv<10) then raise exception 'Cosmetic locked'; end if;
 insert into public.player_profiles(user_id,appearance) values(u,appearance) on conflict(user_id) do update set appearance=excluded.appearance;
end $$;
revoke all on function public.begin_walk(),public.credit_walk(uuid,integer,integer) from public,anon;
grant execute on function public.begin_walk(),public.credit_walk(uuid,integer,integer) to authenticated;
