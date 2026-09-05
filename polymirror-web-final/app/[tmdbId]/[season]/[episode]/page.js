"use client";

import { useEffect, useState } from "react";

import { useParams } from "next/navigation";


export default function EpisodePage() {

  const params =
    useParams();


  const tmdbId =
    params.tmdbId;

  const season =
    params.season;

  const episode =
    params.episode;


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

        const query =
          new URLSearchParams({
            tmdb: tmdbId,
            season,
            episode
          });


        const response =
          await fetch(
            `/api/player?${query.toString()}`,
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

  }, [
    tmdbId,
    season,
    episode
  ]);


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
            TMDB: {tmdbId}
          </p>

          <p>
            S{season}E{episode}
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

          {" "}

          S{season}E{episode}

        </div>

      </div>


      <div className="iframeContainer">

        {selected?.url ? (

          <iframe
            key={selected.url}
            src={selected.url}
            title={
              data.title ||
              "Player"
            }
            allowFullScreen
            allow="autoplay; fullscreen; picture-in-picture"
          />

        ) : (

          <div className="playerMessage">
            Server is processing.
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
