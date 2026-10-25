alter table public.cleanup_claims add column state_code text check(state_code is null or state_code in ('AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY')),
 add column imported_guest boolean not null default false;
-- Old one-argument clients remain compatible. First receipt fixes the location;
-- a replay cannot recolor or move an existing cleanup.
create function public.claim_cleanup_state(discovery uuid,state_code text default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=private.lock_player(); result public.cleanup_claims; begin
 select * into result from public.cleanup_claims where discovery_id=discovery and user_id=u;
 if found then return to_jsonb(result);end if;
 perform public.claim_cleanup(discovery);
 update public.cleanup_claims set state_code=claim_cleanup_state.state_code where discovery_id=discovery and user_id=u returning * into result;
 return to_jsonb(result);
end $$;
revoke all on function public.claim_cleanup_state(uuid,text) from public,anon;
grant execute on function public.claim_cleanup_state(uuid,text) to authenticated;
