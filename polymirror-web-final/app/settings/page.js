"use client";

import { useState } from "react";


export default function SettingsPage() {

  const [
    saved,
    setSaved
  ] = useState(false);


  const [
    source,
    setSource
  ] = useState("");


  function save() {

    localStorage.setItem(
      "polymirror_settings",
      JSON.stringify({
        source
      })
    );


    setSaved(true);


    setTimeout(
      () => setSaved(false),
      2000
    );
  }


  return (
    <main className="settingsPage">

      <div className="settingsPanel">

        <h1>
          Settings
        </h1>


        <p>
          Server API keys must be configured
          in Vercel Environment Variables.
        </p>


        <label>
          Authorized source endpoint

          <input
            value={source}
            onChange={e =>
              setSource(
                e.target.value
              )
            }
            placeholder="https://example.com/api/source"
          />

        </label>


        <button
          className="startButton"
          onClick={save}
        >
          Save
        </button>


        {saved && (
          <p className="success">
            Saved.
          </p>
        )}


        <hr />


        <h2>
          Required environment variables
        </h2>


        <pre>
{`TMDB_ACCESS_TOKEN
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
CRON_SECRET

AUTHORIZED_SOURCE_URL

STREAMHG_API_KEY
EARNVIDS_API_KEY

RPMSHARE_UPLOAD_ENDPOINT
RPMshare_API_KEY

STREAMP2P_UPLOAD_ENDPOINT
STREAMP2P_API_KEY`}
        </pre>


        <a
          href="/"
          className="backLink"
        >
          ← Back
        </a>

      </div>

    </main>
  );
}
