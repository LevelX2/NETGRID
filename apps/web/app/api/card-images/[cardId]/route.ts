import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { NextResponse } from "next/server";
import { lookupCardImage, type CardImageLookupResult } from "../card-image-lookup";

const LOCAL_ONR_CACHE_CONTROL = "private, max-age=0, must-revalidate";
const VERSIONED_CACHE_CONTROL = "private, max-age=31536000, immutable";

export async function GET(request: Request, context: { params: Promise<{ cardId: string }> }) {
  const { cardId } = await context.params;
  const image = await lookupCardImage(cardId, request.url);
  if (!image) return safeImageError("card_image_not_found", "Kartenbild wurde nicht gefunden.", 404);

  let fileStat: Awaited<ReturnType<typeof stat>>;
  try {
    fileStat = await stat(image.absolutePath);
    if (!fileStat.isFile()) return safeImageError("card_image_missing", "Kartenbilddatei fehlt lokal.", 404);
  } catch {
    return safeImageError("card_image_missing", "Kartenbilddatei fehlt lokal.", 404);
  }

  const validators = imageValidators(image, fileStat);
  const headers = imageResponseHeaders(image, fileStat, validators);
  if (clientHasFreshImage(request, validators)) return new NextResponse(null, { status: 304, headers });

  try {
    const body = await readFile(image.absolutePath);
    return new NextResponse(body, { status: 200, headers });
  } catch {
    return safeImageError("card_image_missing", "Kartenbilddatei fehlt lokal.", 404);
  }
}

function imageResponseHeaders(
  image: CardImageLookupResult,
  fileStat: Awaited<ReturnType<typeof stat>>,
  validators: { etag: string; lastModified: string }
): Headers {
  const headers = new Headers({
    "Cache-Control": cacheControlForCardImage(image),
    "Content-Length": String(fileStat.size),
    "Content-Type": "image/png",
    ETag: validators.etag,
    "Last-Modified": validators.lastModified,
    "X-Content-Type-Options": "nosniff"
  });
  return headers;
}

function imageValidators(image: CardImageLookupResult, fileStat: Awaited<ReturnType<typeof stat>>): { etag: string; lastModified: string } {
  const hash = createHash("sha256")
    .update(`${image.kind}:${image.cardId}:${Number(fileStat.size)}:${Math.floor(Number(fileStat.mtimeMs))}`)
    .digest("base64url")
    .slice(0, 24);
  return {
    etag: `"${hash}"`,
    lastModified: fileStat.mtime.toUTCString()
  };
}

export function cacheControlForCardImage(image: Pick<CardImageLookupResult, "kind" | "versioned">): string {
  return image.kind === "generated" && image.versioned ? VERSIONED_CACHE_CONTROL : LOCAL_ONR_CACHE_CONTROL;
}

export function clientHasFreshImage(request: Request, validators: { etag: string; lastModified: string }): boolean {
  const ifNoneMatch = request.headers.get("if-none-match");
  if (ifNoneMatch) return ifNoneMatch.split(",").map((value) => value.trim()).some((value) => value === "*" || value === validators.etag);

  const ifModifiedSince = request.headers.get("if-modified-since");
  if (!ifModifiedSince) return false;
  const sinceMs = Date.parse(ifModifiedSince);
  const lastModifiedMs = Date.parse(validators.lastModified);
  return Number.isFinite(sinceMs) && Number.isFinite(lastModifiedMs) && lastModifiedMs <= sinceMs;
}

function safeImageError(code: string, message: string, status: 403 | 404): NextResponse {
  return NextResponse.json(
    { error: { code, message } },
    {
      status,
      headers: {
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff"
      }
    }
  );
}
