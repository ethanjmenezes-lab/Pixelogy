-- Live-safe fixture transactions: no coordinates, emails or persistent players.
begin;
insert into auth.users(id,email) values ('a3333333-3333-4333-8333-333333333333','walking-a@example.invalid'),('b4444444-4444-4444-8444-444444444444','walking-b@example.invalid');
select set_config('request.jwt.claim.sub','a3333333-3333-4333-8333-333333333333',true);
set local role authenticated;
select public.begin_walk();
reset role;
update private.walking_clocks set consumed_until=clock_timestamp()-interval '100 seconds' where user_id='a3333333-3333-4333-8333-333333333333';
set local role authenticated;
select public.credit_walk('a3333333-3333-4333-8333-333333333333','c5555555-5555-4555-8555-555555555555',50000,25000);
select public.credit_walk('a3333333-3333-4333-8333-333333333333','d6666666-6666-4666-8666-666666666666',50000,25000);
select public.credit_walk('a3333333-3333-4333-8333-333333333333','d6666666-6666-4666-8666-666666666666',50000,25000);
do $$ begin
 if not exists(select 1 from public.player_progression where player_xp=8 and battle_xp=5 and walking_mm=100000) then raise exception 'Wrong dual award or replay';end if;
 if exists(select 1 from public.cleanup_claims) then raise exception 'Walking awarded cleanup';end if;
 begin perform public.credit_walk('a3333333-3333-4333-8333-333333333333',gen_random_uuid(),100000,1000);raise exception 'Fast accepted';exception when raise_exception then if sqlerrm='Fast accepted' then raise;end if;end;
 begin perform public.credit_walk('a3333333-3333-4333-8333-333333333333',gen_random_uuid(),100000,100000);raise exception 'Future accepted';exception when raise_exception then if sqlerrm='Future accepted' then raise;end if;end;
 begin update public.player_progression set player_xp=9999;raise exception 'Direct XP accepted';exception when insufficient_privilege then null;end;
 begin perform public.save_appearance('{"nickname":"Test","skin":1,"hair":0,"clothing":0,"hairStyle":"short","hat":"none","motion":"system","outfit":"explorer"}');raise exception 'Locked cosmetic accepted';exception when raise_exception then if sqlerrm='Locked cosmetic accepted' then raise;end if;end;
end $$;
reset role;
-- Player level unlocks cosmetics, never crab main attacks.
update public.player_progression set player_xp=900 where user_id='a3333333-3333-4333-8333-333333333333';
set local role authenticated;
select public.save_appearance('{"nickname":"Test","skin":1,"hair":0,"clothing":0,"hairStyle":"short","hat":"none","motion":"system","outfit":"explorer"}');
do $$ begin
 begin perform public.choose_move('main','shell_slam');raise exception 'Player XP unlocked attack';exception when raise_exception then if sqlerrm='Player XP unlocked attack' then raise;end if;end;
end $$;
reset role;
-- Cap is enforced against server receipt day; partial remainder survives.
insert into public.walking_rewards values('a3333333-3333-4333-8333-333333333333',gen_random_uuid(),9890000,1000,9890000,0,0,clock_timestamp());
set local role authenticated;
select public.credit_walk('a3333333-3333-4333-8333-333333333333','e7777777-7777-4777-8777-777777777777',20000,10000);
do $$ begin
 if not exists(select 1 from public.player_progression where walking_mm=110000) then raise exception 'Daily cap failed';end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub','b4444444-4444-4444-8444-444444444444',true);
set local role authenticated;
do $$ begin
 begin perform public.credit_walk('a3333333-3333-4333-8333-333333333333',gen_random_uuid(),10000,10000);raise exception 'Foreign outbox accepted';exception when raise_exception then if sqlerrm<>'Walking account changed' then raise;end if;end;
 if exists(select 1 from public.walking_rewards) or exists(select 1 from public.player_progression) then raise exception 'Cross-user walking read';end if;
 begin perform public.credit_walk('b4444444-4444-4444-8444-444444444444',gen_random_uuid(),10000,10000);raise exception 'Unstarted accepted';exception when raise_exception then if sqlerrm='Unstarted accepted' then raise;end if;end;
end $$;
reset role;
rollback;
