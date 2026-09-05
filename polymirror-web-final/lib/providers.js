function encode(value) {
  return encodeURIComponent(String(value ?? ""));
}


function extractResult(data) {
  if (!data) {
    return {};
  }

  const result =
    data.result ||
    data.data ||
    data.video ||
    data;

  return {
    taskId:
      result.task_id ||
      result.taskId ||
      result.id ||
      data.task_id ||
      data.taskId ||
      null,

    fileCode:
      result.filecode ||
      result.file_code ||
      result.code ||
      data.filecode ||
      null,

    resultUrl:
      result.url ||
      result.link ||
      result.result_url ||
      result.resultUrl ||
      null,

    embedUrl:
      result.embed_url ||
      result.embedUrl ||
      result.embed ||
      null
  };
}


async function requestJson(
  url,
  options = {}
) {

  const response = await fetch(url, {
    ...options,
    cache: "no-store"
  });

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
      `${response.status}: ${
        typeof data === "string"
          ? data
          : JSON.stringify(data)
      }`
    );
  }

  return data;
}


/* =========================================================
   STREAMHG
   ========================================================= */

export async function streamhgUpload(
  sourceUrl,
  title
) {

  const key =
    process.env.STREAMHG_API_KEY;

  if (!key) {
    throw new Error(
      "STREAMHG_API_KEY missing"
    );
  }

  const url =
    `https://streamhgapi.com/api/upload/url` +
    `?key=${encode(key)}` +
    `&url=${encode(sourceUrl)}`;

  const data = await requestJson(url);

  return {
    provider: "streamhg",
    ...extractResult(data),
    response: data
  };
}


/* =========================================================
   EARNVIDS
   ========================================================= */

export async function earnvidsUpload(
  sourceUrl,
  title
) {

  const key =
    process.env.EARNVIDS_API_KEY;

  if (!key) {
    throw new Error(
      "EARNVIDS_API_KEY missing"
    );
  }

  const url =
    `https://earnvidsapi.com/api/upload/url` +
    `?key=${encode(key)}` +
    `&url=${encode(sourceUrl)}`;

  const data = await requestJson(url);

  return {
    provider: "earnvids",
    ...extractResult(data),
    response: data
  };
}


/* =========================================================
   GENERIC POST PROVIDER
   ========================================================= */

async function postProvider({
  provider,
  endpoint,
  apiKey,
  sourceUrl,
  title
}) {

  if (!endpoint) {
    throw new Error(
      `${provider} endpoint not configured`
    );
  }

  /*
   * This is deliberately generic.
   *
   * Configure the exact authentication/body required
   * by the provider's current API documentation.
   */

  const body = {
    url: sourceUrl,
    name: title || "Video"
  };

  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json"
  };

  if (apiKey) {
    headers.Authorization =
      `Bearer ${apiKey}`;
  }

  const data = await requestJson(
    endpoint,
    {
      method: "POST",
      headers,
      body: JSON.stringify(body)
    }
  );

  return {
    provider,
    ...extractResult(data),
    response: data
  };
}


/* =========================================================
   RPMSHARE
   ========================================================= */

export async function rpmshareUpload(
  sourceUrl,
  title
) {

  return postProvider({
    provider: "rpmshare",
    endpoint:
      process.env.RPMSHARE_UPLOAD_ENDPOINT,
    apiKey:
      process.env.RPMshare_API_KEY,
    sourceUrl,
    title
  });
}


/* =========================================================
   STREAMP2P
   ========================================================= */

export async function streamp2pUpload(
  sourceUrl,
  title
) {

  return postProvider({
    provider: "streamp2p",
    endpoint:
      process.env.STREAMP2P_UPLOAD_ENDPOINT,
    apiKey:
      process.env.STREAMP2P_API_KEY,
    sourceUrl,
    title
  });
}


export const providers = {
  streamhg: streamhgUpload,
  earnvids: earnvidsUpload,
  rpmshare: rpmshareUpload,
  streamp2p: streamp2pUpload
};
