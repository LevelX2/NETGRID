# Originalset-Spotcheck 2026-05-15 Ramming/Galveston Umsetzung

Jobbericht: `docs/derived/originalset-spotcheck-jobs/done/spotcheck-2026-05-15-ramming-galveston.md`

## Ergebnis

Der sequenzielle Spotcheck-Job `spotcheck-2026-05-15-ramming-galveston` ist umgesetzt. Die Runde korrigiert mehrere Vertragsdrifts zwischen lokaler Kartenbasis, Runtime-Definitionen, AI-Hints, Manifesten und Engine-Resolvern.

| Karte | Ergebnis |
|---|---|
| Ramming Piston | Wall-Breaker-Vertrag mit Pump, Wall-only-Break und exakt 2 Stealth-Folgekosten ergänzt. |
| Skivviss | Recurring-Credit-Stub entfernt; erfolgreiche R&D-Runs legen Virus-Counter, Corp-Zugstart zieht Zusatzkarten. |
| Core Command: Jettison Ice | Bestehender HQ-Erfolgsrun-/Rez-Kosten-Trash-Pfad bleibt grün und wurde im Job als nicht driftend bestätigt. |
| Weather-to-Finance Pipe | Access-Replacement-Payload für HQ-Erfolgsrun, Creditverlust und Hidden-Zone-Barriere präzisiert. |
| Bodyweight Data Creche | Installkosten 3, +1 MU, Deck-Einzigartigkeit und einmal-pro-Zug Bonus-Run nach erfolgreichem Run ergänzt. |
| Rigged Investments | Recurring-Credit-Stub entfernt; sechs Bit-Counter, Runner-Zugstart-Credit und Auto-Trash umgesetzt. |
| The Short Circuit | Stack-Programm-Suche mit Runner-privater Choice, Reveal genau der gewählten Karte, Shuffle und Trash-on-use umgesetzt. |
| Data Raven | Runner-Aktion zum Entfernen eines Data-Raven-Counters für `[A]` und 1 Credit ergänzt. |
| Experimental AI | Advancement-Counter steuern die Anzahl getrashter öffentlicher installierter Runner-Programme. |
| New Galveston City Grid | R&D-Reveal-Stub entfernt; servergebundener +2-Trashkosten-Modifikator für andere Nodes/Upgrades im Fort umgesetzt. |

## Geänderte Artefaktgruppen

- Engine und Shared-Katalog: `packages/engine/src/index.ts`, `packages/engine/src/index.test.ts`, `packages/shared/src/index.ts`
- AI-Hints: `data/ai/ai-card-hints-deck-legal-v1911.json`, `data/ai/ai-card-hints-deck-legal-v1912.json`, `data/ai/ai-card-hints-deck-legal-v1914.json`, `data/ai/ai-card-hints-deck-legal-v1918.json`, `data/ai/ai-card-hints-deck-legal-v1922.json`, `data/ai/ai-card-hints-deck-legal-v195-v198.json`
- Manifeste, Rules und Szenarien: V1.9.11, V1.9.12, V1.9.14, V1.9.18, V1.9.19 und V1.9.22 Artefakte unter `data/manifests/`, `data/rules/` und `data/scenarios/`
- Nachtest-Register und Jobqueue: `docs/derived/ORIGINALSET_CARD_SPOTCHECK_REGISTER.md`, `data/reports/originalset-card-spotcheck-register.json`, `docs/derived/originalset-spotcheck-jobs/done/spotcheck-2026-05-15-ramming-galveston.md`

## Verifikation

- `corepack pnpm --filter @netgrid/engine test`: grün, 328 Tests
- `corepack pnpm --filter @netgrid/web test -- chronicle.test.ts`: grün, 119 Tests
- `corepack pnpm --filter @netgrid/catalog test`: grün, 44 Tests
- `corepack pnpm typecheck`: grün

## Restpunkte

Keine Blocker für diesen Job. Breitere Folgearbeit bleibt außerhalb dieser Runde: weitere noch nicht nachgetestete Originalset-Karten und alte historische Review-Dokumente, die frühere V1.9.x-Zwischenstände beschreiben, wurden bewusst nicht umgeschrieben.
