# Rote Evidence: Match 20EB – Run-Revalidierungs-Follow-up (2026-07-17)

## Ergebnis vor Produktionsänderung

Die beiden korrigierten Findings sind auf dem unveränderten Ausgangscode
reproduzierbar. Beide historischen Zieltests scheitern ausschließlich als
`behavior_regression`; Fixture-Validierung, Redaction, Engine-Legalität und
Runtime-Restore sind erfolgreich.

| Checkpoint | Anker | Vor-Fix-Auswahl | Erwartung | Ergebnis |
| --- | ---: | --- | --- | --- |
| `cp-20eb-07-no-upgrade-only-matchpoint-run-d92` | D92 / SV185 | `runner.start_run.remote_1` | R&D statt des als Upgrade beweisbaren Remotes; Remote verboten | `behavior_regression` |
| `cp-20eb-08-revalidate-upgrade-only-run-d113` | D113 / SV214 | `runner.continue_run` | bei drei Credits und nur öffentlichem Upgrade-Payoff jack out | `behavior_regression` |

## Strikter Capture und dokumentierte Rebase

Der verpflichtende erste Capture-Versuch mit `--warmup-policy strict` stoppte
an D39: Historisch wurde Streetware erneut geladen, während der bereits
integrierte frühere Match-20EB-Fix heute korrekt Draw wählt. Das ist die
versionierte Alt-Finding-Korrektur und keine D92-/D113-Drift.

Die anschließend ausdrücklich als Fixture-Migration ausgeführte Rebase
meldete für beide Checkpoints 23 Abweichungen. Sie liegen vollständig zwischen
D39 und D88 und entsprechen den bereits integrierten Bank-, Run-Lock-,
Eurocorpse-, Hosting- und Draw-Korrekturen. Ab D89 ist der produktive Warmup
wieder kompatibel:

- D92: 91 Warmup-Decisions, 23 bekannte Abweichungen, kompatibler Suffix 3;
- D113: 112 Warmup-Decisions, 23 bekannte Abweichungen, kompatibler Suffix 24.

Die historischen Zielzustände, StateHashes, LegalActions und öffentlichen
Eventpräfixe bleiben unverändert. D92 enthält Events bis `evt_185`, D113 bis
`evt_214`; spätere Access- oder Kartenidentitätsdaten sind nicht enthalten.

## Grüne Gegenproben vor dem Fix

1. `20EB-C06-POST-SCORE-UNKNOWN-REMOTE-CONTEST`: Wenn nach dem Agenda-Score
   eine neue verdeckte Rootkarte öffentlich installiert wurde, bleibt Remote 1
   ein zulässiger terminaler Contest und wird gewählt.
2. `20EB-C07-FUNDED-UPGRADE-TRASH-PAYOFF`: Wenn am D113-Fenster statt drei
   zwölf liquide Credits vorhanden sind, bleibt `continue_run` für den
   sichtbaren Upgrade-Trash-Payoff zulässig und wird gewählt.

Damit sind die Korrekturgrenzen eng: Weder werden unbekannte Remotes pauschal
gemieden noch wird Jack-out nach jedem Upgrade-Rez erzwungen.

## Ausgeführter Red-Lauf

```text
corepack pnpm exec vitest run \
  packages/ai/src/evaluation/decision-checkpoints/match-20eb-run-revalidation-followup-decision-checkpoints.test.ts \
  --maxWorkers=1 --testTimeout=30000 --reporter=verbose
```

Ergebnis: 4 Tests, davon 2 erwartungsgemäß rot als `behavior_regression` und
2 Gegenproben grün.
