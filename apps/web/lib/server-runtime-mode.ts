export type ServerRuntimeMode = "normal" | "watch";

export function serverRuntimeModeFromHealth(
  value: unknown,
): ServerRuntimeMode | undefined {
  if (!value || typeof value !== "object") return undefined;
  const runtime = (value as { runtime?: unknown }).runtime;
  if (!runtime || typeof runtime !== "object") return undefined;
  const mode = (runtime as { mode?: unknown }).mode;
  return mode === "normal" || mode === "watch" ? mode : undefined;
}
