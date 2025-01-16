-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- Create the custom_squadrons table
create table custom_squadrons (
  id uuid default uuid_generate_v4() primary key,
  user_id text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  modified_at timestamp with time zone default timezone('utc'::text, now()),
  is_public boolean default false,
  
  -- Squadron metadata
  author text[],
  alias text,
  team text,
  release text,
  expansion text,
  type text default 'squadron',
  
  -- Core squadron data
  faction text not null,
  squadron_type text not null,
  name text not null,
  nicknames text[],
  ace_name text,
  unique_class text[],
  irregular boolean default false,
  
  -- Stats
  hull integer not null,
  speed integer not null,
  points integer not null,
  
  -- Complex data (stored as JSONB)
  tokens jsonb not null default '{
    "def_scatter": 0,
    "def_evade": 0,
    "def_brace": 0
  }'::jsonb,
  
  armament jsonb not null default '{
    "anti-squadron": [0,0,0],
    "anti-ship": [0,0,0]
  }'::jsonb,
  
  abilities jsonb not null default '{
    "adept": 0,
    "ai-battery": 0,
    "ai-antisquadron": 0,
    "assault": false,
    "bomber": false,
    "cloak": false,
    "counter": 0,
    "dodge": 0,
    "escort": false,
    "grit": false,
    "heavy": false,
    "intel": false,
    "relay": 0,
    "rogue": false,
    "scout": false,
    "screen": false,
    "snipe": 0,
    "strategic": false,
    "swarm": false
  }'::jsonb,
  
  -- Additional attributes
  ability text,
  is_unique boolean default false,
  ace boolean default false,
  
  -- Image paths
  silhouette text,
  artwork text,
  cardimage text,
  
  -- Search optimization
  searchable_text tsvector generated always as (
    to_tsvector('english', 
      coalesce(name, '') || ' ' || 
      coalesce(ace_name, '') || ' ' || 
      coalesce(ability, '')
    )
  ) stored
);

-- Enable RLS
alter table custom_squadrons enable row level security;

-- Create policies
create policy "Public squadrons are viewable by everyone"
  on custom_squadrons for select
  using (is_public = true);

create policy "Users can view their own squadrons"
  on custom_squadrons for select
  using (auth.jwt() ->> 'sub' = user_id);

create policy "Users can insert their own squadrons"
  on custom_squadrons for insert
  with check (auth.jwt() ->> 'sub' = user_id);

create policy "Users can update their own squadrons"
  on custom_squadrons for update
  using (auth.jwt() ->> 'sub' = user_id);

create policy "Users can delete their own squadrons"
  on custom_squadrons for delete
  using (auth.jwt() ->> 'sub' = user_id);

-- Create indexes
create index custom_squadrons_search_idx on custom_squadrons using gin(searchable_text);
create index custom_squadrons_faction_idx on custom_squadrons(faction); 