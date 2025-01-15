create table if not exists migrations (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  applied_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS
alter table migrations enable row level security;

-- Create policy for authenticated users
create policy "Authenticated users can view migrations"
  on migrations for select
  using (auth.role() = 'authenticated'); 