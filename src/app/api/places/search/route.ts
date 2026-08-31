import { NextRequest, NextResponse } from "next/server";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "Eventos/1.0 (event planning app; contact@eventos.app)";
const MIN_QUERY_LENGTH = 3;
const MAX_LIMIT = 8;
const RATE_LIMIT_MS = 1000;

const rateLimitMap = new Map<string, number>();

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const lastRequest = rateLimitMap.get(ip);

  if (lastRequest && now - lastRequest < RATE_LIMIT_MS) {
    return true;
  }

  rateLimitMap.set(ip, now);
  return false;
}

export interface PlaceResult {
  placeId: string;
  displayName: string;
  name: string;
  address: string;
  lat: number;
  lon: number;
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const limitParam = Number(request.nextUrl.searchParams.get("limit") ?? "5");
  const limit = Math.min(Math.max(1, limitParam), MAX_LIMIT);

  if (query.length < MIN_QUERY_LENGTH) {
    return NextResponse.json({ data: [] satisfies PlaceResult[] });
  }

  const ip = getClientIp(request);
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: { message: "Too many requests. Please wait a moment." } },
      { status: 429 },
    );
  }

  try {
    const url = new URL(NOMINATIM_URL);
    url.searchParams.set("q", query);
    url.searchParams.set("format", "json");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("limit", String(limit));

    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: { message: "Location search unavailable" } },
        { status: 502 },
      );
    }

    const results = (await response.json()) as Array<{
      place_id: number;
      display_name: string;
      name?: string;
      lat: string;
      lon: string;
    }>;

    const data: PlaceResult[] = results.map((item) => ({
      placeId: String(item.place_id),
      displayName: item.display_name,
      name: item.name ?? item.display_name.split(",")[0] ?? item.display_name,
      address: item.display_name,
      lat: Number(item.lat),
      lon: Number(item.lon),
    }));

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json(
      { error: { message: "Location search failed" } },
      { status: 500 },
    );
  }
}
