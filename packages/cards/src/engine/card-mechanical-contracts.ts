import type {
  PlayCostDefinition,
  ResolvedStrengthDefinition,
} from "@netgrid/shared";
import type { AddressableCapabilityContract } from "../capability-identity";
import type {
  CardAbilityImplementation,
  CardAccessEffectImplementation,
  CardAccessHookImplementation,
  CardAgendaAccessReplacementImplementation,
  CardCorpUtilityImplementation,
  CardCorpTrashInstalledRunnerSourceImplementation,
  CardDamagePreventionSourceImplementation,
  CardFortRunWindowImplementation,
  CardFortCapacityModifierImplementation,
  CardHiddenReplacementLongtailImplementation,
  CardFlatlineReplacementSourceImplementation,
  CardInstallCapabilityImplementation,
  CardLeavePlayCleanupImplementation,
  CardIcebreakerAbilityImplementation,
  CardIceEncounterImplementation,
  CardInstallAdditionalCostImplementation,
  CardInstallTargetBindingImplementation,
  CardLifecycleImplementation,
  CardLifecycleTriggeredAbilityImplementation,
  CardModifierImplementation,
  CardPrintedSubroutineImplementation,
  CardRegionBaselineImplementation,
  CardRemainingReplacementLongtailImplementation,
  CardRelativeIceImplementation,
  CardRunEncounterInterventionImplementation,
  CardRunnerEventLongtailImplementation,
  CardRunnerUtilityLongtailImplementation,
  CardScoredAgendaImplementation,
  CardSelfRezAdditionalCostImplementation,
  CardSelfRezCostModifierImplementation,
  CardSelfStealCostImplementation,
  CardSuccessfulRunFollowupImplementation,
  CardTagPreventionSourceImplementation,
  CardTrashPreventionSourceImplementation,
  CardUniqueDirectLongtailImplementation,
  CardVariableRezImplementation,
  CardVirusCounterImplementation,
  HostedProgramCapacityImplementation,
  HostedProgramModifierImplementation,
  RestrictedHostedCreditSourceImplementation,
  RunnerTraceCounterEffectImplementation,
} from "./definition-types";

/**
 * Declares a Corp root-card credit outcome that resolves only after the
 * Runner's post-rez jack-out intervention window.
 *
 * This intentionally is not lifecycle.on_rez: the generic on-rez lifecycle
 * executes immediately, while this outcome can still be prevented by the
 * Runner leaving before the card effect resolves.
 */
export type CorpRootRezCreditOutcomeImplementation = {
  timing: "after_runner_rez_interrupt_window";
  effect: {
    kind: "gain_credits";
    recipient: "corp";
    amount: number;
    visibility: "public";
  };
};

/**
 * Transitional legacy registry shape. Engine may consume it while the sets
 * migrate, but new CardSpecs must use only the explicit canonical field list
 * below. Remove this container after the final set cutover.
 */
export type CardMechanicalDefinition = {
  corpRootRezCreditOutcome?: CorpRootRezCreditOutcomeImplementation;
  advanceable?: {
    while: "installed_before_and_after_rez";
  };
  printedSubroutines?: readonly CardPrintedSubroutineImplementation[];
  selfRezCostModifiers?: readonly CardSelfRezCostModifierImplementation[];
  selfRezAdditionalCosts?: readonly CardSelfRezAdditionalCostImplementation[];
  iceEncounter?: CardIceEncounterImplementation;
  icebreakerAbilities?: readonly CardIcebreakerAbilityImplementation[];
  hostedProgramCapacity?: HostedProgramCapacityImplementation;
  hostedProgramModifiers?: readonly HostedProgramModifierImplementation[];
  modifiers?: readonly CardModifierImplementation[];
  selfStealCosts?: readonly CardSelfStealCostImplementation[];
  abilities?: CardAbilityImplementation[];
  agendaAccessReplacement?: CardAgendaAccessReplacementImplementation;
  accessEffects?: readonly CardAccessEffectImplementation[];
  accessHooks?: readonly CardAccessHookImplementation[];
  lifecycle?: CardLifecycleImplementation;
  runnerCounterEffects?: readonly RunnerTraceCounterEffectImplementation[];
  restrictedHostedCreditSource?: RestrictedHostedCreditSourceImplementation;
  installAdditionalCosts?: readonly CardInstallAdditionalCostImplementation[];
  installTargetBinding?: CardInstallTargetBindingImplementation;
  icebreakerEncounterStrengthBonus?: {
    kind: "against_selected_installed_ice";
    amount: number;
    visibility: "public";
  };
  icebreakerSubtypeChange?: {
    timing:
      | "runner_main"
      | "during_run"
      | "runner_cost_penalty_support"
      | "access_start";
    cost: { clicks: 0 | 1; credits: number };
    choices: readonly ("code_gate" | "sentry" | "wall")[];
    limit?: "once_until_selected";
    visibility: "public";
  };
  runnerRunStrengthBoost?: {
    timing: "during_ice_encounter";
    cost: { tap?: true; trashSelf?: true };
    target: "installed_runner_icebreaker";
    amount: number;
    duration: "current_run";
    visibility: "public";
  };
  runnerEventTargetedEffect?: {
    kind: "add_strength_counter_to_installed_icebreaker";
    counterType: "power";
    amount: number;
    visibility: "public";
  };
  damagePreventionSources?: readonly CardDamagePreventionSourceImplementation[];
  flatlineReplacementSources?: readonly CardFlatlineReplacementSourceImplementation[];
  tagPreventionSources?: readonly CardTagPreventionSourceImplementation[];
  trashPreventionSources?: readonly CardTrashPreventionSourceImplementation[];
  successfulRunFollowups?: readonly CardSuccessfulRunFollowupImplementation[];
  fortRunWindows?: readonly CardFortRunWindowImplementation[];
  runEncounterInterventions?: readonly CardRunEncounterInterventionImplementation[];
  /**
   * Declarative authoring evidence for the generic region rules. It is not a
   * CardImplementation runtime family: the Engine owns that baseline once
   * for every region, rather than once per projected card.
   */
  regionBaseline?: CardRegionBaselineImplementation;
  installCapabilities?: readonly CardInstallCapabilityImplementation[];
  fortCapacityModifiers?: readonly CardFortCapacityModifierImplementation[];
  leavePlayCleanup?: readonly CardLeavePlayCleanupImplementation[];
  variableRez?: CardVariableRezImplementation;
  relativeIce?: CardRelativeIceImplementation;
  virusCounter?: CardVirusCounterImplementation;
  scoredAgenda?: CardScoredAgendaImplementation;
  corpUtility?: CardCorpUtilityImplementation;
  corpTrashInstalledRunnerSource?: CardCorpTrashInstalledRunnerSourceImplementation;
  hiddenReplacementLongtail?: CardHiddenReplacementLongtailImplementation;
  runnerUtilityLongtail?: CardRunnerUtilityLongtailImplementation;
  runnerEventLongtail?: CardRunnerEventLongtailImplementation;
  uniqueDirectLongtail?: CardUniqueDirectLongtailImplementation;
  remainingReplacementLongtail?: CardRemainingReplacementLongtailImplementation;
  hardwareDeck?: true;
  unique?: {
    kind: "unique_by_title";
    controller: "runner" | "corp";
  };
};

export type CardMechanicalCharacteristicsSpec = {
  /** Deck/influence-relevant faction identity; public values are derived later. */
  faction: string;
  subtypes: readonly string[];
  numeric: {
    installCost: number | null;
    memoryCost: number | null;
    rezCost: number | null;
    trashCost: number | null;
    advancementRequirement: number | null;
    agendaPoints: number | null;
  };
  /** Sole canonical source for the card's play/install/rez cost. */
  playCost: PlayCostDefinition | null;
  /** Sole canonical source for fixed, variable, random, or absent strength. */
  strength: ResolvedStrengthDefinition;
  baseLink?: number;
  memoryLimitBonus?: number;
  maxHandSizeBonus?: number;
  recurringCredits?: number;
};

/** The only mechanical section of a canonical CardSpec. */
export type AddressableCardCapability<Capability extends object> =
  Capability extends unknown
    ? Omit<
        MechanicsOnly<Capability>,
        "abilityKey" | "capabilityKey" | "addressability"
      > &
        AddressableCapabilityContract
    : never;

/** Removes author-facing display copy from the canonical mechanical graph. */
export type MechanicsOnly<Value> = Value extends readonly (infer Element)[]
  ? readonly MechanicsOnly<Element>[]
  : Value extends object
    ? {
        [Key in keyof Value as Key extends "label" | "text"
          ? never
          : Key]: MechanicsOnly<Value[Key]>;
      }
    : Value;

export type CanonicalAbilityAlias<Capability> = Capability extends object
  ? Capability extends { abilityKey?: string }
    ? AddressableCardCapability<Capability>
    : Capability
  : Capability;

type AddressableMechanicalFamilyKey =
  | "abilities"
  | "accessEffects"
  | "accessHooks"
  | "agendaAccessReplacement"
  | "corpTrashInstalledRunnerSource"
  | "corpUtility"
  | "damagePreventionSources"
  | "flatlineReplacementSources"
  | "fortRunWindows"
  | "hiddenReplacementLongtail"
  | "iceEncounter"
  | "icebreakerAbilities"
  | "icebreakerSubtypeChange"
  | "installTargetBinding"
  | "printedSubroutines"
  | "relativeIce"
  | "remainingReplacementLongtail"
  | "runEncounterInterventions"
  | "runnerCounterEffects"
  | "runnerEventLongtail"
  | "runnerEventTargetedEffect"
  | "runnerRunStrengthBoost"
  | "runnerUtilityLongtail"
  | "scoredAgenda"
  | "successfulRunFollowups"
  | "tagPreventionSources"
  | "trashPreventionSources"
  | "uniqueDirectLongtail"
  | "variableRez"
  | "virusCounter";

type AddressableMechanicalFamily<Value> = Value extends readonly (infer Entry)[]
  ? [Entry] extends [object]
    ? readonly AddressableCardCapability<Extract<Entry, object>>[]
    : never
  : Value extends object
    ? AddressableCardCapability<Value>
    : never;

type CanonicalAddressableMechanicalFamilies = {
  [Key in AddressableMechanicalFamilyKey]?: AddressableMechanicalFamily<
    NonNullable<MechanicsOnly<CardMechanicalDefinition>[Key]>
  >;
};

type CanonicalMechanicalFamilies = Omit<
  Pick<
    MechanicsOnly<CardMechanicalDefinition>,
    | "corpRootRezCreditOutcome"
    | "advanceable"
    | "printedSubroutines"
    | "selfRezCostModifiers"
    | "selfRezAdditionalCosts"
    | "iceEncounter"
    | "hostedProgramCapacity"
    | "hostedProgramModifiers"
    | "modifiers"
    | "selfStealCosts"
    | "agendaAccessReplacement"
    | "accessEffects"
    | "accessHooks"
    | "runnerCounterEffects"
    | "restrictedHostedCreditSource"
    | "installAdditionalCosts"
    | "installTargetBinding"
    | "icebreakerEncounterStrengthBonus"
    | "icebreakerSubtypeChange"
    | "runnerRunStrengthBoost"
    | "runnerEventTargetedEffect"
    | "damagePreventionSources"
    | "flatlineReplacementSources"
    | "tagPreventionSources"
    | "trashPreventionSources"
    | "runEncounterInterventions"
    | "regionBaseline"
    | "fortCapacityModifiers"
    | "leavePlayCleanup"
    | "variableRez"
    | "relativeIce"
    | "virusCounter"
    | "scoredAgenda"
    | "corpUtility"
    | "corpTrashInstalledRunnerSource"
    | "hiddenReplacementLongtail"
    | "runnerUtilityLongtail"
    | "runnerEventLongtail"
    | "uniqueDirectLongtail"
    | "remainingReplacementLongtail"
    | "hardwareDeck"
    | "unique"
  >,
  AddressableMechanicalFamilyKey | "lifecycle"
>;

export type CanonicalCardLifecycleSpec = Omit<
  MechanicsOnly<CardLifecycleImplementation>,
  "end_of_runner_turn"
> & {
  /** End-turn choices materialize LegalActions and therefore require keys. */
  end_of_runner_turn?: readonly AddressableCardCapability<CardLifecycleTriggeredAbilityImplementation>[];
};

export type CardMechanicalSpec = CanonicalMechanicalFamilies &
  CanonicalAddressableMechanicalFamilies & {
    schemaVersion: "card-mechanical-spec-v1";
    characteristics: CardMechanicalCharacteristicsSpec;
    lifecycle?: CanonicalCardLifecycleSpec;
    installCapabilities?: readonly CanonicalAbilityAlias<
      MechanicsOnly<CardInstallCapabilityImplementation>
    >[];
  };
