const HOSTS = {
  streamhg: {
    name: "StreamHG",
    env: "STREAMHG_API_KEY",
    documented: true
  },
  earnvids: {
    name: "EarnVids",
    env: "EARNVIDS_API_KEY",
    documented: true
  },
  rpmshare: {
    name: "RPMShare",
    env: "RPMSHARE_API_KEY",
    documented: true
  },
  streamp2p: { name: "StreamP2P", env: "STREAMP2P_API_KEY", documented: false },
  gdflix: { name: "GDFlix", env: "GDFLIX_API_KEY", documented: false },
  gdtot: { name: "GDTOT", env: "GDTOT_API_KEY", documented: false }
};

export async function createMirrorJobs({ url, title, hosts }) {
  return hosts.map((id, i) => {
    const h = HOSTS[id];
    if (!h) return { id: String(i + 1), host: id, status: "unsupported" };
    if (!process.env[h.env]) {
      return { id: String(i + 1), host: h.name, status: "API key not configured" };
    }
    if (!h.documented) {
      return { id: String(i + 1), host: h.name, status: "adapter pending API verification" };
    }
    return {
      id: String(i + 1),
      host: h.name,
      status: "queued",
      // The actual host-specific request is intentionally isolated in an adapter.
      // Add it after verifying the provider's current official API contract.
    };
  });
}