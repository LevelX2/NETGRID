import type { AiDecision, AiDecisionInput, LegalAction } from "@netrunner/shared";

const PRIORITY: Array<(action: LegalAction) => boolean> = [
  (action) => action.type === "mandatory_draw",
  (action) => action.type === "score_agenda",
  (action) => action.type === "rez_ice",
  (action) => action.type === "play_operation",
  (action) => action.type === "install_card" && action.payload?.placement === "root",
  (action) => action.type === "advance_card",
  (action) => action.type === "install_card" && action.payload?.placement === "ice",
  (action) => action.type === "gain_credit",
  (action) => action.type === "decline_rez",
  (action) => action.type === "end_turn"
];

export function chooseCorpAction(input: AiDecisionInput): AiDecision {
  for (const predicate of PRIORITY) {
    const match = input.legalActions.find(predicate);
    if (match) return { actionId: match.actionId, reason: `priority:${match.type}` };
  }
  const fallback = input.legalActions[0];
  if (!fallback) return { actionId: "", reason: "no legal action available" };
  return { actionId: fallback.actionId, reason: `fallback:${fallback.type}` };
}

export function assertAiInputIsSideSafe(input: AiDecisionInput): boolean {
  const serialized = JSON.stringify(input);
  const forbidden = [
    "runner_stack",
    "runner_simple_fracter",
    "runner_simple_decoder",
    "runner_simple_killer",
    "fullGameState"
  ];
  return !forbidden.some((needle) => serialized.includes(needle));
}
