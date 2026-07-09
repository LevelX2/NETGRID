# RunnerRunPlan Remaining ICE Fix Review 2026-07-09

Status: umgesetzt und lokal verifiziert  
Aktiver Agent: card-enablement-ai-knowledge-agent  
Scope: Runner-KI, aktive Run-Fortsetzung, side-sichere Pfadquote

## Befund

Im aktiven Match `match_f4c099f8b5edb26d` startete die Runner-KI in Zug 14 einen Run auf HQ gegen zwei bekannte gerezzte Code Gates (`Keeper` außen, `Quandary` innen). Die Startbewertung erkannte den bekannten Pfad als erreichbar: `known_ice:2`, `break_cost:6`, `can_reach_access:true`.

Nach dem erfolgreichen Brechen und Passieren von `Keeper` stand der Runner an `Quandary` mit 2 Credits. Die Engine bot weiter legale Breaker-Aktionen an. Die RunnerRunPlan-Revalidierung quotierte aber wieder den bereits passierten `Keeper` mit, kam dadurch auf einen unpayable Restpfad und ließ die `End the run`-Subroutine auslösen.

## Ursache

`quoteRunnerRunPath` nutzte für laufende Runs `currentRunRemainingIce(input)`. Wenn die Funktion an der innersten ICE-Position eine leere Restliste lieferte, fiel die Quote auf `server.ice` zurück. Dadurch wurde ein bereits passiertes äußeres ICE erneut als zu zahlender Restpfad behandelt.

Die Engine-LegalActions waren in diesem Fall korrekt. Der Fehler lag in der KI-Pfadquote für aktive Run-Revalidierung.

## Anpassung

Die aktive Run-Pfadquote unterscheidet jetzt explizit:

- `encounter_ice`: quote aktuelles ICE plus noch kommende innere ICE.
- Bewegung/Annäherung vor einem ICE: quote das aktuelle beziehungsweise angenäherte ICE plus innere ICE.
- `server`/`access`: kein ICE-Restpfad.

Ein leerer aktiver Restpfad ist damit ein gültiges Ergebnis und löst keinen Fallback auf den kompletten Server mehr aus.

## Regression

Neue Regressionen decken den Playtest-Fall generisch ab:

- `runner-run-plan-path-quote.test.ts`: bereits passiertes äußeres ICE wird bei innerem ICE nicht erneut quotiert.
- `runner-run-plan-policy.test.ts`: die RunnerRunPlan-Revalidierung wählt am inneren ICE weiter die relevante Break-Sequenz statt `continue_run`/Abort.

## Verifikation

- `corepack pnpm exec vitest run packages/ai/src/runtime/runner-run-plan-path-quote.test.ts packages/ai/src/runtime/runner-run-plan-policy.test.ts --maxWorkers=1 --testTimeout=30000 --reporter=dot`
- `git diff --check`

## Ergebnis

Ein bekannter, bei Run-Start bezahlbarer Pfad bleibt während der Encounter-Sequenz konsistent bezahlbar, solange sich nur bereits bezahlte/passierte ICE aus dem Restpfad entfernen. Die KI darf dadurch nicht mehr in die beobachtete Situation geraten, zuerst äußere ICE zu bezahlen und dann am inneren ICE wegen einer doppelt gezählten Kostenquote auszusteigen.
