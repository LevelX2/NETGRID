import type { PlayerView } from "@netgrid/shared";
import { runHeaderTargetLabel } from "./run-header";

/** Two single-line rows; the phase remains visible when the server is long. */
export function RunTimelineHeading({
  view,
  serverLabel,
  phaseLabel,
  hiddenIceLabel,
  statusLabel,
}: {
  view: PlayerView;
  serverLabel: string;
  phaseLabel: string;
  hiddenIceLabel: string;
  statusLabel: string | null;
}) {
  const detail = runHeaderTargetLabel(view, hiddenIceLabel) ?? statusLabel;
  const title = [serverLabel, phaseLabel, statusLabel]
    .filter(Boolean)
    .join(" · ");
  return (
    <>
      <strong className="runTimelineTitle" title={title}>
        <span>{serverLabel}</span>
        <small> · {phaseLabel}</small>
      </strong>
      {detail ? (
        <small className="runTimelineDetail" title={detail}>
          {detail}
        </small>
      ) : null}
    </>
  );
}
