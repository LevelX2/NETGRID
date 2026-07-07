# Runner Coverage Search Fix Final 2026-07-07

Status: umgesetzt auf Arbeitsbranch `codex/ai-runner-coverage-search-fix`

## Analysierte Spiele

- `match_e05dbb4eadd9a5f4`: Runner verlor nach gutem Start den Fokus, aktivierte `The Short Circuit` wiederholt, suchte Programme mehrfach und warf gesuchte Karten später ab.
- `match_13f99872809e6a66`: Runner ließ eine bekannte HQ-Agenda-Chance liegen, weil `runner.obtain_breaker_coverage` Setup-Aktionen bevorzugte.

## Änderungen

- Coverage-Programmsuche ist kein gültiger Planfortschritt mehr, wenn eine vorherige Programmsuche bereits ein sichtbares Programm in die Hand gebracht hat und dieses noch nicht installiert, finanziert oder in einen Run umgesetzt wurde.
- Rig-basierte Programmsuche wird bei vollem Griff als Handlimit-Risiko abgelehnt.
- Ein Runtime-Test hält fest, dass nach einer `The Short Circuit`-Suche Funding statt erneuter Suche gewählt wird.
- Coverage-Plan-Mapping lässt bekannte HQ-Agenda- und frische R&D-Payoff-Runs mit klarem Score-Vorsprung durch.
- Remote-Score-Threats aus neutralen oder RunTarget-basierten Goals gelten als Remote-Contest-Anker.

## Grenzen

- Der vorherige `Setup!`-Access-Trash-Fehler war bereits auf `main` behoben und wurde hier nicht erneut geändert.
- Es wurde kein Broker-spezifischer Plan gebaut, weil die zwei analysierten Spiele keine freiwillige Broker-Fehlbehandlung belegen.
- Keine Engine-, LegalAction-, PlayerView-, Replay-, StateHash-, Randomness-, Kartenpool- oder Hidden-Info-Vertragsänderung.

## Fokussierte Checks

- `corepack pnpm exec vitest run src/plans/tactical-plan-coverage-search-fit.test.ts --maxWorkers=1 --testTimeout=30000 --reporter=dot`
- `corepack pnpm exec vitest run src/tactical-plans.test.ts --maxWorkers=1 --testTimeout=30000 --reporter=dot -t "blocks repeated The Short Circuit"`
- `corepack pnpm exec vitest run src/semantic-ai-runtime-cutover.test.ts --maxWorkers=1 --testTimeout=30000 --reporter=dot -t "does not repeat The Short Circuit"`
- `corepack pnpm exec vitest run src/runtime/semantic-choice-ranking.test.ts --maxWorkers=1 --testTimeout=30000 --reporter=dot`
- `corepack pnpm exec vitest run src/tactical-plans.test.ts --maxWorkers=1 --testTimeout=30000 --reporter=dot -t "uses neutral remote score-threat"`

Finale Paket-7-Checks und lokaler Merge nach `main` folgen nach diesem Dokumentationspaket.
