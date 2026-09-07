const TMDB_BASE = 'https://api.themoviedb.org/3';

const EXTERNAL_IDS_BASE =
  'https://search-proxy.bingeoutofficial.workers.dev';

function headers() {
  const token = process.env.TMDB_ACCESS_TOKEN;

  if (!token) {
    throw new Error('TMDB_ACCESS_TOKEN is missing');
  }

  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json'
  };
}

async function tmdbFetch(path) {
  const response = await fetch(
    `${TMDB_BASE}${path}`,
    {
      headers: headers(),
      cache: 'no-store'
    }
  );

  if (!response.ok) {
    throw new Error(
      `TMDB ${response.status}: ${await response.text()}`
    );
  }

  return response.json();
}

export async function getMovie(tmdbId) {
  return tmdbFetch(`/movie/${encodeURIComponent(tmdbId)}`);
}

export async function getTv(tmdbId) {
  return tmdbFetch(`/tv/${encodeURIComponent(tmdbId)}`);
}

export async function getMovieExternalIds(tmdbId) {
  return tmdbFetch(
    `/movie/${encodeURIComponent(tmdbId)}/external_ids`
  );
}

export async function getTvExternalIds(tmdbId) {
  return tmdbFetch(
    `/tv/${encodeURIComponent(tmdbId)}/external_ids`
  );
}

export async function getExternalIds(type, tmdbId) {
  const url =
    `${EXTERNAL_IDS_BASE}/` +
    `${type}/${encodeURIComponent(tmdbId)}/external_ids`;

  const response = await fetch(url, {
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(
      `External ID API ${response.status}: ${await response.text()}`
    );
  }

  return response.json();
}

export async function getSeason(
  tmdbId,
  seasonNumber
) {
  return tmdbFetch(
    `/tv/${encodeURIComponent(tmdbId)}/season/${encodeURIComponent(seasonNumber)}`
  );
}

export async function getCatalog(category) {

  const routes = {
    popular_movies:
      '/movie/popular',

    top_rated_movies:
      '/movie/top_rated',

    now_playing:
      '/movie/now_playing',

    popular_tv:
      '/tv/popular',

    top_rated_tv:
      '/tv/top_rated',

    on_the_air_tv:
      '/tv/on_the_air',

    hindi_movies:
      '/discover/movie?with_original_language=hi&with_origin_country=IN',

    punjabi_movies:
      '/discover/movie?with_original_language=pa&with_origin_country=IN',

    hindi_tv:
      '/discover/tv?with_original_language=hi&with_origin_country=IN',

    punjabi_tv:
      '/discover/tv?with_original_language=pa&with_origin_country=IN'
  };

  const route = routes[category];

  if (!route) {
    throw new Error(`Unknown catalog category: ${category}`);
  }

  return tmdbFetch(`${route}${route.includes('?') ? '&' : '?'}page=1`);
}
