import type {
  GameState,
  ResolvedGameEffect,
  ServerId,
  Side,
  Winner,
} from "@netgrid/shared";
import type { CardEffectImplementation } from "../definition-types";
import type { CardEffectExecutionContext } from "../effect-execution-types";

export type CardEffectPublicPayload = Record<string, string | number | boolean>;

export type CardEffectFamilyRuntime = {
  recipientSide: (
    context: CardEffectExecutionContext,
    recipient: "controller" | "runner" | "corp",
  ) => Side;
  gainCredits: (state: GameState, side: Side, amount: number) => void;
  creditsForSide: (state: GameState, side: Side) => number;
  loseCredits: (state: GameState, side: Side, amount: number) => void;
  spendCreditsIfAvailable: (
    state: GameState,
    side: Side,
    amount: number,
  ) => boolean;
  loseGame: (state: GameState, side: Side) => Winner;
  addRunnerTags: (state: GameState, amount: number) => void;
  publicEffectId: (
    context: CardEffectExecutionContext,
    index: number,
    kind: string,
  ) => string;
  effectReason: (context: CardEffectExecutionContext) => string;
  assertPositiveIntegerAmount: (kind: string, amount: number) => void;
  assertPublicVisibility: (kind: string, visibility: string) => void;
  assertHiddenInfoBarrierVisibility: (kind: string, visibility: string) => void;
  mergePublicPayload: (
    target: CardEffectPublicPayload,
    next: CardEffectPublicPayload | undefined,
  ) => void;
  dataFortServerIds: (state: GameState) => Exclude<ServerId, "new_remote">[];
};

export type CardEffectFamilyInput = {
  state: GameState;
  context: CardEffectExecutionContext;
  effect: CardEffectImplementation;
  index: number;
  publicPayload: CardEffectPublicPayload;
  resolvedEffects: ResolvedGameEffect[];
  runtime: CardEffectFamilyRuntime;
};
