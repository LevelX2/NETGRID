import type { CatalogCard } from "@netgrid/catalog";

const REQUIRED_CARD_IMAGE_MAPPING_COLUMNS = [
  "aktiv",
  "printingId",
  "setId",
  "sammlernummer",
  "seite",
  "titel",
  "quelle",
  "sha256",
] as const;

export const CARD_IMAGE_MAPPING_COLUMNS = [
  ...REQUIRED_CARD_IMAGE_MAPPING_COLUMNS,
  "randzuschnittPx",
] as const;

export const CARD_IMAGE_MAPPING_COMMENT_PREFIX = "#";

const CARD_IMAGE_MAPPING_INSTRUCTIONS = [
  "# NETGRID-Kartenbild-Zuordnung",
  "# Kommentarzeilen beginnen mit # und werden beim Import ignoriert.",
  "# Bearbeite nur aktiv, quelle sowie optional sha256 und randzuschnittPx; die Katalogspalten müssen unverändert bleiben.",
  "# aktiv: ja aktiviert die Zeile, nein lässt sie unberücksichtigt.",
  "# Lokale Quelle: relativer Pfad zur CSV, zum Beispiel images/afreet.jpg. In der Maintenance-Oberfläche muss die Datei innerhalb der Import-Inbox liegen.",
  "# HTTPS-Quelle: direkte https://-URL zu einer PNG-, JPEG- oder WebP-Datei. Webseiten- und Artikel-URLs sind unzulässig; wähle dafür den expliziten HTTPS-Importmodus.",
  "# sha256: optional exakt 64 hexadezimale Zeichen zur Prüfung der unveränderten Quelldatei.",
  "# randzuschnittPx: optional links,oben,rechts,unten in Pixeln nach EXIF-Ausrichtung, zum Beispiel 40,35,40,35. Leer bedeutet kein Zuschnitt.",
  "# Trennzeichen ist das Semikolon. Felder mit Semikolon, Anführungszeichen oder Zeilenumbruch müssen nach CSV-Regeln in Anführungszeichen stehen.",
] as const;

export type CardImageMappingRow = {
  enabled: boolean;
  printingId: string;
  setId: string;
  collectorNumber: string;
  side: string;
  title: string;
  source: string;
  expectedSha256?: string;
  cropPixels?: CardImageCropPixels;
  rowNumber: number;
};

export type CardImageCropPixels = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

export type CardImageMappingCsvErrorCode =
  | "csv_invalid"
  | "csv_header_invalid"
  | "csv_row_invalid"
  | "csv_active_invalid"
  | "csv_duplicate_printing_id"
  | "csv_unknown_printing_id"
  | "csv_catalog_mismatch"
  | "csv_source_missing"
  | "csv_sha256_invalid"
  | "csv_crop_invalid";

export class CardImageMappingCsvError extends Error {
  constructor(
    readonly code: CardImageMappingCsvErrorCode,
    message: string,
    readonly rowNumber?: number,
  ) {
    super(message);
    this.name = "CardImageMappingCsvError";
  }
}

export function serializeCardImageMappingCsv(
  cards: readonly CatalogCard[],
  assignments: ReadonlyMap<
    string,
    {
      source: string;
      expectedSha256?: string;
      cropPixels?: CardImageCropPixels;
    }
  > = new Map(),
): string {
  const rows = [
    ...CARD_IMAGE_MAPPING_INSTRUCTIONS,
    CARD_IMAGE_MAPPING_COLUMNS.join(";"),
  ];
  for (const card of cards) {
    const assignment = assignments.get(card.printingId);
    rows.push(
      [
        assignment ? "ja" : "nein",
        card.printingId,
        card.setId,
        card.collectorNumber,
        card.side,
        card.title,
        assignment?.source ?? "",
        assignment?.expectedSha256 ?? "",
        assignment?.cropPixels
          ? serializeCropPixels(assignment.cropPixels)
          : "",
      ]
        .map(serializeCsvField)
        .join(";"),
    );
  }
  return `\uFEFF${rows.join("\r\n")}\r\n`;
}

export function parseCardImageMappingCsv(
  input: string,
  cards: readonly CatalogCard[],
): CardImageMappingRow[] {
  const records = parseDelimitedRows(input.replace(/^\uFEFF/, ""));
  const headerIndex = records.findIndex((fields) => !isCommentRow(fields));
  const header = headerIndex >= 0 ? records[headerIndex] : undefined;
  const hasCropColumn = header
    ? sameColumns(header, CARD_IMAGE_MAPPING_COLUMNS)
    : false;
  if (
    !header ||
    (!hasCropColumn &&
      !sameColumns(header, REQUIRED_CARD_IMAGE_MAPPING_COLUMNS))
  )
    throw new CardImageMappingCsvError(
      "csv_header_invalid",
      `CSV-Kopf muss ${REQUIRED_CARD_IMAGE_MAPPING_COLUMNS.join(";")} und darf zusätzlich randzuschnittPx enthalten.`,
      1,
    );
  const cardsByPrintingId = new Map(
    cards.map((card) => [card.printingId, card]),
  );
  const seen = new Set<string>();
  const rows: CardImageMappingRow[] = [];
  for (const [index, fields] of records.slice(headerIndex + 1).entries()) {
    const rowNumber = headerIndex + index + 2;
    if (isCommentRow(fields)) continue;
    if (fields.every((field) => field.trim().length === 0)) continue;
    if (fields.length !== header.length)
      throw new CardImageMappingCsvError(
        "csv_row_invalid",
        `Zeile ${rowNumber} besitzt ${fields.length} statt ${header.length} Spalten.`,
        rowNumber,
      );
    const values = fields.map((field) => field.trim());
    const active = values[0]!;
    const printingId = values[1]!;
    const setId = values[2]!;
    const collectorNumber = values[3]!;
    const side = values[4]!;
    const title = values[5]!;
    const source = values[6]!;
    const hash = values[7]!;
    const cropValue = hasCropColumn ? values[8]! : "";
    if (!printingId)
      throw new CardImageMappingCsvError(
        "csv_row_invalid",
        `Zeile ${rowNumber} enthält keine printingId.`,
        rowNumber,
      );
    if (seen.has(printingId))
      throw new CardImageMappingCsvError(
        "csv_duplicate_printing_id",
        `Zeile ${rowNumber} enthält ${printingId} erneut.`,
        rowNumber,
      );
    seen.add(printingId);
    const card = cardsByPrintingId.get(printingId);
    if (!card)
      throw new CardImageMappingCsvError(
        "csv_unknown_printing_id",
        `Zeile ${rowNumber} referenziert unbekannte printingId ${printingId}.`,
        rowNumber,
      );
    if (
      setId !== card.setId ||
      collectorNumber !== card.collectorNumber ||
      side !== card.side ||
      title !== card.title
    )
      throw new CardImageMappingCsvError(
        "csv_catalog_mismatch",
        `Zeile ${rowNumber} stimmt nicht mit dem aktuellen Katalogeintrag ${printingId} überein.`,
        rowNumber,
      );
    const enabled = parseEnabled(active, rowNumber);
    if (enabled && !source)
      throw new CardImageMappingCsvError(
        "csv_source_missing",
        `Zeile ${rowNumber} ist aktiv, enthält aber keine Quelle.`,
        rowNumber,
      );
    if (hash && !/^[a-fA-F0-9]{64}$/.test(hash))
      throw new CardImageMappingCsvError(
        "csv_sha256_invalid",
        `Zeile ${rowNumber} enthält keinen gültigen SHA-256.`,
        rowNumber,
      );
    const cropPixels = cropValue
      ? parseCropPixels(cropValue, rowNumber)
      : undefined;
    rows.push({
      enabled,
      printingId,
      setId,
      collectorNumber,
      side,
      title,
      source,
      ...(hash ? { expectedSha256: hash.toLowerCase() } : {}),
      ...(cropPixels ? { cropPixels } : {}),
      rowNumber,
    });
  }
  return rows;
}

function parseCropPixels(
  value: string,
  rowNumber: number,
): CardImageCropPixels {
  const parts = value.split(",").map((part) => part.trim());
  const values = parts.map((part) =>
    /^\d+$/.test(part) ? Number(part) : Number.NaN,
  );
  if (
    values.length !== 4 ||
    values.some(
      (part) => !Number.isSafeInteger(part) || part < 0 || part > 100_000,
    )
  )
    throw new CardImageMappingCsvError(
      "csv_crop_invalid",
      `Zeile ${rowNumber} enthält keinen gültigen randzuschnittPx-Wert links,oben,rechts,unten.`,
      rowNumber,
    );
  return {
    left: values[0]!,
    top: values[1]!,
    right: values[2]!,
    bottom: values[3]!,
  };
}

function serializeCropPixels(crop: CardImageCropPixels): string {
  return [crop.left, crop.top, crop.right, crop.bottom].join(",");
}

function isCommentRow(fields: readonly string[]): boolean {
  return (
    fields[0]?.trimStart().startsWith(CARD_IMAGE_MAPPING_COMMENT_PREFIX) ??
    false
  );
}

function parseDelimitedRows(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  let quoteClosed = false;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index]!;
    if (quoted) {
      if (character === '"') {
        if (input[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
          quoteClosed = true;
        }
      } else field += character;
      continue;
    }
    if (
      quoteClosed &&
      character !== ";" &&
      character !== "\r" &&
      character !== "\n"
    )
      throw new CardImageMappingCsvError(
        "csv_invalid",
        "Nach einem schließenden CSV-Anführungszeichen sind nur Trennzeichen oder Zeilenende erlaubt.",
      );
    if (character === '"') {
      if (field.length > 0)
        throw new CardImageMappingCsvError(
          "csv_invalid",
          "CSV-Anführungszeichen dürfen nur am Feldanfang stehen.",
        );
      quoted = true;
      quoteClosed = false;
    } else if (character === ";") {
      row.push(field);
      field = "";
      quoteClosed = false;
    } else if (character === "\r" || character === "\n") {
      if (character === "\r" && input[index + 1] === "\n") index += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      quoteClosed = false;
    } else field += character;
  }
  if (quoted)
    throw new CardImageMappingCsvError(
      "csv_invalid",
      "CSV enthält ein nicht geschlossenes Anführungszeichen.",
    );
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function serializeCsvField(value: string): string {
  if (!/[;"\r\n]/.test(value)) return value;
  return `"${value.replaceAll('"', '""')}"`;
}

function parseEnabled(value: string, rowNumber: number): boolean {
  const normalized = value.toLocaleLowerCase("de-DE");
  if (["", "nein", "no", "false", "0"].includes(normalized)) return false;
  if (["ja", "yes", "true", "1", "x"].includes(normalized)) return true;
  throw new CardImageMappingCsvError(
    "csv_active_invalid",
    `Zeile ${rowNumber} enthält einen ungültigen aktiv-Wert ${value}.`,
    rowNumber,
  );
}

function sameColumns(
  actual: readonly string[],
  expected: readonly string[],
): boolean {
  return (
    actual.length === expected.length &&
    actual.every((value, index) => value === expected[index])
  );
}
