
create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  storage_key text not null unique,
  uploaded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.revision_assets (
  revision_id uuid not null references public.guide_revisions (id) on delete cascade,
  asset_id uuid not null references public.media_assets (id) on delete cascade,
  primary key (revision_id, asset_id)
);

create index revision_assets_asset_id_idx on public.revision_assets (asset_id);


insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing; -- to prevent dupe error

-- 3. Storage Security Fix
alter table storage.objects enable row level security;

create policy "Media bucket files are public"
  on storage.objects for select
  using (bucket_id = 'media');

create policy "Users can upload files to media bucket"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'media' and auth.uid() = owner);

-- 4. Table row level
alter table public.media_assets enable row level security;
alter table public.revision_assets enable row level security;

create policy "Media assets are viewable by everyone"
  on public.media_assets for select
  using (true);

create policy "Authenticated users can upload their own media"
  on public.media_assets for insert
  to authenticated
  with check (uploaded_by = auth.uid());

create policy "Revision asset links are viewable by everyone"
  on public.revision_assets for select
  using (true);

create policy "Revision authors can link assets to their draft revisions"
  on public.revision_assets for insert
  to authenticated
  with check (
    exists (
      select 1 from public.guide_revisions r
      where r.id = revision_id
        and r.author_id = auth.uid()
        and r.status = 'draft'
    )
  );
