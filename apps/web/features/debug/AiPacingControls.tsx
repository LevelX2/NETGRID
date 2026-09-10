import { Bot, FastForward, Pause, Play, StepForward } from "lucide-react";
import type { ApiSidePayload } from "@netgrid/shared";

import type { AiPacingMode } from "../settings/settings-model";

type ClientPayload = ApiSidePayload;

export function AiPacingControls({
  presentation,
  mode,
  connection,
  observerMode = false,
  onAdvance,
  onMode,
}: {
  presentation: ClientPayload["aiTurnPresentation"] | undefined;
  mode: AiPacingMode;
  connection: "offline" | "connecting" | "online";
  observerMode?: boolean;
  onAdvance(): void;
  onMode?(mode: AiPacingMode): void;
}) {
  if (!presentation?.canAdvanceAi) return null;
  return (
    <section className="section aiPacingPanel" data-testid="ai-pacing">
      <div className="sectionTitleLine">
        <h2>{observerMode ? "Simulationssteuerung" : "KI-Steuerung"}</h2>
        <Bot size={16} />
      </div>
      <p className="aiPacingHint">
        {mode === "manual"
          ? "Pausiert. Der letzte echte Spielzustand bleibt sichtbar."
          : mode === "paced"
            ? "Getakteter Automatiklauf: jede KI-Aktion wird einzeln angezeigt."
            : "Schneller Automatiklauf: weiterhin genau eine sichtbare KI-Aktion pro Schritt."}
      </p>
      {observerMode && onMode ? (
        <div
          className="aiPacingModeButtons"
          role="group"
          aria-label="Simulationstempo"
        >
          <button
            className={`button ${mode === "manual" ? "active" : ""}`}
            onClick={() => onMode("manual")}
            type="button"
          >
            <Pause size={14} /> Pause
          </button>
          <button
            className={`button ${mode === "paced" ? "active" : ""}`}
            onClick={() => onMode("paced")}
            type="button"
          >
            <Play size={14} /> Weiter
          </button>
          <button
            className={`button ${mode === "fast" ? "active" : ""}`}
            onClick={() => onMode("fast")}
            type="button"
          >
            <FastForward size={14} /> Schnell
          </button>
        </div>
      ) : null}
      <button
        className="aiStepButton"
        onClick={onAdvance}
        disabled={!presentation.canAdvanceAi || connection !== "online"}
        type="button"
      >
        {observerMode ? <StepForward size={14} /> : <Bot size={14} />}
        {observerMode
          ? "Einzelschritt"
          : mode === "manual"
            ? "KI-Schritt"
            : "KI fortsetzen"}
      </button>
    </section>
  );
}
