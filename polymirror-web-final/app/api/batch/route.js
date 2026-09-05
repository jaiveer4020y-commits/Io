import { NextResponse } from "next/server";

import {
  getCatalog,
  getExternalIds
} from "@/lib/catalog";

import { supabase } from "@/lib/supabase";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";


export async function POST(request) {

  try {

    const body =
      await request.json();


    const category =
      body.category ||
      "popular-movies";


    const requested =
      Math.min(
        200,
        Math.max(
          1,
          Number(body.limit || 100)
        )
      );


    const pagesNeeded =
      Math.ceil(requested / 20);


    let allItems = [];


    /*
     * Get enough TMDB pages.
     */

    for (
      let page = 1;
      page <= pagesNeeded;
      page++
    ) {

      const catalog =
        await getCatalog(
          category,
          page
        );


      allItems.push(
        ...(catalog.results || [])
      );


      if (
        allItems.length >= requested
      ) {
        break;
      }
    }


    allItems =
      allItems.slice(
        0,
        requested
      );


    const mediaType =
      category.includes("tv")
        ? "tv"
        : "movie";


    /* ------------------------------------------------------
       Create batch
       ------------------------------------------------------ */

    const {
      data: batch,
      error: batchError
    } = await supabase
      .from("batches")
      .insert({
        category,
        media_type: mediaType,
        requested: allItems.length,
        queued: allItems.length,
        status: "queued"
      })
      .select()
      .single();


    if (batchError) {
      throw batchError;
    }


    const jobs = [];


    for (const item of allItems) {

      let imdbId = null;

      try {

        const external =
          await getExternalIds(
            item.id,
            mediaType
          );

        imdbId =
          external.imdb_id || null;

      } catch (error) {

        console.warn(
          `IMDb lookup failed for ${item.id}`,
          error.message
        );
      }


      const title =
        item.title ||
        item.name ||
        "Unknown";


      jobs.push({
        batch_id: batch.id,

        tmdb_id: item.id,

        imdb_id: imdbId,

        media_type: mediaType,

        title,

        status: "pending"
      });
    }


    /*
     * Insert jobs in chunks.
     */

    for (
      let i = 0;
      i < jobs.length;
      i += 50
    ) {

      const chunk =
        jobs.slice(i, i + 50);


      const {
        error
      } = await supabase
        .from("upload_jobs")
        .insert(chunk);


      if (error) {
        throw error;
      }
    }


    return NextResponse.json({
      success: true,

      batchId: batch.id,

      category,

      mediaType,

      requested:
        allItems.length,

      queued:
        jobs.length
    });


  } catch (error) {

    console.error(
      "[BATCH]",
      error
    );


    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      {
        status: 500
      }
    );
  }
}
