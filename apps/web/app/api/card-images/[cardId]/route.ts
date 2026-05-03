import { existsSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const IMAGE_DIR = resolveImageDir();

const CARD_IMAGES: Record<string, string> = {
  back_corp: path.join("generated-backs", "corp_back.png"),
  back_runner: path.join("generated-backs", "runner_back.png"),
  simple_agenda: path.join("generated-agendas", "simple_agenda.png"),
  simple_economy_asset: path.join("generated-assets", "simple_economy_asset.png"),
  simple_draw_event: path.join("generated-events", "simple_draw_event.png"),
  simple_economy_event: path.join("generated-events", "simple_economy_event.png"),
  simple_run_event: path.join("generated-events", "simple_run_event.png"),
  simple_priority_agenda: path.join("generated-agendas", "simple_priority_agenda.png"),
  v08_burst_credit_event: path.join("generated-events", "v08_burst_credit_event.png"),
  v08_cashout_asset: path.join("generated-assets", "v08_cashout_asset.png"),
  v08_deep_draw_event: path.join("generated-events", "v08_deep_draw_event.png"),
  v08_overclock_run_event: path.join("generated-events", "v08_overclock_run_event.png"),
  v08_project_agenda: path.join("generated-agendas", "v08_project_agenda.png")
};

export function GET(_request: Request, context: { params: Promise<{ cardId: string }> }) {
  return context.params.then(async ({ cardId }) => {
    const fileName = CARD_IMAGES[cardId] ?? localOnrImagePath(cardId);
    if (!fileName) return NextResponse.json({ error: { code: "card_image_not_found", message: "Kartenbild wurde nicht gefunden." } }, { status: 404 });

    const filePath = path.resolve(IMAGE_DIR, fileName);
    if (!filePath.startsWith(`${IMAGE_DIR}${path.sep}`)) return NextResponse.json({ error: { code: "card_image_blocked", message: "Kartenbild wurde blockiert." } }, { status: 403 });

    try {
      const image = await readFile(filePath);
      return new NextResponse(image, {
        status: 200,
        headers: {
          "Cache-Control": "private, max-age=3600",
          "Content-Type": "image/png"
        }
      });
    } catch {
      return NextResponse.json({ error: { code: "card_image_missing", message: "Kartenbilddatei fehlt lokal." } }, { status: 404 });
    }
  });
}

function localOnrImagePath(cardId: string): string | null {
  if (!cardId.startsWith("onr_v1_")) return null;

  for (const candidate of localSnapshotCandidates()) {
    if (!existsSync(candidate)) continue;
    const snapshot = JSON.parse(readFileSync(candidate, "utf8")) as LocalOnrSnapshot;
    const card = snapshot.cards.find((entry) => entry.catalogCardId === cardId);
    const relativePath = card?.onr?.imageAsset?.relativePath;
    if (!isSafeLocalImagePath(relativePath)) return null;
    return relativePath;
  }

  return null;
}

function isSafeLocalImagePath(value: string | undefined): value is string {
  return Boolean(value && value.startsWith("onr-1996/") && value.endsWith(".png") && !value.includes("..") && !path.isAbsolute(value));
}

function localSnapshotCandidates(): string[] {
  const relative = path.join("data", "local", "card-import", "onr-v1-limited", "card-snapshot-onr-v1-limited.local.json");
  return Array.from(
    new Set([
      path.resolve(process.cwd(), relative),
      path.resolve(process.cwd(), "..", relative),
      path.resolve(process.cwd(), "..", "..", relative)
    ])
  );
}

function resolveImageDir(): string {
  const relative = path.join("data", "local-assets", "card-images");
  const candidates = Array.from(
    new Set([
      path.resolve(process.cwd(), relative),
      path.resolve(process.cwd(), "..", relative),
      path.resolve(process.cwd(), "..", "..", relative)
    ])
  );
  return candidates.find((candidate) => existsSync(candidate)) ?? path.resolve(process.cwd(), relative);
}

type LocalOnrSnapshot = {
  cards: Array<{
    catalogCardId: string;
    onr?: {
      imageAsset?: {
        relativePath?: string;
      };
    };
  }>;
};
