import { NextResponse } from 'next/server';

import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

export async function GET() {

  try {

    const { data, error } =
      await supabaseAdmin
        .from('mirror_jobs')
        .select('status');

    if (error) {
      throw error;
    }

    const counts = {
      pending: 0,
      processing: 0,
      completed: 0,
      retry: 0,
      failed: 0
    };

    for (const row of data || []) {

      if (
        Object.hasOwn(
          counts,
          row.status
        )
      ) {
        counts[row.status]++;
      }
    }

    return NextResponse.json({
      ok: true,
      counts,
      total:
        data?.length || 0
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
