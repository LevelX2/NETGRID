import type { ApiSidePayload } from "@netgrid/shared";

type ClientPayload = ApiSidePayload;

export function DiagnosticsDrawer({ open, payload, connection }: { open: boolean; payload: ClientPayload; connection: "offline" | "connecting" | "online" }) {
  if (!open) return null;
  const hash = payload.finalStateHash ?? payload.eventTail.at(-1)?.stateHashAfter ?? payload.playerView.publicEvents.at(-1)?.stateHashAfter ?? "pending";
  return (
    <section className="section diagnosticsDrawer" data-testid="diagnostics-drawer">
      <h2>Diagnostics</h2>
      <dl>
        <div>
          <dt>Connection</dt>
          <dd>{connection}</dd>
        </div>
        <div>
          <dt>StateVersion</dt>
          <dd>{payload.playerView.stateVersion}</dd>
        </div>
        <div>
          <dt>MatchVersion</dt>
          <dd>{payload.matchVersion}</dd>
        </div>
        <div>
          <dt>StateHash</dt>
          <dd>{shortDiagnosticsHash(hash)}</dd>
        </div>
        <div>
          <dt>Sync</dt>
          <dd>{connection === "online" ? "live" : "wartet"}</dd>
        </div>
        <div>
          <dt>Visibility</dt>
          <dd>side-filtered</dd>
        </div>
      </dl>
    </section>
  );
}

export function shortDiagnosticsHash(hash: string): string {
  if (hash.length <= 18) return hash;
  return `${hash.slice(0, 14)}...`;
}
