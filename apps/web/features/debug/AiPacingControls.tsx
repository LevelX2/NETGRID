import { Bot } from "lucide-react";
import type { ApiSidePayload } from "@netgrid/shared";

import type { AiPacingMode } from "../settings/settings-model";

type ClientPayload = ApiSidePayload;

export function AiPacingControls({
  presentation,
  mode,
  connection,
  onAdvance
}: {
  presentation: ClientPayload["aiTurnPresentation"] | undefined;
  mode: AiPacingMode;
  connection: "offline" | "connecting" | "online";
  onAdvance(): void;
}) {
  if (!presentation?.canAdvanceAi) return null;
  return (
    <section className="section aiPacingPanel" data-testid="ai-pacing">
      <div className="sectionTitleLine">
        <h2>KI-Steuerung</h2>
        <Bot size={16} />
      </div>
      <p className="aiPacingHint">
        {mode === "manual" ? "Einzelschritt aktiv." : mode === "paced" ? "Getakteter Automatiklauf aktiv." : "Schneller Automatiklauf aktiv."}
      </p>
      <button className="aiStepButton" onClick={onAdvance} disabled={!presentation.canAdvanceAi || connection !== "online"} type="button">
        <Bot size={14} />
        {mode === "manual" ? "KI-Schritt" : "KI fortsetzen"}
      </button>
    </section>
  );
}
