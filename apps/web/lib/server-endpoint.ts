/** The root layout projects this one public value, never the runtime environment. */
export const SERVER_ENDPOINT_ATTRIBUTE = "data-netgrid-server-origin";

export function validateServerOrigin(value: string | null | undefined): string {
  if (!value?.trim()) throw new Error("web_server_origin_missing");
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("web_server_origin_invalid");
  }
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/"
  )
    throw new Error("web_server_origin_invalid");
  return url.origin;
}

/** Resolve on use, not at module/build time: installed ports are runtime values. */
export function configuredServerHttp(): string {
  if (typeof window !== "undefined") {
    return validateServerOrigin(
      document.documentElement.getAttribute(SERVER_ENDPOINT_ATTRIBUTE),
    );
  }
  const configured = process.env.NETGRID_SERVER_BASE_URL;
  // The local developer default is not a release or browser fallback.
  return validateServerOrigin(
    configured ??
      (process.env.NETGRID_RUNTIME_PROFILE === "release"
        ? undefined
        : "http://127.0.0.1:8787"),
  );
}
