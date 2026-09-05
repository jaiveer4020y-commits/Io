const TMDB_BASE = "https://api.themoviedb.org/3";

function headers() {
  const token = process.env.TMDB_ACCESS_TOKEN;

  if (!token) {
    throw new Error("TMDB_ACCESS_TOKEN is missing");
  }

  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/json"
  };
}

async function tmdb(path) {
  const response = await fetch(`${TMDB_BASE}${path}`, {
    headers: headers(),
    cache: "no-store"
  });

  if (!response.ok) {
    const text = await response.text();

    throw new Error(
      `TMDB ${response.status}: ${text.slice(0, 500)}`
    );
  }

  return response.json();
}


export async function getCatalog(category, page = 1) {
  switch (category) {

    case "popular-movies":
      return tmdb(`/movie/popular?page=${page}`);

    case "top-rated-movies":
      return tmdb(`/movie/top_rated?page=${page}`);

    case "now-playing":
      return tmdb(`/movie/now_playing?page=${page}`);

    case "indian-movies":
      return tmdb(
        `/discover/movie?with_origin_country=IN&page=${page}`
      );

    case "hindi-movies":
      return tmdb(
        `/discover/movie?with_original_language=hi&with_origin_country=IN&page=${page}`
      );

    case "punjabi-movies":
      return tmdb(
        `/discover/movie?with_original_language=pa&with_origin_country=IN&page=${page}`
      );


    case "popular-tv":
      return tmdb(`/tv/popular?page=${page}`);

    case "top-rated-tv":
      return tmdb(`/tv/top_rated?page=${page}`);

    case "indian-tv":
      return tmdb(
        `/discover/tv?with_origin_country=IN&page=${page}`
      );

    case "hindi-tv":
      return tmdb(
        `/discover/tv?with_original_language=hi&with_origin_country=IN&page=${page}`
      );

    case "punjabi-tv":
      return tmdb(
        `/discover/tv?with_original_language=pa&with_origin_country=IN&page=${page}`
      );

    default:
      throw new Error(`Unknown category: ${category}`);
  }
}


export async function getDetails(tmdbId, mediaType) {
  return tmdb(
    `/${mediaType}/${encodeURIComponent(tmdbId)}`
  );
}


export async function getExternalIds(tmdbId, mediaType) {
  return tmdb(
    `/${mediaType}/${encodeURIComponent(tmdbId)}/external_ids`
  );
}


export async function getTvSeason(
  tmdbId,
  season
) {
  return tmdb(
    `/tv/${encodeURIComponent(tmdbId)}/season/${encodeURIComponent(season)}`
  );
}
