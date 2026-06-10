export function semanticRuntimeForcedLegacy(): boolean {
  return process.env.NETGRID_SEMANTIC_AI_RUNTIME === "legacy";
}
