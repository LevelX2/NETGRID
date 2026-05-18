# Originalset-Spotcheck Umsetzung 2026-05-15 Netwatch/Spinn

Quelle: `docs/archive/originalset-spotcheck-jobs/2026-05/spotcheck-2026-05-15-netwatch-spinn.md`

## Ergebnis

Der Job wurde umgesetzt. Die wichtigsten Engine-Korrekturen betreffen:

- `Security Net Optimization`: Beim Scoren wird der gewählte Fort als `selectedServerId` auf der gescorten Agenda gespeichert; der +1-ICE-Stärkebonus gilt nur für ICE in diesem Fort.
- `Encryption Breakthrough`: Gescort liefert die Agenda jetzt einen source-bound Code-Gate-Stärkebonus. Beim Score werden installierte Code Gates öffentlich revealbar markiert und die Korp erhält 1 Credit je revealed/rezzed Code Gate.
- `Crybaby`: Access auf rezzed Crybaby legt einen öffentlichen Crying-Counter auf den Runner-Identitätsstatus. Jeder Crying-Counter reduziert Runner-Link in Trace-Fenstern um 2; der Runner kann per LegalAction `1 Click + 4 Credits` genau einen Counter entfernen.
- `Spinn Public Relations`: Die Karte nutzt keinen generischen Sofort-2-Credit-Pfad mehr. Ihre Aktion lädt 6 öffentliche Bits auf die Karte; am Start jedes Korp-Zugs wird bei vorhandenem Pool genau 1 Bit in 1 Korp-Credit umgewandelt.

Zusätzliche Härtungen:

- `Netwatch Operations Office` bleibt lokal bei Trace 2; der fokussierte Test prüft Wrong-Side/Stale und PublicPayload ohne irreführenden Credit-Betrag.
- `Bartmoss Memorial Icebreaker` schreibt den Post-Encounter-Ausgang in die `continue_run`-Payload.
- `Data Masons`, `Dr. Dreff`, `Washington, D.C., City Grid` und `Japanese Water Torture` bleiben auf ihren bestehenden source-bound Pfaden grün; die aktualisierten Tests schützen die geänderte Security-Net-/Spinn-Semantik vor Regression.

## Geänderte Artefakte

- `packages/engine/src/index.ts`
- `packages/engine/src/index.test.ts`
- `packages/shared/src/index.ts`
- `packages/catalog/src/index.ts`
- `data/ai/ai-card-hints-deck-legal-v1917.json`
- `data/ai/ai-card-hints-deck-legal-v1918.json`
- `data/ai/ai-card-hints-deck-legal-v1920.json`
- `docs/reviews/originalset-spotchecks/register.md`
- `data/reports/originalset-card-spotcheck-register.json`

## Tests

- `corepack pnpm --filter @netgrid/engine test`

Die vollständigen Pflichtchecks werden im Jobbericht dokumentiert.

