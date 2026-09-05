create extension if not exists pgcrypto;


-- ==========================================
-- CONTENT ITEMS
-- ==========================================

create table if not exists content_items (
  id uuid primary key default gen_random_uuid(),

  tmdb_id integer not null,

  imdb_id text,

  media_type text not null
    check (media_type in ('movie', 'tv')),

  title text,

  poster_path text,

  overview text,

  release_date text,

  created_at timestamptz default now(),

  updated_at timestamptz default now(),

  unique(tmdb_id, media_type)
);


-- ==========================================
-- EPISODES
-- ==========================================

create table if not exists episodes (
  id uuid primary key default gen_random_uuid(),

  tmdb_id integer not null,

  imdb_id text,

  season integer not null,

  episode integer not null,

  title text,

  source_url text,

  created_at timestamptz default now(),

  updated_at timestamptz default now(),

  unique(tmdb_id, season, episode)
);


-- ==========================================
-- BATCHES
-- ==========================================

create table if not exists batches (
  id uuid primary key default gen_random_uuid(),

  category text not null,

  media_type text not null,

  requested integer not null default 0,

  queued integer not null default 0,

  processing integer not null default 0,

  completed integer not null default 0,

  failed integer not null default 0,

  status text not null default 'queued'
    check (
      status in (
        'queued',
        'running',
        'completed',
        'paused',
        'failed'
      )
    ),

  created_at timestamptz default now(),

  updated_at timestamptz default now()
);


-- ==========================================
-- JOBS
-- ==========================================

create table if not exists upload_jobs (
  id uuid primary key default gen_random_uuid(),

  batch_id uuid references batches(id) on delete cascade,

  tmdb_id integer not null,

  imdb_id text,

  media_type text not null,

  season integer,

  episode integer,

  title text,

  source_url text,

  status text not null default 'pending'
    check (
      status in (
        'pending',
        'resolving',
        'uploading',
        'processing',
        'completed',
        'partial',
        'failed'
      )
    ),

  attempts integer not null default 0,

  error_message text,

  locked_at timestamptz,

  created_at timestamptz default now(),

  updated_at timestamptz default now()
);


-- ==========================================
-- PROVIDER RESULTS
-- ==========================================

create table if not exists provider_results (
  id uuid primary key default gen_random_uuid(),

  job_id uuid references upload_jobs(id) on delete cascade,

  provider text not null,

  status text not null default 'pending'
    check (
      status in (
        'pending',
        'submitted',
        'processing',
        'completed',
        'failed'
      )
    ),

  task_id text,

  result_url text,

  embed_url text,

  file_code text,

  response_json jsonb,

  error_message text,

  attempts integer not null default 0,

  updated_at timestamptz default now(),

  created_at timestamptz default now(),

  unique(job_id, provider)
);


-- ==========================================
-- INDEXES
-- ==========================================

create index if not exists upload_jobs_status_idx
on upload_jobs(status);

create index if not exists upload_jobs_batch_idx
on upload_jobs(batch_id);

create index if not exists upload_jobs_tmdb_idx
on upload_jobs(tmdb_id);

create index if not exists provider_results_job_idx
on provider_results(job_id);

create index if not exists provider_results_status_idx
on provider_results(status);
