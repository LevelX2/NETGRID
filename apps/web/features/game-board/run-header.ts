import type { PlayerView } from "@netgrid/shared";

export function runHeaderIceTitle(view: PlayerView): string | null {
  const run = view.run;
  if (!run || run.position?.kind !== "ice") return null;
  const position = run.position;
  const ice =
    run.encounteredIce ??
    run.approachedIce ??
    view.servers.find((server) => server.id === position.serverId)?.ice[
      position.iceIndex
    ];
  return ice?.known === true ? (ice.title ?? null) : null;
}
