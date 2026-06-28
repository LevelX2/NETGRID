export type CorpTempoGoalFit =
  | "safe_score"
  | "advance_to_score"
  | "protect_remote"
  | "protect_central"
  | "rez_meaningful_ice"
  | "install_meaningful_ice"
  | "economy_only"
  | "opaque_ability"
  | "unrelated";

export type CorpTempoAction = {
  type: string;
  label?: string;
  sourceTitle?: string;
  targetServerId?: string;
  evidence?: readonly string[];
  debugFacts?: readonly string[];
  scoreKeys?: readonly string[];
  corpScoreTerminalWindowScoreLegal?: boolean;
  corpScoreTerminalWindowAdvanceToScoreLegal?: boolean;
  corpScoreTerminalWindowAgendaInstallLegal?: boolean;
  corpScoreTerminalScoreTaken?: boolean;
  corpScoreTerminalAdvanceTaken?: boolean;
  protectBeforeAdvance?: boolean;
  corpCreditsBelowCheapestRelevantRez?: boolean;
  corpCreditsBelowEstimatedCentralRezNeed?: boolean;
};

export type CorpTempoGoalResolution = {
  fit: CorpTempoGoalFit;
  progressRelevant: boolean;
  sideSafeEvidence: string[];
  rationale: string;
};

export function classifyCorpTempoGoal(
  action: CorpTempoAction,
): CorpTempoGoalResolution {
  const evidence = sideSafeEvidence(action);

  if (action.type === "score_agenda" || action.corpScoreTerminalScoreTaken) {
    return resolution(
      "safe_score",
      true,
      evidence,
      "Corp takes a legal scoreline action.",
    );
  }
  if (action.type === "advance_card" || action.corpScoreTerminalAdvanceTaken) {
    return resolution(
      "advance_to_score",
      true,
      evidence,
      "Corp advances an agenda or scoreline toward completion.",
    );
  }
  if (
    action.protectBeforeAdvance ||
    evidenceHasTerms(evidence, ["protect", "remote"]) ||
    evidenceHasTerms(evidence, ["protection", "remote"])
  ) {
    return resolution(
      "protect_remote",
      true,
      evidence,
      "Corp action has side-safe remote protection evidence.",
    );
  }
  if (
    evidenceHasTerms(evidence, ["protect", "central"]) ||
    evidenceHasTerms(evidence, ["protection", "central"]) ||
    evidenceHasAnyTerm(evidence, ["hq", "rd", "archives"])
  ) {
    return resolution(
      "protect_central",
      true,
      evidence,
      "Corp action has side-safe central protection evidence.",
    );
  }
  if (
    action.type === "rez_ice" &&
    evidenceHasAnyTerm(evidence, ["ice", "rez", "server", "remote", "central"])
  ) {
    return resolution(
      "rez_meaningful_ice",
      true,
      evidence,
      "Corp rezzes ICE with side-safe server relevance.",
    );
  }
  if (
    action.type === "install_card" &&
    evidenceHasAnyTerm(evidence, ["ice", "remote", "central", "protect", "server"])
  ) {
    return resolution(
      "install_meaningful_ice",
      true,
      evidence,
      "Corp installs ICE or protection with side-safe server relevance.",
    );
  }
  if (
    action.type === "gain_credit" ||
    evidenceHasAnyTerm(evidence, ["credit", "economy", "corporate", "boon"])
  ) {
    return resolution(
      "economy_only",
      false,
      evidence,
      "Corp economy has no direct side-safe score or protection conversion in this action.",
    );
  }
  if (action.type === "activated_card_ability" || action.type === "trigger_ability") {
    const abilityHasTempoEvidence = evidenceHasAnyTerm(evidence, [
      "score",
      "protect",
      "protection",
      "rez",
      "ice",
      "flatline",
      "tag",
    ]);
    return resolution(
      abilityHasTempoEvidence
        ? "protect_remote"
        : "opaque_ability",
      abilityHasTempoEvidence,
      evidence,
      abilityHasTempoEvidence
        ? "Ability has side-safe tempo evidence."
        : "Ability has no side-safe evidence for tempo progress.",
    );
  }
  return resolution(
    "unrelated",
    false,
    evidence,
    "Action is not a recognized Corp tempo goal in this shadow classifier.",
  );
}

function evidenceHasTerms(evidence: readonly string[], terms: readonly string[]): boolean {
  const termSet = new Set(terms.map((term) => term.toLocaleLowerCase("en-US")));
  return evidence.some((entry) => {
    const tokens = evidenceTokens(entry);
    return [...termSet].every((term) => tokens.has(term));
  });
}

function evidenceHasAnyTerm(evidence: readonly string[], terms: readonly string[]): boolean {
  const termSet = new Set(terms.map((term) => term.toLocaleLowerCase("en-US")));
  return evidence.some((entry) =>
    [...evidenceTokens(entry)].some((token) => termSet.has(token)),
  );
}

function evidenceTokens(entry: string): Set<string> {
  return new Set(
    entry
      .toLocaleLowerCase("en-US")
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length > 0),
  );
}

function sideSafeEvidence(action: CorpTempoAction): string[] {
  return [
    action.type,
    action.sourceTitle,
    action.targetServerId,
    ...(action.evidence ?? []),
    ...(action.debugFacts ?? []),
    ...(action.scoreKeys ?? []),
    ...(action.corpScoreTerminalWindowScoreLegal ? ["score_legal"] : []),
    ...(action.corpScoreTerminalWindowAdvanceToScoreLegal
      ? ["advance_to_score_legal"]
      : []),
    ...(action.corpScoreTerminalWindowAgendaInstallLegal
      ? ["agenda_install_legal"]
      : []),
    ...(action.corpCreditsBelowCheapestRelevantRez
      ? ["credits_below_cheapest_rez"]
      : []),
    ...(action.corpCreditsBelowEstimatedCentralRezNeed
      ? ["credits_below_central_rez_need"]
      : []),
  ]
    .filter((entry): entry is string => Boolean(entry))
    .slice(0, 16);
}

function resolution(
  fit: CorpTempoGoalFit,
  progressRelevant: boolean,
  sideSafeEvidence: string[],
  rationale: string,
): CorpTempoGoalResolution {
  return {
    fit,
    progressRelevant,
    sideSafeEvidence,
    rationale,
  };
}
