import { lookup as dnsLookup } from "node:dns/promises";
import { createHash } from "node:crypto";
import { BlockList, isIP } from "node:net";
import type { IncomingHttpHeaders } from "node:http";
import https, { type RequestOptions } from "node:https";
import path from "node:path";
import type { CardImageMediaType } from "./store";

export const DEFAULT_HTTPS_IMAGE_IMPORT_LIMITS = Object.freeze({
  maxBytes: 20 * 1024 * 1024,
  connectTimeoutMs: 5_000,
  totalTimeoutMs: 30_000,
  maxRedirects: 3,
});

export type HttpsImageImportLimits = {
  maxBytes: number;
  connectTimeoutMs: number;
  totalTimeoutMs: number;
  maxRedirects: number;
};

export type HttpsImageDownload = {
  content: Buffer;
  sourceFileName: string;
  sourceHash: string;
  mediaType: CardImageMediaType;
};

export type HttpsImageImportErrorCode =
  | "source_url_invalid"
  | "source_https_required"
  | "source_url_credentials_forbidden"
  | "source_url_port_forbidden"
  | "source_network_target_forbidden"
  | "source_dns_failed"
  | "source_redirect_invalid"
  | "source_redirect_limit"
  | "source_http_status_invalid"
  | "source_content_type_invalid"
  | "source_content_encoding_invalid"
  | "source_file_too_large"
  | "source_connect_timeout"
  | "source_timeout"
  | "source_download_failed";

export class HttpsImageImportError extends Error {
  constructor(
    readonly code: HttpsImageImportErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "HttpsImageImportError";
  }
}

type LookupAddress = {
  address: string;
  family: 4 | 6;
};

type HttpsTransportResponse = {
  statusCode: number;
  headers: IncomingHttpHeaders;
  remoteAddress: string;
  body: AsyncIterable<Uint8Array>;
  close: () => void;
};

type HttpsTransport = (
  target: URL,
  pinnedAddress: LookupAddress,
  connectTimeoutMs: number,
  signal: AbortSignal,
) => Promise<HttpsTransportResponse>;

type HttpsImportDependencies = {
  lookup: (hostname: string) => Promise<readonly LookupAddress[]>;
  transport: HttpsTransport;
};

export async function downloadHttpsCardImage(
  source: string,
  limits: HttpsImageImportLimits = DEFAULT_HTTPS_IMAGE_IMPORT_LIMITS,
): Promise<HttpsImageDownload> {
  return downloadHttpsCardImageWithDependencies(source, limits, {
    lookup: lookupPublicAddresses,
    transport: requestPinnedHttps,
  });
}

async function downloadHttpsCardImageWithDependencies(
  source: string,
  limits: HttpsImageImportLimits,
  dependencies: HttpsImportDependencies,
): Promise<HttpsImageDownload> {
  validateLimits(limits);
  const controller = new AbortController();
  const totalTimer = setTimeout(() => {
    controller.abort(
      new HttpsImageImportError(
        "source_timeout",
        "HTTPS-Bildimport überschritt das Gesamtzeitlimit.",
      ),
    );
  }, limits.totalTimeoutMs);
  try {
    let target = parseHttpsTarget(source);
    for (let redirectCount = 0; ; redirectCount += 1) {
      const addresses = await withAbort(
        resolveTargetAddresses(target, dependencies.lookup),
        controller.signal,
      );
      const response = await withAbort(
        dependencies.transport(
          target,
          addresses[0]!,
          limits.connectTimeoutMs,
          controller.signal,
        ),
        controller.signal,
      );
      try {
        assertConnectedAddress(response.remoteAddress, addresses);
      } catch (error) {
        response.close();
        throw error;
      }

      if (isRedirect(response.statusCode)) {
        response.close();
        if (redirectCount >= limits.maxRedirects)
          throw new HttpsImageImportError(
            "source_redirect_limit",
            `HTTPS-Bildimport überschreitet ${limits.maxRedirects} Redirects.`,
          );
        target = redirectedTarget(target, response.headers.location);
        continue;
      }

      try {
        if (response.statusCode !== 200)
          throw new HttpsImageImportError(
            "source_http_status_invalid",
            `HTTPS-Bildquelle antwortete mit Status ${response.statusCode}.`,
          );
        const mediaType = responseMediaType(response.headers["content-type"]);
        assertIdentityEncoding(response.headers["content-encoding"]);
        assertContentLength(
          response.headers["content-length"],
          limits.maxBytes,
        );
        const content = await readLimitedBody(
          response,
          limits.maxBytes,
          controller.signal,
        );
        return {
          content,
          sourceFileName: safeRemoteFileName(target),
          sourceHash: createHash("sha256").update(content).digest("hex"),
          mediaType,
        };
      } catch (error) {
        response.close();
        throw error;
      }
    }
  } catch (error) {
    if (error instanceof HttpsImageImportError) throw error;
    if (controller.signal.aborted) throw abortReason(controller.signal);
    throw new HttpsImageImportError(
      "source_download_failed",
      `HTTPS-Bildimport ist fehlgeschlagen: ${safeErrorMessage(error)}`,
    );
  } finally {
    clearTimeout(totalTimer);
  }
}

function parseHttpsTarget(source: string): URL {
  let target: URL;
  try {
    target = new URL(source);
  } catch {
    throw new HttpsImageImportError(
      "source_url_invalid",
      "Remote-Bildquelle ist keine gültige URL.",
    );
  }
  if (target.protocol !== "https:")
    throw new HttpsImageImportError(
      "source_https_required",
      "Remote-Bildquellen müssen HTTPS verwenden.",
    );
  if (target.username || target.password)
    throw new HttpsImageImportError(
      "source_url_credentials_forbidden",
      "HTTPS-Bildquellen dürfen keine Zugangsdaten in der URL enthalten.",
    );
  if (target.port && target.port !== "443")
    throw new HttpsImageImportError(
      "source_url_port_forbidden",
      "HTTPS-Bildquellen dürfen ausschließlich Port 443 verwenden.",
    );
  if (!target.hostname)
    throw new HttpsImageImportError(
      "source_url_invalid",
      "HTTPS-Bildquelle enthält keinen Hostnamen.",
    );
  return target;
}

async function resolveTargetAddresses(
  target: URL,
  lookup: HttpsImportDependencies["lookup"],
): Promise<readonly LookupAddress[]> {
  const hostname = unbracket(target.hostname).toLowerCase();
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname.endsWith(".home.arpa")
  )
    throw forbiddenNetworkTarget();
  const literalFamily = isIP(hostname);
  let addresses: readonly LookupAddress[];
  if (literalFamily === 4 || literalFamily === 6) {
    addresses = [{ address: hostname, family: literalFamily }];
  } else {
    try {
      addresses = await lookup(hostname);
    } catch {
      throw new HttpsImageImportError(
        "source_dns_failed",
        "HTTPS-Bildquelle konnte nicht öffentlich aufgelöst werden.",
      );
    }
  }
  if (addresses.length === 0)
    throw new HttpsImageImportError(
      "source_dns_failed",
      "HTTPS-Bildquelle lieferte keine DNS-Adresse.",
    );
  const unique = new Map<string, LookupAddress>();
  for (const address of addresses) {
    if (!isPublicNetworkAddress(address.address, address.family))
      throw forbiddenNetworkTarget();
    unique.set(`${address.family}:${address.address}`, address);
  }
  return [...unique.values()];
}

async function lookupPublicAddresses(
  hostname: string,
): Promise<readonly LookupAddress[]> {
  const addresses = await dnsLookup(hostname, { all: true, verbatim: true });
  return addresses.map((entry) => {
    if (entry.family !== 4 && entry.family !== 6)
      throw new HttpsImageImportError(
        "source_dns_failed",
        "HTTPS-Bildquelle lieferte eine unbekannte Adressfamilie.",
      );
    return { address: entry.address, family: entry.family };
  });
}

function requestPinnedHttps(
  target: URL,
  pinnedAddress: LookupAddress,
  connectTimeoutMs: number,
  signal: AbortSignal,
): Promise<HttpsTransportResponse> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const requestOptions: RequestOptions = {
      protocol: "https:",
      hostname: unbracket(target.hostname),
      port: 443,
      method: "GET",
      path: `${target.pathname}${target.search}`,
      headers: {
        Accept: "image/png,image/jpeg,image/webp",
        "Accept-Encoding": "identity",
        "User-Agent": "NETGRID-card-image-import/1",
      },
      lookup: (_hostname, _options, callback) => {
        callback(null, pinnedAddress.address, pinnedAddress.family);
      },
      family: pinnedAddress.family,
      servername: unbracket(target.hostname),
    };
    const request = https.request(requestOptions, (response) => {
      settled = true;
      clearTimeout(connectTimer);
      const remoteAddress = response.socket.remoteAddress;
      if (!remoteAddress) {
        response.destroy();
        reject(forbiddenNetworkTarget());
        return;
      }
      resolve({
        statusCode: response.statusCode ?? 0,
        headers: response.headers,
        remoteAddress,
        body: response,
        close: () => response.destroy(),
      });
    });
    const connectTimer = setTimeout(() => {
      request.destroy(
        new HttpsImageImportError(
          "source_connect_timeout",
          "HTTPS-Bildquelle überschritt das Verbindungszeitlimit.",
        ),
      );
    }, connectTimeoutMs);
    const abort = () => request.destroy(abortReason(signal));
    signal.addEventListener("abort", abort, { once: true });
    request.once("error", (error) => {
      clearTimeout(connectTimer);
      signal.removeEventListener("abort", abort);
      if (!settled) reject(error);
    });
    request.once("close", () => {
      clearTimeout(connectTimer);
      signal.removeEventListener("abort", abort);
    });
    request.end();
  });
}

function redirectedTarget(
  current: URL,
  location: string | string[] | undefined,
): URL {
  if (typeof location !== "string" || location.trim().length === 0)
    throw new HttpsImageImportError(
      "source_redirect_invalid",
      "HTTPS-Bildquelle lieferte einen ungültigen Redirect.",
    );
  try {
    return parseHttpsTarget(new URL(location, current).href);
  } catch (error) {
    if (error instanceof HttpsImageImportError) throw error;
    throw new HttpsImageImportError(
      "source_redirect_invalid",
      "HTTPS-Bildquelle lieferte einen ungültigen Redirect.",
    );
  }
}

function responseMediaType(
  header: string | string[] | undefined,
): CardImageMediaType {
  if (typeof header !== "string")
    throw new HttpsImageImportError(
      "source_content_type_invalid",
      "HTTPS-Bildquelle enthält keinen eindeutigen Bild-MIME-Typ.",
    );
  const mediaType = header.split(";", 1)[0]!.trim().toLowerCase();
  if (
    mediaType !== "image/png" &&
    mediaType !== "image/jpeg" &&
    mediaType !== "image/webp"
  )
    throw new HttpsImageImportError(
      "source_content_type_invalid",
      `HTTPS-Bildquelle lieferte unzulässigen MIME-Typ ${mediaType || "leer"}.`,
    );
  return mediaType;
}

function assertIdentityEncoding(header: string | string[] | undefined): void {
  if (header === undefined) return;
  if (typeof header === "string" && header.trim().toLowerCase() === "identity")
    return;
  throw new HttpsImageImportError(
    "source_content_encoding_invalid",
    "HTTPS-Bildquelle verwendet eine unzulässige Inhaltskodierung.",
  );
}

function assertContentLength(
  header: string | string[] | undefined,
  maxBytes: number,
): void {
  if (header === undefined) return;
  if (typeof header !== "string" || !/^[0-9]+$/.test(header.trim()))
    throw new HttpsImageImportError(
      "source_download_failed",
      "HTTPS-Bildquelle enthält eine ungültige Content-Length.",
    );
  const bytes = Number(header);
  if (!Number.isSafeInteger(bytes) || bytes > maxBytes)
    throw sourceTooLarge(maxBytes);
}

async function readLimitedBody(
  response: HttpsTransportResponse,
  maxBytes: number,
  signal: AbortSignal,
): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let bytes = 0;
  try {
    for await (const chunk of response.body) {
      if (signal.aborted) throw abortReason(signal);
      const buffer = Buffer.from(chunk);
      bytes += buffer.byteLength;
      if (bytes > maxBytes) throw sourceTooLarge(maxBytes);
      chunks.push(buffer);
    }
  } catch (error) {
    response.close();
    throw error;
  }
  return Buffer.concat(chunks, bytes);
}

function assertConnectedAddress(
  remoteAddress: string,
  resolvedAddresses: readonly LookupAddress[],
): void {
  const family = isIP(remoteAddress);
  if (family !== 4 && family !== 6) throw forbiddenNetworkTarget();
  if (!isPublicNetworkAddress(remoteAddress, family))
    throw forbiddenNetworkTarget();
  const allowed = new BlockList();
  for (const candidate of resolvedAddresses)
    allowed.addAddress(
      candidate.address,
      candidate.family === 4 ? "ipv4" : "ipv6",
    );
  if (!allowed.check(remoteAddress, family === 4 ? "ipv4" : "ipv6"))
    throw forbiddenNetworkTarget();
}

export function isPublicNetworkAddress(
  address: string,
  family: 4 | 6,
): boolean {
  if (isIP(address) !== family) return false;
  if (family === 4) return !BLOCKED_IPV4.check(address, "ipv4");
  return (
    GLOBAL_IPV6.check(address, "ipv6") && !BLOCKED_IPV6.check(address, "ipv6")
  );
}

function createIpv4BlockList(): BlockList {
  const blockList = new BlockList();
  for (const [network, prefix] of [
    ["0.0.0.0", 8],
    ["10.0.0.0", 8],
    ["100.64.0.0", 10],
    ["127.0.0.0", 8],
    ["169.254.0.0", 16],
    ["172.16.0.0", 12],
    ["192.0.0.0", 24],
    ["192.0.2.0", 24],
    ["192.88.99.0", 24],
    ["192.168.0.0", 16],
    ["198.18.0.0", 15],
    ["198.51.100.0", 24],
    ["203.0.113.0", 24],
    ["224.0.0.0", 4],
    ["240.0.0.0", 4],
  ] as const)
    blockList.addSubnet(network, prefix, "ipv4");
  return blockList;
}

function createIpv6BlockList(): BlockList {
  const blockList = new BlockList();
  for (const [network, prefix] of [
    ["::", 128],
    ["::1", 128],
    ["::ffff:0:0", 96],
    ["64:ff9b::", 96],
    ["64:ff9b:1::", 48],
    ["100::", 64],
    ["2001::", 23],
    ["2001:db8::", 32],
    ["2002::", 16],
    ["fc00::", 7],
    ["fe80::", 10],
    ["fec0::", 10],
    ["ff00::", 8],
  ] as const)
    blockList.addSubnet(network, prefix, "ipv6");
  return blockList;
}

function validateLimits(limits: HttpsImageImportLimits): void {
  for (const value of [
    limits.maxBytes,
    limits.connectTimeoutMs,
    limits.totalTimeoutMs,
    limits.maxRedirects,
  ]) {
    if (!Number.isSafeInteger(value) || value < 0)
      throw new HttpsImageImportError(
        "source_download_failed",
        "HTTPS-Importgrenzen sind ungültig.",
      );
  }
  if (
    limits.maxBytes === 0 ||
    limits.connectTimeoutMs === 0 ||
    limits.totalTimeoutMs === 0
  )
    throw new HttpsImageImportError(
      "source_download_failed",
      "HTTPS-Importgrenzen müssen größer als null sein.",
    );
}

function safeRemoteFileName(target: URL): string {
  const candidate = path.posix.basename(target.pathname) || "remote-image";
  let decoded = candidate;
  try {
    decoded = decodeURIComponent(candidate);
  } catch {
    // Der URL-Pfad ist bereits syntaktisch gültig; der Bericht bleibt kodiert.
  }
  const safe = decoded.replace(/[\u0000-\u001f\u007f]/g, "_").slice(0, 255);
  return safe || "remote-image";
}

function sourceTooLarge(maxBytes: number): HttpsImageImportError {
  return new HttpsImageImportError(
    "source_file_too_large",
    `HTTPS-Bildquelle überschreitet ${maxBytes} Byte.`,
  );
}

function forbiddenNetworkTarget(): HttpsImageImportError {
  return new HttpsImageImportError(
    "source_network_target_forbidden",
    "HTTPS-Bildquelle verweist nicht ausschließlich auf öffentliche Netzwerkziele.",
  );
}

function isRedirect(statusCode: number): boolean {
  return [301, 302, 303, 307, 308].includes(statusCode);
}

function unbracket(hostname: string): string {
  return hostname.startsWith("[") && hostname.endsWith("]")
    ? hostname.slice(1, -1)
    : hostname;
}

function abortReason(signal: AbortSignal): Error {
  return signal.reason instanceof Error
    ? signal.reason
    : new HttpsImageImportError(
        "source_timeout",
        "HTTPS-Bildimport wurde abgebrochen.",
      );
}

function withAbort<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) return Promise.reject(abortReason(signal));
  return new Promise((resolve, reject) => {
    const abort = () => reject(abortReason(signal));
    signal.addEventListener("abort", abort, { once: true });
    promise.then(
      (value) => {
        signal.removeEventListener("abort", abort);
        resolve(value);
      },
      (error: unknown) => {
        signal.removeEventListener("abort", abort);
        reject(error);
      },
    );
  });
}

function safeErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return "unbekannter Netzwerkfehler";
}

const BLOCKED_IPV4 = createIpv4BlockList();
const BLOCKED_IPV6 = createIpv6BlockList();
const GLOBAL_IPV6 = new BlockList();
GLOBAL_IPV6.addSubnet("2000::", 3, "ipv6");

export const __httpsImportTestOnly = {
  downloadHttpsCardImageWithDependencies,
  parseHttpsTarget,
};
