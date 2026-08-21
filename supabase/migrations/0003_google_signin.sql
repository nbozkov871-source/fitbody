-- Hardens profile creation now that accounts can also arrive through Google.
--
-- The password form always sends full_name, so the original trigger could read
-- one field and stop. An OAuth provider decides for itself what it puts in the
-- metadata, and a Google account without a name set would have produced a
-- profile with a null name that no screen has anything to show for.

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      -- Last resort: the part of the address before the @, so the interface
      -- always has something to greet the person with.
      split_part(new.email, '@', 1)
    ),
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'trainer')
  )
  -- Linking a Google identity to an address that already signed up with a
  -- password fires this trigger again; the existing profile is the good one.
  on conflict (id) do nothing;

  return new;
end;
$$;
