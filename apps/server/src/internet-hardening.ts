import type { IncomingMessage, ServerResponse } from "node:http";
import { createHash } from "node:crypto";
import type { StorageHealth } from "./storage-sqlite";

export const LOCAL_DEFAULT_TOKEN_SALT = "local-dev-netrunner-token-salt";
export const LOCAL_DEFAULT_WEB_BASE_URL = "http://127.0.0.1:3100";
export const LOCAL_DEFAULT_SERVER_BASE_URL = "http://127.0.0.1:8787";

export type DeploymentProfile = "local" | "private_internet";
export type RateLimitProfile = "off" | "local" | "private_internet" | "test";
export type HealthDetail = "safe" | "local_diagnostics";

export type DeploymentConfig = {
  profile: DeploymentProfile;
  webBaseUrl: string;
  serverBaseUrl: string;
  allowedOrigins: string[];
  tokenSalt?: string;
  rateLimitProfile: RateLimitProfile;
  trustProxyHeaders: boolean;
  healthDetail: HealthDetail;
};

export class DeploymentConfigError extends Error {
  constructor(readonly code: "insecure_deployment_config" | "missing_required_secret" | "unsafe_base_url" | "origin_not_allowed", message: string) {
    super(message);
    this.name = "DeploymentConfigError";
  }
}

export function loadDeploymentConfig(env: NodeJS.ProcessEnv = process.env): DeploymentConfig {
  const profile = env.NETRUNNER_DEPLOYMENT_PROFILE === "private_internet" ? "private_internet" : "local";
  const webBaseUrl = trimTrailingSlash(env.NETRUNNER_WEB_BASE_URL ?? LOCAL_DEFAULT_WEB_BASE_URL);
  const serverBaseUrl = trimTrailingSlash(env.NETRUNNER_SERVER_BASE_URL ?? LOCAL_DEFAULT_SERVER_BASE_URL);
  const configuredOrigins = parseOrigins(env.NETRUNNER_ALLOWED_ORIGINS);
  const localOrigins = uniqueOrigins([
    originOf(webBaseUrl),
    originOf(serverBaseUrl),
    "http://127.0.0.1:3100",
    "http://localhost:3100",
    "http://127.0.0.1:8787",
    "http://localhost:8787"
  ]);
  const allowedOrigins = configuredOrigins.length > 0 ? configuredOrigins : localOrigins;
  const config: DeploymentConfig = {
    profile,
    webBaseUrl,
    serverBaseUrl,
    allowedOrigins,
    rateLimitProfile: rateLimitProfileFromEnv(env.NETRUNNER_RATE_LIMIT_PROFILE, profile),
    trustProxyHeaders: env.NETRUNNER_TRUST_PROXY_HEADERS === "true",
    healthDetail: env.NETRUNNER_HEALTH_DETAIL === "local_diagnostics" ? "local_diagnostics" : "safe"
  };
  if (env.NETRUNNER_TOKEN_SALT) config.tokenSalt = env.NETRUNNER_TOKEN_SALT;
  validateDeploymentConfig(config, env);
  return config;
}

export function validateDeploymentConfig(config: DeploymentConfig, env: NodeJS.ProcessEnv = process.env): void {
  if (config.profile !== "private_internet") return;
  if (!env.NETRUNNER_WEB_BASE_URL || !env.NETRUNNER_SERVER_BASE_URL) {
    throw new DeploymentConfigError("insecure_deployment_config", "Private Internet verlangt explizite Web- und Server-Base-URLs.");
  }
  if (!isHttpsUrl(config.webBaseUrl) || !isHttpsUrl(config.serverBaseUrl)) {
    throw new DeploymentConfigError("unsafe_base_url", "Private Internet erlaubt nur HTTPS-Base-URLs; WebSocket-Clients leiten daraus WSS ab.");
  }
  if (!env.NETRUNNER_ALLOWED_ORIGINS || config.allowedOrigins.length === 0) {
    throw new DeploymentConfigError("origin_not_allowed", "Private Internet verlangt eine explizite Origin-Allowlist.");
  }
  if (config.allowedOrigins.some((origin) => origin === "*" || origin.includes("*"))) {
    throw new DeploymentConfigError("origin_not_allowed", "Private Internet erlaubt keine Wildcard-Origin.");
  }
  if (!config.tokenSalt || config.tokenSalt === LOCAL_DEFAULT_TOKEN_SALT) {
    throw new DeploymentConfigError("missing_required_secret", "Private Internet verlangt einen eigenen NETRUNNER_TOKEN_SALT.");
  }
}

export type OriginDecision = "allowed" | "denied";

export function applyCors(request: IncomingMessage, response: ServerResponse, config: DeploymentConfig): OriginDecision {
  const origin = request.headers.origin;
  response.setHeader("vary", "Origin");
  response.setHeader("access-control-allow-methods", "GET,POST,OPTIONS");
  response.setHeader("access-control-allow-headers", "content-type,authorization");
  response.setHeader("access-control-max-age", "600");
  if (!origin) return "allowed";
  if (!isOriginAllowed(origin, config)) return "denied";
  response.setHeader("access-control-allow-origin", origin);
  return "allowed";
}

export function isOriginAllowed(origin: string | undefined, config: DeploymentConfig): boolean {
  if (!origin) return true;
  const normalized = originOf(origin);
  return Boolean(normalized && config.allowedOrigins.includes(normalized));
}

export function clientIdentity(request: IncomingMessage, config: DeploymentConfig): string {
  if (config.trustProxyHeaders) {
    const forwardedFor = firstHeaderValue(request.headers["x-forwarded-for"])?.split(",")[0]?.trim();
    if (forwardedFor) return forwardedFor;
    const realIp = firstHeaderValue(request.headers["x-real-ip"]);
    if (realIp) return realIp.trim();
  }
  return request.socket.remoteAddress ?? "unknown-client";
}

export type RateLimitCategory = "create_match" | "token_probe" | "lifecycle" | "ai_advance" | "ws_handshake" | "ws_join";

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds?: number;
};

type RateRule = {
  limit: number;
  windowMs: number;
};

type RateBucket = {
  resetAt: number;
  count: number;
};

export class FixedWindowRateLimiter {
  private readonly buckets = new Map<string, RateBucket>();

  constructor(
    private readonly rules: Record<RateLimitCategory, RateRule | undefined>,
    private readonly now: () => number = () => Date.now()
  ) {}

  check(category: RateLimitCategory, clientKey: string, scope = "global"): RateLimitResult {
    const rule = this.rules[category];
    if (!rule || rule.limit <= 0) return { allowed: true };
    const now = this.now();
    const key = `${category}:${clientKey}:${scope}`;
    const bucket = this.buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      this.buckets.set(key, { resetAt: now + rule.windowMs, count: 1 });
      return { allowed: true };
    }
    if (bucket.count >= rule.limit) {
      return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
    }
    bucket.count += 1;
    return { allowed: true };
  }
}

export function createRateLimiter(profile: RateLimitProfile, now?: () => number): FixedWindowRateLimiter {
  if (profile === "off") return new FixedWindowRateLimiter(emptyRules(), now);
  if (profile === "test") {
    return new FixedWindowRateLimiter(
      {
        create_match: { limit: 2, windowMs: 60_000 },
        token_probe: { limit: 2, windowMs: 60_000 },
        lifecycle: { limit: 2, windowMs: 60_000 },
        ai_advance: { limit: 2, windowMs: 60_000 },
        ws_handshake: { limit: 2, windowMs: 60_000 },
        ws_join: { limit: 2, windowMs: 60_000 }
      },
      now
    );
  }
  const privateRules: Record<RateLimitCategory, RateRule> = {
    create_match: { limit: profile === "private_internet" ? 20 : 200, windowMs: 60_000 },
    token_probe: { limit: profile === "private_internet" ? 60 : 300, windowMs: 60_000 },
    lifecycle: { limit: profile === "private_internet" ? 60 : 300, windowMs: 60_000 },
    ai_advance: { limit: profile === "private_internet" ? 120 : 600, windowMs: 60_000 },
    ws_handshake: { limit: profile === "private_internet" ? 80 : 400, windowMs: 60_000 },
    ws_join: { limit: profile === "private_internet" ? 60 : 300, windowMs: 60_000 }
  };
  return new FixedWindowRateLimiter(privateRules, now);
}

export function rateLimitedPayload(): { error: { code: "rate_limited"; message: string } } {
  return { error: { code: "rate_limited", message: "Zu viele Versuche. Bitte kurz warten." } };
}

export function originDeniedPayload(): { error: { code: "origin_not_allowed"; message: string } } {
  return { error: { code: "origin_not_allowed", message: "Diese Browser-Origin ist nicht erlaubt." } };
}

export function deploymentErrorPayload(error: DeploymentConfigError): { error: { code: DeploymentConfigError["code"]; message: string } } {
  return { error: { code: error.code, message: error.message } };
}

export function redactedHealth(storage: StorageHealth, config: DeploymentConfig): Record<string, unknown> {
  return {
    ok: true,
    service: "netrunner-multiplayer",
    release: "V1.0.9",
    profile: config.profile,
    realtime: { webSocketPath: "/ws", ready: true },
    storage: {
      ok: storage.ok,
      kind: storage.kind,
      ...(typeof storage.schemaVersion === "number" ? { schemaVersion: storage.schemaVersion } : {}),
      ...(storage.storageFormat ? { storageFormat: storage.storageFormat } : {}),
      ...(storage.database ? { database: storage.database } : {}),
      ...(storage.legacyImport ? { legacyImport: storage.legacyImport } : {})
    }
  };
}

export function redactedDiagnosticsUnavailable(): { error: { code: "diagnostics_unavailable"; message: string } } {
  return { error: { code: "diagnostics_unavailable", message: "Diagnose ist in diesem Profil nicht verfügbar." } };
}

export function redactSensitiveText(value: unknown): string {
  return String(value)
    .replace(/(joinToken=)[A-Za-z0-9_-]+/g, "$1[redacted]")
    .replace(/("(?:hostSessionToken|hostReconnectToken|sessionToken|reconnectToken|joinToken|tokenHash)"\s*:\s*")[^"]+(")/gi, "$1[redacted]$2")
    .replace(/\b(?:hostSessionToken|hostReconnectToken|sessionToken|reconnectToken|joinToken|tokenHash)\b\s*[:=]\s*[A-Za-z0-9_.:-]+/gi, (match) => match.replace(/[:=]\s*.*/, "=[redacted]"))
    .replace(/sha256:[a-f0-9]{64}/gi, "sha256:[redacted]")
    .replace(/privateDeckSnapshots|privatePayload|cardInstances|decklist/gi, "[redacted-field]");
}

export function redactedJoinUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  return url.replace(/(joinToken=)[^&]+/g, "$1[redacted]");
}

export function hashClientKey(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

function emptyRules(): Record<RateLimitCategory, undefined> {
  return {
    create_match: undefined,
    token_probe: undefined,
    lifecycle: undefined,
    ai_advance: undefined,
    ws_handshake: undefined,
    ws_join: undefined
  };
}

function parseOrigins(value: string | undefined): string[] {
  if (!value) return [];
  return uniqueOrigins(
    value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => (entry === "*" ? "*" : originOf(entry)))
      .filter((entry): entry is string => Boolean(entry))
  );
}

function uniqueOrigins(values: Array<string | undefined>): string[] {
  return [...new Set(values.filter((entry): entry is string => Boolean(entry)))];
}

function originOf(value: string | undefined): string | undefined {
  if (!value) return undefined;
  if (value === "*") return "*";
  try {
    return new URL(value).origin;
  } catch {
    return undefined;
  }
}

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function rateLimitProfileFromEnv(value: string | undefined, profile: DeploymentProfile): RateLimitProfile {
  if (value === "off" || value === "local" || value === "private_internet" || value === "test") return value;
  return profile === "private_internet" ? "private_internet" : "local";
}

function firstHeaderValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}
