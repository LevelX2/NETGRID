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
