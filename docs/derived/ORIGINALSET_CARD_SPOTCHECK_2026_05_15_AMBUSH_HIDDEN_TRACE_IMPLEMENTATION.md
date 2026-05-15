# Originalset-Spotcheck 2026-05-15 Ambush/Hidden/Trace Implementation

Quelle: `docs/derived/originalset-spotcheck-jobs/inbox/spotcheck-2026-05-15-ambush-hidden-trace.md`

Status: `blocked`

## Ergebnis

Der Lauf hat mehrere konkrete, eng begrenzte Engine-Nacharbeiten umgesetzt und grün getestet. Der Gesamtjob bleibt fachlich blockiert, weil vier Karten größere Vollresolver benötigen, die nicht seriös als Nebenfix im Spotcheck abgeschlossen werden können.

## Umgesetzte Teilfixes

| Karte | Umsetzung |
|---|---|
| Setup! | Access-Schaden auf 2 Net Damage korrigiert; Archives-Zugriff no-op; R&D-Reveal-Payload ergänzt. |
| Virus Test Site | Schaden skaliert mit `max(1, advancementCounters * 2)`; Archives-Zugriff no-op; R&D-Reveal-Payload ergänzt. |
| Information Laundering | Rezzed Asset-Aktion skaliert mit Advancement-Countern, trasht die Quelle und publiziert Counter-/Credit-/Selftrash-Felder. |
| Edited Shipping Manifests | Access-Replacement-Draw wird als `corpDrawnCount` redigiert veröffentlicht; Zugriff bleibt ersetzt. |
| Fragmentation Storm | Erfolgreicher Folge-`continue_run` publiziert getrashte installierte Programmdefinition, Typ und Anzahl. |
| Skälderviken SA Beta Test Site | Rez-LegalAction und Chronik machen die öffentliche Black-ICE-Kostenreduktion samt Quelle sichtbar. |

## Blockierte Restverträge

| Karte | Removal Condition |
|---|---|
| Self-Modifying Code | Eigener Resolver für Trash-Kosten, Nutzung während Run/Encounter, Stack-Programmauswahl, Reveal, Installkosten, MU-Druck und Shuffle. |
| Fait Accompli | Fortgebundene Fait-Counter nach erfolgreichem Run auf subsidiary data fort und Difficulty-Modifikation für Agenden in genau diesem Fort. |
| Emergency Self-Construct | Flatline-/Damage-Replacement mit Gripverlust, Core-Damage-Removal, 3-Aktionen-Restzustand, Handgröße -1 und automatischer Meat-Damage-Prevention. |
| Crystal Palace Station Grid | Finalisierter lokaler Counter-Wirkungsvertrag, inklusive servergebundener Nutzung und Verbrauch/Zählung. |

## Verifikation

- `corepack pnpm --filter @netgrid/engine test` grün, 349 Tests.
- `corepack pnpm --filter @netgrid/web test -- chronicle.test.ts` grün, 13 Testdateien / 121 Tests.
- `corepack pnpm --filter @netgrid/catalog test` grün, 44 Tests.
- `corepack pnpm typecheck` grün.

## Geänderte Dateien

- `packages/engine/src/index.ts`
- `packages/engine/src/index.test.ts`
- `packages/shared/src/index.ts`
- `docs/derived/originalset-spotcheck-jobs/inbox/spotcheck-2026-05-15-ambush-hidden-trace.md`
- `docs/derived/originalset-spotcheck-jobs/blocked/spotcheck-2026-05-15-ambush-hidden-trace.md`
- `docs/derived/ORIGINALSET_CARD_SPOTCHECK_REGISTER.md`
- `data/reports/originalset-card-spotcheck-register.json`
- `KI-Wissen-NETGRID/03 Betrieb/Log 2026-05.md`
