# AI 3DB62D Corp Fixes Final 2026-06-29

## Ergebnis

Das Replay `match_3db62d5216ecde8d` wurde als Regression gegen die bereits aktive Corp-Board-Triage umgesetzt. Die Anpassungen bleiben AI-intern, LegalActions-only und side-safe.

## Umgesetzt

- `score_agenda` schlägt weiteres `advance_card`, wenn die Agenda bereits legal scorebar ist und das zusätzliche Advance keinen sichtbaren Overadvance-Schwellenwert erreicht.
- Kritische Corp-Board-Triage-Mismatches wirken wieder mit Rohwerten stark genug, damit lokale Scoreline-Boni sie nicht überstimmen.
- Die Triage priorisiert bei mehreren Score-Remote-Kandidaten konkrete bestehende Remotes höher als hypothetische `new_remote`-Kontexte.
- Sichtbare Runner-Creditquellen wie Broker-Hosted-Credits werden vor Runner-Exposure in den Access-Floor eingerechnet.
- Game-ending oder near-win Remote-Exposure empfiehlt Remote-Schutz auch dann, wenn vorhandene rezzed ICE zwar da sind, aber sichtbar bezahlbar gebrochen werden können.
- Same-Turn-Advance-Pfade gelten nur als `score_now`, wenn das Scoring-Window keine Runner-Exposure vor dem Score meldet.
- `semanticRuntimeVisibleSourceCard` behandelt optionale `LegalAction.source`-Werte defensiv.

## Verifikation

- `corepack pnpm exec vitest run src/runtime/semantic-runtime-corp-score.test.ts src/runtime/semantic-runtime-corp-scoring-window.test.ts src/runtime/semantic-runtime-corp-board-triage.test.ts src/runtime/semantic-runtime-corp-remote-score.test.ts src/semantic-ai-runtime-cutover.test.ts src/strategic-vertical-slices.test.ts --maxWorkers=1 --testTimeout=30000`: 6 Dateien, 166 Tests grün.
- `corepack pnpm --filter @netgrid/ai typecheck`: grün.
- `corepack pnpm --filter @netgrid/ai test`: 272 Dateien, 2187 Tests grün.
- `git diff --check`: grün.

## Auffälligkeiten

Der vollständige AI-Testlauf dauert in diesem Worktree rund 320 Sekunden. Ein erster Lauf mit 184 Sekunden Timeout wurde vom Tool abgebrochen, ohne verwertbaren Testfehler; der zweite vollständige Lauf war grün.

## Grenzen

Die Änderungen nehmen keine Hidden-Info-Annahmen über Runner-Hand, Runner-Stack oder verdeckte Runner-Ressourcen vor. Engine-Legalität, `applyAction`, Replay, StateHash, Randomness und LegalAction-Erzeugung bleiben unverändert.
