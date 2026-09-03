'use client';
import { useEffect, useState } from 'react';
const KEY='polymirror-config-v2';
const defaults=[
{id:'streamhg',name:'StreamHG',endpoint:'https://streamhgapi.com/api/upload/url?key={key}&url={url}',docs:'https://streamhg.com/api.html',resultTemplate:'https://streamhg.com/{filecode}'},
{id:'earnvids',name:'EarnVids',endpoint:'https://earnvidsapi.com/api/upload/url?key={key}&url={url}',docs:'https://earnvids.com/api.html',resultTemplate:'https://earnvids.com/{filecode}'},
{id:'rpmshare',name:'RPMShare',endpoint:'https://rpmshare.com/api/upload/url?key={key}&url={url}',docs:'https://rpmshare.com/api-document/index.html',resultTemplate:'https://rpmshare.com/{filecode}'},
{id:'streamp2p',name:'StreamP2P',endpoint:'',docs:'',resultTemplate:''},{id:'gdflix',name:'GDFlix',endpoint:'',docs:'',resultTemplate:''},{id:'gdtot',name:'GDTOT',endpoint:'',docs:'',resultTemplate:''}];
export default function Settings(){
 const [proxy,setProxy]=useState('https://workingg.vercel.app/api/proxy?url='); const [hosts,setHosts]=useState(defaults.map(x=>({...x,key:''}))); const [saved,setSaved]=useState(false);
 useEffect(()=>{try{const x=JSON.parse(localStorage.getItem(KEY)||'null');if(x){setProxy(x.proxy||proxy);setHosts(x.hosts||hosts)}}catch{}} ,[]);
 function update(i,k,v){setHosts(h=>h.map((x,n)=>n===i?{...x,[k]:v}:x))}
 function save(){localStorage.setItem(KEY,JSON.stringify({proxy,hosts}));setSaved(true);setTimeout(()=>setSaved(false),1500)}
 function reset(){localStorage.removeItem(KEY);location.reload()}
 return <main className="shell"><header><div><div className="eyebrow">CONFIGURATION</div><h1>Settings</h1></div><a className="settings" href="/">Back</a></header>
 <section className="card"><label>CORS proxy prefix</label><input value={proxy} onChange={e=>setProxy(e.target.value)} placeholder="https://workingg.vercel.app/api/proxy?url="/><p className="muted">The app URL-encodes the entire provider request before putting it after this prefix. This avoids the nested <code>&amp;url=</code> query-string problem.</p></section>
 {hosts.map((h,i)=><section className="card" key={h.id}><div className="settingTitle"><strong>{h.name}</strong><span>{h.endpoint?'Configured adapter':'Custom adapter'}</span></div><label>API key</label><input type="password" value={h.key} onChange={e=>update(i,'key',e.target.value)} placeholder="Paste your API key" autoComplete="off"/><label>Upload-by-URL endpoint</label><input value={h.endpoint} onChange={e=>update(i,'endpoint',e.target.value)} placeholder="https://host/api/upload/url?key={key}&url={url}"/><label>Result URL template <span>(optional)</span></label><input value={h.resultTemplate} onChange={e=>update(i,'resultTemplate',e.target.value)} placeholder="https://host/{filecode}"/><p className="muted">Supported placeholders: <code>{'{key}'}</code>, <code>{'{url}'}</code>, <code>{'{title}'}</code>. Result template also supports <code>{'{filecode}'}</code>.</p>{h.docs&&<a className="docLink" href={h.docs} target="_blank" rel="noreferrer">Open official API documentation ↗</a>}</section>)}
 <div className="row actions"><button className="primary" onClick={save}>{saved?'Saved ✓':'Save settings'}</button><button className="small" onClick={reset}>Reset</button></div>
 <p className="note">These settings live only in your browser localStorage. Client-side keys can be inspected by the browser and should be treated as exposed credentials.</p></main>
}
