export type CorpHandManagementSignal = {
  handPlanId: string;
  parentPlanInstanceId?: string;
  parentNeedId?: string;
  phase:
    | "draw_for_plan"
    | "develop_card"
    | "resolve_hq_overflow"
    | "agenda_flood_relief"
    | "discard_window"
    | "draw_filter_window"
    | "hq_shuffle_window";
  sourceDefinitionIds?: string[];
  sourceInstanceId?: string;
  actionIds?: string[];
  exactActionRoute?: boolean;
  agendaCount: number;
  handSize: number;
  maximumHandSize: number;
  concretePurposeCode: string;
  priorityClass?: "P3" | "P5" | "P6";
  routeAllowed?: boolean;
  uncertainty?: {
    kind: "draw_then_observe";
    unknownOutcome: "drawn_card_identity";
    revalidateAfterCurrentHead: true;
  };
  drawAttemptState?: {
    turnKey: string;
    remainingAttempts: 0 | 1;
    selectedAtStateVersion?: number;
  };
  overflowResolutionState?: {
    turnKey: string;
    initialOverflowCount: number;
    maximumConversions: number;
    remainingConversions: number;
    selectedAtStateVersion?: number;
    expectedOverflowAfterSelectedConversion?: number;
  };
  discardChoiceBinding?: {
    actionId: string;
    choiceId: string;
    observedAtStateVersion: number;
    selectedOptionIds: string[];
    discardedCardInstanceIds: string[];
    retainedCardInstanceIds: string[];
    evidenceCodes: string[];
  };
  drawFilterChoiceBinding?: {
    actionId: string;
    choiceId: string;
    observedAtStateVersion: number;
    selectedOptionIds: string[];
    bottomedCardInstanceIds: string[];
    retainedCardInstanceIds: string[];
    evidenceCodes: string[];
  };
  hqShuffleChoiceBinding?: {
    actionId: string;
    choiceId: string;
    observedAtStateVersion: number;
    selectedOptionIds: string[];
    shuffledCardInstanceIds: string[];
    retainedCardInstanceIds: string[];
    evidenceCodes: string[];
  };
  actionPriorityOrder?: string[];
  value: number;
  evidenceCode: string;
};
