import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { ManagedCardImageRuntimeError } from "@netgrid/card-images";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const { lookupCardImage } = vi.hoisted(() => ({ lookupCardImage: vi.fn() }));
vi.mock("../card-image-lookup", () => ({ lookupCardImage }));

import { GET, cacheControlForCardImage, clientHasFreshImage } from "./route";

let temporaryDirectory = "";
let imagePath = "";

beforeAll(async () => {
  temporaryDirectory = await mkdtemp(
    path.join(tmpdir(), "netgrid-card-route-"),
  );
  imagePath = path.join(temporaryDirectory, "test-card.png");
  await writeFile(imagePath, Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
});

afterAll(async () => {
  await rm(temporaryDirectory, { recursive: true, force: true });
});

beforeEach(() => {
  lookupCardImage.mockReset();
  lookupCardImage.mockResolvedValue({
    cardId: "test_card",
    printingId: "test_card_printing",
    kind: "generated",
    relativePath: "generated-test-card.png",
    absolutePath: imagePath,
    mediaType: "image/png",
    versioned: true,
  });
});

describe("card image route cache contract", () => {
  it("uses immutable private caching only for versioned generated images", () => {
    expect(
      cacheControlForCardImage({ kind: "generated", versioned: true }),
    ).toBe("private, max-age=31536000, immutable");
    expect(
      cacheControlForCardImage({ kind: "generated", versioned: false }),
    ).toBe("private, max-age=0, must-revalidate");
    expect(
      cacheControlForCardImage({ kind: "localized_de", versioned: true }),
    ).toBe("private, max-age=31536000, immutable");
    expect(
      cacheControlForCardImage({ kind: "localized_de", versioned: false }),
    ).toBe("private, max-age=0, must-revalidate");
    expect(
      cacheControlForCardImage({ kind: "personal", versioned: false }),
    ).toBe("private, max-age=0, must-revalidate");
  });

  it("serves personal WebP variants with content-hash validation", async () => {
    lookupCardImage.mockResolvedValueOnce({
      cardId: "test_card",
      printingId: "test_card_printing",
      kind: "personal",
      relativePath: "blobs/sha256/ab/test.webp",
      absolutePath: imagePath,
      mediaType: "image/webp",
      contentHash: "a".repeat(64),
      variant: "preview",
      versioned: false,
    });
    const response = await GET(
      new Request(
        "http://netgrid.local/api/card-images/test_card?variant=preview",
      ),
      {
        params: Promise.resolve({ cardId: "test_card" }),
      },
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/webp");
    expect(response.headers.get("cache-control")).toBe(
      "private, max-age=0, must-revalidate",
    );
  });

  it("returns path-free diagnostics for invalid variants and personal assets", async () => {
    lookupCardImage.mockRejectedValueOnce(
      new ManagedCardImageRuntimeError(
        "invalid_variant",
        "Die angeforderte Kartenbildvariante ist ungültig.",
      ),
    );
    const invalidVariant = await GET(
      new Request(
        "http://netgrid.local/api/card-images/test_card?variant=secret",
      ),
      {
        params: Promise.resolve({ cardId: "test_card" }),
      },
    );
    expect(invalidVariant.status).toBe(400);
    expect(await invalidVariant.json()).toEqual({
      error: {
        code: "card_image_variant_invalid",
        message: "Die angeforderte Kartenbildvariante ist ungültig.",
      },
    });

    lookupCardImage.mockRejectedValueOnce(
      new ManagedCardImageRuntimeError(
        "personal_image_invalid",
        "Das persönliche Kartenbild ist unvollständig oder beschädigt.",
      ),
    );
    const invalidAsset = await GET(
      new Request("http://netgrid.local/api/card-images/test_card"),
      {
        params: Promise.resolve({ cardId: "test_card" }),
      },
    );
    const body = await invalidAsset.text();
    expect(invalidAsset.status).toBe(404);
    expect(body).not.toContain(temporaryDirectory);
    expect(JSON.parse(body).error.code).toBe("personal_card_image_invalid");
  });

  it("honors ETag and Last-Modified revalidation without exposing file paths", () => {
    const validators = {
      etag: '"abc123"',
      lastModified: "Fri, 15 May 2026 10:00:00 GMT",
    };

    expect(
      clientHasFreshImage(
        new Request("http://netgrid.local/api/card-images/simple_agenda", {
          headers: { "If-None-Match": '"abc123"' },
        }),
        validators,
      ),
    ).toBe(true);
    expect(
      clientHasFreshImage(
        new Request("http://netgrid.local/api/card-images/simple_agenda", {
          headers: { "If-None-Match": '"different"' },
        }),
        validators,
      ),
    ).toBe(false);
    expect(
      clientHasFreshImage(
        new Request("http://netgrid.local/api/card-images/onr_v1_001_afreet", {
          headers: { "If-Modified-Since": "Fri, 15 May 2026 10:00:00 GMT" },
        }),
        validators,
      ),
    ).toBe(true);
  });

  it("serves the resolved image through the exported GET handler with production headers", async () => {
    const response = await GET(
      new Request("http://netgrid.local/api/card-images/test_card?v=realism"),
      {
        params: Promise.resolve({ cardId: "test_card" }),
      },
    );

    expect(lookupCardImage).toHaveBeenCalledWith(
      "test_card",
      "http://netgrid.local/api/card-images/test_card?v=realism",
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(response.headers.get("content-length")).toBe("8");
    expect(response.headers.get("cache-control")).toBe(
      "private, max-age=31536000, immutable",
    );
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("etag")).toMatch(/^"[A-Za-z0-9_-]{24}"$/);
    expect(Buffer.from(await response.arrayBuffer())).toEqual(
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    );
  });

  it("returns a bodyless 304 through GET when the live ETag matches", async () => {
    const first = await GET(
      new Request("http://netgrid.local/api/card-images/test_card?v=realism"),
      {
        params: Promise.resolve({ cardId: "test_card" }),
      },
    );
    const etag = first.headers.get("etag");
    expect(etag).toBeTruthy();

    const response = await GET(
      new Request("http://netgrid.local/api/card-images/test_card?v=realism", {
        headers: { "If-None-Match": etag! },
      }),
      { params: Promise.resolve({ cardId: "test_card" }) },
    );

    expect(response.status).toBe(304);
    expect(await response.text()).toBe("");
    expect(response.headers.get("etag")).toBe(etag);
  });

  it("keeps missing-image GET errors path-free and non-cacheable", async () => {
    lookupCardImage.mockResolvedValueOnce({
      cardId: "missing_card",
      printingId: "missing_card_printing",
      kind: "generated",
      relativePath: "generated-missing-card.png",
      absolutePath: path.join(
        temporaryDirectory,
        "private",
        "missing-card.png",
      ),
      mediaType: "image/png",
      versioned: true,
    });

    const response = await GET(
      new Request("http://netgrid.local/api/card-images/missing_card"),
      {
        params: Promise.resolve({ cardId: "missing_card" }),
      },
    );
    const body = await response.text();

    expect(response.status).toBe(404);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(JSON.parse(body)).toEqual({
      error: {
        code: "card_image_missing",
        message: "Kartenbilddatei fehlt lokal.",
      },
    });
    expect(body).not.toContain(temporaryDirectory);
    expect(body).not.toContain("missing-card.png");
  });
});
