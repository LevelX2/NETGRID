# Final Review: Trapdoor-/Dumpster-Deflector (2026-07-14)

Status: Implementierung und breite Verifikation grün; lokal in `main`
integriert

## Ergebnis

Der gespeicherte Ablauf aus `match_f450485d3e5be1ab`

`R&D -> Trapdoor -> Remote 1 -> Dumpster -> Archive`

ist auf aktuellem Code fachlich geschlossen:

- Die Chronik nennt bei beiden Deflector-Routinen Karte, Subroutine und neues
  Run-Ziel. Direkte `continue_run`-Redirects wechseln außerdem die
  Run-Gruppierung auf `Remote 1` beziehungsweise `Archive`.
- Die Engine-Run-Quote transportiert für bekannte gerezzte ICE die
  öffentlichen Deflector-Felder Zielprofil, Korp-Kosten und
  Auto-Break-Bedingung durch den side-sicheren AI-DTO.
- Start-Run-Pfadbewertung, Pump-Viability, Break-Priorisierung und
  RunnerRunPlan behandeln einen wirksamen Deflector generisch als
  zugriffsverändernde Subroutine. Das Brechen bewahrt das ursprüngliche
  Zugriffsziel; fehlendes Ziel oder nicht bezahlbare Korp-Kosten machen die
  Routine dagegen nicht künstlich breakpflichtig.
- Nach der vollzogenen Dumpster-Umleitung rebasiert die bereits vorhandene
  Run-Plan-Revalidation korrekt auf Archive und setzt den freien Run fort.

Produktiver Code enthält keine Prüfungen auf Trapdoor, Dumpster, Match-ID,
Seed oder Deck. Rules Engine, LegalActions, Replay, StateHash und Randomness
bleiben Regelautorität beziehungsweise unverändert.

## Korrigierte Ressourcenklassifikation

Die erste Analyse bewertete den zweiten R&D-Run bei 7 Credits als
unbezahlbar. Das war unvollständig: Cortical Cybermodem stellt 2 sichtbare
Run-Bits für Icebreaker bereit; zusätzlich kann der ungenutzte Lockjaw Krash
im Encounter kostenlos +2 Stärke geben.

Deshalb ist `runner.start_run.rd` bei SV96 korrekt. Der Fehler lag darin, dass
die KI anschließend die bezahlbare Trapdoor-Break-Sequenz nicht begann. Beide
historischen Encounter-Checkpoints SV92 und SV97 wählen nach dem Fix
`pump_breaker` mit Krash. Eine synthetische Gegenprobe mit nur 1 Credit plus 2
Run-Bits stellt sicher, dass die KI denselben sichtbaren R&D-Pfad vermeidet,
wenn alle sichtbaren Ressourcen tatsächlich nicht reichen.

## Technischer Vertrag

- `VisibleEffectiveSubroutine` enthält optional `deflectorTarget`,
  `deflectorCost` und `deflectorAutoBreakIfNoTarget`.
- `visibleDeflectorSubroutineCanResolve` entscheidet ausschließlich aus
  sichtbaren Run-Quote-Feldern, öffentlicher Remote-Anzahl und sichtbaren
  Korp-Credits, ob ein Redirect wirksam werden kann.
- `assessKnownRezzedIcePath` preist wirksame Redirects gemeinsam mit anderen
  zugriffshindernden Subroutinen als Break-Kosten ein.
- RunnerRunPlan und Encounter-Scoring verlangen für einen wirksamen Redirect
  einen access-erhaltenden Break-Schritt, auch wenn
  `encounterWillEndRun === false` ist.
- Trapdoors Auto-Break ohne Remote bleibt kostenlos; `any_data_fort` bleibt
  auch ohne Remote wirksam, weil zentrale Data Forts Ziele bleiben.

## Chronikvertrag

Neue PublicEvents mit der generischen `classicDeflector`-Payload werden so
erzählt:

- `Trapdoor: Subroutine 1 leitet den Run auf Remote 1 um.`
- `Dumpster: Subroutine 1 leitet den Run auf Archive um.`

Die Beschreibungen unterscheiden, ob der Runner dort dem äußersten gerezzten
ICE begegnet oder bereits als am letzten ICE vorbeigekommen gilt. Historische
Runtime-Events, denen diese Public-Payload-Felder fehlen, werden in der
Version-0-Umgebung nicht nachträglich migriert.

## Verifikation

- Exakte Trapdoor-/Dumpster-Decision-Checkpoints: 5/5 grün.
- Deflector-Quote, sichtbare Run-Analyse und RunnerRunPlan-Fokus: 59/59 grün.
- Chronik, Redirect-Revalidation und exakte Checkpoints kombiniert: 184/184
  grün.
- Vollständige AI-Suite: 322 Testdateien, 2132/2132 Tests grün.
- Vollständige Web-Suite: 42 Testdateien, 572/572 Tests grün.
- Fokussierte Engine-PublicContext-/Deflector-Auflösung: 17/17 grün.
- Typechecks für `@netgrid/shared`, `@netgrid/engine`, `@netgrid/ai` und
  `@netgrid/web`: grün.
- `git diff --check`: grün.

Nicht ausgeführt wurden eine vollständige Engine-Suite, Selfplay-Langläufe
oder die AI-Behavior-Baseline. Für die eng reproduzierten Entscheidungs-,
Schema- und Chronikänderungen liefern die vollständigen AI-/Web-Suiten plus
fokussierte Engine-Tests den angemessenen Regressionsschutz.

Nach Einzug des neuesten lokalen `main` mit dem unabhängigen
Deflector-Kostenfix wurden 255 kombinierte Zieltests sowie AI- und
Engine-Typecheck erneut grün ausgeführt. Der Arbeitsbranch wurde anschließend
per Fast-Forward lokal nach `main` integriert; es erfolgte kein Push.

## Führende Artefakte

- `docs/architecture/ai/trapdoor-dumpster-deflector-remediation-process-2026-07-14.md`
- `docs/reviews/ai/trapdoor-dumpster-deflector-red-evidence-2026-07-14.md`
- `docs/reviews/ai/trapdoor-dumpster-deflector-final-review-2026-07-14.md`
- `data/scenarios/ai-decision-checkpoints/cp-trapdoor-dumpster-deflector-01-pump.json`
- `data/scenarios/ai-decision-checkpoints/cp-trapdoor-dumpster-deflector-02-no-run.json`
- `data/scenarios/ai-decision-checkpoints/cp-trapdoor-dumpster-deflector-03-unaffordable-control.json`
- `data/scenarios/ai-decision-checkpoints/cp-trapdoor-dumpster-deflector-04-archives-continue.json`
