function applyTemplate(template, values) {
  let output = String(template || "");

  for (const [key, value] of Object.entries(values)) {
    output = output.replaceAll(
      `{${key}}`,
      encodeURIComponent(String(value ?? ""))
    );
  }

  return output;
}


export async function getAuthorizedSource({
  tmdbId,
  imdbId,
  mediaType,
  season = null,
  episode = null
}) {

  const base =
    process.env.AUTHORIZED_SOURCE_URL;

  if (!base) {
    throw new Error(
      "AUTHORIZED_SOURCE_URL is not configured"
    );
  }

  /*
   * Example:
   *
   * https://example.com/api/source
   *
   * receives:
   *
   * tmdb
   * imdb
   * type
   * season
   * episode
   */

  const url = new URL(base);

  url.searchParams.set(
    "tmdb",
    String(tmdbId)
  );

  if (imdbId) {
    url.searchParams.set(
      "imdb",
      String(imdbId)
    );
  }

  url.searchParams.set(
    "type",
    mediaType
  );

  if (season !== null) {
    url.searchParams.set(
      "season",
      String(season)
    );
  }

  if (episode !== null) {
    url.searchParams.set(
      "episode",
      String(episode)
    );
  }


  const headers = {
    Accept: "application/json"
  };

  if (process.env.AUTHORIZED_SOURCE_KEY) {
    headers.Authorization =
      `Bearer ${process.env.AUTHORIZED_SOURCE_KEY}`;
  }


  const response = await fetch(url, {
    method: "GET",
    headers,
    cache: "no-store"
  });


  if (!response.ok) {
    throw new Error(
      `Source provider returned ${response.status}`
    );
  }


  const contentType =
    response.headers.get("content-type") || "";


  if (contentType.includes("application/json")) {

    const data = await response.json();

    /*
     * Supported response examples:
     *
     * {
     *   "url": "https://..."
     * }
     *
     * OR
     *
     * {
     *   "sourceUrl": "https://..."
     * }
     */

    const sourceUrl =
      data.url ||
      data.sourceUrl ||
      data.source_url ||
      data.videoUrl ||
      data.video_url;


    if (!sourceUrl) {
      throw new Error(
        "Authorized source provider did not return a video URL"
      );
    }

    return {
      sourceUrl,
      raw: data
    };
  }


  const text = await response.text();

  if (!text.trim()) {
    throw new Error(
      "Authorized source provider returned empty response"
    );
  }

  return {
    sourceUrl: text.trim(),
    raw: text
  };
}
