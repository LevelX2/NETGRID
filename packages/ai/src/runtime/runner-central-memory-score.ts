import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";

type RunnerRndTopFreshness = {
  freshness?: string;
};

type RunnerHqHandMemory = {
  knownDefinitions: readonly string[];
  allCardsKnown?: boolean;
  handCount?: number;
};

export type RunnerCentralMemoryScoreDependencies = {
  rndTopFreshness: (input: AiDecisionInput) => RunnerRndTopFreshness | undefined;
  staleKnownRndRepeatRunPenalty: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => number;
  rndFreshRepeatRunBoost: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => number;
  hqHandMemory: (input: AiDecisionInput) => RunnerHqHandMemory | undefined;
  definitionType: (definitionId: string) => string | undefined;
  staleKnownHqRepeatRunPenalty: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => number;
};

export function runnerRndMemoryScoreComponents(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: RunnerCentralMemoryScoreDependencies,
): AiDecisionScoreComponent[] {
  const components: AiDecisionScoreComponent[] = [];
  const freshness = dependencies.rndTopFreshness(input);
  const stalePenalty = dependencies.staleKnownRndRepeatRunPenalty(input, action);
  const freshBoost = dependencies.rndFreshRepeatRunBoost(input, action);
  if (freshBoost !== 0) {
    components.push({
      key: "runner_rnd_fresh_memory",
      label: "R&D-Frische",
      value: freshBoost,
      reason: freshness?.freshness ?? "unknown",
    });
  } else if (stalePenalty !== 0) {
    components.push({
      key: "runner_rnd_stale_known_top",
      label: "R&D bekannte Topkarte",
      value: -stalePenalty,
      reason: freshness?.freshness ?? "stale_known_same_top",
    });
  } else if (!freshness || freshness.freshness === "invalidated") {
    components.push({
      key: "runner_rnd_unknown_top",
      label: "R&D unbekannte Topkarte",
      value: 180,
      reason: "unknown_or_invalidated",
    });
  }
  return components;
}

export function runnerHqMemoryScoreComponents(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: RunnerCentralMemoryScoreDependencies,
): AiDecisionScoreComponent[] {
  const components: AiDecisionScoreComponent[] = [];
  const memory = dependencies.hqHandMemory(input);
  const knownDefinitions = memory?.knownDefinitions ?? [];
  const knownAgenda = knownDefinitions.some(
    (definitionId) => dependencies.definitionType(definitionId) === "agenda",
  );
  if (knownAgenda) {
    components.push({
      key: "runner_hq_known_agenda",
      label: "HQ bekannte Agenda",
      value: memory?.allCardsKnown ? 520 : 260,
      reason: memory?.allCardsKnown ? "all_hq_known" : "partial_hq_known",
    });
  }
  const stalePenalty = dependencies.staleKnownHqRepeatRunPenalty(input, action);
  if (stalePenalty !== 0) {
    components.push({
      key: "runner_hq_all_known_low_value",
      label: "HQ bekannte Low-Value-Hand",
      value: -stalePenalty,
      reason: "all_known_low_value",
    });
  } else if (knownDefinitions.length > 0 && !knownAgenda) {
    components.push({
      key: "runner_hq_partial_known_cards",
      label: "HQ bekannte Karten",
      value: -Math.min(180, knownDefinitions.length * 45),
      reason: `${knownDefinitions.length}/${memory?.handCount ?? "?"}`,
    });
  }
  return components;
}
