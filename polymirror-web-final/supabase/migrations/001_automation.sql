create extension if not exists pgcrypto;

create table if not exists catalog_items (
  id uuid primary key default gen_random_uuid(),

  tmdb_id bigint not null,
  imdb_id text,

  media_type text not null
    check (media_type in ('movie', 'tv')),

  title text not null,
  overview text,
  poster_path text,
  backdrop_path text,

  original_language text,
  release_date date,
  first_air_date date,

  total_seasons integer,
  total_episodes integer,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (tmdb_id, media_type)
);

create table if not exists episodes (
  id uuid primary key default gen_random_uuid(),

  catalog_item_id uuid not null
    references catalog_items(id)
    on delete cascade,

  tmdb_id bigint not null,
  season_number integer not null,
  episode_number integer not null,

  name text,
  overview text,
  still_path text,

  air_date date,

  created_at timestamptz not null default now(),

  unique (
    tmdb_id,
    season_number,
    episode_number
  )
);

create table if not exists mirror_jobs (
  id uuid primary key default gen_random_uuid(),

  catalog_item_id uuid
    references catalog_items(id)
    on delete cascade,

  episode_id uuid
    references episodes(id)
    on delete cascade,

  tmdb_id bigint not null,
  imdb_id text,

  media_type text not null
    check (media_type in ('movie', 'tv')),

  season_number integer,
  episode_number integer,

  title text not null,

  source_url text,

  status text not null default 'pending'
    check (
      status in (
        'pending',
        'processing',
        'completed',
        'failed',
        'retry'
      )
    ),

  attempts integer not null default 0,

  max_attempts integer not null default 5,

  locked_at timestamptz,
  locked_by text,

  last_error text,

  next_attempt_at timestamptz not null default now(),

  started_at timestamptz,
  completed_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists mirror_jobs_status_idx
on mirror_jobs(status, next_attempt_at);

create index if not exists mirror_jobs_tmdb_idx
on mirror_jobs(tmdb_id);

create table if not exists mirror_results (
  id uuid primary key default gen_random_uuid(),

  job_id uuid not null
    references mirror_jobs(id)
    on delete cascade,

  provider text not null,

  status text not null default 'pending'
    check (
      status in (
        'pending',
        'processing',
        'completed',
        'failed'
      )
    ),

  external_id text,

  result_url text,
  embed_url text,
  raw_response jsonb,

  error text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(job_id, provider)
);

create index if not exists mirror_results_job_idx
on mirror_results(job_id);

create table if not exists worker_runs (
  id uuid primary key default gen_random_uuid(),

  worker_id text not null,

  started_at timestamptz not null default now(),
  finished_at timestamptz,

  jobs_claimed integer not null default 0,
  jobs_completed integer not null default 0,
  jobs_failed integer not null default 0,

  error text
);

create index if not exists worker_runs_started_idx
on worker_runs(started_at desc);


-- Atomic job claim.
create or replace function claim_mirror_jobs(
  p_worker_id text,
  p_limit integer default 3
)
returns setof mirror_jobs
language plpgsql
security definer
as $$
begin

  return query
  with candidates as (
    select id
    from mirror_jobs
    where
      (
        status in ('pending', 'retry')
        and next_attempt_at <= now()
      )
      or
      (
        status = 'processing'
        and locked_at < now() - interval '15 minutes'
      )
    order by created_at
    for update skip locked
    limit p_limit
  )

  update mirror_jobs j
  set
    status = 'processing',
    locked_at = now(),
    locked_by = p_worker_id,
    started_at = coalesce(started_at, now()),
    attempts = attempts + 1,
    updated_at = now()

  from candidates c
  where j.id = c.id

  returning j.*;

end;
$$;


-- Retry helper.
create or replace function retry_mirror_job(
  p_job_id uuid,
  p_error text
)
returns void
language plpgsql
security definer
as $$
declare
  v_attempts integer;
  v_max_attempts integer;
begin

  select attempts, max_attempts
  into v_attempts, v_max_attempts
  from mirror_jobs
  where id = p_job_id;

  update mirror_jobs
  set
    status =
      case
        when v_attempts >= v_max_attempts
        then 'failed'
        else 'retry'
      end,

    last_error = p_error,

    next_attempt_at =
      now()
      +
      (
        least(
          power(2, greatest(v_attempts - 1, 0)),
          60
        ) * interval '1 minute'
      ),

    locked_at = null,
    locked_by = null,
    updated_at = now()

  where id = p_job_id;

end;
$$;
