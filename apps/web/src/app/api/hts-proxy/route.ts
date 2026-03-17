import { NextRequest, NextResponse } from "next/server";

/**
 * Server-side proxy for the USITC HTS REST API.
 * Avoids CORS issues when calling from the browser.
 */
export async function GET(request: NextRequest) {
  const keyword = request.nextUrl.searchParams.get("keyword");

  if (!keyword) {
    return NextResponse.json(
      { error: "Missing 'keyword' parameter" },
      { status: 400 }
    );
  }

  try {
    const url = `https://hts.usitc.gov/reststop/search?keyword=${encodeURIComponent(keyword)}`;
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `USITC API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("USITC proxy error:", error);
    return NextResponse.json(
      { error: "Failed to fetch from USITC" },
      { status: 500 }
    );
  }
}
