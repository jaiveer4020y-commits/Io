"use client";

import { useEffect, useState } from "react";


const CATEGORIES = [
  {
    title: "Movies",
    items: [
      ["popular-movies", "Popular Movies"],
      ["top-rated-movies", "Top Rated Movies"],
      ["now-playing", "Now Playing"]
    ]
  },
  {
    title: "Indian Movies",
    items: [
      ["indian-movies", "Indian Movies"],
      ["hindi-movies", "Hindi Movies"],
      ["punjabi-movies", "Punjabi Movies"]
    ]
  },
  {
    title: "TV Shows",
    items: [
      ["popular-tv", "Popular TV"],
      ["top-rated-tv", "Top Rated TV"]
    ]
  },
  {
    title: "Indian TV",
    items: [
      ["indian-tv", "Indian TV"],
      ["hindi-tv", "Hindi TV"],
      ["punjabi-tv", "Punjabi TV"]
    ]
  }
];


export default function Home() {

  const [
    category,
    setCategory
  ] = useState(
    "popular-movies"
  );


  const [
    limit,
    setLimit
  ] = useState(100);


  const [
    results,
    setResults
  ] = useState([]);


  const [
    loading,
    setLoading
  ] = useState(false);


  const [
    batchId,
    setBatchId
  ] = useState(null);


  const [
    batch,
    setBatch
  ] = useState(null);


  const [
    error,
    setError
  ] = useState("");


  async function loadCatalog(
    selectedCategory
  ) {

    setLoading(true);
    setError("");


    try {

      const response =
        await fetch(
          `/api/catalog?category=${encodeURIComponent(
            selectedCategory
          )}`
        );


      const data =
        await response.json();


      if (!response.ok) {
        throw new Error(
          data.error ||
          "Catalog failed"
        );
      }


      setResults(
        data.results || []
      );


    } catch (err) {

      setError(
        err.message
      );

    } finally {

      setLoading(false);
    }
  }


  async function startBatch() {

    setLoading(true);
    setError("");


    try {

      const response =
        await fetch(
          "/api/batch",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              category,
              limit
            })
          }
        );


      const data =
        await response.json();


      if (!response.ok) {
        throw new Error(
          data.error ||
          "Batch creation failed"
        );
      }


      setBatchId(
        data.batchId
      );


      await loadBatch(
        data.batchId
      );


    } catch (err) {

      setError(
        err.message
      );

    } finally {

      setLoading(false);
    }
  }


  async function loadBatch(
    id = batchId
  ) {

    if (!id) {
      return;
    }


    try {

      const response =
        await fetch(
          `/api/item?batch=${encodeURIComponent(
            id
          )}`,
          {
            cache: "no-store"
          }
        );


      const data =
        await response.json();


      if (
        data.success
      ) {

        setBatch(
          data.batch
        );
      }


    } catch (err) {

      console.error(
        err
      );
    }
  }


  useEffect(() => {

    loadCatalog(
      category
    );

  }, [category]);


  useEffect(() => {

    if (!batchId) {
      return;
    }


    loadBatch(
      batchId
    );


    const timer =
      setInterval(
        () => {
          loadBatch(
            batchId
          );
        },
        10000
      );


    return () =>
      clearInterval(
        timer
      );

  }, [batchId]);


  return (
    <main className="dashboard">

      <header className="topbar">

        <div>
          <h1>PolyMirror</h1>

          <p>
            Automated catalog & upload queue
          </p>
        </div>

        <a
          href="/settings"
          className="settingsLink"
        >
          Settings
        </a>

      </header>


      <section className="panel">

        <h2>1. Select catalog</h2>


        {CATEGORIES.map(
          group => (

            <div
              className="categoryGroup"
              key={group.title}
            >

              <h3>
                {group.title}
              </h3>


              <div className="buttonGrid">

                {group.items.map(
                  ([value, label]) => (

                    <button
                      key={value}
                      className={
                        category === value
                          ? "catalogButton active"
                          : "catalogButton"
                      }
                      onClick={() =>
                        setCategory(
                          value
                        )
                      }
                    >
                      {label}
                    </button>

                  )
                )}

              </div>

            </div>

          )
        )}

      </section>


      <section className="panel">

        <h2>2. Create background batch</h2>


        <div className="batchControls">

          <label>
            Number of items

            <select
              value={limit}
              onChange={e =>
                setLimit(
                  Number(
                    e.target.value
                  )
                )
              }
            >
              <option value="10">
                10
              </option>

              <option value="25">
                25
              </option>

              <option value="50">
                50
              </option>

              <option value="100">
                100
              </option>

              <option value="150">
                150
              </option>

              <option value="200">
                200
              </option>
            </select>
          </label>


          <button
            className="startButton"
            onClick={
              startBatch
            }
            disabled={loading}
          >
            {loading
              ? "Starting..."
              : "START BATCH"}
          </button>

        </div>


        <p className="smallText">
          Once started, processing happens on
          the server. You can close this page.
        </p>

      </section>


      {batch && (

        <section className="panel">

          <h2>
            Batch Progress
          </h2>


          <div className="stats">

            <div>
              <strong>
                {batch.requested}
              </strong>
              <span>
                Requested
              </span>
            </div>


            <div>
              <strong>
                {batch.queued}
              </strong>
              <span>
                Queued
              </span>
            </div>


            <div>
              <strong>
                {batch.processing}
              </strong>
              <span>
                Processing
              </span>
            </div>


            <div>
              <strong>
                {batch.completed}
              </strong>
              <span>
                Completed
              </span>
            </div>


            <div>
              <strong>
                {batch.failed}
              </strong>
              <span>
                Failed
              </span>
            </div>

          </div>


          <div className="progressBar">

            <div
              style={{
                width: `${
                  batch.requested
                    ? Math.min(
                        100,
                        (
                          batch.completed /
                          batch.requested
                        ) * 100
                      )
                    : 0
                }%`
              }}
            />

          </div>


          <p className="status">
            Status:{" "}
            <b>
              {batch.status}
            </b>
          </p>


          {batchId && (

            <p className="smallText">
              Batch ID:
              <br />
              <code>
                {batchId}
              </code>
            </p>

          )}

        </section>

      )}


      <section className="panel">

        <h2>
          Catalog Preview
        </h2>


        {error && (
          <div className="error">
            {error}
          </div>
        )}


        <div className="catalogList">

          {results.map(
            item => (

              <div
                className="catalogItem"
                key={item.id}
              >

                <div>

                  <strong>
                    {
                      item.title ||
                      item.name
                    }
                  </strong>

                  <span>
                    TMDB: {item.id}
                  </span>

                </div>

              </div>

            )
          )}

        </div>

      </section>

    </main>
  );
}
