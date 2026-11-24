import type { LegalAction } from "@netgrid/shared";

export function applyPublicDamageContext(
  legalAction: LegalAction,
  context: Record<string, unknown>,
): void {
  if (legalAction.payload?.damageResolved === true) {
    // Damage summaries are public outcomes only. Hidden-zone card identities are
    // not reconstructed from the state while building public context.
    context.damageResolved = true;
    context.damageType = legalAction.payload.damageType;
    context.damageAmount = legalAction.payload.damageAmount;
    context.cardsTrashed = legalAction.payload.cardsTrashed;
    context.flatline = legalAction.payload.flatline;
    if (typeof legalAction.payload.baseDamageAmount === "number")
      context.baseDamageAmount = legalAction.payload.baseDamageAmount;
    if (typeof legalAction.payload.damageAmountModifier === "number")
      context.damageAmountModifier = legalAction.payload.damageAmountModifier;
    if (typeof legalAction.payload.coreDamageAfter === "number")
      context.coreDamageAfter = legalAction.payload.coreDamageAfter;
    if (typeof legalAction.payload.runnerMaxHandSizeAfter === "number")
      context.runnerMaxHandSizeAfter =
        legalAction.payload.runnerMaxHandSizeAfter;
    if (typeof legalAction.payload.runnerGripBefore === "number")
      context.runnerGripBefore = legalAction.payload.runnerGripBefore;
    if (typeof legalAction.payload.runnerGripAfter === "number")
      context.runnerGripAfter = legalAction.payload.runnerGripAfter;
    if (typeof legalAction.payload.preventableDamage === "boolean")
      context.preventableDamage = legalAction.payload.preventableDamage;
    if (typeof legalAction.payload.unpreventableDamage === "boolean")
      context.unpreventableDamage = legalAction.payload.unpreventableDamage;
    if (typeof legalAction.payload.cerberusCounterCount === "number")
      context.cerberusCounterCount = legalAction.payload.cerberusCounterCount;
  }
  if (legalAction.payload?.eventModificationWindowOpened === true) {
    context.eventModificationWindowOpened = true;
    context.eventModificationKind = legalAction.payload.eventModificationKind;
    context.eventModificationWindowId =
      legalAction.payload.eventModificationWindowId;
    context.imminentEventId = legalAction.payload.imminentEventId;
    context.imminentEventType = legalAction.payload.imminentEventType;
    context.affectedSide = legalAction.payload.affectedSide;
    context.candidateCount = legalAction.payload.candidateCount;
    context.redactedKind = "event_modification";
  }
  if (legalAction.payload?.replacementWindowOpened === true) {
    context.replacementWindowOpened = true;
    context.replacementWindowId = legalAction.payload.replacementWindowId;
    context.originalEventId = legalAction.payload.originalEventId;
    context.originalEventType = legalAction.payload.originalEventType;
    if (legalAction.payload.originalEventType === "damage")
      context.damageType = legalAction.payload.damageType;
    context.replacementCandidateCount =
      legalAction.payload.replacementCandidateCount;
    context.affectedSide = legalAction.payload.affectedSide;
    context.redactedKind = "replacement";
  }
}
