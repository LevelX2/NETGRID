# DECK LEGAL AI APPROVAL CORP TAG SLICE IMPLEMENTATION REVIEW

## Kontext

Dieser Slice gibt Corp-Karten mit Tag-Druck für die KI frei:

- `simple_tag_ice`
- `onr_v1_287_datapool-by-zetatech`
- `onr_v1_293_netwatch-credit-voucher`
- `onr_v1_243_fetch-4-0-1`
- `onr_v1_249_hunter`
- `onr_v1_306_trojan-horse`

Ziel ist ein enger, side-sicherer Corp-Tag-Slice ohne Mechanik- oder Scope-Erweiterung.

## Artefakte

- AI-Hints: `data/ai/ai-card-hints-corp-tag-approval-slice.json`
- Manifest: `data/manifests/deck-legal-ai-approval-corp-tag-slice-manifest.json`
- Szenarien: `data/scenarios/ai-corp-tag-approval-slice-smokes.json`

## Codeänderungen

- `packages/catalog/src/index.ts`
  - Neuer Slice-Export `DECK_LEGAL_AI_APPROVAL_CORP_TAG_SLICE_CARD_IDS`.
  - ONR-Tag-Operationen sind im Runtime-Katalog jetzt als `ai_supported` freigeschaltet.
- `packages/ai/src/corp-plans.ts`
  - Slice-Hints werden in den Corp-Plan-Hint-Mix aufgenommen.
- `packages/ai/src/index.ts`
  - `corp.tag.punish_visible_tag` wird als reaktive Baseline-Entscheidung behandelt, damit legale Tag-Punishment-Aktionen nicht vom Plan-Layer überstimmt werden.
- `apps/web/app/api/cards/catalog-data.ts`
  - Slice-Hints werden in die API-Hint-Merge-Map aufgenommen.
- `packages/catalog/src/index.test.ts` und `packages/ai/src/index.test.ts`
  - Katalog- und KI-Gates für den Slice ergänzt.

## Gate-Ergebnis

- Scope: pass (Tag-Slice erweitert, kein Scope-Sprung außerhalb Corp-Tag-Fokus).
- LegalAction/Hidden-Info: pass gemäß ergänzten Slice-Tests.
- Replay/StateHash: unverändert; keine Engine-Regelautorität verschoben.

## No-Scope-Bestätigung

- Kleine Zustandsprüfung ergänzt: `runner_stole_agenda_last_turn` für `Trojan Horse`.
- Kein Kartentextparser.
- Kein Belief State.
- Keine FullState-Simulation.
- Keine offiziellen Assets.
- Keine Public-Plattformfunktionen.
