import { NextResponse } from "next/server";

import { supabase } from "@/lib/supabase";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";


export async function GET(request) {

  try {

    const {
      searchParams
    } = new URL(request.url);


    const batchId =
      searchParams.get(
        "batch"
      );


    if (!batchId) {

      return NextResponse.json(
        {
          error:
            "batch parameter required"
        },
        {
          status: 400
        }
      );
    }


    const {
      data: batch,
      error
    } = await supabase
      .from("batches")
      .select("*")
      .eq("id", batchId)
      .single();


    if (error) {
      throw error;
    }


    const {
      data: jobs
    } = await supabase
      .from("upload_jobs")
      .select(`
        *,
        provider_results (*)
      `)
      .eq(
        "batch_id",
        batchId
      )
      .order(
        "created_at",
        {
          ascending: true
        }
      );


    return NextResponse.json({
      success: true,
      batch,
      jobs: jobs || []
    });


  } catch (error) {

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
