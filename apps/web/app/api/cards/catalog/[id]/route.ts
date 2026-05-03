import { NextResponse } from "next/server";
import { catalogDetailResponse } from "../../catalog-data";

export function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  return context.params.then((params) => {
    const response = catalogDetailResponse(params.id);
    return NextResponse.json(response.body, { status: response.status });
  });
}
