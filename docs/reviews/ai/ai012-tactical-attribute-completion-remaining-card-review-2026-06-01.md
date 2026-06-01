# AI012 Tactical Attribute Completion / Remaining Card Review

Aufgabe-ID: AI012

## Kurzfazit

AI012 korrigiert die AI011-Grenze: Die 52 Karten ohne strategischen `lineSupport`-Oberanker wurden nicht erneut mit `lineSupport` belegt, sondern mit den bereits definierten strukturierten Teilzielattributen versorgt. Alle 52 AI011-Restkarten erhalten aktive `effects`, `conditions` und/oder `remoteRole`, soweit diese Felder aus dem compiled/generated Pfad belastbar vorlagen.

Keine Plannerwirkung, keine Action-Score- oder PlanWeight-Änderung, keine Engine-/Legalitätsänderung, keine Profil-/Default-Umschaltung und kein Hidden-Info-Feld.

## Ergebniszahlen

| Messpunkt | Vor AI012 | Nach AI012 |
| --- | ---: | ---: |
| Aktive effects-Karten | 118 | 162 |
| Aktive conditions-Karten | 52 | 86 |
| Aktive remoteRole-Karten | 13 | 17 |
| Aktive costProfile-Karten | 69 | 69 |
| Aktive breakerProfile-Karten | 20 | 20 |
| Aktive targetProfiles-Karten | 0 | 0 |
| Aktive lineSupport-Karten | 189 | 189 |
| Aktive strategicRole-Karten | 189 | 189 |

## Ergänzte Teilzielattribute

| Feld | Karten |
| --- | ---: |
| `effects` | 52 |
| `conditions` | 34 |
| `remoteRole` | 4 |

## Bearbeitete Restgruppen aus AI011

| AI011-Restgrund | Karten |
| --- | ---: |
| `plain_etr_or_deferred_basic_ice_only` | 21 |
| `recurring_credit_or_install_support_only` | 17 |
| `draw_or_generic_economy_support_only` | 5 |
| `low_damage_or_descriptor_review_needed` | 4 |
| `descriptor_gap_kept_for_separate_review` | 3 |
| `hand_size_or_remote_slot_support_only` | 2 |

## Bewusst nicht geändert

- Kein `lineSupport` für Karten ohne klaren strategischen Oberanker.
- Keine neuen `strategicRole`-Werte.
- Keine manuelle Erfindung von `targetProfiles`, `breakerProfile` oder `costProfile`, wenn diese im aktuellen Contract nicht belastbar ableitbar waren.
- Keine Runtime-, LegalAction-, Planner- oder Profiländerung.

## Detailreport

Maschinenlesbare Pro-Karte-Liste mit neuen Teilzielattributen: `docs/reviews/ai/ai012-tactical-attribute-completion-remaining-card-review-report-2026-06-01.json`.

## Checks

- `corepack pnpm build:ai-compiled-hints`: pass
- `corepack pnpm build:ai-hint-inspector-index`: pass
- `corepack pnpm check:ai-strategy-taxonomy`: pass
- `node scripts/check-ai-derived-facts.mjs --write`: pass
- `node scripts/check-ai-hint-compiled-index.mjs --write`: pass
- `node scripts/check-ai-manual-overlays.mjs --write`: pass
- `corepack pnpm check:ai-compiled-hints`: pass
- `corepack pnpm check:ai-hint-inspector-index`: pass
- `corepack pnpm check:ai-hint-quality`: pass
- `corepack pnpm check:ai-approval-consistency`: pass
- `corepack pnpm check:ai-deck-doctrine-strategy`: pass
- `corepack pnpm --filter @netgrid/ai test`: pass
- `corepack pnpm --filter @netgrid/ai exec tsc -p tsconfig.json --noEmit`: pass
- `corepack pnpm --filter @netgrid/web exec tsc -p tsconfig.json --noEmit`: pass
- `git diff --check`: pass
