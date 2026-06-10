import type {
  ActionCardSemanticProfile,
  ActionProjectionIssue,
  StrategySupportPair,
  TargetProfileMatch,
} from "../action-semantic-candidate";

export const ACTION_SEMANTIC_INVARIANT_REPORT_SCHEMA_VERSION =
  "action-semantic-invariants-v1" as const;

export type ActionSemanticInvariantIssueId =
  | "pure_type_subtype_name_signal"
  | "strategy_support_pair_incomplete"
  | "support_only_strategy_id"
  | "target_profile_hidden_info"
  | "fixture_profile_in_production_scope";

export type ActionSemanticInvariantIssue = {
  issueId: ActionSemanticInvariantIssueId;
  severity: "warning" | "error";
  path: string;
  message: string;
  evidence: string[];
};

export type ActionSemanticInvariantReport = {
  schemaVersion: typeof ACTION_SEMANTIC_INVARIANT_REPORT_SCHEMA_VERSION;
  scope: "diagnostic_only";
  productiveUseAllowed: false;
  checkedProfileCount: number;
  valid: boolean;
  issues: ActionSemanticInvariantIssue[];
  summary: {
    errorCount: number;
    warningCount: number;
    byIssueId: Record<ActionSemanticInvariantIssueId, number>;
  };
  noEffectFlags: string[];
};

export type BuildActionSemanticInvariantReportOptions = {
  allowFixtureProfiles?: boolean;
};

export function buildActionSemanticInvariantReport(
  profiles: readonly ActionCardSemanticProfile[],
  options: BuildActionSemanticInvariantReportOptions = {},
): ActionSemanticInvariantReport {
  const issues = profiles.flatMap((profile, profileIndex) =>
    profileInvariantIssues(profile, profileIndex, options),
  );

  return {
    schemaVersion: ACTION_SEMANTIC_INVARIANT_REPORT_SCHEMA_VERSION,
    scope: "diagnostic_only",
    productiveUseAllowed: false,
    checkedProfileCount: profiles.length,
    valid: issues.every((issue) => issue.severity !== "error"),
    issues,
    summary: summarizeIssues(issues),
    noEffectFlags: [
      "no_runtime_scoring",
      "no_action_selection",
      "no_legal_action_generation",
      "no_hidden_info_projection",
    ],
  };
}

function profileInvariantIssues(
  profile: ActionCardSemanticProfile,
  profileIndex: number,
  options: BuildActionSemanticInvariantReportOptions,
): ActionSemanticInvariantIssue[] {
  const basePath = `profiles[${profileIndex}]`;
  const issues: ActionSemanticInvariantIssue[] = [];

  if (options.allowFixtureProfiles !== true && fixtureLikeCardId(profile.cardId)) {
    issues.push(
      issue(
        "fixture_profile_in_production_scope",
        "error",
        `${basePath}.cardId`,
        "Fixture or harness semantic profiles must not be mixed into production-profile checks.",
        [profile.cardId],
      ),
    );
  }

  issues.push(
    ...signalIssues(`${basePath}.tacticSignals`, profile.tacticSignals),
    ...strategySupportIssues(
      `${basePath}.strategySupport`,
      profile.strategySupport ?? [],
    ),
    ...supportOnlyStrategyIssues(
      `${basePath}.strategySupport`,
      profile.tacticSignals,
      profile.strategySupport ?? [],
    ),
    ...targetProfileIssues(
      `${basePath}.targetProfileMatches`,
      profile.targetProfileMatches ?? [],
    ),
  );

  for (const [abilityIndex, ability] of (
    profile.abilitySemantics ?? []
  ).entries()) {
    const abilityPath = `${basePath}.abilitySemantics[${abilityIndex}]`;
    issues.push(
      ...signalIssues(`${abilityPath}.tacticSignals`, ability.tacticSignals),
      ...strategySupportIssues(
        `${abilityPath}.strategySupport`,
        ability.strategySupport ?? [],
      ),
      ...supportOnlyStrategyIssues(
        `${abilityPath}.strategySupport`,
        ability.tacticSignals,
        ability.strategySupport ?? [],
      ),
      ...targetProfileIssues(
        `${abilityPath}.targetProfileMatches`,
        ability.targetProfileMatches ?? [],
      ),
    );
  }

  return issues;
}

function signalIssues(
  pathPrefix: string,
  signals: readonly string[],
): ActionSemanticInvariantIssue[] {
  return signals.flatMap((signal, signalIndex) =>
    pureStructuralSignal(signal)
      ? [
          issue(
            "pure_type_subtype_name_signal",
            "error",
            `${pathPrefix}[${signalIndex}]`,
            "Semantic signals must describe behavior or tactical function, not only type, subtype or card name.",
            [signal],
          ),
        ]
      : [],
  );
}

function strategySupportIssues(
  pathPrefix: string,
  pairs: readonly StrategySupportPair[],
): ActionSemanticInvariantIssue[] {
  return pairs.flatMap((pair, pairIndex) =>
    completeStrategySupportPair(pair)
      ? []
      : [
          issue(
            "strategy_support_pair_incomplete",
            "error",
            `${pathPrefix}[${pairIndex}]`,
            "StrategySupportPair requires strategyId, role, confidence and evidence.",
            [JSON.stringify(pair)],
          ),
        ],
  );
}

function supportOnlyStrategyIssues(
  pathPrefix: string,
  signals: readonly string[],
  pairs: readonly StrategySupportPair[],
): ActionSemanticInvariantIssue[] {
  if (!signals.some((signal) => supportOnlySignal(signal)) || pairs.length === 0) {
    return [];
  }

  return [
    issue(
      "support_only_strategy_id",
      "error",
      pathPrefix,
      "Support-only semantic signals must not create StrategySupportPairs.",
      [...signals, ...pairs.map((pair) => pair.strategyId ?? "")].filter(
        (value) => value.length > 0,
      ),
    ),
  ];
}

function targetProfileIssues(
  pathPrefix: string,
  matches: readonly TargetProfileMatch[],
): ActionSemanticInvariantIssue[] {
  return matches.flatMap((match, matchIndex) => {
    const path = `${pathPrefix}[${matchIndex}]`;
    const evidence = [
      match.targetProfileId ?? "",
      ...match.issues,
      ...match.evidence,
    ].filter((value) => value.length > 0);
    const matchedHiddenInfo =
      match.status === "matched" &&
      match.issues.includes("hidden_info_blocked" as ActionProjectionIssue);
    if (!matchedHiddenInfo && !evidence.some((value) => hiddenInfoText(value))) {
      return [];
    }

    return [
      issue(
        "target_profile_hidden_info",
        "error",
        path,
        "Matched TargetProfiles must stay side-safe and must not contain hidden-info evidence.",
        evidence,
      ),
    ];
  });
}

function completeStrategySupportPair(pair: StrategySupportPair): boolean {
  return (
    nonEmptyString(pair.strategyId) &&
    nonEmptyString(pair.role) &&
    ["low", "medium", "high"].includes(pair.confidence) &&
    nonEmptyString(pair.evidence)
  );
}

function pureStructuralSignal(signal: string): boolean {
  const normalized = signal.trim().toLowerCase();
  return (
    /(^|[.:-])(type|subtype|name)[.:-]/.test(normalized) ||
    /(^|[_-])(type|subtype|name)_only([_-]|$)/.test(normalized) ||
    /^(card|own)[_-](type|subtype|name)([_-]|$)/.test(normalized)
  );
}

function supportOnlySignal(signal: string): boolean {
  const normalized = signal.trim().toLowerCase();
  return (
    normalized.includes("support_only") ||
    normalized.includes("support-only") ||
    normalized.endsWith(".support_only")
  );
}

function hiddenInfoText(value: string): boolean {
  return /\b(hidden|private|secret|engine_only|cardinstances|privatepayload|fullgamestate|decklist|sessiontoken|reconnecttoken)\b/i.test(
    value,
  );
}

function fixtureLikeCardId(cardId: string): boolean {
  return /(^test[_-]|^fixture[_-]|fixture|harness)/i.test(cardId);
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function issue(
  issueId: ActionSemanticInvariantIssueId,
  severity: "warning" | "error",
  path: string,
  message: string,
  evidence: string[],
): ActionSemanticInvariantIssue {
  return { issueId, severity, path, message, evidence };
}

function summarizeIssues(
  issues: readonly ActionSemanticInvariantIssue[],
): ActionSemanticInvariantReport["summary"] {
  const byIssueId: Record<ActionSemanticInvariantIssueId, number> = {
    pure_type_subtype_name_signal: 0,
    strategy_support_pair_incomplete: 0,
    support_only_strategy_id: 0,
    target_profile_hidden_info: 0,
    fixture_profile_in_production_scope: 0,
  };

  for (const issueEntry of issues) {
    byIssueId[issueEntry.issueId] += 1;
  }

  return {
    errorCount: issues.filter((issueEntry) => issueEntry.severity === "error")
      .length,
    warningCount: issues.filter(
      (issueEntry) => issueEntry.severity === "warning",
    ).length,
    byIssueId,
  };
}
