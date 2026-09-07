function requireEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing ${name}`);
  }

  return value;
}

function buildUrl(template, values) {
  let output = template;

  for (const [key, value] of Object.entries(values)) {
    output = output.replaceAll(
      `{${key}}`,
      encodeURIComponent(String(value ?? ''))
    );
  }

  return output;
}

async function parseResponse(response) {
  const text = await response.text();

  let data;

  try {
    data = JSON.parse(text);
  } catch {
    data = {
      raw: text
    };
  }

  if (!response.ok) {
    throw new Error(
      `${response.status}: ${text.slice(0, 500)}`
    );
  }

  return data;
}


/*
 * Generic authorized source provider.
 *
 * Configure:
 *
 * AUTH_SOURCE_URL_TEMPLATE
 *
 * Example:
 *
 * https://your-authorized-provider.example/api/source?tmdb_id={tmdb_id}&imdb_id={imdb_id}&season={season}&episode={episode}
 *
 * The provider should return:
 *
 * {
 *   "url": "https://authorized.example/video.mp4"
 * }
 *
 * or
 *
 * {
 *   "url": "https://authorized.example/master.m3u8"
 * }
 */
export async function getAuthorizedSource(job) {

  const template =
    requireEnv('AUTH_SOURCE_URL_TEMPLATE');

  const url = buildUrl(
    template,
    {
      tmdb_id: job.tmdb_id,
      imdb_id: job.imdb_id,
      type: job.media_type,
      season: job.season_number,
      episode: job.episode_number
    }
  );

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json'
    },
    cache: 'no-store'
  });

  const data = await parseResponse(response);

  const source =
    data.url ||
    data.source ||
    data.stream_url ||
    data.streaming_url;

  if (!source) {
    throw new Error(
      'Authorized source provider did not return a URL'
    );
  }

  return source;
}


/*
 * StreamHG
 *
 * Official API style:
 *
 * GET /api/upload/url?key=...&url=...
 */
export async function uploadStreamHG(sourceUrl) {

  const key = requireEnv('STREAMHG_API_KEY');

  const endpoint =
    'https://streamhgapi.com/api/upload/url';

  const url = new URL(endpoint);

  url.searchParams.set('key', key);
  url.searchParams.set('url', sourceUrl);

  const response = await fetch(url, {
    method: 'GET',
    cache: 'no-store'
  });

  return parseResponse(response);
}


/*
 * EarnVids
 */
export async function uploadEarnVids(sourceUrl) {

  const key = requireEnv('EARNVIDS_API_KEY');

  const endpoint =
    'https://earnvidsapi.com/api/upload/url';

  const url = new URL(endpoint);

  url.searchParams.set('key', key);
  url.searchParams.set('url', sourceUrl);

  const response = await fetch(url, {
    method: 'GET',
    cache: 'no-store'
  });

  return parseResponse(response);
}


/*
 * RPMShare / Streamp2p
 *
 * These are configurable because your current API
 * documentation uses POST upload-by-URL.
 *
 * Set:
 *
 * RPM_SHARE_UPLOAD_URL
 * RPM_SHARE_API_KEY
 *
 * STREAMP2P_UPLOAD_URL
 * STREAMP2P_API_KEY
 *
 * Adjust the authentication header in these functions
 * to exactly match your provider's documentation.
 */

async function postUpload(
  endpoint,
  apiKey,
  sourceUrl,
  title
) {

  const response = await fetch(endpoint, {
    method: 'POST',

    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',

      'X-API-Key': apiKey
    },

    body: JSON.stringify({
      url: sourceUrl,
      name: title
    }),

    cache: 'no-store'
  });

  return parseResponse(response);
}


export async function uploadRPMShare(
  sourceUrl,
  title
) {

  const endpoint =
    requireEnv('RPM_SHARE_UPLOAD_URL');

  const key =
    requireEnv('RPM_SHARE_API_KEY');

  return postUpload(
    endpoint,
    key,
    sourceUrl,
    title
  );
}


export async function uploadStreamp2p(
  sourceUrl,
  title
) {

  const endpoint =
    requireEnv('STREAMP2P_UPLOAD_URL');

  const key =
    requireEnv('STREAMP2P_API_KEY');

  return postUpload(
    endpoint,
    key,
    sourceUrl,
    title
  );
}


export function extractProviderUrl(
  provider,
  data
) {

  if (!data) {
    return null;
  }

  const result = data.result || data.data || data;

  return (
    result.url ||
    result.link ||
    result.embed_url ||
    result.embedUrl ||
    result.player_url ||
    result.playerUrl ||
    result.filecode ||
    result.code ||
    data.url ||
    data.link ||
    data.embed_url ||
    null
  );
}
