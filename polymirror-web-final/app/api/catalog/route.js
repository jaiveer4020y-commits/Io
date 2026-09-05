import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const category =
      searchParams.get("category") || "popular-movies";

    const page = Math.max(
      1,
      Number(searchParams.get("page") || 1)
    );

    const data = await getCatalog(category, page);

    const mediaType =
      category.includes("tv") ||
      category.includes("shows")
        ? "tv"
        : "movie";

    const results = Array.isArray(data.results)
      ? data.results
      : [];

    return NextResponse.json({
      success: true,
      category,
      page,
      total_pages: data.total_pages || 1,
      total_results: data.total_results || 0,
      mediaType,
      results
    });

  } catch (error) {

    console.error("[CATALOG]", error);

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
