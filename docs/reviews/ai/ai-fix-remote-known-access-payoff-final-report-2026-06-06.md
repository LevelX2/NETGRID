# AI-FIX-REMOTE-1 Known Remote Access Payoff - Abschlussreport

Datum: 2026-06-06

## Anlass

Im Playtest wiederholte die Runner-KI nach einem erfolgreichen Zugriff auf `remote_1/root:0` sofort einen Run auf dasselbe Remote, obwohl sie `Braindance Campaign` bereits kannte und mit 5 Credits die Trashkosten 7 nicht bezahlen konnte. Das Action-Level-Ranking bewertete R&D und HQ bereits höher, der fortgeführte TacticalPlan `runner.contest_remote:remote_1` konnte aber weiterhin auf `start_run remote_1` mappen.

## Umsetzung

- `packages/ai/src/known-remote-access-payoff.ts` bündelt die Auswertung bekannter Remote-Wurzeln aus aktueller sichtbarer Root-Information und side-sicherem `knownPositionMemory`.
- `runner-plans.ts` nutzt diese Routine für Remote-Access-Wert, Trash-Affordability und die Contestable-Prüfung.
- `tactical-plans.ts` stuft Remote-Run-Aktionen mit bekanntem, aktuell nutzlosem Payoff als `abandoned` ein. Diese Pläne bleiben im Debug sichtbar, können aber nicht mehr auf die nächste LegalAction gemappt werden.
- `index.test.ts` deckt die Regressionen für unbezahlbaren Braindance-Trash, bezahlbaren Braindance-Trash, bekannte Remote-Agenda, unbekannte Remote-Wurzeln und den semantischen Livepfad ab.

## Safety-Grenzen

- Keine Engine-, `LegalAction`-, `applyAction`-, Replay-, StateHash- oder Randomness-Änderung.
- Keine Nutzung verdeckter gegnerischer Daten; die Auswertung basiert auf PlayerView und side-sicher rekonstruierter Memory.
- Unbekannte oder invalidierte Remote-Zustände bleiben konservativ und blockieren Remote nicht hart.
- TacticalPlans erzeugen keine Legalität; sie priorisieren und mappen nur vorhandene Engine-`LegalActions`.

## Verifikation

- `corepack pnpm --filter @netgrid/ai typecheck`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts -t "memory-known remote|post-ICE trash guard|known remote contest viable|memory-known unaffordable remote"`: 6 Tests bestanden.
- `corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts src/tactical-plans.test.ts src/semantic-ai-runtime-cutover.test.ts`: 459 Tests bestanden.
- `git diff --check`

## Ergebnis

Der bekannte unbezahlbare Remote-Asset-Fall wird jetzt auf Plan- und Mapping-Ebene entwertet. Im semantischen Runtime-Pfad wird der Remote-Plan für `remote_1` als `abandoned` mit `too_expensive` geführt, und die KI wählt in der Regression keinen zweiten Run auf `remote_1`. Bezahlbare Remote-Trash-Ziele und bekannte Agendas bleiben weiter positive Remote-Ziele.

## Nicht erledigt

HQ- und R&D-Access-Freshness wurden in diesem Fix nicht vereinheitlicht. Die bestehenden separaten HQ-/R&D-Mechanismen bleiben aktiv; eine breitere gemeinsame Access-Payoff-Schicht wäre ein eigenes Folgepaket.
