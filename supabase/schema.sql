-- Schema for when you point PetThrone at Supabase instead of .data/store.json
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz default now()
);

create table if not exists pets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) not null unique,
  name text not null,
  boast text not null default '',
  photo_url text not null,
  clicks int not null default 0,
  crowned_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists bids (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid references pets(id) not null,
  user_id uuid references users(id) not null,
  amount_cents int not null,
  stripe_session_id text unique,
  created_at timestamptz default now()
);

create table if not exists feed_events (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  actor_pet_id uuid references pets(id) not null,
  victim_pet_id uuid references pets(id),
  actor_name text not null,
  victim_name text,
  amount_cents int not null,
  created_at timestamptz default now()
);

alter table bids replica identity full;
alter table feed_events replica identity full;
