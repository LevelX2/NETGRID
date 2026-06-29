# AI Archives ICE Depriorisierung Final-Report 2026-06-29

## Anlass

Nach der Rush-Scoring-Window-Härtung blieb die Archives-ICE-Logik fachlich zu weich. „Deckeln“ reichte nicht: Aus Korp-Sicht ist Vorrats-ICE vor Archives fast immer eine schlechte Ausgabe von Klicks, Credits und ICE. Es signalisiert außerdem häufig, dass Archives relevant sein könnte, statt die eigentlichen Gewinnlinien zu stärken.

## Umsetzung

Die Bewertung von `install_card` mit `placement: ice` auf `archives` wurde in `semantic-runtime-corp-remote-score.ts` nachgeschärft:

- Keine Agenda im Archiv: Archives-ICE ist grundsätzlich negativ.
- Wiederholte Runner-Archives-Runs ohne Agenda im Archiv reichen nicht mehr als positiver Baugrund.
- Agenda im Archiv und kein vorhandenes Archives-ICE: erstes Archives-ICE bleibt als Notfallmaßnahme positiv, aber schwächer als bisher.
- Agenda im Archiv und bereits vorhandenes Archives-ICE: weiteres Archives-ICE wird negativ bewertet, besonders wenn HQ/R&D bedroht sind oder Agenda-Druck im HQ liegt.

Damit bleibt das Primärziel für die Corp-KI klar: Agendas sollen gescored werden. Archives soll kein vorbereiteter Sicherheitsserver sein.

## Tests

Neue beziehungsweise angepasste Regressionen prüfen:

- Archives-ICE ohne konkretes Archives-Risiko unter R&D-Druck fällt auf `-950`.
- Empty Archives ohne akuten Central-Druck bleibt mit `-650` negativ.
- Erstes Archives-ICE bei Agenda im Archiv ist nur noch Notfallbonus `550`.
- Weiteres Archives-ICE bei Agenda im Archiv und HQ-Druck ist `-700`.
- Wiederholte Archives-Probes ohne Agenda bleiben `-650`.

## Checks

Grün im Worktree:

- `corepack pnpm --filter @netgrid/ai exec vitest run src/runtime/semantic-runtime-corp-remote-score.test.ts src/runtime/semantic-runtime-corp-scoring-window.test.ts`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

## Grenzen

Keine Engine-, LegalAction-, PlayerView-, Replay-, StateHash- oder Hidden-Info-Grenze wurde erweitert. Es wurde keine Bluff-Strategie für Archives eingeführt.
