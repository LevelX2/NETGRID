export type PlayMode = "human_vs_human" | "human_vs_ai" | "ai_vs_ai";
export type HumanSideSelection = "runner" | "corp" | "random";
export type HumanAiSideSelection = "runner" | "corp" | "random";
export type TechnicalMatchMode = "human_vs_human" | "human_runner_vs_corp_ai" | "human_corp_vs_runner_ai";

export type DerivedMatchStart = {
  requestedPlayMode: PlayMode;
  technicalMode?: TechnicalMatchMode;
  hostSide: HumanSideSelection;
  hasAiOpponent: boolean;
  isSimulation: boolean;
  createRequest:
    | { mode: "human_vs_human"; hostSide: HumanSideSelection }
    | { playMode: "human_vs_ai"; humanSide: HumanAiSideSelection; hostSide: HumanSideSelection }
    | { simulation: "ai_vs_ai"; hostSide: "runner" };
};

export function deriveMatchStart(input: {
  playMode: PlayMode;
  humanSideSelection: HumanSideSelection;
  humanAiSideSelection: HumanAiSideSelection;
}): DerivedMatchStart {
  if (input.playMode === "ai_vs_ai") {
    return {
      requestedPlayMode: "ai_vs_ai",
      hostSide: "runner",
      hasAiOpponent: true,
      isSimulation: true,
      createRequest: { simulation: "ai_vs_ai", hostSide: "runner" }
    };
  }

  if (input.playMode === "human_vs_ai") {
    const technicalMode =
      input.humanAiSideSelection === "runner" ? "human_runner_vs_corp_ai" : input.humanAiSideSelection === "corp" ? "human_corp_vs_runner_ai" : undefined;
    return {
      requestedPlayMode: "human_vs_ai",
      ...(technicalMode ? { technicalMode } : {}),
      hostSide: input.humanAiSideSelection,
      hasAiOpponent: true,
      isSimulation: false,
      createRequest: { playMode: "human_vs_ai", humanSide: input.humanAiSideSelection, hostSide: input.humanAiSideSelection }
    };
  }

  return {
    requestedPlayMode: "human_vs_human",
    technicalMode: "human_vs_human",
    hostSide: input.humanSideSelection,
    hasAiOpponent: false,
    isSimulation: false,
    createRequest: { mode: "human_vs_human", hostSide: input.humanSideSelection }
  };
}

export function playModeLabel(mode: PlayMode): string {
  if (mode === "human_vs_human") return "Mensch gegen Mensch · privater Link";
  if (mode === "human_vs_ai") return "Mensch gegen KI";
  return "KI gegen KI · Simulation";
}

export function sideSelectionLabel(selection: HumanSideSelection): string {
  if (selection === "random") return "Auslosen";
  return selection === "runner" ? "Ich spiele Runner" : "Ich spiele Korp";
}

export function humanAiSideLabel(selection: HumanAiSideSelection): string {
  if (selection === "random") return "Auslosen";
  return selection === "runner" ? "Runner" : "Korp";
}
