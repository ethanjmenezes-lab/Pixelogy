alter table public.story_cinematics drop constraint story_cinematics_cinematic_id_check;
alter table public.story_cinematics add constraint story_cinematics_cinematic_id_check check (
 cinematic_id in ('opening','shellshore-entry','sandy-intro','shellshore-clear','conspiracy-opening','conspiracy-ending','cinematic.opening','cinematic.ending')
 or cinematic_id ~ '^(shellshore|rustport|neon|mangroves|headquarters)-(briefing|boss|restored)$'
 or cinematic_id ~ '^cinematic\.(shellshore|rustport|boardwalk|mangroves|headquarters)\.(intro|outro)$'
);
