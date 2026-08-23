-- Deleting a client used to be impossible from the app, and for good reason:
-- everything hangs off clients.id with `on delete cascade`, so one wrong click
-- would take the caliper sessions, the tape readings and the nutrition plans
-- with it. This marks the row instead of removing it, so a mistake is a click
-- away from being undone.
--
-- Safe to run more than once.

alter table clients add column if not exists deleted_at timestamptz;

-- Every list the trainer sees filters on this, so it earns an index even on a
-- table this small.
create index if not exists clients_deleted_at_idx on clients(deleted_at);
