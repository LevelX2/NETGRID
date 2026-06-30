# Corp Remote Scoreline Triage Process 2026-06-30

## Status

complete

## Quelle

Analyse von `match_95e375a5711a40ae` aus `data/runtime/multiplayer/netgrid.sqlite`.

## Gesamtziel

Die Corp-KI soll nach einer erfolgreichen frühen Remote-Scoreline das bestehende Scoring-Remote weiter sinnvoll als Score-Basis erhalten und kritische Remote-/Scoreline-Lagen nicht durch lokale Economy- oder Central-ICE-Boni überstimmen lassen.

## Annahmen

- Die Engine bleibt Regelautorität.
- Die KI bewertet ausschließlich bestehende `LegalActions`.
- Es werden keine verdeckten Runner-Hand- oder Stack-Informationen genutzt.
- Remote-Schutz wird nicht pauschal hochgedreht; der Bonus ist an Agenda-/Scoreline-Druck und konkrete Verbesserungen gebunden.

## Nicht-Ziele

- Keine neue Kartenfreischaltung.
- Keine Engine- oder LegalAction-Erweiterung.
- Keine große Triage-Neuarchitektur.
- Kein Deck-Rebuild in diesem Prozess.

## Invarianten

- Side-safe PlayerView-Kontext bleibt die einzige Entscheidungsgrundlage.
- `temporary_safe` und `durable` dürfen nicht aus bloßer fehlender sichtbarer Coverage entstehen, wenn der Runner vor dem Score ein reales Exposure-Fenster hat.
- Kritische `protect_score_remote`-Triage muss lokale Nicht-Ziel-Aktionen hart genug unterdrücken.
- Central-Schutz bleibt erlaubt, wenn HQ/R&D wirklich akut bedroht sind.

## Paketfolge

### Paket 1: Prozess und Evidence

Ziel: Match-Evidence und Prozessvertrag dokumentieren.

Kernartefakte:

- `docs/architecture/ai/corp-remote-scoreline-triage-process-2026-06-30.md`
- `docs/reviews/ai/corp-remote-scoreline-triage-evidence-2026-06-30.md`

Checks:

- `git diff --check`

Commit:

- `docs(ai): record corp remote scoreline triage process`

### Paket 2: Runtime-Fix

Ziel: Scoreline-Exposure, Remote-Erhalt und Triage-Alignment korrigieren.

Kernartefakte:

- `packages/ai/src/runtime/semantic-runtime-corp-scoring-window.ts`
- `packages/ai/src/runtime/semantic-runtime-corp-remote-score.ts`
- `packages/ai/src/runtime/semantic-runtime-corp-board-triage.ts`

Checks:

- fokussierte Runtime-Tests
- `git diff --check`

Commit:

- `fix(ai): strengthen corp remote scoreline triage`

### Paket 3: Regressionen

Ziel: Die neuen Entscheidungsgrenzen mit gezielten Tests sichern.

Kernartefakte:

- `packages/ai/src/runtime/semantic-runtime-corp-score.test.ts`
- `packages/ai/src/runtime/semantic-runtime-corp-scoring-window.test.ts`
- `packages/ai/src/runtime/semantic-runtime-corp-remote-score.test.ts`

Checks:

- fokussierte Vitest-Dateien
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

Commit:

- `test(ai): cover corp remote scoreline triage regressions`

### Paket 4: Abschluss und Integration

Ziel: Final-Report, Wissenslog, breitere AI-Checks und lokaler Merge nach `main`.

Kernartefakte:

- `docs/reviews/ai/corp-remote-scoreline-triage-final-report-2026-06-30.md`
- `KI-Wissen-NETGRID/03 Betrieb/Log 2026-06.md`

Checks:

- `corepack pnpm --filter @netgrid/ai test`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`
- finaler Main-Status

Commit:

- `docs(ai): close corp remote scoreline triage review`

## Fehlerbehandlung

Wenn ein Check rot ist, wird im aktiven Paket eng debuggt. Wenn eine korrekte Lösung Hidden Info, neue LegalActions oder Engine-Änderungen verlangen würde, stoppt der Prozess mit Blocker-Report statt KI-Workaround.
