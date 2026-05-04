import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const REPO_ROOT = path.resolve(process.cwd(), "..", "..");
const IMAGE_DIR = path.join(REPO_ROOT, "data", "local-assets", "card-images");
const LOCAL_ONR_SNAPSHOT_PATH = path.join(REPO_ROOT, "data", "local", "card-import", "onr-v1-limited", "card-snapshot-onr-v1-limited.local.json");

const CARD_IMAGES: Record<string, string> = {
  back_corp: "generated-backs/corp_back.png",
  back_runner: "generated-backs/runner_back.png",
  efficient_fracter: "generated-icebreakers/efficient_fracter.png",
  simple_agenda: "generated-agendas/simple_agenda.png",
  simple_barrier_ice: "generated-ice/simple_barrier_ice.png",
  simple_code_gate_ice: "generated-ice/simple_code_gate_ice.png",
  simple_decoder: "generated-icebreakers/simple_decoder.png",
  simple_economy_asset: "generated-assets/simple_economy_asset.png",
  simple_draw_event: "generated-events/simple_draw_event.png",
  simple_economy_event: "generated-events/simple_economy_event.png",
  simple_fracter: "generated-icebreakers/simple_fracter.png",
  simple_killer: "generated-icebreakers/simple_killer.png",
  simple_run_event: "generated-events/simple_run_event.png",
  simple_priority_agenda: "generated-agendas/simple_priority_agenda.png",
  simple_sentry_ice: "generated-ice/simple_sentry_ice.png",
  simple_tag_ice: "generated-ice/simple_tag_ice.png",
  simple_taxing_barrier_ice: "generated-ice/simple_taxing_barrier_ice.png",
  v08_adaptive_killer: "generated-icebreakers/v08_adaptive_killer.png",
  v08_burst_credit_event: "generated-events/v08_burst_credit_event.png",
  v08_cashout_asset: "generated-assets/v08_cashout_asset.png",
  v08_deep_draw_event: "generated-events/v08_deep_draw_event.png",
  v08_gate_ice: "generated-ice/v08_gate_ice.png",
  v08_overclock_run_event: "generated-events/v08_overclock_run_event.png",
  v08_precise_decoder: "generated-icebreakers/v08_precise_decoder.png",
  v08_steady_fracter: "generated-icebreakers/v08_steady_fracter.png",
  v08_project_agenda: "generated-agendas/v08_project_agenda.png",
  v08_wall_ice: "generated-ice/v08_wall_ice.png",
  v08_watchdog_ice: "generated-ice/v08_watchdog_ice.png"
};

export async function GET(_request: Request, context: { params: Promise<{ cardId: string }> }) {
  const { cardId } = await context.params;
  const fileName = CARD_IMAGES[cardId] ?? (await localOnrImagePath(cardId));
  if (!fileName) return NextResponse.json({ error: { code: "card_image_not_found", message: "Kartenbild wurde nicht gefunden." } }, { status: 404 });

  const filePath = path.resolve(IMAGE_DIR, fileName);
  if (!filePath.startsWith(`${IMAGE_DIR}${path.sep}`)) return NextResponse.json({ error: { code: "card_image_blocked", message: "Kartenbild wurde blockiert." } }, { status: 403 });

  try {
    const image = await readFile(filePath);
    return new NextResponse(image, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "Content-Type": "image/png"
      }
    });
  } catch {
    return NextResponse.json({ error: { code: "card_image_missing", message: "Kartenbilddatei fehlt lokal." } }, { status: 404 });
  }
}

async function localOnrImagePath(cardId: string): Promise<string | null> {
  if (!cardId.startsWith("onr_v1_")) return null;

  try {
    const snapshot = JSON.parse(await readFile(LOCAL_ONR_SNAPSHOT_PATH, "utf8")) as LocalOnrSnapshot;
    const card = snapshot.cards.find((entry) => entry.catalogCardId === cardId);
    const relativePath = card?.onr?.imageAsset?.relativePath;
    if (!isSafeLocalImagePath(relativePath)) return null;
    return relativePath;
  } catch {
    return null;
  }
}

function isSafeLocalImagePath(value: string | undefined): value is string {
  return Boolean(value && value.startsWith("onr-1996/") && value.endsWith(".png") && !value.includes("..") && !path.isAbsolute(value));
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
