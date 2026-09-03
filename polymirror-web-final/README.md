# PolyMirror

Client-configurable URL mirroring dashboard for documented upload-by-URL APIs.

## How it works

1. Add each provider API key in **Settings**.
2. Configure the provider's upload-by-URL endpoint using `{key}` and `{url}` placeholders.
3. Configure a CORS proxy prefix such as `https://workingg.vercel.app/api/proxy?url=`.
4. The browser builds the provider request, URL-encodes the complete provider URL, then sends it through the CORS proxy.
5. Requests to all selected providers run in parallel.
6. The response parser extracts `filecode`, `task_id`, or URL fields and the UI combines result URLs into one list and iframe.

## Important

API keys are stored in browser localStorage in this client-side design. Anyone with access to that browser profile can inspect them. Use only with accounts and URLs you are authorized to use.

Official documentation used for the included adapters:
- https://streamhg.com/api.html
- https://earnvids.com/api.html
- https://rpmshare.com/api-document/index.html
