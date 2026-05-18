# Originalset-Spotcheck 2026-05-15 AI Boon/Virizz Implementation

Quelle: `docs/archive/originalset-spotcheck-jobs/2026-05/spotcheck-2026-05-15-ai-boon-virizz.md`

## Ergebnis

Der sequenzielle Spotcheck-Job `spotcheck-2026-05-15-ai-boon-virizz` ist umgesetzt und lokal verifiziert.

Korrigiert wurden drei echte Vertragsdrifts:

- `AI Boon`: Die Runner-Programm-Hauptaktion `deterministic_die_probe` wird nicht mehr angeboten. Stattdessen würfelt die Engine beim Start jedes echten Runs mit installiertem `AI Boon` genau einmal, schreibt einen `RandomDrawRecord`, setzt die Stärke run-lokal und dokumentiert Quelle, Zufallszweck, Würfelwurf, `randomCounterAfter` und `aiBoonRunStrength` im PublicPayload.
- `ZZ22 Speed Chip`: Die Shared-/Engine-Definition nutzt jetzt Installkosten 5 und lädt 2 Recurring Credits. Diese Credits werden nur während Runs und nur für Killer-Icebreaker-Kosten berücksichtigt, nicht für Programm-Installationen, Nicht-Killer oder Run-Start-Taxes.
- `Newsgroup Taunting`: Rezzed Kopien erzeugen einen globalen Run-Start-Tax von 1 Credit je Quelle. LegalActions projizieren den Tax source-bound; `applyAction` bezahlt ihn erneut revalidiert über die Run-Kostenlogik und der PublicPayload bleibt ohne private Zoneninformationen.

Die übrigen sieben Karten wurden gegen die vorhandenen Engine-Pfade und Regressionstests geprüft:

- `Security Code WORM Chip`: erfolgreicher-HQ-Run-Flag, public unrezzed-ICE-Choice, Ziel-Revalidation und Hidden-Info-Schutz bleiben grün.
- `Synchronized Attack on HQ`: private Korp-HQ-Retain-Choice, Kosten-Revalidation, Counts-only PublicPayload und Replay bleiben grün.
- `Triggerman`: deterministischer installed-program Trash aus der V1.6.3-Familie bleibt grün.
- `Cortical Scanner`: drei getrennte End-the-run-Subroutinen bleiben indexstabil.
- `Virizz`: rest-of-run Break-Kostenmodifier bleibt legalaction-/applyaction-konsistent.
- `Anonymous Tip`: public Black-ICE-Derez-Choice und Revalidation bleiben grün.
- `Canis Minor`: Future-Encounter-Strength-Bonus bleibt run-gebunden.

## Geänderte Dateien

- `packages/shared/src/index.ts`
- `packages/engine/src/index.ts`
- `packages/engine/src/index.test.ts`
- `data/ai/ai-card-hints-deck-legal-v1920.json`
- `data/ai/ai-card-hints-deck-legal-v1922.json`
- `docs/reviews/originalset-spotchecks/register.md`
- `data/reports/originalset-card-spotcheck-register.json`
- `docs/reviews/originalset-spotchecks/reports/ORIGINALSET_CARD_SPOTCHECK_2026_05_15_AI_BOON_VIRIZZ_IMPLEMENTATION.md`

## Verifikation

- `corepack pnpm --filter @netgrid/engine test`: grün, 337 Tests.
- `corepack pnpm --filter @netgrid/web test -- chronicle.test.ts`: grün, 119 Tests.
- `corepack pnpm --filter @netgrid/catalog test`: grün, 44 Tests.
- `corepack pnpm typecheck`: grün.

## Restpunkte

Keine fachlichen Restpunkte für diese Runde. Die lokale Windows-ACL hat das Entfernen der ursprünglichen Inbox-Datei blockiert; der Jobbericht wurde deshalb zusätzlich in `done/` finalisiert und die verbliebene Inbox-Kopie auf `done` gesetzt, damit sie nicht erneut als ready gezogen wird.
