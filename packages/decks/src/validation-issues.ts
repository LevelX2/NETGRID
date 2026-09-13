export const DECK_VALIDATION_ISSUE_PARAMETERS = {
  deck_name_required: [],
  card_pool_mismatch: [],
  card_pool_version_mismatch: [],
  format_profile_unsupported: [],
  format_profile_version_mismatch: [],
  identity_missing: ["cardId"],
  identity_wrong_side: ["cardId"],
  identity_not_deck_legal: ["cardId"],
  identity_not_allowed: ["cardId"],
  identity_rule_missing: ["cardId"],
  invalid_quantity: ["cardId"],
  too_many_copies: ["cardId", "maximum"],
  unknown_card: ["cardId"],
  wrong_side_card: ["cardId"],
  card_missing_required_status: ["cardId", "status"],
  deck_legal_without_human_playable: ["cardId"],
  format_legal_requires_deck_legal: ["cardId"],
  format_legal_requires_human_playable: ["cardId"],
  influence_data_missing: ["cardId"],
  agenda_points_missing: ["cardId"],
  minimum_deck_size: ["actual", "minimum"],
  agenda_points_too_low: ["actual", "cards", "minimum", "maximum"],
  agenda_points_too_high: ["actual", "cards", "minimum", "maximum"],
  minimum_agenda_points: ["actual", "minimum"],
  agenda_density_too_low: [],
  agenda_density_too_high: [],
  influence_limit_exceeded: ["actual", "maximum"],
  runner_agenda_points: [],
  snapshot_not_immutable: [],
  snapshot_hash_mismatch: [],
  forbidden_payload: [],
} as const;

export type DeckValidationIssueCode =
  keyof typeof DECK_VALIDATION_ISSUE_PARAMETERS;
export type DeckValidationIssueParams<C extends DeckValidationIssueCode> = {
  [P in (typeof DECK_VALIDATION_ISSUE_PARAMETERS)[C][number]]: P extends
    | "cardId"
    | "status"
    ? string
    : number;
};
export type DeckValidationIssue = {
  code: DeckValidationIssueCode;
  severity: "error" | "warning";
  params: Record<string, string | number>;
};

export function createDeckValidationIssue<C extends DeckValidationIssueCode>(
  code: C,
  params: DeckValidationIssueParams<C>,
  severity: DeckValidationIssue["severity"] = "error",
): DeckValidationIssue {
  return { code, params, severity };
}

export class DeckValidationContractError extends Error {
  readonly code = "deck_validation_issue_contract_invalid";
  constructor() {
    super("Deck validation requires complete structured issues.");
  }
}

export function assertDeckValidationIssues(value: {
  issues: DeckValidationIssue[];
  errors: string[];
  warnings: string[];
}): void {
  const fail = () => {
    throw new DeckValidationContractError();
  };
  if (
    !Array.isArray(value.issues) ||
    !Array.isArray(value.errors) ||
    !Array.isArray(value.warnings)
  )
    return fail();
  for (const issue of value.issues) {
    if (
      !issue ||
      !Object.hasOwn(DECK_VALIDATION_ISSUE_PARAMETERS, issue.code) ||
      !["error", "warning"].includes(issue.severity) ||
      !issue.params ||
      typeof issue.params !== "object"
    )
      return fail();
    const required = DECK_VALIDATION_ISSUE_PARAMETERS[issue.code];
    const keys = Object.keys(issue.params);
    if (
      keys.length !== required.length ||
      !required.every((key) => keys.includes(key))
    )
      return fail();
    for (const [name, parameter] of Object.entries(issue.params)) {
      if (name === "cardId" || name === "status") {
        if (typeof parameter !== "string") return fail();
      } else if (typeof parameter !== "number" || !Number.isFinite(parameter))
        return fail();
    }
  }
  if (
    value.issues.filter((issue) => issue.severity === "error").length !==
      value.errors.length ||
    value.issues.filter((issue) => issue.severity === "warning").length !==
      value.warnings.length
  )
    return fail();
}
