---
activityId: act-2026-05-20-runner-ai-shell-traders-overprepare
status: done
kind: fix
area: ai
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-20
startedAt: 2026-05-20
completedAt: 2026-05-20
branch:
releaseTarget: Runner AI Shell Traders follow-up
blockedBy: []
resultArtifacts:
  - packages/ai/src/runner-plans.ts
  - packages/ai/src/index.ts
  - packages/ai/src/index.test.ts
checks:
  - corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts -t "Shell Traders"
  - corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts -t "Runner AI|Runner plan|Shell Traders|installed Runner economy|King of the Road|breaker|economy"
  - corepack pnpm --filter @netgrid/ai typecheck
  - corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts
  - git diff --check -- packages/ai/src/index.ts packages/ai/src/runner-plans.ts packages/ai/src/index.test.ts docs/activities/done/act-2026-05-20-runner-ai-shell-traders-overprepare.md
relatedActivities:
  - act-2026-05-18-runner-ai-shell-traders-unused
  - act-2026-05-19-shell-traders-missing-prepare-action
  - act-2026-05-19-shell-traders-action-labels-target-card
---

# Runner-KI: The Shell Traders nicht mit zu vielen vorbereiteten Karten überfüllen

## Ziel

Die Runner-KI soll `The Shell Traders` weiterhin sinnvoll nutzen, aber nicht immer weitere Karten beiseitelegen, während bereits mehrere Shell-Traders-Ziele mit Shell-Countern auf Fertigstellung warten. Bestehende vorbereitete Ziele sollen je nach Lage eher per `remove_shell_counter`, Start-of-turn-Progress, Economy oder Run-Plan vorangetrieben werden, statt ohne klare Notwendigkeit einen großen Set-Aside-Backlog aufzubauen.

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-05-20: Die Runner-KI spielte mit `The Shell Traders` sehr viele Karten heraus beziehungsweise legte sechs bis sieben Karten teilweise beiseite, bevor sie eine Karte fertigstellte. Der Eindruck war, dass Zielorgien und die aktuelle Bewertung dazu führen, dass eine weitere Karte beiseitegelegt wird, obwohl Fertigstellen, Economy oder Runs sinnvoller sein könnten.
- Gemeinter Kartentitel im Workspace: `The Shell Traders` (`onr_v1_176_the-shell-traders`).
- Die erledigte Activity `act-2026-05-18-runner-ai-shell-traders-unused` reparierte den alten Gegenbefund: Shell Traders wurde gar nicht genutzt oder verlor gegen Basic Economy. Der neue Befund ist ein Folgeproblem der nun aktiven Nutzung.
- `packages/ai/src/runner-plans.ts` bewertet Shell-Traders-Prepare- und Remove-Counter-Aktionen aktuell gemeinsam im `build_rig`-Plan. `evaluateShellTradersActions` addiert Prepare- und Remove-Scores; dadurch kann ein weiterer Prepare-Button den Gesamtplanwert erhöhen, auch wenn schon Shell-Ziele offen sind.
- `packages/ai/src/index.ts` hat zusätzlich Baseline-Scores für `runner.shell_traders.prepare_install` und `runner.shell_traders.remove_counter`; diese sollten mit dem Planverhalten konsistent bleiben.
- Bestehender fokussierter Check vom 2026-05-20: `corepack pnpm --filter @netgrid/ai test -- -t "Shell Traders"` ist grün, deckt aber die Überfüllungs-Situation nicht ab.

## Scope

- Reproduzierbaren AI-Test oder eine kleine Engine+AI-Fixture anlegen, in der die Runner-KI mehrere bereits beiseitegelegte Shell-Traders-Ziele hat und zusätzlich weitere Prepare-LegalActions sieht.
- Shell-Traders-Backlog side-sicher aus PlayerView/LegalActions bewerten: Anzahl vorbereiteter Shell-Ziele, verbleibende Shell-Counter, sofortige Installationschance und Zielrollen.
- `prepare` gegenüber `remove_shell_counter` dämpfen, wenn bereits genügend Shell-Traders-Ziele offen sind oder ein Remove-Schritt eine Installation zeitnah fertigstellt.
- Economy- und Run-Pläne in solchen Zuständen wieder konkurrenzfähig machen, insbesondere wenn die KI wenig Credits hat oder bereits genug Rig-Aufbau in der Pipeline liegt.
- Debug/Evidence erweitern oder prüfen, damit sichtbar ist, ob Prepare wegen Shell-Traders-Backlog, sofortiger Fertigstellung, Economy-Bedarf oder Run-Druck gewählt oder zurückgestellt wurde.

## Nicht im Scope

- Keine Änderung am bestätigten Engine-Vertrag von `The Shell Traders`: Set Aside, Shell-Counter, Start-of-turn-Removal, Paid Removal, Auto-Install, MU-Choice, Replay und StateHash bleiben unverändert.
- Keine pauschale Regel, Shell Traders nie mehrfach zu verwenden. Mehrere vorbereitete Karten dürfen sinnvoll sein, wenn mehrere installierte Shell-Traders-Kopien, gute Ziele und ausreichende Zeit/Credits dafür sprechen.
- Keine Hidden-Info-Erweiterung: Die Runner-KI darf keine Korp-Geheimdaten und keine nicht sichtbaren Runner-Ziele außerhalb ihres PlayerViews nutzen.
- Keine breite Runner-KI-Neuschreibung und kein generisches Delayed-Install-System über diesen Shell-Traders-Fall hinaus.

## Akzeptanzkriterien

- [ ] Ein AI-Test reproduziert den Befund: Bei mehreren vorbereiteten Shell-Traders-Zielen und weiteren Handzielen legt die Runner-KI nicht blind noch eine Karte beiseite, wenn ein Remove-Counter-, Economy- oder Run-Plan klar sinnvoller ist.
- [ ] Wenn ein `remove_shell_counter` eine Karte sofort oder fast sofort installiert, priorisiert die Runner-KI diesen Fortschritt gegenüber einem weiteren Prepare, sofern kein dringender höherwertiger Plan vorliegt.
- [ ] Wenn bereits ein angemessener Shell-Traders-Backlog vorhanden ist, erhält weiteres Prepare einen nachvollziehbaren Malus oder eine harte Auswahlbremse; der konkrete Grenzwert wird im Test begründet.
- [ ] Bei leerem oder niedrigem Backlog bleibt Shell-Traders-Prepare weiterhin nutzbar und verliert nicht wieder dauerhaft gegen Basic Credit/Draw.
- [ ] Debug/Evidence enthält side-sichere Hinweise wie Shell-Traders-Backlog, Prepare-/Remove-Anzahl und Immediate-Install-Status, aber keine FullState-, PrivatePayload- oder Hidden-Info-Daten.
- [ ] Bestehende Shell-Traders-AI-Tests, Runner-Economy-Tests und relevante Runner-Plan-Regressionen bleiben grün.

## Umsetzungshinweise

- Primäre Startpunkte:
  - `packages/ai/src/runner-plans.ts`: `evaluateShellTradersActions`, `classifyShellTradersAction`, `runnerShellTradersPriority`.
  - `packages/ai/src/index.ts`: Baseline-Scores für `runner.shell_traders.prepare_install` und `runner.shell_traders.remove_counter`, falls Plan- und Baseline-Verhalten auseinanderlaufen.
  - `packages/ai/src/index.test.ts`: Mehrziel-/Backlog-Regression ergänzen, nicht nur isolierte Basic-Credit-Vergleiche.
- Wahrscheinliche technische Ursache: `prepare` und `remove_counter` werden additiv im selben `build_rig`-Plan bewertet. Ein sinnvoller Fix sollte eher das beste Shell-Traders-Vorhaben oder einen Backlog-adjustierten Score bewerten, statt alle verfügbaren Prepare-LegalActions als kumulativen Nutzen zu zählen.
- Ein konservativer Startpunkt wäre: `remove_counter` mit Immediate Install bevorzugen; weiteres `prepare` ab einer kleinen Zahl offener Shell-Ziele deutlich abwerten; hohe Zielrollen wie fehlende passende Breaker dürfen diese Bremse nur begründet überstimmen.

## Ergebnisnotiz

Umgesetzt. Die Runner-Planbewertung für `The Shell Traders` bewertet Prepare und Remove nicht mehr additiv als immer weiter wachsenden Build-Rig-Nutzen. Stattdessen wird das beste Shell-Traders-Vorhaben gewählt: sofortige oder nahe Remove-Counter-Fertigstellung wird bevorzugt, weiteres Prepare erhält bei vorhandenen vorbereiteten Shell-Zielen einen Backlog-Malus. Die Baseline-Bewertung für Shell-Traders-Prepare wurde konsistent gedämpft, damit der Planpfad nicht durch reaktive Baseline-Scores wieder zum Überfüllen kippt.

Ein neuer AI-Test reproduziert den Backlog-Fall mit zwei vorbereiteten Shell-Traders-Zielen und einem weiteren Prepare-Ziel im Grip: Die KI wählt `remove_shell_counter` zur Fertigstellung statt erneut `set_aside_from_grip`. Debug/Evidence enthält side-sichere Felder wie `shell_traders_backlog`, `shell_traders_near_install`, `shell_traders_prepare_score`, `shell_traders_remove_score` und `shell_traders_prepare_backlog_penalty`; keine FullState- oder PrivatePayload-Daten werden ausgegeben. Niedriger/leer laufender Backlog bleibt durch den bestehenden Prepare-Test abgedeckt.
