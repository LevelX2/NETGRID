import {
  DEMO_CARDS_BY_ID,
  type CardDefinition,
  type CardInstanceId,
  type GameState,
  type LegalAction,
} from "@netgrid/shared";
import { ZETATECH_SOFTWARE_INSTALLER_SOURCE } from "../../mechanics/longtail-card-effects";
import {
  hostedPaymentCredits,
  isRestrictedHostedCreditSource,
  restrictedHostedCreditSourceIds,
} from "../run/run-duration-payment";
import { makeActionId } from "../turn/action-builders";

export type RunnerProgramInstallPaymentSourcePayment = {
  sourceCardId: CardInstanceId;
  amount: number;
};

export type RunnerInstallCreditSpendResult = {
  amount: number;
  normalCreditsSpent: number;
  hostedCreditsSpent: number;
  recurringCreditsSpent: number;
  temporaryCreditsSpent: number;
  sourceDefinitionIds: string[];
  runnerCreditsAfter: number;
};

export function runnerProgramInstallOptionalCreditSourceIds(
  state: GameState,
): CardInstanceId[] {
  return restrictedHostedCreditSourceIds(state, "install_programs", {
    installCardType: "program",
  });
}

export function runnerProgramInstallAutomaticCreditSourceIds(
  state: GameState,
): CardInstanceId[] {
  return [
    ...state.runner.rig.hardware.filter(
      (cardId) => definitionFor(state, cardId).id === "v099_recurring_chip",
    ),
    ...state.runner.rig.programs.filter(
      (cardId) =>
        definitionFor(state, cardId).id === ZETATECH_SOFTWARE_INSTALLER_SOURCE,
    ),
  ]
    .filter((cardId) => !isRestrictedHostedCreditSource(definitionFor(state, cardId)))
    .filter((cardId) => hostedPaymentCredits(state, cardId) > 0)
    .sort();
}

export function runnerProgramInstallOptionalCreditTotal(
  state: GameState,
): number {
  return runnerProgramInstallOptionalCreditSourceIds(state).reduce(
    (sum, cardId) => sum + hostedPaymentCredits(state, cardId),
    0,
  );
}

export function runnerProgramInstallAutomaticCreditTotal(
  state: GameState,
): number {
  return runnerProgramInstallAutomaticCreditSourceIds(state).reduce(
    (sum, cardId) => sum + hostedPaymentCredits(state, cardId),
    0,
  );
}

export function expandRunnerProgramInstallPaymentActions(
  state: GameState,
  action: LegalAction,
  input: {
    installCost: number;
    availableProgramInstallCredits: number;
  },
): LegalAction[] {
  const installCost = Math.max(0, Math.floor(input.installCost));
  if (installCost <= 0) return [action];
  const sources = runnerProgramInstallOptionalCreditSourceIds(state);
  if (sources.length === 0) return [action];
  const optionalTotal = runnerProgramInstallOptionalCreditTotal(state);
  const nonOptionalCredits = Math.max(
    0,
    Math.floor(input.availableProgramInstallCredits) - optionalTotal,
  );
  const payments = enumerateInstallPaymentSourceAmounts(
    state,
    sources,
    installCost,
    nonOptionalCredits,
  );
  if (payments.length === 0) return [];
  if (payments.length === 1 && totalSourceCredits(payments[0] ?? []) === 0)
    return [action];
  return payments.map((sourcePayments) =>
    actionWithRunnerInstallPayment(state, action, sourcePayments),
  );
}

export function runnerInstallPaymentSourcePaymentsFromPayload(
  payload: LegalAction["payload"] | undefined,
): RunnerProgramInstallPaymentSourcePayment[] | undefined {
  const rawIds = payload?.runnerInstallPaymentSourceIds;
  const rawAmounts = payload?.runnerInstallPaymentSourceAmounts;
  if (rawIds === undefined && rawAmounts === undefined) return undefined;
  if (typeof rawIds !== "string" || typeof rawAmounts !== "string")
    throw new Error("Die Programminstallations-Zahlungsaufteilung ist ungueltig.");
  const sourceIds = rawIds.length > 0 ? rawIds.split(",") : [];
  const amounts = rawAmounts.length > 0 ? rawAmounts.split(",") : [];
  if (sourceIds.length !== amounts.length)
    throw new Error("Die Programminstallations-Zahlungsaufteilung ist ungueltig.");
  return sourceIds.map((sourceCardId, index) => {
    const amount = Number(amounts[index]);
    if (!sourceCardId || !Number.isInteger(amount) || amount < 0)
      throw new Error("Die Programminstallations-Zahlungsaufteilung ist ungueltig.");
    return {
      sourceCardId: sourceCardId as CardInstanceId,
      amount,
    };
  });
}

export function runnerInstallPaymentPayloadForChoiceSource(
  source: string,
): NonNullable<LegalAction["payload"]> {
  const parts = source.split(":");
  const encoded = parts[3] ?? "";
  if (!encoded.startsWith("payment=")) return {};
  const paymentParts = encoded.slice("payment=".length).split(";");
  const ids = paymentParts.find((part) => part.startsWith("ids="))?.slice(4);
  const amounts = paymentParts
    .find((part) => part.startsWith("amounts="))
    ?.slice(8);
  if (ids === undefined || amounts === undefined) return {};
  return {
    runnerInstallPaymentSourceIds: ids,
    runnerInstallPaymentSourceAmounts: amounts,
  };
}

export function runnerInstallPaymentChoiceSourceSuffix(
  payload: LegalAction["payload"] | undefined,
): string {
  const ids = payload?.runnerInstallPaymentSourceIds;
  const amounts = payload?.runnerInstallPaymentSourceAmounts;
  if (typeof ids !== "string" || typeof amounts !== "string") return "";
  return `:payment=ids=${ids};amounts=${amounts}`;
}

export function runnerInstallPaymentPublicPayload(
  result: RunnerInstallCreditSpendResult,
): NonNullable<LegalAction["payload"]> {
  return {
    installCostPaid: result.amount,
    runnerInstallNormalCreditsPaid: result.normalCreditsSpent,
    runnerInstallHostedCreditsPaid: result.hostedCreditsSpent,
    runnerInstallRecurringCreditsPaid: result.recurringCreditsSpent,
    runnerInstallTemporaryCreditsPaid: result.temporaryCreditsSpent,
    runnerCreditsAfter: result.runnerCreditsAfter,
    ...(result.sourceDefinitionIds.length > 0
      ? {
          runnerInstallPaymentSourceDefinitionIds:
            result.sourceDefinitionIds.join(","),
        }
      : {}),
  };
}

function enumerateInstallPaymentSourceAmounts(
  state: GameState,
  sources: CardInstanceId[],
  installCost: number,
  nonOptionalCredits: number,
): RunnerProgramInstallPaymentSourcePayment[][] {
  const results: RunnerProgramInstallPaymentSourcePayment[][] = [];
  const current: RunnerProgramInstallPaymentSourcePayment[] = [];

  const visit = (index: number, spent: number): void => {
    if (spent > installCost) return;
    if (index >= sources.length) {
      if (installCost - spent <= nonOptionalCredits)
        results.push(current.map((entry) => ({ ...entry })));
      return;
    }
    const sourceCardId = sources[index]!;
    const max = Math.min(hostedPaymentCredits(state, sourceCardId), installCost - spent);
    for (let amount = 0; amount <= max; amount += 1) {
      current.push({ sourceCardId, amount });
      visit(index + 1, spent + amount);
      current.pop();
    }
  };

  visit(0, 0);
  return results.sort((left, right) => {
    const totalDelta = totalSourceCredits(left) - totalSourceCredits(right);
    if (totalDelta !== 0) return totalDelta;
    return amountSignature(left).localeCompare(amountSignature(right));
  });
}

function actionWithRunnerInstallPayment(
  state: GameState,
  action: LegalAction,
  sourcePayments: RunnerProgramInstallPaymentSourcePayment[],
): LegalAction {
  const payload = {
    ...(action.payload ?? {}),
    ...runnerInstallPaymentPayload(state, sourcePayments),
  };
  const label = `${action.label} (${paymentLabel(state, sourcePayments)})`;
  return {
    ...action,
    actionId: makeActionId(action.type, action.side, payload, action.source),
    label,
    payload,
  };
}

function runnerInstallPaymentPayload(
  state: GameState,
  sourcePayments: RunnerProgramInstallPaymentSourcePayment[],
): NonNullable<LegalAction["payload"]> {
  const sourceCredits = totalSourceCredits(sourcePayments);
  const sourceDefinitionIds = [
    ...new Set(
      sourcePayments
        .filter((payment) => payment.amount > 0)
        .map((payment) => definitionFor(state, payment.sourceCardId).id),
    ),
  ].sort();
  return {
    runnerInstallPaymentSourceIds: sourcePayments
      .map((payment) => payment.sourceCardId)
      .join(","),
    runnerInstallPaymentSourceAmounts: sourcePayments
      .map((payment) => String(payment.amount))
      .join(","),
    runnerInstallPaymentHostedCredits: sourceCredits,
    runnerInstallPaymentLabel: paymentLabel(state, sourcePayments),
    ...(sourceDefinitionIds.length > 0
      ? { runnerInstallPaymentSourceDefinitionIds: sourceDefinitionIds.join(",") }
      : {}),
  };
}

function paymentLabel(
  state: GameState,
  sourcePayments: RunnerProgramInstallPaymentSourcePayment[],
): string {
  const active = sourcePayments.filter((payment) => payment.amount > 0);
  if (active.length === 0) return "Ohne Zeta-Bits";
  if (
    sourcePayments.length === 1 &&
    definitionFor(state, sourcePayments[0]!.sourceCardId).id ===
      ZETATECH_SOFTWARE_INSTALLER_SOURCE
  ) {
    const amount = active[0]!.amount;
    return `Mit ${amount} Zeta-Bit${amount === 1 ? "" : "s"}`;
  }
  return `Mit ${active
    .map(
      (payment) =>
        `${sourceDisplayLabel(state, payment.sourceCardId, sourcePayments)}: ${payment.amount} Bit${payment.amount === 1 ? "" : "s"}`,
    )
    .join(", ")}`;
}

function sourceDisplayLabel(
  state: GameState,
  sourceCardId: CardInstanceId,
  allPayments: RunnerProgramInstallPaymentSourcePayment[],
): string {
  const title = definitionFor(state, sourceCardId).title;
  const sameTitle = allPayments
    .map((payment) => payment.sourceCardId)
    .filter((cardId) => definitionFor(state, cardId).title === title);
  if (sameTitle.length <= 1) return title;
  return `${title} #${sameTitle.indexOf(sourceCardId) + 1}`;
}

function totalSourceCredits(
  sourcePayments: RunnerProgramInstallPaymentSourcePayment[],
): number {
  return sourcePayments.reduce((sum, payment) => sum + payment.amount, 0);
}

function amountSignature(
  sourcePayments: RunnerProgramInstallPaymentSourcePayment[],
): string {
  return sourcePayments.map((payment) => String(payment.amount)).join(",");
}

function definitionFor(state: GameState, id: CardInstanceId): CardDefinition {
  const instance = state.cardInstances[id];
  if (!instance) throw new Error(`CardInstance fehlt: ${id}`);
  const definition = DEMO_CARDS_BY_ID[instance.definitionId];
  if (!definition)
    throw new Error(`Unbekannte Karte: ${instance.definitionId}`);
  return definition;
}
