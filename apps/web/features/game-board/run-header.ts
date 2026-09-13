import type { PlayerView } from "@netgrid/shared";

export function runHeaderIceTitle(view: PlayerView): string | null {
  const run = view.run;
  if (!run || run.position?.kind !== "ice") return null;
  const position = run.position;
  const positionedIce = view.servers.find(
    (server) => server.id === position.serverId,
  )?.ice[position.iceIndex];
  const ice =
    run.phase === "encounter_ice"
      ? (run.encounteredIce ?? run.approachedIce ?? positionedIce)
      : (run.approachedIce ?? positionedIce);
  return ice?.known === true ? (ice.title ?? null) : null;
}

export function runHeaderTargetLabel(
  view: PlayerView,
  hiddenIceLabel: string,
): string | null {
  const run = view.run;
  if (!run || run.position?.kind !== "ice") return null;
  const direction = run.phase === "movement" ? "→ " : "";
  return `${direction}ICE ${run.position.iceIndex + 1} · ${runHeaderIceTitle(view) ?? hiddenIceLabel}`;
}
