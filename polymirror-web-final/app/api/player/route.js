import { NextResponse } from "next/server";

import { supabase } from "@/lib/supabase";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";


export async function GET(request) {

  try {

    const {
      searchParams
    } = new URL(request.url);


    const tmdbId =
      searchParams.get("tmdb");

    const season =
      searchParams.get("season");

    const episode =
      searchParams.get("episode");


    if (!tmdbId) {

      return NextResponse.json(
        {
          error:
            "tmdb required"
        },
        {
          status: 400
        }
      );
    }


    let query =
      supabase
        .from("upload_jobs")
        .select(`
          *,
          provider_results (*)
        `)
        .eq(
          "tmdb_id",
          Number(tmdbId)
        );


    if (
      season !== null &&
      episode !== null
    ) {

      query = query
        .eq(
          "season",
          Number(season)
        )
        .eq(
          "episode",
          Number(episode)
        );
    }


    const {
      data: jobs,
      error
    } = await query
      .order(
        "created_at",
        {
          ascending: false
        }
      )
      .limit(1);


    if (error) {
      throw error;
    }


    if (!jobs?.length) {

      return NextResponse.json({
        success: true,
        found: false,
        servers: []
      });
    }


    const job = jobs[0];


    const servers =
      (job.provider_results || [])
        .filter(
          item =>
            item.status === "completed" ||
            item.status === "submitted" ||
            item.result_url ||
            item.embed_url ||
            item.file_code
        )
        .map(item => ({
          provider:
            item.provider,

          status:
            item.status,

          url:
            item.result_url ||
            item.embed_url ||
            null,

          fileCode:
            item.file_code ||
            null
        }));


    return NextResponse.json({
      success: true,
      found: true,

      tmdbId:
        job.tmdb_id,

      imdbId:
        job.imdb_id,

      title:
        job.title,

      mediaType:
        job.media_type,

      season:
        job.season,

      episode:
        job.episode,

      servers
    });


  } catch (error) {

    console.error(
      "[PLAYER]",
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
