#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const skinRoot = path.join(root, "data", "card-assets", "localized", "de");
const manifestPath = path.join(skinRoot, "cards.de.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const findings = [];

for (const card of manifest.cards ?? []) {
  const renderedKeys = Object.keys(card.rendered ?? {});
  if (renderedKeys.length !== 1 || renderedKeys[0] !== "full") {
    findings.push(
      `${card.cardId}: rendered darf nur den Current-State-Key full enthalten`,
    );
    continue;
  }
  if (
    !card.rendered.full.startsWith("rendered/full/") ||
    !card.rendered.full.endsWith(".png")
  ) {
    findings.push(
      `${card.cardId}: unsicherer oder unerwarteter Full-Pfad ${card.rendered.full}`,
    );
    continue;
  }
  if (!existsSync(path.join(skinRoot, card.rendered.full))) {
    findings.push(`${card.cardId}: Full-PNG fehlt`);
  }
  if (!existsSync(path.join(skinRoot, card.art)))
    findings.push(`${card.cardId}: Art-Quelle fehlt`);
}

const trackedRenderedFiles = execFileSync(
  "git",
  ["ls-files", "data/card-assets/localized/de/rendered"],
  { cwd: root, encoding: "utf8" },
)
  .split(/\r?\n/)
  .filter(Boolean);
for (const file of trackedRenderedFiles) {
  if (!file.startsWith("data/card-assets/localized/de/rendered/full/")) {
    findings.push(`${file}: versioniertes Review-Derivat`);
  }
}

if (findings.length > 0) {
  console.error("CARD_ASSET_RETENTION FAIL");
  for (const finding of findings) console.error(`- ${finding}`);
  process.exitCode = 1;
} else {
  const fullBytes = trackedRenderedFiles.reduce(
    (total, file) => total + statSync(path.join(root, file)).size,
    0,
  );
  console.log(
    `CARD_ASSET_RETENTION OK cards=${manifest.cards.length} fullMb=${(fullBytes / 1024 / 1024).toFixed(1)}`,
  );
}
