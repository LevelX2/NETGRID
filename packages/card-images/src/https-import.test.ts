import { describe, expect, it, vi } from "vitest";
import {
  __httpsImportTestOnly,
  isPublicNetworkAddress,
  type HttpsImageImportLimits,
} from "./https-import";

const PUBLIC_IPV4 = "93.184.216.34";
const TEST_LIMITS: HttpsImageImportLimits = {
  maxBytes: 32,
  connectTimeoutMs: 100,
  totalTimeoutMs: 1_000,
  maxRedirects: 2,
};

describe("hardened HTTPS image download", () => {
  it("accepts a direct public HTTPS image with bounded bytes", async () => {
    const result =
      await __httpsImportTestOnly.downloadHttpsCardImageWithDependencies(
        "https://images.example/card%20one.png?version=1",
        TEST_LIMITS,
        fakeDependencies([
          response({
            headers: { "content-type": "image/png", "content-length": "4" },
            chunks: [Buffer.from([1, 2]), Buffer.from([3, 4])],
          }),
        ]),
      );

    expect(result).toMatchObject({
      content: Buffer.from([1, 2, 3, 4]),
      sourceFileName: "card one.png",
      mediaType: "image/png",
    });
    expect(result.sourceHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("requires HTTPS, forbids credentials and restricts the port", async () => {
    const dependencies = fakeDependencies([]);
    await expect(
      __httpsImportTestOnly.downloadHttpsCardImageWithDependencies(
        "http://images.example/card.png",
        TEST_LIMITS,
        dependencies,
      ),
    ).rejects.toMatchObject({ code: "source_https_required" });
    await expect(
      __httpsImportTestOnly.downloadHttpsCardImageWithDependencies(
        "https://user:secret@images.example/card.png",
        TEST_LIMITS,
        dependencies,
      ),
    ).rejects.toMatchObject({ code: "source_url_credentials_forbidden" });
    await expect(
      __httpsImportTestOnly.downloadHttpsCardImageWithDependencies(
        "https://images.example:8443/card.png",
        TEST_LIMITS,
        dependencies,
      ),
    ).rejects.toMatchObject({ code: "source_url_port_forbidden" });
  });

  it("rejects local, private, metadata, documentation and mapped addresses", async () => {
    for (const address of [
      "127.0.0.1",
      "10.0.0.1",
      "169.254.169.254",
      "192.168.1.1",
      "198.51.100.20",
    ])
      expect(isPublicNetworkAddress(address, 4)).toBe(false);
    for (const address of ["::1", "fc00::1", "fe80::1", "2001:db8::1"])
      expect(isPublicNetworkAddress(address, 6)).toBe(false);
    expect(isPublicNetworkAddress("8.8.8.8", 4)).toBe(true);
    expect(isPublicNetworkAddress("2606:4700:4700::1111", 6)).toBe(true);

    const transport = vi.fn();
    await expect(
      __httpsImportTestOnly.downloadHttpsCardImageWithDependencies(
        "https://images.example/card.png",
        TEST_LIMITS,
        {
          lookup: async () => [
            { address: PUBLIC_IPV4, family: 4 },
            { address: "127.0.0.1", family: 4 },
          ],
          transport,
        },
      ),
    ).rejects.toMatchObject({ code: "source_network_target_forbidden" });
    expect(transport).not.toHaveBeenCalled();
  });

  it("revalidates every redirect and rejects a redirect to an internal target", async () => {
    const transport = vi.fn(async () =>
      response({
        statusCode: 302,
        headers: { location: "https://127.0.0.1/card.png" },
      }),
    );
    await expect(
      __httpsImportTestOnly.downloadHttpsCardImageWithDependencies(
        "https://images.example/card.png",
        TEST_LIMITS,
        {
          lookup: async () => [{ address: PUBLIC_IPV4, family: 4 }],
          transport,
        },
      ),
    ).rejects.toMatchObject({ code: "source_network_target_forbidden" });
    expect(transport).toHaveBeenCalledTimes(1);
  });

  it("rejects unsafe redirect protocols and excessive redirects", async () => {
    await expect(
      __httpsImportTestOnly.downloadHttpsCardImageWithDependencies(
        "https://images.example/card.png",
        TEST_LIMITS,
        fakeDependencies([
          response({
            statusCode: 302,
            headers: { location: "http://example.com/x" },
          }),
        ]),
      ),
    ).rejects.toMatchObject({ code: "source_https_required" });

    await expect(
      __httpsImportTestOnly.downloadHttpsCardImageWithDependencies(
        "https://images.example/card.png",
        { ...TEST_LIMITS, maxRedirects: 0 },
        fakeDependencies([
          response({ statusCode: 302, headers: { location: "/again.png" } }),
        ]),
      ),
    ).rejects.toMatchObject({ code: "source_redirect_limit" });
  });

  it("validates response status, MIME type, encoding and both byte limits", async () => {
    await expectDownloadError(
      response({ statusCode: 404 }),
      "source_http_status_invalid",
    );
    await expectDownloadError(
      response({ headers: { "content-type": "text/html" } }),
      "source_content_type_invalid",
    );
    await expectDownloadError(
      response({
        headers: {
          "content-type": "image/png",
          "content-encoding": "gzip",
        },
      }),
      "source_content_encoding_invalid",
    );
    await expectDownloadError(
      response({
        headers: { "content-type": "image/png", "content-length": "33" },
      }),
      "source_file_too_large",
    );
    await expectDownloadError(
      response({
        headers: { "content-type": "image/png" },
        chunks: [Buffer.alloc(20), Buffer.alloc(20)],
      }),
      "source_file_too_large",
    );
  });

  it("applies an overall timeout even when the transport does not settle", async () => {
    await expect(
      __httpsImportTestOnly.downloadHttpsCardImageWithDependencies(
        "https://images.example/card.png",
        { ...TEST_LIMITS, totalTimeoutMs: 10 },
        {
          lookup: async () => [{ address: PUBLIC_IPV4, family: 4 }],
          transport: () => new Promise(() => undefined),
        },
      ),
    ).rejects.toMatchObject({ code: "source_timeout" });
  });
});

async function expectDownloadError(
  candidate: ReturnType<typeof response>,
  code: string,
): Promise<void> {
  await expect(
    __httpsImportTestOnly.downloadHttpsCardImageWithDependencies(
      "https://images.example/card.png",
      TEST_LIMITS,
      fakeDependencies([candidate]),
    ),
  ).rejects.toMatchObject({ code });
}

function fakeDependencies(responses: ReturnType<typeof response>[]) {
  return {
    lookup: async () => [{ address: PUBLIC_IPV4, family: 4 as const }],
    transport: async () => {
      const next = responses.shift();
      if (!next) throw new Error("unexpected transport call");
      return next;
    },
  };
}

function response(
  options: {
    statusCode?: number;
    headers?: Record<string, string>;
    chunks?: readonly Uint8Array[];
  } = {},
) {
  return {
    statusCode: options.statusCode ?? 200,
    headers: options.headers ?? { "content-type": "image/png" },
    remoteAddress: PUBLIC_IPV4,
    body: {
      async *[Symbol.asyncIterator]() {
        for (const chunk of options.chunks ?? []) yield chunk;
      },
    },
    close: vi.fn(),
  };
}
