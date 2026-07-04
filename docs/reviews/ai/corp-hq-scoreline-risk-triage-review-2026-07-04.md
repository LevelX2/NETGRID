# Corp HQ Scoreline Risk Triage Review 2026-07-04

## Ergebnis

Die vier freigegebenen Fehlergruppen aus `match_cc21ade0f73dd743` sind umgesetzt:

- HQ-Agenda-Gefahr wird auch bei formal geicetem HQ kritisch, wenn die ICE sichtbar abgedeckt oder nicht als belastbarer Access-Stop geeignet ist.
- Agenda-Installationen in ein vorhandenes Scoring-Remote können als relative HQ-Entlastung gewinnen, wenn die Agenda nicht game-ending frei stehlbar ist und die Remote-ICE-Bezahlbarkeit passt.
- Wenn eine konkrete Remote-Schutzaktion legal ist, bleibt Schutz vor Agenda-Install bevorzugt.
- Draw-/Burst-Economy mit Kartenziehen und Non-Agenda-Root-Installationen werden in diesen Lagen gebremst.

## Geänderte Runtime-Schnittstellen

- `semantic-runtime-corp-board-triage.ts`: Central-Schutz prüft effektive Access-Stop-ICE statt nur Layer-Anzahl; HQ-Flood kann relative Remote-Evakuierung ausweisen.
- `semantic-runtime-corp-score.ts`: Score-Komponenten federn `contestable_remote` nur bei side-safe HQ-Relief ab, bremsen HQ-Flood-Draw und bestrafen Non-Agenda-Root vor installierbarer Agenda.
- `semantic-runtime-corp-board-triage.test.ts` und `semantic-runtime-corp-score.test.ts`: Regressionen für sichtbar abgedeckte HQ-ICE, relative HQ-Relief-Scoreline, Remote-Schutz-Vorrang, Night-Shift-Draw-Risiko und Chicago-Branch-vor-Agenda-Muster.

## Verifikation

- `corepack pnpm --filter @netgrid/ai exec vitest run src/runtime/semantic-runtime-corp-board-triage.test.ts src/runtime/semantic-runtime-corp-score.test.ts --maxWorkers=1 --testTimeout=30000 --reporter=verbose`
  - Ergebnis: 2 Dateien, 66 Tests grün.
- `corepack pnpm --filter @netgrid/ai typecheck`
  - Ergebnis: grün.
- `git diff --check`
  - Ergebnis: grün.

## Rest-Risiken

- Die Änderung ist heuristisch und sollte nach dem Merge wieder mit dem 100-Spiele-Benchmark geprüft werden.
- Die relative HQ-Evakuierung ist bewusst auf vorhandene Remotes mit bezahlbarer relevanter ICE begrenzt; sie soll keine neue allgemeine Blind-Scoreline-Regel sein.
