import type {
  LegalAction,
  VisibleCorpRezCostQuote,
  VisibleEffectiveIceRunQuote,
} from "@netgrid/shared";

type PostInstallEffectiveRunQuoteRead =
  | Readonly<{
      status: "known";
      quote: VisibleEffectiveIceRunQuote;
    }>
  | Readonly<{
      status: "unknown";
      reason: "post_install_effective_run_quote_drift";
    }>;

export function readPostInstallEffectiveRunQuote(
  action: LegalAction,
  sourceCardInstanceId: string,
  sourceDefinitionId: string,
  targetServerId: VisibleCorpRezCostQuote["targetServerId"],
  observedAtStateVersion: number,
): PostInstallEffectiveRunQuoteRead | undefined {
  const payload = action.payload ?? {};
  const json = payload.postInstallEffectiveRunQuoteJson;
  if (typeof json !== "string") {
    return undefined;
  }
  if (
    payload.postInstallRezQuoteCardId !== sourceCardInstanceId ||
    payload.postInstallRezQuoteTargetServerId !== targetServerId ||
    payload.postInstallRezQuoteExpiresAtStateVersion !== observedAtStateVersion
  ) {
    return {
      status: "unknown",
      reason: "post_install_effective_run_quote_drift",
    };
  }
  try {
    const quote = JSON.parse(json) as Partial<VisibleEffectiveIceRunQuote>;
    if (
      quote.iceInstanceId !== sourceCardInstanceId ||
      quote.iceDefinitionId !== sourceDefinitionId ||
      !Number.isFinite(quote.effectiveStrength) ||
      !Array.isArray(quote.subroutines) ||
      !quote.subroutines.every(
        (subroutine) =>
          subroutine !== null &&
          typeof subroutine === "object" &&
          typeof subroutine.id === "string" &&
          typeof subroutine.type === "string",
      )
    ) {
      return {
        status: "unknown",
        reason: "post_install_effective_run_quote_drift",
      };
    }
    return { status: "known", quote: quote as VisibleEffectiveIceRunQuote };
  } catch {
    return {
      status: "unknown",
      reason: "post_install_effective_run_quote_drift",
    };
  }
}
