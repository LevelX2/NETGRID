import { NextResponse } from "next/server";
import { catalogPresentationResponse } from "../../catalog-runtime";

export function GET() {
  const response = catalogPresentationResponse();
  return NextResponse.json(response.body, { status: response.status });
}
