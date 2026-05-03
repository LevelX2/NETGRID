import { NextResponse } from "next/server";
import { catalogStatusSummaryResponse } from "../catalog-data";

export function GET() {
  const response = catalogStatusSummaryResponse();
  return NextResponse.json(response.body, { status: response.status });
}
