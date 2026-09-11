export type RunnerDefenseSignals = {
  activeTags: number;
  visibleTagPunish: boolean;
  persistentHazardCounterRemovalAvailable: boolean;
  pendingDamage: number;
  damagePreventionNeeded: boolean;
  handSize: number;
  minimumHandBuffer: number;
  drawAllowed: boolean;
  handBufferActionIds?: string[];
  confirmedDamageTaxedDrawActionIds?: string[];
  forgoUnsafeRunCapacity: boolean;
  forgoExhaustedStandardCapacity?: boolean;
  forgoTerminalDeckPressureCapacity?: boolean;
  discardChoiceBinding?: RunnerDiscardChoiceBinding;
  tagClearFundingNeed?: {
    needId: "runner-defense-tag-clear-funding";
    parentPlanInstanceId: "plan:runner.defense_and_recovery:runner";
    targetCredits: number;
    currentCreditsAtRevalidation: number;
    gap: number;
    actionIds: string[];
    revalidation: {
      stateVersion: number;
      status: "defense_parent_open";
    };
    evidenceCode: string;
  };
  reactionReserveNeed?: {
    needId: "runner-defense-reaction-reserve";
    parentPlanInstanceId: "plan:runner.defense_and_recovery:runner";
    targetCredits: number;
    currentCreditsAtRevalidation: number;
    gap: number;
    actionIds: string[];
    revalidation: {
      stateVersion: number;
      status: "defense_parent_open";
    };
    evidenceCode: string;
  };
  defenseSupportInstallActionIds?: string[];
  defenseSupportRejectedInstallActionIds?: string[];
  defenseSupportInstallValues?: Record<string, number>;
  handBufferPriorityClass: "P3" | "P4" | "P5";
  evidenceCodes: string[];
};

export type RunnerDiscardChoiceBinding = {
  actionId: string;
  choiceId: string;
  observedAtStateVersion: number;
  selectedOptionIds: string[];
  discardedCardInstanceIds: string[];
  retainedCardInstanceIds: string[];
  emergencyKeepCardInstanceIds: string[];
  evidenceCodes: string[];
};

export type DefenseState = {
  kind: "defense";
  phase:
    | "clear_tags"
    | "fund_tag_clear"
    | "clear_persistent_hazard_counter"
    | "prevent_damage"
    | "install_defense_support"
    | "build_hand_buffer"
    | "build_reaction_reserve"
    | "discard_window"
    | "forgo_unsafe_run"
    | "forgo_exhausted_options"
    | "forgo_terminal_deck_pressure";
  signals: RunnerDefenseSignals;
};
