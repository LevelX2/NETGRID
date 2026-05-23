import { describe, expect, it } from "vitest";
import { cacheControlForCardImage, clientHasFreshImage } from "./route";

describe("card image route cache contract", () => {
  it("uses immutable private caching only for versioned generated images", () => {
    expect(cacheControlForCardImage({ kind: "generated", versioned: true })).toBe("private, max-age=31536000, immutable");
    expect(cacheControlForCardImage({ kind: "generated", versioned: false })).toBe("private, max-age=0, must-revalidate");
    expect(cacheControlForCardImage({ kind: "local_onr", versioned: false })).toBe("private, max-age=0, must-revalidate");
  });

  it("honors ETag and Last-Modified revalidation without exposing file paths", () => {
    const validators = { etag: '"abc123"', lastModified: "Fri, 15 May 2026 10:00:00 GMT" };

    expect(clientHasFreshImage(new Request("http://netgrid.local/api/card-images/simple_agenda", { headers: { "If-None-Match": '"abc123"' } }), validators)).toBe(true);
    expect(clientHasFreshImage(new Request("http://netgrid.local/api/card-images/simple_agenda", { headers: { "If-None-Match": '"different"' } }), validators)).toBe(false);
    expect(clientHasFreshImage(new Request("http://netgrid.local/api/card-images/onr_v1_001_afreet", { headers: { "If-Modified-Since": "Fri, 15 May 2026 10:00:00 GMT" } }), validators)).toBe(true);
  });
});
