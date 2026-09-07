import { NextResponse } from 'next/server';
import { getCatalog } from '@/lib/tmdb';

export const runtime = 'nodejs';

export async function GET(request) {

  try {

    const { searchParams } =
      new URL(request.url);

    const category =
      searchParams.get('category');

    if (!category) {
      return NextResponse.json(
        {
          error: 'category is required'
        },
        {
          status: 400
        }
      );
    }

    const data =
      await getCatalog(category);

    return NextResponse.json(data);

  } catch (error) {

    console.error('[CATALOG]', error);

    return NextResponse.json(
      {
        error: error.message
      },
      {
        status: 500
      }
    );
  }
}
