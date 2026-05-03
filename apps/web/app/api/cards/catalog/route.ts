import { NextResponse } from "next/server";
import { catalogListResponse } from "../catalog-data";

export function GET(request: Request) {
  const response = catalogListResponse(new URL(request.url).searchParams);
  return NextResponse.json(response.body, { status: response.status });
}
