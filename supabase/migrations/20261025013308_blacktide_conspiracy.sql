-- Additive narrative migration: retain all old stage IDs, clears, stars, XP,
-- match snapshots and watched flags. Evidence/restoration derive from boss clears.
alter table public.story_progress drop constraint story_progress_stage_id_check;
alter table public.story_progress add constraint story_progress_stage_id_check check(stage_id ~ '^(shellshore|rustport|neon|mangroves|headquarters)-[1-5]$');
alter table public.story_cinematics drop constraint story_cinematics_cinematic_id_check;
alter table public.story_cinematics add constraint story_cinematics_cinematic_id_check check(
 cinematic_id in ('opening','shellshore-entry','sandy-intro','shellshore-clear','conspiracy-opening','conspiracy-ending')
 or cinematic_id ~ '^(shellshore|rustport|neon|mangroves|headquarters)-(briefing|boss|restored)$'
);
create or replace function public.apply_story(payload text,signature text) returns jsonb language plpgsql security definer set search_path='' as $$
 declare u uuid:=private.lock_player(); data jsonb:=private.verify_ticket(payload,signature,'story');
 s jsonb:=data->'state'; mid uuid:=(s->>'id')::uuid; sid text:=s->>'storyStageId';
 region_keys text[]:=array['shellshore','rustport','neon','mangroves','headquarters']; region_key text:=split_part(sid,'-',1); region_no integer;
 old jsonb; old_version integer; reward integer:=0; first_clear boolean; stars integer:=(data->>'stars')::integer;
 begin
 if s->>'mode' is distinct from 'story' or sid is null or sid !~ '^(shellshore|rustport|neon|mangroves|headquarters)-[1-5]$' then raise exception 'Unknown story stage'; end if;
 region_no:=array_position(region_keys,region_key);
 select state,version into old,old_version from public.story_matches where id=mid and user_id=u for update;
 if not found then
   if (data->>'expectedVersion')::integer<>-1 or (s->>'version')::integer not in (0,1) or s->>'status'<>'active' then raise exception 'Unknown match'; end if;
   if region_no>1 and not exists(select 1 from public.story_progress where user_id=u and stage_id=region_keys[region_no-1]||'-5') then raise exception 'Region locked'; end if;
   if right(sid,2)='-5' and (select count(*) from public.story_progress where user_id=u and stage_id in (region_key||'-1',region_key||'-2',region_key||'-3',region_key||'-4'))<>4 then raise exception 'Boss locked'; end if;
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
     if first_clear then reward:=case when right(sid,2)='-5' then 80 else 40 end; end if;
     update public.player_progression set battle_xp=battle_xp+reward where user_id=u;
   end if;
   update public.story_matches set state=s,version=(s->>'version')::integer,awarded_xp=reward where id=mid;
 end if;
 return s;
 end $$;
