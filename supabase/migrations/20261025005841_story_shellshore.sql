-- Chapter one. No changes to existing inventory, cleanup claims or practice saves.
create table public.story_progress (
 user_id uuid references auth.users(id) on delete cascade,
 stage_id text check(stage_id in ('shellshore-1','shellshore-2','shellshore-3','shellshore-4','shellshore-5')),
 best_stars integer not null check(best_stars between 1 and 3),
 cleared_at timestamptz not null default now(), primary key(user_id,stage_id)
);
create table public.story_matches (
 id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade,
 state jsonb not null, version integer not null, awarded_xp integer not null default 0,
 created_at timestamptz not null default now()
);
create table public.story_cinematics (
 user_id uuid references auth.users(id) on delete cascade,
 cinematic_id text check(cinematic_id in ('opening','shellshore-entry','sandy-intro','shellshore-clear')),
 primary key(user_id,cinematic_id)
);
do $$ declare t text; begin
 foreach t in array array['story_progress','story_matches','story_cinematics'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon,authenticated',t);
 execute format('grant select on public.%I to authenticated',t);
 execute format('create policy owner_read on public.%I for select to authenticated using ((select auth.uid())=user_id)',t);
 end loop;
end $$;
create index on public.story_matches(user_id,created_at);
create function public.watch_story(cinematic text) returns void language plpgsql security definer set search_path='' as $$
 declare u uuid:=private.lock_player(); begin
 insert into public.story_cinematics(user_id,cinematic_id) values(u,cinematic) on conflict do nothing;
 end $$;
create function public.apply_story(payload text,signature text) returns jsonb language plpgsql security definer set search_path='' as $$
 declare u uuid:=private.lock_player(); data jsonb:=private.verify_ticket(payload,signature,'story');
 s jsonb:=data->'state'; mid uuid:=(s->>'id')::uuid; sid text:=s->>'storyStageId';
 old jsonb; old_version integer; reward integer:=0; first_clear boolean; stars integer:=(data->>'stars')::integer;
 begin
 if s->>'mode' is distinct from 'story' or sid is null or sid not in ('shellshore-1','shellshore-2','shellshore-3','shellshore-4','shellshore-5') then raise exception 'Unknown story stage'; end if;
 select state,version into old,old_version from public.story_matches where id=mid and user_id=u for update;
 if not found then
   if (data->>'expectedVersion')::integer<>-1 or (s->>'version')::integer not in (0,1) or s->>'status'<>'active' then raise exception 'Unknown match'; end if;
   if sid='shellshore-5' and (select count(*) from public.story_progress where user_id=u and stage_id in ('shellshore-1','shellshore-2','shellshore-3','shellshore-4'))<>4 then raise exception 'Boss locked'; end if;
   if (select count(*) from public.story_matches where user_id=u and created_at>now()-interval '1 hour')>=30 then raise exception 'Story battle limit reached. Try later.'; end if;
   insert into public.story_matches(id,user_id,state,version) values(mid,u,s,(s->>'version')::integer);
 else
   if old_version<>(data->>'expectedVersion')::integer or old->>'status'<>'active' then return old; end if;
   if old->>'storyStageId'<>sid then raise exception 'Stage mismatch'; end if;
   if s->>'status'='completed' and s->>'winnerId'='player' then
     if stars is null or stars not between 1 and 3 then raise exception 'Invalid stars'; end if;
     first_clear:=not exists(select 1 from public.story_progress where user_id=u and stage_id=sid);
     insert into public.story_progress(user_id,stage_id,best_stars) values(u,sid,stars)
     on conflict(user_id,stage_id) do update set best_stars=greatest(story_progress.best_stars,excluded.best_stars);
     -- Repeat victories improve stars but grant zero XP: no farming or duplicate first clears.
     if first_clear then reward:=case when sid='shellshore-5' then 80 else 40 end; end if;
     update public.player_progression set battle_xp=battle_xp+reward where user_id=u;
   end if;
   update public.story_matches set state=s,version=(s->>'version')::integer,awarded_xp=reward where id=mid;
 end if;
 return s;
 end $$;
revoke all on function public.watch_story(text),public.apply_story(text,text) from public,anon;
grant execute on function public.watch_story(text),public.apply_story(text,text) to authenticated;
