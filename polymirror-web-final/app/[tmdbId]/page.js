"use client";

import { useEffect, useState } from "react";

import { useParams } from "next/navigation";


export default function MoviePage() {

  const params =
    useParams();


  const tmdbId =
    params.tmdbId;


  const [
    data,
    setData
  ] = useState(null);


  const [
    selected,
    setSelected
  ] = useState(null);


  const [
    loading,
    setLoading
  ] = useState(true);


  useEffect(() => {

    async function load() {

      try {

        const response =
          await fetch(
            `/api/player?tmdb=${encodeURIComponent(
              tmdbId
            )}`,
            {
              cache: "no-store"
            }
          );


        const json =
          await response.json();


        setData(
          json
        );


        if (
          json.servers?.length
        ) {
          setSelected(
            json.servers[0]
          );
        }

      } catch (error) {

        console.error(
          error
        );

      } finally {

        setLoading(false);
      }
    }


    load();

  }, [tmdbId]);


  if (loading) {

    return (
      <main className="playerPage">
        <div className="playerMessage">
          Loading...
        </div>
      </main>
    );
  }


  if (
    !data?.found ||
    !data?.servers?.length
  ) {

    return (
      <main className="playerPage">

        <div className="playerMessage">

          <h1>
            No server ready
          </h1>

          <p>
            TMDB ID: {tmdbId}
          </p>

        </div>

      </main>
    );
  }


  return (
    <main className="playerPage">

      <div className="playerHeader">

        <div className="serverTitle">

          <span className="serverIcon">
            ▣
          </span>

          {selected?.provider}

        </div>


        <div className="videoTitle">

          {data.title}

        </div>

      </div>


      <div className="iframeContainer">

        {selected?.url ? (

          <iframe
            key={selected.url}
            src={selected.url}
            title={data.title || "Player"}
            allowFullScreen
            allow="autoplay; fullscreen; picture-in-picture"
          />

        ) : (

          <div className="playerMessage">
            This server is still processing.
          </div>

        )}

      </div>


      <div className="serverButtons">

        {data.servers.map(
          server => (

            <button
              key={server.provider}
              className={
                selected?.provider ===
                server.provider
                  ? "serverButton active"
                  : "serverButton"
              }
              onClick={() =>
                setSelected(
                  server
                )
              }
            >
              {server.provider}
            </button>

          )
        )}

      </div>

    </main>
  );
}
