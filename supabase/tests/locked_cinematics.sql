begin;
insert into auth.users(id,email) values('c3333333-3333-4333-8333-333333333333','locked-story@example.invalid');
select set_config('request.jwt.claim.sub','c3333333-3333-4333-8333-333333333333',true);
set local role authenticated;
select public.watch_story('opening');
select public.watch_story('cinematic.opening');
select public.watch_story('cinematic.opening');
select public.watch_story('cinematic.ending');
select public.watch_story('cinematic.'||region||'.'||phase)
 from unnest(array['shellshore','rustport','boardwalk','mangroves','headquarters']) region
 cross join unnest(array['intro','outro']) phase;
do $$ begin
 if (select count(*) from public.story_cinematics where user_id=auth.uid())<>13 then raise exception 'Cinematic flags lost or duplicated'; end if;
end $$;
reset role;
rollback;
