import type { CardEffectFamilyInput } from "./family-runtime";
import { executeContextEffectPart1 } from "./context-effects-part-1";
import { executeContextEffectPart2 } from "./context-effects-part-2";
import { executeContextEffectPart3 } from "./context-effects-part-3";
import { executeContextEffectPart4 } from "./context-effects-part-4";
import { executeContextEffectPart5 } from "./context-effects-part-5";

export function executeContextEffect(input: CardEffectFamilyInput): void {
  if (
    executeContextEffectPart1(input) ||
    executeContextEffectPart2(input) ||
    executeContextEffectPart3(input) ||
    executeContextEffectPart4(input) ||
    executeContextEffectPart5(input)
  )
    return;

  const unknownEffect = input.effect as { kind?: string };
  throw new Error(
    `Unsupported card implementation effect: ${unknownEffect.kind ?? "unknown"}`,
  );
}
