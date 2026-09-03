'use client';

import { useEffect, useMemo, useState } from 'react';

const DEFAULT_HOSTS = [
  { id: 'streamhg', name: 'StreamHG', endpoint: 'https://streamhgapi.com/api/upload/url?key={key}&url={url}', docs: 'https://streamhg.com/api.html', resultTemplate: 'https://streamhg.com/{filecode}' },
  { id: 'earnvids', name: 'EarnVids', endpoint: 'https://earnvidsapi.com/api/upload/url?key={key}&url={url}', docs: 'https://earnvids.com/api.html', resultTemplate: 'https://earnvids.com/{filecode}' },
  { id: 'rpmshare', name: 'RPMShare', endpoint: 'https://rpmshare.com/api/upload/url?key={key}&url={url}', docs: 'https://rpmshare.com/api-document/index.html', resultTemplate: 'https://rpmshare.com/{filecode}' },
];
const STORAGE = 'polymirror-config-v2';

function loadConfig() {
  if (typeof window === 'undefined') return { proxy: 'https://workingg.vercel.app/api/proxy?url=', hosts: DEFAULT_HOSTS.map(x => ({ ...x, key: '' })) };
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE) || 'null');
    return saved || { proxy: 'https://workingg.vercel.app/api/proxy?url=', hosts: DEFAULT_HOSTS.map(x => ({ ...x, key: '' })) };
  } catch { return { proxy: 'https://workingg.vercel.app/api/proxy?url=', hosts: DEFAULT_HOSTS.map(x => ({ ...x, key: '' })) }; }
}

function buildTarget(template, key, url, title) {
  return template
    .replaceAll('{key}', encodeURIComponent(key))
    .replaceAll('{url}', encodeURIComponent(url))
    .replaceAll('{title}', encodeURIComponent(title || ''));
}

function pickValue(obj, names) {
  if (!obj || typeof obj !== 'object') return '';
  for (const n of names) if (typeof obj[n] === 'string' && obj[n]) return obj[n];
  return '';
}

function extractResult(data, template) {
  const seen = new Set();
  let filecode = '', taskId = '', directUrl = '', pageUrl = '';
  function walk(v) {
    if (!v || typeof v !== 'object' || seen.has(v)) return;
    seen.add(v);
    if (Array.isArray(v)) { v.forEach(walk); return; }
    filecode ||= pickValue(v, ['filecode', 'file_code']);
    taskId ||= pickValue(v, ['task_id', 'taskId']);
    directUrl ||= pickValue(v, ['url', 'link', 'hls_direct', 'direct_url']);
    pageUrl ||= pickValue(v, ['page_url', 'player_url', 'embed_url']);
    Object.values(v).forEach(walk);
  }
  walk(data);
  const generated = pageUrl || directUrl || (filecode && template ? template.replaceAll('{filecode}', encodeURIComponent(filecode)) : '');
  return { filecode, taskId, url: generated };
}

export default function Home() {
  const [config, setConfig] = useState({ proxy: '', hosts: [] });
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [selected, setSelected] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState('mirror');

  useEffect(() => {
    const c = loadConfig();
    setConfig(c);
    setSelected(c.hosts.filter(h => h.key).map(h => h.id));
  }, []);

  const hosts = config.hosts || [];
  const combined = useMemo(() => jobs.filter(j => j.url).map(j => j.url).join('\n'), [jobs]);
  const iframeHtml = useMemo(() => {
    const rows = jobs.filter(j => j.url).map(j => `<li><b>${escapeHtml(j.host)}</b> — <a href="${escapeAttr(j.url)}" target="_blank" rel="noopener">${escapeHtml(j.url)}</a></li>`).join('');
    return `<!doctype html><html><body style="font-family:system-ui;background:#111318;color:#eee;padding:18px"><h3>Combined result URLs</h3>${rows ? `<ol>${rows}</ol>` : '<p>No result URLs yet.</p>'}</body></html>`;
  }, [jobs]);

  function toggle(id) { setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]); }

  async function mirror() {
    if (!url.trim() || !selected.length) return;
    if (!config.proxy.trim()) return alert('Set a CORS proxy in Settings first.');
    setBusy(true);
    setJobs(selected.map(id => ({ id, host: hosts.find(h => h.id === id)?.name || id, status: 'requesting…' })));
    const chosen = hosts.filter(h => selected.includes(h.id));
    const results = await Promise.all(chosen.map(async h => {
      if (!h.key) return { id: h.id, host: h.name, status: 'API key not configured' };
      try {
        const target = buildTarget(h.endpoint, h.key, url.trim(), title.trim());
        const proxy = config.proxy.trim().endsWith('=') ? config.proxy.trim() : config.proxy.trim() + (config.proxy.includes('?') ? '' : '?url=');
        const requestUrl = proxy + encodeURIComponent(target);
        const r = await fetch(requestUrl, { headers: { Accept: 'application/json,text/plain,*/*' } });
        const text = await r.text();
        let data; try { data = JSON.parse(text); } catch { data = text; }
        if (!r.ok) throw new Error(`HTTP ${r.status}: ${typeof data === 'string' ? data.slice(0, 180) : JSON.stringify(data).slice(0, 180)}`);
        const parsed = extractResult(data, h.resultTemplate);
        return { id: h.id, host: h.name, status: 'success', url: parsed.url, filecode: parsed.filecode, taskId: parsed.taskId, raw: data, requestUrl };
      } catch (e) {
        return { id: h.id, host: h.name, status: 'error', error: e.message };
      }
    }));
    setJobs(results);
    setBusy(false);
  }

  if (tab === 'docs') return <Docs onBack={() => setTab('mirror')} />;

  return (
    <main className="shell">
      <header><div><div className="eyebrow">PERSONAL MIRROR CENTER</div><h1>PolyMirror</h1></div><div className="nav"><button className="settings" onClick={() => setTab('docs')}>API Docs</button><a className="settings" href="/settings">Settings</a></div></header>
      <section className="card">
        <label>Remote file URL</label>
        <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com/video.mp4" inputMode="url" />
        <label>Title <span>(optional)</span></label>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="My video" />
        <div className="row between"><label className="no-margin">Hosts</label><button className="small" onClick={() => setSelected(selected.length === hosts.length ? [] : hosts.filter(h => h.key).map(h => h.id))}>{selected.length === hosts.length ? 'Clear all' : 'Select all configured'}</button></div>
        <div className="hosts">{hosts.map(h => <button key={h.id} className={'host ' + (selected.includes(h.id) ? 'active' : '')} onClick={() => toggle(h.id)}><span>{selected.includes(h.id) ? '✓' : ''}</span>{h.name}<small>{h.key ? 'API ready' : 'No API key'}</small></button>)}</div>
        <button className="primary" disabled={busy || !url.trim() || !selected.length} onClick={mirror}>{busy ? 'Requesting…' : 'Mirror URL'}</button>
      </section>

      {jobs.length > 0 && <section className="card"><div className="row between"><h2>Results</h2><button className="small" onClick={() => navigator.clipboard.writeText(combined)}>Copy all URLs</button></div>
        {jobs.map(job => <div className="job" key={job.id}><div><strong>{job.host}</strong><div className="muted">{job.status}{job.filecode ? ` · ${job.filecode}` : ''}{job.taskId ? ` · task ${job.taskId}` : ''}</div>{job.error && <div className="error">{job.error}</div>}{job.url && <a className="resultLink" href={job.url} target="_blank" rel="noreferrer">{job.url}</a>}</div>{job.url && <button className="copy" onClick={() => navigator.clipboard.writeText(job.url)}>Copy</button>}</div>)}
      </section>}

      {jobs.some(j => j.url) && <section className="card"><div className="row between"><h2>Combined URLs</h2></div><textarea className="combined" readOnly value={combined} /><iframe className="resultFrame" title="Combined result URLs" srcDoc={iframeHtml} /></section>}
      <p className="note">API keys are stored in this browser's localStorage because you requested client-side API configuration. Do not use this mode on a public/shared device.</p>
    </main>
  );
}

function Docs({ onBack }) {
  const docs = DEFAULT_HOSTS;
  const [active, setActive] = useState(docs[0].id);
  const current = docs.find(d => d.id === active) || docs[0];
  return <main className="shell"><header><div><div className="eyebrow">DOCUMENTATION</div><h1>Host APIs</h1></div><button className="settings" onClick={onBack}>Back</button></header><div className="docTabs">{docs.map(d => <button key={d.id} className="settings" onClick={() => setActive(d.id)}>{d.name}</button>)}</div><section className="card docCard"><iframe title={current.name + ' API documentation'} src={current.docs} /></section></main>;
}
function escapeHtml(s) { return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;'); }
function escapeAttr(s) { return escapeHtml(s).replaceAll("'", '&#39;'); }
