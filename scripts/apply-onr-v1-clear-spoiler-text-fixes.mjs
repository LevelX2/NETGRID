import fs from "node:fs";

const snapshotPath =
  "data/local/card-import/onr-v1-limited/card-snapshot-onr-v1-limited.local.json";
const galleryDir =
  "data/local/card-import/onr-v1-limited/text-review-galleries";
const spoilerFiles = [
  "docs/source/Runnerspoiler 1.0.txt",
  "docs/source/Corpspoiler 1.0.txt",
];

const clearFixNumbers = new Set([
  "015",
  "018",
  "026",
  "027",
  "031",
  "045",
  "048",
  "050",
  "052",
  "057",
  "066",
  "100",
  "103",
  "165",
  "166",
  "167",
  "168",
  "169",
  "170",
  "173",
  "174",
  "175",
  "176",
  "177",
  "178",
  "180",
  "181",
  "182",
  "184",
  "186",
  "187",
  "193",
  "195",
  "197",
  "198",
  "203",
  "206",
  "207",
  "209",
  "210",
  "213",
  "220",
  "221",
  "222",
  "255",
  "293",
  "295",
  "309",
  "310",
  "311",
  "312",
  "318",
  "319",
  "320",
  "322",
  "328",
  "330",
  "336",
  "337",
  "343",
  "344",
  "345",
  "348",
  "352",
  "354",
  "359",
  "360",
  "365",
  "370",
  "371",
  "372",
]);

function cleanLine(line) {
  return line.replace(/\r/g, "").replace(/\u00a0/g, " ").replace(/[ \t]+$/g, "");
}

function titleStart(line) {
  return /^Card T(?:i\s*tle|itle):/.test(line);
}

function isMetaLine(line) {
  return /^(Cost\/Strength:|Cost\/Trash:|Cost:\s|Diff\.\/Agenda:|Rez\/Strength:|Agenda\/Difficulty:|Trash:|Artist:|Rarity:)/.test(
    line.trim(),
  );
}

function parseSpoiler(file) {
  const lines = fs.readFileSync(file, "utf8").split(/\n/).map(cleanLine);
  const cards = [];
  for (let index = 0; index < lines.length; index += 1) {
    if (!titleStart(lines[index])) continue;
    const rawTitleLine = lines[index].replace(
      /^Card T(?:i\s*tle|itle):\s*/,
      "",
    );
    const inline = rawTitleLine.match(
      /^(.*?)(?:\s*(?:Card Type|Card Title):\s*)(.*)$/,
    );
    let title = "";
    if (inline) {
      title = inline[1].trim();
    } else {
      title = rawTitleLine.trim();
      if (/^Card Type:\s*/.test(lines[index + 1] ?? "")) index += 1;
    }
    let text = "";
    let textIndex = index + 1;
    if (textIndex < lines.length && /^Card Text:/.test(lines[textIndex])) {
      text = lines[textIndex].replace(/^Card Text:\s*/, "").trim();
      textIndex += 1;
      while (
        textIndex < lines.length &&
        !titleStart(lines[textIndex]) &&
        !isMetaLine(lines[textIndex])
      ) {
        const line = lines[textIndex].trim();
        if (line) text += `${text ? " " : ""}${line}`;
        textIndex += 1;
      }
    }
    cards.push({ title, text, file });
  }
  return cards;
}

function keyTitle(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[π]/g, "pi")
    .replace(/\b(tm|r)\b/gi, "")
    .replace(/[™®]/g, "")
    .replace(/[()[\]]/g, " ")
    .replace(/[’']/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function spoilerByTitle() {
  const byTitle = new Map();
  for (const spoiler of spoilerFiles.flatMap(parseSpoiler)) {
    const key = keyTitle(spoiler.title);
    if (!byTitle.has(key)) byTitle.set(key, []);
    byTitle.get(key).push(spoiler);
  }
  return byTitle;
}

function spoilerForCard(card, byTitle) {
  const matches = byTitle.get(keyTitle(card.title)) ?? [];
  return (
    matches.find((candidate) =>
      card.side === "runner"
        ? candidate.file.includes("Runner")
        : candidate.file.includes("Corp"),
    ) ?? matches[0]
  );
}

function galleryPathFromSource(sourceUrl) {
  const match = String(sourceUrl ?? "").match(
    /:([^:]+\.local\.md)$/u,
  );
  if (!match) return null;
  return `${galleryDir}/${match[1]}`;
}

function replaceGalleryText(file, collectorNumber, newText) {
  const original = fs.readFileSync(file, "utf8");
  const headingPattern = new RegExp(
    `((?:##|###)\\s+${collectorNumber}\\s+-[\\s\\S]*?Regeltext(?:\\s+ohne\\s+Flavour)?:\\s*\\n\\x60\\x60\\x60text\\n)([\\s\\S]*?)(\\n\\x60\\x60\\x60)`,
    "u",
  );
  if (!headingPattern.test(original)) return false;
  const next = original.replace(headingPattern, `$1${newText}$3`);
  if (next !== original) fs.writeFileSync(file, next, "utf8");
  return true;
}

const snapshot = JSON.parse(fs.readFileSync(snapshotPath, "utf8"));
const byTitle = spoilerByTitle();
const changedGalleries = new Set();
const changedCards = [];
const missing = [];

for (const card of snapshot.cards) {
  if (!clearFixNumbers.has(card.collectorNumber)) continue;
  const spoiler = spoilerForCard(card, byTitle);
  if (!spoiler) {
    missing.push(`${card.collectorNumber} ${card.title}`);
    continue;
  }
  if (card.text !== spoiler.text) {
    card.text = spoiler.text;
    changedCards.push(`${card.collectorNumber} ${card.title}`);
  }
  const galleryPath = galleryPathFromSource(card.onr?.textSourceUrl);
  if (galleryPath && fs.existsSync(galleryPath)) {
    const replaced = replaceGalleryText(
      galleryPath,
      card.collectorNumber,
      spoiler.text,
    );
    if (replaced) changedGalleries.add(galleryPath);
  }
}

snapshot.updatedAt = "2026-05-16T00:00:00.000Z";
fs.writeFileSync(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");

console.log(
  JSON.stringify(
    {
      changedCards: changedCards.length,
      changedGalleries: [...changedGalleries].sort(),
      missing,
    },
    null,
    2,
  ),
);
