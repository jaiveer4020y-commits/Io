import { NextResponse } from "next/server";

import {
  claimJob,
  processJob
} from "@/lib/queue";

import { supabase } from "@/lib/supabase";


export const runtime = "nodejs";

export const maxDuration = 300;

export const dynamic = "force-dynamic";


function authorized(request) {

  const secret =
    process.env.CRON_SECRET;

  if (!secret) {
    return false;
  }


  const authorization =
    request.headers.get(
      "authorization"
    );


  return (
    authorization ===
    `Bearer ${secret}`
  );
}


export async function GET(request) {

  if (!authorized(request)) {

    return NextResponse.json(
      {
        error: "Unauthorized"
      },
      {
        status: 401
      }
    );
  }


  const results = [];


  /*
   * Process a few jobs per cron invocation.
   *
   * The website does NOT need to remain open.
   */

  for (
    let i = 0;
    i < 3;
    i++
  ) {

    try {

      const job =
        await claimJob();


      if (!job) {
        break;
      }


      const result =
        await processJob(job);


      results.push({
        jobId: job.id,
        ...result
      });


    } catch (error) {

      console.error(
        "[WORKER]",
        error
      );


      results.push({
        error: error.message
      });
    }
  }


  /*
   * Recalculate batch counters.
   */

  const {
    data: batches
  } = await supabase
    .from("batches")
    .select("id");


  for (const batch of batches || []) {

    const {
      data: jobs
    } = await supabase
      .from("upload_jobs")
      .select("status")
      .eq(
        "batch_id",
        batch.id
      );


    if (!jobs) {
      continue;
    }


    const queued =
      jobs.filter(
        x =>
          x.status === "pending"
      ).length;


    const processing =
      jobs.filter(
        x =>
          x.status === "resolving" ||
          x.status === "uploading" ||
          x.status === "processing"
      ).length;


    const completed =
      jobs.filter(
        x =>
          x.status === "completed"
      ).length;


    const failed =
      jobs.filter(
        x =>
          x.status === "failed"
      ).length;


    const partial =
      jobs.filter(
        x =>
          x.status === "partial"
      ).length;


    let status = "running";


    if (
      queued === 0 &&
      processing === 0 &&
      partial === 0
    ) {
      status =
        failed > 0
          ? "completed"
          : "completed";
    }


    await supabase
      .from("batches")
      .update({
        queued,
        processing,
        completed,
        failed,
        status,
        updated_at:
          new Date().toISOString()
      })
      .eq(
        "id",
        batch.id
      );
  }


  return NextResponse.json({
    success: true,
    processed: results.length,
    results
  });
}
