import { NextResponse } from "next/server";
import { catalogDeckCardsResponse } from "../../catalog-runtime";

export function GET() {
  const response = catalogDeckCardsResponse();
  return NextResponse.json(response.body, { status: response.status });
}
