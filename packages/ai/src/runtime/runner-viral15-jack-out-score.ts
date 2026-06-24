import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";

export type RunnerViral15JackOutScoreDependencies = {
  actionCreditCost: (action: LegalAction) => number;
  isVisibleIcebreakerProgram: (card: VisibleCard) => boolean;
};

export function runnerViral15JackOutScoreComponent(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: RunnerViral15JackOutScoreDependencies,
): AiDecisionScoreComponent | undefined {
  if (
    input.side !== "runner" ||
    action.type !== "jack_out" ||
    action.payload?.v1922CorpIceAbility !== "viral_15_jack_out_tax"
  ) {
    return undefined;
  }
  const cost = dependencies.actionCreditCost(action);
  if (cost > input.playerView.own.credits) return undefined;
  const installedPrograms = (input.playerView.own.rig ?? []).filter(
    (card) => card.known === true && card.type === "program",
  );
  if (installedPrograms.length === 0) return undefined;
  const protectedBreakers = installedPrograms.filter(
    dependencies.isVisibleIcebreakerProgram,
  ).length;
  return {
    key: "runner_viral15_jack_out_prevents_program_trash",
    label: "Viral-15-Rigschutz",
    value: 1350 + Math.min(2, protectedBreakers) * 120,
    reason: [
      `jack_out_cost:${cost}`,
      `installed_programs:${installedPrograms.length}`,
      `visible_breakers:${protectedBreakers}`,
    ].join("|"),
  };
}
