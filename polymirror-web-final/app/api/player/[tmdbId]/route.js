import { NextResponse } from 'next/server';

import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

export async function GET(
  request,
  { params }
) {

  try {

    const {
      tmdbId
    } = await params;


    const url =
      new URL(request.url);

    const season =
      url.searchParams.get(
        'season'
      );

    const episode =
      url.searchParams.get(
        'episode'
      );


    let query =
      supabaseAdmin
        .from('mirror_jobs')
        .select(`
          id,
          tmdb_id,
          imdb_id,
          media_type,
          season_number,
          episode_number,
          title,
          status,
          mirror_results (
            provider,
            status,
            result_url,
            embed_url
          )
        `)
        .eq(
          'tmdb_id',
          Number(tmdbId)
        );


    if (
      season !== null &&
      episode !== null
    ) {

      query =
        query
          .eq(
            'season_number',
            Number(season)
          )
          .eq(
            'episode_number',
            Number(episode)
          );
    }


    const {
      data,
      error
    } = await query;


    if (error) {
      throw error;
    }


    return NextResponse.json({
      ok: true,
      results:
        data || []
    });

  } catch (error) {

    return NextResponse.json(
      {
        error:
          error.message
      },
      {
        status: 500
      }
    );
  }
}
