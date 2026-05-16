import fs from "node:fs";

const snapshotPath =
  "data/local/card-import/onr-v1-limited/card-snapshot-onr-v1-limited.local.json";
const reportPath =
  "docs/derived/ONR_V1_SPOILER_TEXT_AUDIT_2026_05_16.md";
const spoilerFiles = [
  "docs/source/Runnerspoiler 1.0.txt",
  "docs/source/Corpspoiler 1.0.txt",
];

const semanticOverrides = new Map([
  ["015", "Break-Kosten sind im Snapshot 0, im Spoiler 1."],
  ["018", "Break- und Pump-Kosten sind im Snapshot 0, im Spoiler 1."],
  ["026", "Der Spoiler hat eine 2-Credit-Aktivierung, die im Snapshot fehlt."],
  ["027", "Break-Kosten sind im Snapshot 0, im Spoiler 1."],
  ["031", "Snapshot hat Break-Kosten 0 und Stealth-Verlust 1; Spoiler hat Break-Kosten 1 und Stealth-Verlust 2."],
  ["045", "Snapshot lässt die Action-Kosten weg und gibt 1; Spoiler ist A: Gain 2."],
  ["048", "Start-Credits sind im Snapshot 1, im Spoiler 2."],
  ["050", "Snapshot nutzt einen T-Marker; Spoiler sagt Action A."],
  ["052", "Break-Kosten sind im Snapshot 0, im Spoiler 1."],
  ["057", "Start-Credits sind im Snapshot 1, im Spoiler 2."],
  ["066", "Break- und Pump-Kosten sind im Snapshot 0, im Spoiler 1."],
  ["100", "Gewinn pro getrashter installierter Karte ist im Snapshot 1, im Spoiler 3."],
  ["103", "Gewinn pro getrashter Handkarte ist im Snapshot 1, im Spoiler 2."],
  ["165", "Kostenmarker abweichend: Snapshot A,T; Spoiler A,[1]. Scan-/Symbolprüfung nötig."],
  ["166", "Gewinn pro erfolgreichem Run ist im Snapshot 2, im Spoiler 1."],
  ["167", "Meat-Prevention-Kosten sind im Snapshot 0, im Spoiler 1."],
  ["168", "Leave-play-Zahlung ist im Snapshot 6, im Spoiler 10."],
  ["169", "Snapshot sagt sinngemäß 'shuffle your stack into your stack'; Spoiler sagt 'shuffle the rest back into your stack'."],
  ["170", "Kostenmarker abweichend: Snapshot A,T; Spoiler A,[1]. Scan-/Symbolprüfung nötig."],
  ["173", "Zusatzkosten für Corp-ICE-Install sind im Snapshot 1, im Spoiler 2."],
  ["174", "Start-Credits sind im Snapshot 6, im Spoiler 12."],
  ["175", "Expose-Fähigkeit hat abweichende Kosten: Snapshot A,T; Spoiler A,[2]."],
  ["176", "Zweite Shell-Counter-Entfernung weicht ab: Snapshot A; Spoiler [1]."],
  ["177", "Kostenmarker abweichend: Snapshot A,T; Spoiler A,[1]. Scan-/Symbolprüfung nötig."],
  ["178", "Start-Credits sind im Snapshot 6 und die Take-Aktion fehlt; Spoiler sagt Put 12 und A: Take 2."],
  ["180", "Gewinn für das Trashen einer anderen installierten Karte ist im Snapshot 1, im Spoiler 2."],
  ["181", "Snapshot enthält eine zusätzliche Flavor-/OCR-Zeile, die im Spoiler nicht steht."],
  ["182", "+1-Link-Kosten sind im Snapshot 0, im Spoiler 1."],
  ["184", "Start-of-turn-Gewinn ist im Snapshot 3, im Spoiler 2."],
  ["186", "Kostenmarker abweichend: Snapshot A; Spoiler [T]."],
  ["187", "Snapshot sagt Ausgabenlimit 0 und lässt den Zweck für Icebreaker/Link weg; Spoiler sagt Limit 3 für Icebreaker- oder Link-Zahlungen."],
  ["193", "Start-Credits/Take-Betrag sind im Snapshot 5/1, im Spoiler 15/3."],
  ["195", "Action-Gewinn ist im Snapshot 6, im Spoiler 2."],
  ["197", "Sonderbudget ist im Snapshot 9, im Spoiler 10."],
  ["198", "Start-Credits/Take-Betrag sind im Snapshot 4/1, im Spoiler 12/2."],
  ["203", "Gewinn ist im Snapshot 6 plus Zusatztext; Spoiler sagt Gain 5."],
  ["206", "Kosten/Effekt abweichend: Snapshot A,T Gain 1; Spoiler A,A Gain 3."],
  ["207", "Trace-Stärke ist im Snapshot 7, im Spoiler 2."],
  ["209", "Start-Credits/Take-Betrag sind im Snapshot 6/1, im Spoiler 12/3."],
  ["210", "Action-Gewinn ist im Snapshot 2, im Spoiler 3."],
  ["213", "Trace-Stärke ist im Snapshot 7, im Spoiler 5."],
  ["220", "Snapshot hat Platzhaltertext; Spoiler hat keinen Regeltext."],
  ["221", "Snapshot hat Trace 3/Zahlung 3 plus zusätzliche Net-Damage-Subroutine; Spoiler hat Trace 5/Zahlung 1 und keine zweite Subroutine."],
  ["222", "Encounter-Tax ist im Snapshot 1, im Spoiler 2."],
  ["255", "Snapshot enthält Trace 5; die Spoilerzeile scheint die Trace-Zahl auszulassen. Scan-/Quellenprüfung nötig."],
  ["293", "Gewinn ist im Snapshot 4, im Spoiler 1."],
  ["295", "Gewinn ist im Snapshot 1, im Spoiler 2."],
  ["309", "Start-Credits/Take-Betrag sind im Snapshot 6/1, im Spoiler 16/2."],
  ["310", "Trace-Stärke ist im Snapshot 6, im Spoiler 5; außerdem fehlt im Snapshot die A-Kostenmarkierung."],
  ["311", "Start-of-turn-Take-Betrag ist im Snapshot 1, im Spoiler 2."],
  ["312", "Der Spoiler hat 3-Credit-Action-Kosten, die im Snapshot fehlen."],
  ["318", "Snapshot hat Put 4 ohne Action-Kosten; Spoiler hat A: Put 3."],
  ["319", "Zahlung zum Vermeiden eines Virus-Counters ist im Snapshot 0, im Spoiler 1."],
  ["320", "Rez-Kostenreduktion ist im Snapshot 2, im Spoiler 1."],
  ["322", "Draw-Fähigkeit hat abweichende Kosten: Snapshot A; Spoiler A,[1]."],
  ["328", "Effekt abweichend: Snapshot A Gain 1 pro Counter; Spoiler A,T Gain 4 pro Counter."],
  ["330", "Trace-Credits sind im Snapshot 6, im Spoiler 1."],
  ["336", "Snapshot nutzt T-Marker; Spoiler sagt A."],
  ["337", "Start-Credits/Take-Betrag sind im Snapshot 8/1, im Spoiler 15/3."],
  ["343", "Kosten/Effekt abweichend: Snapshot A,T Gain 8; Spoiler A,A,A Gain 6."],
  ["344", "Put-Betrag ist im Snapshot 6, im Spoiler 3."],
  ["345", "Access-Zahlung ist im Snapshot 0, im Spoiler 4."],
  ["348", "Damage-Skalierung abweichend: Snapshot sagt 1 pro Counter und hat eine beschädigte Null-Counter-Klausel; Spoiler sagt 2 pro Counter oder 1 ohne Counter."],
  ["352", "Install-Kostenreduktion ist im Snapshot 1, im Spoiler 2."],
  ["354", "Crying-Counter-Entfernungskosten sind im Snapshot 4, im Spoiler 2."],
  ["359", "Installkosten pro vorhandenem ICE sind im Snapshot 0, im Spoiler 1."],
  ["360", "Wall-Rez-Kostenreduktion ist im Snapshot 9, im Spoiler 2."],
  ["365", "Trace-Credits sind im Snapshot 6, im Spoiler 3."],
  ["370", "Zusätzliche ETR-Zahlung ist im Snapshot 2, im Spoiler 1."],
  ["371", "Gewinn nach erfolglosem Run ist im Snapshot 1, im Spoiler 2."],
  ["372", "Trace-Stärke ist im Snapshot 4, im Spoiler 10."],
]);

const wordingOverrides = new Map([
  ["002", "Nur Wording/Format: Apostroph, Stern-Platzhalter und geklammerte Kosten."],
  ["005", "Nur Wording/Format: verkürzter Kartenname im letzten Satz und geklammerte Kosten."],
  ["019", "Nur Wording/Format: Marken-/Namensmarker; Bedeutung wirkt gleich."],
  ["075", "Nur Wording: overlying/overwriting-Schreibweise; gleiche Recurring-Install-Credit-Bedeutung."],
  ["102", "Nur Wording/Format: Registered-Mark und geklammerte Kosten."],
  ["143", "Nur Wording/Format: Trademark-Marker und Zeilenumbruch."],
  ["179", "Nur Wording/Format: A-Marker und geklammerter Betrag."],
  ["183", "Nur Wording/Format: A-Marker-Schreibweise."],
  ["185", "Nur Wording/Format: Trademark-Marker, Zeilenumbruch und ausgeschriebene Zahl."],
  ["188", "Nur Wording/Format: A-Marker-Schreibweise."],
  ["199", "Nur Wording/Format: Zeilenumbruch und A-Marker-Schreibweise."],
  ["208", "Nur Wording/Format: A-Marker-Schreibweise."],
  ["217", "Nur Wording/Format: A-Marker-Schreibweise."],
  ["271", "Nur Wording/Format: expliziter Subroutine-Marker fehlt im Spoiler."],
  ["315", "Nur Wording: trash/destroy-Terminologie."],
  ["323", "Nur Wording: trash/destroy-Terminologie."],
  ["347", "Nur Wording/Format: Zeilenumbrüche, Groß-/Kleinschreibung und geklammerter Betrag."],
  ["351", "Nur Wording: Zeichensetzung/Klammern."],
  ["362", "Nur Wording/Format: Satzstellung und geklammerter Betrag."],
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
    let type = "";
    if (inline) {
      title = inline[1].trim();
      type = inline[2].trim();
    } else {
      title = rawTitleLine.trim();
      const nextLine = lines[index + 1] ?? "";
      if (/^Card Type:\s*/.test(nextLine)) {
        type = nextLine.replace(/^Card Type:\s*/, "").trim();
        index += 1;
      }
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
    cards.push({ title, type, text, file });
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

function normalizeText(value, options = {}) {
  let text = String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[π]/g, "pi")
    .replace(/\[T\]/gi, " trash ")
    .replace(/\bT:/g, " trash ")
    .replace(/\bA:/g, " action ")
    .replace(/\[(\d+)\]/g, " $1 ")
    .replace(/\*/g, " subroutine ")
    .replace(/\[Subroutine\]/gi, " subroutine ")
    .replace(/[™®]/g, "")
    .replace(/\bbit(s)?\b/gi, "credit")
    .replace(/\bcredits\b/gi, "credit")
    .replace(/\bsuccesful\b/gi, "successful")
    .replace(/\bbrain damage\b/gi, "core damage")
    .replace(/\bdata fort\b/gi, "server")
    .replace(/\bfort\b/gi, "server")
    .replace(/\byour trash\b/gi, "heap")
    .toLowerCase();
  if (options.dropMarkers)
    text = text.replace(/\b(action|trash|subroutine)\b/g, " ");
  if (options.dropNumbers) text = text.replace(/\b\d+\b/g, " # ");
  return text
    .replace(/[^a-z0-9#]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function numberSignature(text) {
  return [...String(text).matchAll(/\[?(\d+)\]?/g)]
    .map((match) => match[1])
    .join(",");
}

function tokenSet(text, options) {
  return new Set(normalizeText(text, options).split(" ").filter(Boolean));
}

function similarity(left, right, options) {
  const leftSet = tokenSet(left, options);
  const rightSet = tokenSet(right, options);
  let intersection = 0;
  for (const token of leftSet) if (rightSet.has(token)) intersection += 1;
  const union = new Set([...leftSet, ...rightSet]).size;
  return union ? intersection / union : 1;
}

function shortText(text) {
  const flat = String(text ?? "").replace(/\s+/g, " ").trim();
  return flat.length > 220 ? `${flat.slice(0, 217)}...` : flat;
}

function escapeCell(text) {
  return String(text ?? "")
    .replace(/\|/g, "\\|")
    .replace(/\n/g, "<br>");
}

function buildRows() {
  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, "utf8"));
  const spoilerCards = spoilerFiles.flatMap(parseSpoiler);
  const byTitle = new Map();
  for (const spoiler of spoilerCards) {
    const key = keyTitle(spoiler.title);
    if (!byTitle.has(key)) byTitle.set(key, []);
    byTitle.get(key).push(spoiler);
  }

  return snapshot.cards.map((card) => {
    const matches = byTitle.get(keyTitle(card.title)) ?? [];
    const spoiler =
      matches.find((candidate) =>
        card.side === "runner"
          ? candidate.file.includes("Runner")
          : candidate.file.includes("Corp"),
      ) ?? matches[0];
    const stored = card.text ?? "";
    const spoilerText = spoiler?.text ?? "";
    const exact = stored.trim() === spoilerText.trim();
    const normalizedEqual =
      normalizeText(stored) === normalizeText(spoilerText);
    const storedNumbers = numberSignature(stored);
    const spoilerNumbers = numberSignature(spoilerText);
    const shapeSimilarity = similarity(stored, spoilerText, {
      dropMarkers: true,
      dropNumbers: true,
    });
    const autoSemantic =
      !exact &&
      !normalizedEqual &&
      (!spoiler ||
        storedNumbers !== spoilerNumbers ||
        shapeSimilarity < 0.86);
    const manualSemantic = semanticOverrides.has(card.collectorNumber);
    const manualWording = wordingOverrides.has(card.collectorNumber);
    const category = exact
      ? "exact"
      : manualSemantic
        ? "semantic"
        : manualWording
          ? "wording"
          : normalizedEqual || !autoSemantic
            ? "wording"
            : "semantic";
    const note =
      semanticOverrides.get(card.collectorNumber) ??
      wordingOverrides.get(card.collectorNumber) ??
      (normalizedEqual
        ? "Nur Wording/Format nach Normalisierung."
        : "Wahrscheinlich nur Wording/Format; keine Zahlen- oder Kerneffekt-Abweichung erkannt.");

    return {
      no: card.collectorNumber,
      id: card.catalogCardId,
      title: card.title,
      side: card.side,
      sourceStatus: card.onr?.textSourceStatus ?? "",
      sourceUrl: card.onr?.textSourceUrl ?? "",
      spoilerTitle: spoiler?.title ?? "",
      spoilerFile: spoiler?.file ?? "",
      stored,
      spoiler: spoilerText,
      exact,
      normalizedEqual,
      storedNumbers,
      spoilerNumbers,
      shapeSimilarity,
      category,
      note,
    };
  });
}

function table(rows, columns) {
  const header = `| ${columns.map((column) => column.title).join(" | ")} |`;
  const divider = `| ${columns.map(() => "---").join(" | ")} |`;
  const body = rows.map(
    (row) =>
      `| ${columns
        .map((column) => escapeCell(column.value(row)))
        .join(" | ")} |`,
  );
  return [header, divider, ...body].join("\n");
}

const rows = buildRows();
const semanticRows = rows.filter((row) => row.category === "semantic");
const wordingRows = rows.filter((row) => row.category === "wording");
const exactRows = rows.filter((row) => row.category === "exact");
const shortTermRow = rows.find(
  (row) => row.id === "onr_v1_178_short-term-contract",
);
const runtimeShortTerm = fs
  .readFileSync("packages/shared/src/index.ts", "utf8")
  .includes("Put 12 credits on Short-Term Contract when installed.");
const shortTermSnapshotMatchesSpoiler =
  shortTermRow?.stored.trim() === shortTermRow?.spoiler.trim();

const report = `# ONR v1 Spoiler Text Audit

Stand: 2026-05-16

## Zweck

Abgleich der 374 gespeicherten lokalen ONR-v1-Kartentexte aus \`${snapshotPath}\` gegen die lokalen Spoilerquellen:

- \`docs/source/Runnerspoiler 1.0.txt\`
- \`docs/source/Corpspoiler 1.0.txt\`

Nicht gelistet werden Karten, deren Text exakt übereinstimmt. Gelistet werden:

- **Sachlich abweichend / klärungsbedürftig**: Zahlen, Kosten, fehlende Fähigkeiten, zusätzliche Sätze oder Symbolkosten unterscheiden sich so, dass die Spielbedeutung abweichen kann.
- **Nur Wording/Format**: Bedeutung wirkt gleich; Unterschiede sind Schreibweise, Klammern, Zeilenumbrüche, Symbol-/Markerformat, \`bits\`/\`credits\`, \`brain\`/\`core\` oder kleine Terminologie.

## Kurzbefund

- Geprüfte Snapshot-Karten: ${rows.length}
- Exakt gleich und ausgelassen: ${exactRows.length}
- Sachlich abweichend oder klärungsbedürftig: ${semanticRows.length}
- Nur Wording/Format: ${wordingRows.length}
- \`Short-Term Contract\`: Snapshot ist ${shortTermSnapshotMatchesSpoiler ? "auf den Spoilertext korrigiert" : "weiterhin falsch/alt (`Put 6`, Take-Aktion fehlt)"}. Die Runtime in \`packages/shared/src/index.ts\` ist ${runtimeShortTerm ? "auf \`Put 12 ... [A]: Take 2 ...\` korrigiert" : "nicht auf den Spoilerwert korrigiert"}.

## Sachlich Abweichend Oder Klärungsbedürftig

${table(semanticRows, [
  { title: "Nr.", value: (row) => row.no },
  { title: "Karte", value: (row) => row.title },
  { title: "Hinweis", value: (row) => row.note },
  { title: "Snapshot", value: (row) => shortText(row.stored) },
  { title: "Spoiler", value: (row) => shortText(row.spoiler) },
])}

## Nur Wording Oder Format

${table(wordingRows, [
  { title: "Nr.", value: (row) => row.no },
  { title: "Karte", value: (row) => row.title },
  { title: "Hinweis", value: (row) => row.note },
])}

## Hinweise Zur Interpretation

- Symbolfälle wie \`A,T\` gegenüber \`A,[1]\`, \`[T]\` oder \`T:\` sind in dieser Liste bewusst nicht automatisch geglättet, wenn sie wie Kosten wirken. Diese Fälle brauchen Scan- oder Quellenentscheidung.
- Die lokalen Spoilertexte enthalten selbst einzelne offensichtliche Tipp-/OCR-Spuren, z. B. \`succesful\`, \`Card Title:Operation\` oder Sonderzeichenvarianten. Diese wurden beim Zuordnen toleriert, aber nicht als Korrektur der Quelle behandelt.
- Dieser Audit bewertet die gespeicherten Anzeige-/Snapshot-Texte gegen Spoilertext. Er ersetzt nicht den separaten Runtime-Resolver- oder Testabgleich.
`;

fs.writeFileSync(reportPath, report, "utf8");
console.log(reportPath);
console.log(
  JSON.stringify(
    {
      checked: rows.length,
      exact: exactRows.length,
      semantic: semanticRows.length,
      wording: wordingRows.length,
      runtimeShortTermCorrected: runtimeShortTerm,
      snapshotShortTermCorrected: shortTermSnapshotMatchesSpoiler,
    },
    null,
    2,
  ),
);
