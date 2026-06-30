import type { CardEffectFamilyInput } from "./family-runtime";

export function executeAgendaScoringEffect(
  input: CardEffectFamilyInput,
): boolean {
  const { context, effect, publicPayload, runtime } = input;
  const { assertPublicVisibility, mergePublicPayload } = runtime;

  if (effect.kind !== "score_source_as_agenda") return false;
  assertPublicVisibility("score_source_as_agenda", effect.visibility);
  if (!context.scoreSourceAsAgenda)
    throw new Error(
      "score_source_as_agenda effect requires a scoreSourceAsAgenda execution context.",
    );
  const result = context.scoreSourceAsAgenda();
  mergePublicPayload(publicPayload, result.publicPayload);
  return true;
}
