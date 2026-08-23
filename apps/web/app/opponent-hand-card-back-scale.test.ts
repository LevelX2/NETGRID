import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const globalsCss = readFileSync(
  new URL("./globals.css", import.meta.url),
  "utf8",
);
const runnerBoardSource = readFileSync(
  new URL("../features/game-board/RunnerBoardStrips.tsx", import.meta.url),
  "utf8",
);
const corpBoardSource = readFileSync(
  new URL("../features/game-board/ActiveServerGrid.tsx", import.meta.url),
  "utf8",
);

describe("opponent hand card-back scaling", () => {
  it.each([
    ["runnerOpponentGripPreview", "runner-grip", "runner"],
    ["corpOpponentHqPreview", "corp-hq", "corp"],
  ])(
    "binds %s width, height and hidden-back minimum height to one zone scale",
    (previewClass, variablePrefix, hiddenSide) => {
      const previewRule = cssRule(`.${previewClass}`);
      const cardRule = cssRule(`.${previewClass} .card`);
      const hiddenBackRule = cssRule(`.${previewClass} .card.hiddenBack`);

      expect(previewRule).toContain(
        `--${variablePrefix}-card-width: calc(108px * var(--zone-card-scale, 1));`,
      );
      expect(previewRule).toContain(
        `--${variablePrefix}-card-height: calc(151px * var(--zone-card-scale, 1));`,
      );
      expect(cardRule).toContain(
        `height: var(--${variablePrefix}-card-height);`,
      );
      expect(hiddenBackRule).toContain(
        `min-height: var(--${variablePrefix}-card-height);`,
      );
      expect(`${runnerBoardSource}\n${corpBoardSource}`).toContain(
        `hiddenSide="${hiddenSide}"`,
      );
    },
  );
});

function cssRule(selector: string): string {
  const start = globalsCss.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`CSS-Regel ${selector} fehlt.`);
  const end = globalsCss.indexOf("}", start);
  if (end < 0) throw new Error(`CSS-Regel ${selector} ist unvollständig.`);
  return globalsCss.slice(start, end + 1);
}
