import { expect, it } from "vitest";
import type { VisibleCard } from "@netgrid/shared";
import { quoteRunnerRunRiskReserve } from "./runner-run-risk-reserve";

const rig: VisibleCard[] = [
  {
    instanceId: "public-program",
    known: true,
    type: "program",
    installCost: 5,
  },
];
const params: Parameters<typeof quoteRunnerRunRiskReserve>[0] = {
  purpose: "information",
  riskTolerance: "standard",
  visibleCoverage: "typed_only",
  knownPathCost: 0,
  creditsAfterKnownPath: 3,
  unknownIceCount: 1,
  unknownIcePositions: [0],
  corpRezCredits: 17,
  corpRezExposureActive: true,
  riskCreditBuffer: 3,
  runnerGripCount: 5,
  requiredAccessHandBuffer: 0,
  informationProbeAllowed: true,
  runnerRig: rig,
};
it("does not excuse newly exposed program investment as a cheap information probe", () => {
  expect(quoteRunnerRunRiskReserve(params)).toMatchObject({
    status: "blocked",
    requiredCredits: 5,
    creditGap: 2,
  });
  expect(
    quoteRunnerRunRiskReserve({ ...params, creditsAfterKnownPath: 5 }),
  ).toMatchObject({ status: "satisfied", creditGap: 0 });
  expect(
    quoteRunnerRunRiskReserve({ ...params, corpRezCredits: 2 }),
  ).toMatchObject({ status: "satisfied", requiredCredits: 3 });
  expect(quoteRunnerRunRiskReserve({ ...params, runnerRig: [] })).toMatchObject(
    { status: "satisfied", requiredCredits: 3 },
  );
});
it("requires a new proof when program costs are absent and retains the explicit stable matchpoint exception", () => {
  expect(
    quoteRunnerRunRiskReserve({ ...params, runnerRig: undefined }),
  ).toMatchObject({ status: "blocked" });
  expect(
    quoteRunnerRunRiskReserve({
      ...params,
      runnerRig: [{ instanceId: "unquoted", known: true, type: "program" }],
    }),
  ).toMatchObject({ status: "blocked" });
  expect(
    quoteRunnerRunRiskReserve({
      ...params,
      riskTolerance: "matchpoint_with_stable_universal_coverage",
      visibleCoverage: "stable_universal",
    }),
  ).toMatchObject({ status: "satisfied", requiredCredits: 2 });
});

it("never uses a credit-only probe exception to waive its hand reserve", () => {
  const probe = {
    ...params,
    runnerRig: [],
    visibleCoverage: "risky_universal" as const,
    runnerGripCount: 3,
    creditsAfterKnownPath: 3,
  };
  expect(quoteRunnerRunRiskReserve(probe)).toMatchObject({
    status: "blocked",
    requiredHandBuffer: 4,
    handBufferGap: 1,
    creditGap: 0,
  });
  expect(
    quoteRunnerRunRiskReserve({ ...probe, runnerGripCount: 4 }),
  ).toMatchObject({ status: "satisfied", handBufferGap: 0 });
  expect(
    quoteRunnerRunRiskReserve({
      ...probe,
      runnerGripCount: 4,
      creditsAfterKnownPath: 2,
    }),
  ).toMatchObject({
    status: "information_probe_only",
    handBufferGap: 0,
    creditGap: 1,
  });
  expect(
    quoteRunnerRunRiskReserve({ ...probe, corpRezExposureActive: false }),
  ).toMatchObject({ status: "not_required", requiredHandBuffer: 0 });
  expect(
    quoteRunnerRunRiskReserve({
      ...probe,
      visibleCoverage: "stable_universal",
    }),
  ).toMatchObject({ status: "satisfied", requiredHandBuffer: 2 });
});

it("drops only sunk program investment for a terminal Remote deadline", () => {
  const terminal = {
    ...params,
    purpose: "contest" as const,
    riskTolerance: "terminal_remote_last_chance" as const,
    informationProbeAllowed: false,
    creditsAfterKnownPath: 3,
  };
  expect(quoteRunnerRunRiskReserve(terminal)).toMatchObject({
    status: "satisfied", requiredCredits: 3, requiredHandBuffer: 3,
  });
  expect(quoteRunnerRunRiskReserve({ ...terminal, creditsAfterKnownPath: 2 })).toMatchObject({
    status: "blocked", requiredCredits: 3, creditGap: 1,
  });
  expect(quoteRunnerRunRiskReserve({ ...terminal, runnerGripCount: 2 })).toMatchObject({
    status: "blocked", handBufferGap: 1,
  });
  expect(quoteRunnerRunRiskReserve({ ...terminal, requiredAccessHandBuffer: 6 })).toMatchObject({
    status: "blocked", requiredHandBuffer: 6, handBufferGap: 1,
  });
});

it("keeps the access hand reserve without unknown ICE or Corp rez money", () => {
  const accessOnly = {
    ...params,
    unknownIceCount: 0,
    unknownIcePositions: [],
    corpRezCredits: 0,
    corpRezExposureActive: false,
    requiredAccessHandBuffer: 2,
    runnerGripCount: 1,
    runnerRig: undefined,
  };
  expect(quoteRunnerRunRiskReserve(accessOnly)).toMatchObject({
    status: "blocked",
    requiredCredits: 0,
    requiredHandBuffer: 2,
    handBufferGap: 1,
  });
  expect(
    quoteRunnerRunRiskReserve({ ...accessOnly, runnerGripCount: 2 }),
  ).toMatchObject({
    status: "satisfied",
    handBufferGap: 0,
  });
  expect(
    quoteRunnerRunRiskReserve({ ...accessOnly, requiredAccessHandBuffer: 0 }),
  ).toMatchObject({
    status: "not_required",
    requiredHandBuffer: 0,
  });
});
