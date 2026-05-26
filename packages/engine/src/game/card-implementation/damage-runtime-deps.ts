import type {
  DamageType,
  ImminentEvent,
} from "@netgrid/shared";
import type { CardEffectDamageResult } from "../../ability-engine/effect-interpreter";
import type { CardImplementationRuntimeDependencies } from "../../ability-engine/card-implementation-runtime";
import {
  createDamageImminentEvent,
  doDamage,
  openEventModificationWindow,
  openReplacementWindow,
  resolveDamageImminentEvent,
} from "../damage/damage-core";

type PublicEffectPayload = Record<string, string | number | boolean>;

type DamageSummaryForCardImplementation = {
  damageType: DamageType;
  amount: number;
  cardsTrashed: number;
  flatline: boolean;
  coreDamageAfter?: number;
  runnerMaxHandSizeAfter?: number;
};

type DamageRequestForCardImplementation = {
  damageId: string;
  damageType: DamageType;
  amount: number;
  source: string;
};

export type DamageRuntimeDepsKey =
  | "runnerWasDamagedDuringLastThreeActions"
  | "damageRunner"
  | "unpreventableDamageRunner";

export type DamageCardImplementationRuntimeDeps = Pick<
  CardImplementationRuntimeDependencies,
  DamageRuntimeDepsKey
>;

type RuntimeState = Parameters<DamageCardImplementationRuntimeDeps["damageRunner"]>[0];
type RuntimeLegalAction = Parameters<
  DamageCardImplementationRuntimeDeps["damageRunner"]
>[1];

export type DamageRuntimeDepsHost = {
  damage: {
    createDamageImminentEvent: (
      state: RuntimeState,
      request: DamageRequestForCardImplementation,
    ) => ImminentEvent;
    openReplacementWindow: (
      state: RuntimeState,
      event: ImminentEvent,
      legalAction: RuntimeLegalAction,
    ) => boolean;
    openEventModificationWindow: (
      state: RuntimeState,
      event: ImminentEvent,
      legalAction: RuntimeLegalAction,
    ) => boolean;
    resolveDamageImminentEvent: (
      state: RuntimeState,
      event: ImminentEvent,
    ) => DamageSummaryForCardImplementation;
    resolveUnpreventableDamage: (
      state: RuntimeState,
      request: DamageRequestForCardImplementation,
    ) => DamageSummaryForCardImplementation;
  };
};

const defaultDamageRuntimeDepsHost: DamageRuntimeDepsHost = {
  damage: {
    createDamageImminentEvent,
    openReplacementWindow,
    openEventModificationWindow,
    resolveDamageImminentEvent,
    resolveUnpreventableDamage: (state, request) => doDamage(state, request),
  },
};

export function createDamageCardImplementationRuntimeDeps(
  host: DamageRuntimeDepsHost = defaultDamageRuntimeDepsHost,
): DamageCardImplementationRuntimeDeps {
  function damageRunner(
    state: RuntimeState,
    legalAction: RuntimeLegalAction,
    sourceDefinitionId: Parameters<
      DamageCardImplementationRuntimeDeps["damageRunner"]
    >[2],
    damageType: Extract<DamageType, "meat" | "net" | "core">,
    amount: number,
  ): CardEffectDamageResult {
    const request = {
      damageId: `${state.matchId}.${state.stateVersion}.${sourceDefinitionId}`,
      damageType,
      amount,
      source: `operation:${sourceDefinitionId}`,
    };
    const event = host.damage.createDamageImminentEvent(state, request);
    if (
      host.damage.openReplacementWindow(state, event, legalAction) ||
      host.damage.openEventModificationWindow(state, event, legalAction)
    ) {
      return {
        resolved: false,
        damageType,
        amount: 0,
        cardsTrashed: 0,
        flatline: false,
        publicPayload: legalAction.payload ?? {},
      };
    }

    const summary = host.damage.resolveDamageImminentEvent(state, event);
    const publicPayload = damageSummaryPublicPayload(summary);
    if (typeof event.payload.baseDamageAmount === "number")
      publicPayload.baseDamageAmount = event.payload.baseDamageAmount;
    if (typeof event.payload.bioweaponsEngineeringModifier === "number")
      publicPayload.bioweaponsEngineeringModifier =
        event.payload.bioweaponsEngineeringModifier;
    return {
      resolved: true,
      damageType: summary.damageType,
      amount: summary.amount,
      cardsTrashed: summary.cardsTrashed,
      flatline: summary.flatline,
      publicPayload,
    };
  }

  function unpreventableDamageRunner(
    state: RuntimeState,
    _legalAction: RuntimeLegalAction,
    sourceDefinitionId: Parameters<
      DamageCardImplementationRuntimeDeps["unpreventableDamageRunner"]
    >[2],
    damageType: Extract<DamageType, "meat" | "net" | "core">,
    amount: number,
  ): CardEffectDamageResult {
    const summary = host.damage.resolveUnpreventableDamage(state, {
      damageId: `${state.matchId}.${state.stateVersion}.${sourceDefinitionId}.unpreventable`,
      damageType,
      amount,
      source: `unpreventable:${sourceDefinitionId}`,
    });
    return {
      resolved: true,
      damageType: summary.damageType,
      amount: summary.amount,
      cardsTrashed: summary.cardsTrashed,
      flatline: summary.flatline,
      publicPayload: {
        ...damageSummaryPublicPayload(summary),
        preventableDamage: false,
        unpreventableDamage: true,
      },
    };
  }

  return {
    runnerWasDamagedDuringLastThreeActions,
    damageRunner,
    unpreventableDamageRunner,
  };
}

function runnerWasDamagedDuringLastThreeActions(state: RuntimeState): boolean {
  const flags = state.runnerTurnFlags;
  const lastDamageOrdinal = Math.floor(flags?.lastDamageRunnerActionOrdinal ?? 0);
  if (lastDamageOrdinal <= 0) return false;
  const actionsTaken = Math.floor(flags?.runnerActionsTakenThisTurn ?? 0);
  return actionsTaken - lastDamageOrdinal < 3;
}

function damageSummaryPublicPayload(
  summary: DamageSummaryForCardImplementation,
): PublicEffectPayload {
  return {
    damageResolved: true,
    damageType: summary.damageType,
    damageAmount: summary.amount,
    cardsTrashed: summary.cardsTrashed,
    flatline: summary.flatline,
    ...(summary.coreDamageAfter !== undefined
      ? { coreDamageAfter: summary.coreDamageAfter }
      : {}),
    ...(summary.runnerMaxHandSizeAfter !== undefined
      ? { runnerMaxHandSizeAfter: summary.runnerMaxHandSizeAfter }
      : {}),
  };
}
