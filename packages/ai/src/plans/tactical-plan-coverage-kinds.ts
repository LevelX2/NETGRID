import type { BreakerCoverageKind } from "../deck-capabilities";
import type { KnownRezzedIcePathAssessment } from "../visible-run-analysis";
import type {
  PlanBlockerKind,
  RequiredCapabilityKind,
} from "./tactical-plan-types";

export function deckCoverageKindForRequiredCapability(
  requiredCoverage: RequiredCapabilityKind,
): BreakerCoverageKind | undefined {
  switch (requiredCoverage) {
    case "breaker_wall":
      return "wall";
    case "breaker_code_gate":
      return "code_gate";
    case "breaker_sentry":
      return "sentry";
    case "breaker_ap":
      return "ap";
    case "breaker_trace":
      return "trace";
    case "breaker_universal":
      return "universal";
    case "breaker_coverage":
      return "special";
    default:
      return undefined;
  }
}

export function missingCoverageBlockerKind(
  coverage: BreakerCoverageKind,
): PlanBlockerKind {
  switch (coverage) {
    case "wall":
      return "missing_wall_coverage";
    case "code_gate":
      return "missing_code_gate_coverage";
    case "sentry":
      return "missing_sentry_coverage";
    case "ap":
      return "missing_ap_coverage";
    case "trace":
      return "missing_trace_coverage";
    case "universal":
    case "subtype_limited":
    case "special":
      return "missing_breaker_coverage";
  }
}

export function coverageKindForAssessment(
  assessment: KnownRezzedIcePathAssessment,
): RequiredCapabilityKind | undefined {
  const [coverage] = assessment.missingCoverage ?? [];
  switch (coverage) {
    case "wall":
      return "breaker_wall";
    case "code_gate":
      return "breaker_code_gate";
    case "sentry":
      return "breaker_sentry";
    case "ap":
      return "breaker_ap";
    case "trace":
      return "breaker_trace";
    case "unknown_special":
      return "breaker_universal";
    default:
      return undefined;
  }
}
