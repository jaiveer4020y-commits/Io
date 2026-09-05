import { supabase } from "./supabase";
import {
  getExternalIds,
  getDetails
} from "./catalog";

import {
  getAuthorizedSource
} from "./source-provider";

import {
  providers
} from "./providers";


/* =========================================================
   GET IMDb ID
   ========================================================= */

async function resolveImdbId(
  tmdbId,
  mediaType
) {

  const external =
    await getExternalIds(
      tmdbId,
      mediaType
    );

  return external.imdb_id || null;
}


/* =========================================================
   PROCESS ONE JOB
   ========================================================= */

export async function processJob(job) {

  console.log(
    `[WORKER] Processing ${job.id}`
  );


  /* -------------------------------------------------------
     1. IMDb ID
     ------------------------------------------------------- */

  let imdbId = job.imdb_id;

  if (!imdbId) {

    imdbId =
      await resolveImdbId(
        job.tmdb_id,
        job.media_type
      );

    await supabase
      .from("upload_jobs")
      .update({
        imdb_id: imdbId,
        status: "resolving",
        updated_at: new Date().toISOString()
      })
      .eq("id", job.id);
  }


  /* -------------------------------------------------------
     2. Authorized source
     ------------------------------------------------------- */

  let sourceUrl = job.source_url;

  if (!sourceUrl) {

    const source =
      await getAuthorizedSource({
        tmdbId: job.tmdb_id,
        imdbId,
        mediaType: job.media_type,
        season: job.season,
        episode: job.episode
      });

    sourceUrl =
      source.sourceUrl;

    await supabase
      .from("upload_jobs")
      .update({
        source_url: sourceUrl,
        status: "uploading",
        updated_at: new Date().toISOString()
      })
      .eq("id", job.id);
  }


  /* -------------------------------------------------------
     3. Upload providers
     ------------------------------------------------------- */

  const providerNames = [
    "streamhg",
    "earnvids",
    "rpmshare",
    "streamp2p"
  ];


  let successCount = 0;


  for (const providerName of providerNames) {

    try {

      /*
       * Check existing result first.
       * This makes the worker idempotent.
       */

      const {
        data: existing
      } = await supabase
        .from("provider_results")
        .select("*")
        .eq("job_id", job.id)
        .eq("provider", providerName)
        .maybeSingle();


      if (
        existing &&
        existing.status === "completed" &&
        (
          existing.result_url ||
          existing.embed_url ||
          existing.file_code
        )
      ) {
        successCount++;
        continue;
      }


      const providerFunction =
        providers[providerName];


      if (!providerFunction) {
        continue;
      }


      /*
       * Create/update provider result row.
       */

      await supabase
        .from("provider_results")
        .upsert(
          {
            job_id: job.id,
            provider: providerName,
            status: "processing",
            attempts:
              (existing?.attempts || 0) + 1,
            updated_at:
              new Date().toISOString()
          },
          {
            onConflict:
              "job_id,provider"
          }
        );


      const result =
        await providerFunction(
          sourceUrl,
          job.title
        );


      await supabase
        .from("provider_results")
        .upsert(
          {
            job_id: job.id,
            provider: providerName,

            status:
              result.taskId
                ? "submitted"
                : "completed",

            task_id:
              result.taskId,

            result_url:
              result.resultUrl,

            embed_url:
              result.embedUrl,

            file_code:
              result.fileCode,

            response_json:
              result.response,

            updated_at:
              new Date().toISOString()
          },
          {
            onConflict:
              "job_id,provider"
          }
        );


      if (
        result.resultUrl ||
        result.embedUrl ||
        result.fileCode
      ) {
        successCount++;
      }

    } catch (error) {

      console.error(
        `[${providerName}]`,
        error
      );


      await supabase
        .from("provider_results")
        .upsert(
          {
            job_id: job.id,
            provider: providerName,
            status: "failed",
            error_message:
              error.message,
            updated_at:
              new Date().toISOString()
          },
          {
            onConflict:
              "job_id,provider"
          }
        );
    }
  }


  /* -------------------------------------------------------
     4. Final job status
     ------------------------------------------------------- */

  const finalStatus =
    successCount === providerNames.length
      ? "completed"
      : successCount > 0
        ? "partial"
        : "failed";


  await supabase
    .from("upload_jobs")
    .update({
      status: finalStatus,
      attempts:
        Number(job.attempts || 0) + 1,
      updated_at:
        new Date().toISOString()
    })
    .eq("id", job.id);


  return {
    success: true,
    status: finalStatus,
    providersCompleted: successCount,
    providersTotal: providerNames.length
  };
}


/* =========================================================
   CLAIM JOB
   ========================================================= */

export async function claimJob() {

  /*
   * Simple stale-lock recovery.
   */

  const stale =
    new Date(
      Date.now() - 30 * 60 * 1000
    ).toISOString();


  await supabase
    .from("upload_jobs")
    .update({
      status: "pending",
      locked_at: null
    })
    .eq("status", "resolving")
    .lt("locked_at", stale);


  const {
    data: jobs,
    error
  } = await supabase
    .from("upload_jobs")
    .select("*")
    .in(
      "status",
      [
        "pending",
        "partial"
      ]
    )
    .order(
      "created_at",
      {
        ascending: true
      }
    )
    .limit(1);


  if (error) {
    throw error;
  }


  if (!jobs?.length) {
    return null;
  }


  const job = jobs[0];


  const {
    data: claimed,
    error: updateError
  } = await supabase
    .from("upload_jobs")
    .update({
      status: "resolving",
      locked_at:
        new Date().toISOString(),
      updated_at:
        new Date().toISOString()
    })
    .eq("id", job.id)
    .in(
      "status",
      [
        "pending",
        "partial"
      ]
    )
    .select()
    .maybeSingle();


  if (updateError) {
    throw updateError;
  }


  return claimed || null;
}
