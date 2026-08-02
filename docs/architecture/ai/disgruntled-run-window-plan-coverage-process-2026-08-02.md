# Disgruntled-Runfenster: Planmodulabdeckung – sequenzieller Paketprozess

Status: **aktiv – P1 abgeschlossen**
Datum: 2026-08-02
Primärer Agent: `card-enablement-ai-knowledge-agent`
Worktree: `C:\Projekte\NETGRID_AI_DISGRUNTLED_RUN_WINDOW_COVERAGE`
Branch: `codex/ai-disgruntled-run-window-coverage`

## Quelle und Vorgabe

Das Zehn-Seed-Panel des Counterbank-Fortschrittsschutzes reproduzierte in den
Rent-I-Con-Seeds 02 und 04 denselben unabhängigen Runner-Fehler:
`missing_plan_module_coverage` für eine `trigger_ability` von Disgruntled Ice
Technician im Timingpunkt `run.jack_out_window`. Der Nutzer hat die direkte
Behebung über den Paketprozess mit eigenem Worktree und verbindlichem `/Goal`
freigegeben.

Führende Ausgangsevidence:

- `docs/reviews/ai/counterbank-progress-protection-red-evidence-2026-08-02.md`;
- `docs/reviews/ai/counterbank-progress-protection-ten-seed-final-review-2026-08-02.md`;
- die Engine-LegalAction für
  `derez_fully_broken_passed_ice_and_end_run`;
- der bestehende Planowner `runner.convert_run_window`.

## Zielprüfung

Die Vorgabe ist für die direkte sequenzielle Umsetzung ausreichend präzise.
Der Endzustand ist ein fail-closed plan-first-konformer Vertrag: Die reale,
aktuelle Disgruntled-LegalAction wird innerhalb des begonnenen Runs genau vom
vorhandenen Owner `runner.convert_run_window` als Route oder konkrete
Nichtproduktivitätsdisposition klassifiziert. Bei positivem Nutzen darf der
Plan die exakt gebundene Action ausführen; ein erkennbar höherwertiger
Runzugriff darf weiterhin zum Verzicht führen.

## Gesamtziel

Die reale Disgruntled-Ice-Technician-Triggeraktion erhält im
`run.jack_out_window` vollständige semantische Quellen-, Fähigkeits-, Ziel-
und Planabdeckung. Die Engine bleibt Regelautorität, die Action-ID und ihr
Ziel werden nicht neu erzeugt oder umgebogen, und
`runner.convert_run_window` bleibt einziger fachlicher Owner. Die beiden
reproduzierenden Seeds sowie fokussierte Real-Engine- und Ownership-Tests
enden ohne Runtime Failure oder IllegalAction.

## Annahmen

- Disgruntled Ice Technician ist während der laufenden Event-Run-Fortsetzung
  möglicherweise nicht mehr als sichtbare Karte in Hand oder Rig vorhanden;
  die Engine kennt Quelle und Definition dennoch autoritativ.
- Der vorhandene synthetische Runtime-Test belegt den gewünschten Owner, kann
  aber eine reale LegalAction-Bindungslücke verdecken.
- Der aktuelle Fehler ist voraussichtlich eine Fact-/Semantikbindung vor der
  Planmaterialisierung, keine neue strategische Entscheidung.
- Wird P1 durch andere Evidence widerlegt, wird die Ursache neu klassifiziert,
  der Ownervertrag jedoch nicht durch einen Fallback ersetzt.

## Nicht-Ziele

- keine Änderung von Kartentext, Timing, Kosten, Ziellegalität oder Wirkung;
- kein neues Karten-ID-Sondermodul und kein globaler Actionbonus;
- kein Choice-Resolver für Server-, ICE-, Run- oder Strategieentscheidungen;
- kein First-LegalAction-, Credit-, Draw-, Jack-out- oder EndTurn-Fallback;
- keine Änderung fremder Runner-, Corp- oder Counterbank-Verträge;
- kein Push und kein Pull Request.

## Controller-Invarianten

1. Genau ein Paket ist aktiv; kein Paket wird übersprungen.
2. `runner.convert_run_window` bleibt Root-/Leaf-Owner der optionalen
   Runfortsetzung.
3. Die produktive Route bindet dieselbe aktuelle `actionId`, StateVersion,
   Quelleninstanz und dasselbe Ziel-ICE wie die Engine-LegalAction.
4. Action-Semantik und Planassessment verwenden nur side-sichere
   `PlayerView`, `LegalActions`, erlaubte Events und Engine-Metadaten.
5. Eine unvollständige Quellen- oder Fähigkeitsbindung bleibt fail-closed;
   sie wird nicht über Kartenname, Label oder Deckwissen erraten.
6. Eine produktive Action und ihre Nichtproduktivitätsdisposition dürfen
   nicht gleichzeitig bestehen.
7. Nach jedem Paket laufen paketnahe Checks, `git diff --check`, gezieltes
   Staging und ein eigener Commit.

## Automatische Fehlerbehandlung

- Ein roter Test wird nur dann als Red Evidence akzeptiert, wenn er exakt die
  bekannte Bindungs-/Coverage-Lücke reproduziert.
- Neue Befunde werden als enger Paketfehler, unabhängiger Follow-up oder
  Sicherheitsblocker klassifiziert; sie erweitern den Scope nicht still.
- Timeouts, abgebrochene Tests und ungeklärte Unhandled Rejections gelten als
  rot.
- Läuft `main` weiter, wird es vor dem Abschluss defensiv in den Arbeitsbranch
  integriert und danach werden die relevanten Checks wiederholt.

## Sicherheitsblocker

Der Prozess stoppt bei IllegalAction außerhalb des bekannten Failure-Wrappers,
Hidden-Info-Leak, Replay-/StateHash-Abweichung, Nondeterminismus,
Future-/Stale-Action-ID, verändertem Ziel-ICE, zweiter Entscheidungsautorität
oder nicht erklärbarer Ownership. Ein Blockerreport nennt die genaue Removal
Condition.

## State Machine

```text
P0 Prozessvertrag
  -> P1 spielgleiche Red Evidence und Binding-Differenz
  -> P2 plan-first-konformer Fix in der belegten Schicht
  -> P3 Ownership-, Real-Engine- und Gegenfallregressionen
  -> P4 breite Verifikation und reproduzierende Seeds
  -> P5 Review, Wissenspflege, Main-Integration und Cleanup
  -> abgeschlossen
```

## Paketfolge

| Paket | Titel | Done-Gate | Commit |
| --- | --- | --- | --- |
| P0 | Prozessvertrag | Scope, Invarianten, Pakete und `/Goal` versioniert | `docs(ai): define disgruntled run-window coverage process` |
| P1 | Red Evidence | Rent 02/04 oder ein daraus erfasster Realzustand reproduziert den Fehler; synthetische/echte Binding-Differenz erklärt | `test(ai): capture disgruntled run-window coverage regression` |
| P2 | Quellen- und Planbindung | reale LegalAction wird generisch und side-sicher vom vorhandenen Runfenster-Owner klassifiziert | `fix(ai): bind post-pass run abilities to run-window plan` |
| P3 | Regressionen | Positivfall, bewusster Verzicht, unvollständige Bindung und Ownership sind grün | `test(ai): verify disgruntled run-window ownership` |
| P4 | Breite Verifikation | fokussierte Tests, AI-Typecheck, aktive AI-Gates, drei AI-Shards und Rent 02/04 grün | `test(ai): verify disgruntled run-window coverage fix` |
| P5 | Abschluss | Review und Wissensstand aktuell, `main` integriert, Worktree und Branch entfernt | `docs(ai): close disgruntled run-window coverage process` |

Aktueller Paketstand: P0 und P1 sind abgeschlossen. Die beiden Originalseeds
reproduzieren den Fehler deterministisch; der spielgleiche Checkpoint belegt
als fehlende Stufe die Quellenkartendefinition der Engine-LegalAction. P2 ist
als nächstes Paket freigegeben.

## Paketdetails

### P0 – Prozessvertrag

Ziel: Den Arbeits-, Architektur-, Sicherheits-, Test- und Abschlussvertrag vor
der Verhaltensänderung festschreiben.

Kernartefakt: dieses Dokument.

Checks: `git diff --check`, Worktree-/Branchstatus.

Done-Gate: Prozess und `/Goal` sind vollständig; kein Runtimecode geändert.

### P1 – Spielgleiche Red Evidence und Binding-Differenz

Ziel: Den aktuellen Fehler mit realen Engine-LegalActions reproduzieren und
gegen den bereits grünen synthetischen Runtime-Test abgrenzen.

Arbeit:

- Rent-I-Con-Seeds 02 und 04 unter unveränderter Deck-, Schwierigkeits- und
  Seedkonfiguration erneut ausführen;
- den fehlschlagenden State als lokalen Audit und, wenn stabil erfassbar, als
  versionierten Decision Checkpoint sichern;
- Action, Timing, Quelle, Payload, SemanticCandidate, Planassessment und
  Coverage-Disposition vergleichen;
- einen fokussierten Test ergänzen, der vor P2 aus dem belegten fachlichen
  Grund rot ist.

Done-Gate: Failure Code, Owner, aktuelle Action-ID und fehlende Bindungsstufe
sind exakt belegt; keine Produktivlogik geändert.

### P2 – Plan-first-konformer Fix

Ziel: Die fehlende aktuelle Quellen-/Fähigkeitsinformation in der fachlich
richtigen Schicht vollständig und side-sicher bereitstellen beziehungsweise
die bestehende Runfensterroute generisch darauf binden.

Arbeit:

- bestehende Engine-/Action-Semantikverträge erweitern, falls die reale
  LegalAction eine bereits autoritativ bekannte Quelleninformation nicht
  transportiert;
- ausschließlich funktionsbasierte Semantik für die optionale
  Post-Pass-Derez-und-End-Run-Fortsetzung verwenden;
- `runner.convert_run_window` mit exakt demselben Step, Executor und
  `PlanExecutionOrigin` rematerialisieren;
- unvollständige oder mehrdeutige Bindung weiterhin fail-closed halten.

Done-Gate: Der rote Test ist grün, ohne Karten-ID-Chooser, neuen Plan,
Resolver-Shortcut oder veränderte Engine-Regel.

### P3 – Ownership-, Real-Engine- und Gegenfallregressionen

Ziel: Ergebnis und Architekturgrenzen gemeinsam sichern.

Pflichtfälle:

- echte Engine-LegalAction aus einem vollständig gebrochenen und passierten
  ICE wird vom Runfensterplan gebunden;
- gewählte Action behält Action-ID, Quelle, Ziel, StateVersion, Executor,
  Step und Route;
- bekannter Agenda-/Score-Payoff lässt den Runplan sinnvoll fortsetzen und
  dispositioniert den Derez-End-Run-Trigger exakt;
- fehlende oder mehrdeutige Quellen-/Fähigkeitsbindung bleibt fail-closed;
- kein Hidden-Info-Leak in PlayerView, öffentlichem Event oder Diagnose.

Done-Gate: fokussierte Engine-, Action-Semantik-, Planmodul- und
Live-Runtime-Tests sind grün.

### P4 – Breite Verifikation und reproduzierende Seeds

Checks:

```text
corepack pnpm --filter @netgrid/ai typecheck
corepack pnpm check:ai
corepack pnpm check:ai-deck-doctrine-strategy
corepack pnpm test:ai:shards
git diff --check
```

Zusätzlich werden Rent-I-Con 02 und 04 mit der ursprünglichen Neon-Escrow-
Konfiguration erneut ausgeführt. Beide müssen ohne den bekannten
`missing_plan_module_coverage`-Fehler enden; Replay, Redaction und
IllegalAction-Metriken bleiben grün.

Done-Gate: alle berührten Gates grün; Abweichungen sind klassifiziert und
begründet.

### P5 – Review, Wissenspflege, Integration und Cleanup

Ziel: Den neuen Current-State-Vertrag dauerhaft und knapp zurückführen.

Arbeit:

- Final Review mit Ursache, Owner, Fix, Tests, Seeds und Restpunkten;
- AI-Architekturindex, Projektstatus und Monatslog nur bei dauerhaftem
  Erkenntniswert aktualisieren;
- aktuelles `main` in den Arbeitsbranch integrieren und relevante Checks
  wiederholen;
- Arbeitsbranch lokal bevorzugt per Fast-Forward nach `main` mergen;
- Main-Status und Diffcheck prüfen;
- den exakten sauberen Worktree entfernen, Entfernung in Git und Dateisystem
  verifizieren und den vollständig gemergten Branch mit `git branch -d`
  löschen.

Done-Gate: alle Paketcommits liegen auf `main`; Worktree und Branch sind
nachweislich entfernt.

## Verifikationsregeln

- Fokussierte AI-Testläufe erhalten mindestens 180 Sekunden äußeres
  Zeitfenster, vollständige AI-Shards mindestens 600 Sekunden.
- Tests prüfen neben dem Ergebnis Planmodul, Executor, Step, Route,
  `actionId`, StateVersion und Quellen-/Zielbindung.
- Lokale privilegierte Selfplay-Audits liegen unter `data/local/` und werden
  nicht versioniert.
- Große Rohläufe werden nicht als Projektdokumentation committed; das Review
  hält nur reproduzierbare Konfiguration, relevante Metriken und Urteil fest.

## Worktree-, Git- und Integrationsregeln

- Umsetzung ausschließlich im Worktree
  `C:\Projekte\NETGRID_AI_DISGRUNTLED_RUN_WINDOW_COVERAGE` auf Branch
  `codex/ai-disgruntled-run-window-coverage`;
- Hauptworkspace ausschließlich für den finalen lokalen Merge;
- fremde Worktrees, Standardports 3100/8787 und Hauptdatenbank bleiben
  unangetastet;
- jedes abgeschlossene Paket erhält einen eigenen Commit;
- kein `git reset --hard`, kein pauschales Revert, kein erzwungener Cleanup;
- kein Push und kein Pull Request.

## Verbindliches `/Goal`

```text
/Goal Arbeite Disgruntled-Runfenster-Planmodulabdeckung vollständig und
sequenziell von P0 bis P5 ab und merge den abgeschlossenen Arbeitsbranch lokal
nach main.

Lies zuerst AGENTS.md, AGENTS.local.md, packages/ai/AGENTS.md, die Pflichtseiten
der Wissensbasis, den vollständigen KI-Änderungskompass, AI-README, die
einschlägigen Abschnitte des Planebenen-Zielbilds, den vollständigen
Plan-first-Cutover-Vertrag und dieses Prozessartefakt.

Arbeite ausschließlich im Worktree
C:\Projekte\NETGRID_AI_DISGRUNTLED_RUN_WINDOW_COVERAGE auf Branch
codex/ai-disgruntled-run-window-coverage. Nutze den Hauptworkspace nur für den
finalen Merge. Stelle keine Zwischenfragen, solange der Prozess konservative
automatische Fortsetzung erlaubt.

Arbeite immer nur am aktuellen Paket. Überspringe kein Paket. Führe die
Paketchecks aus, dokumentiere das Ergebnis und committe jedes bestandene Paket.
Erhalte `runner.convert_run_window` als einzigen fachlichen Owner; Choice-
Resolver und Fallbacks dürfen keine Run-, ICE-, Quellen-, Ziel- oder
Strategieentscheidung übernehmen.

Bei IllegalAction, Hidden-Info-Leak, Replay-/StateHash-Abweichung,
Nondeterminismus, Future-/Stale-Action-ID, verändertem Ziel, doppelter
Ownership oder ungeklärtem fachlichem Owner stoppe im aktuellen Paket und
dokumentiere die Removal Condition.

Nach P5: aktuelles main integrieren, finale Checks wiederholen, lokal nach main
mergen, main prüfen, den sauberen Arbeits-Worktree entfernen, seine Entfernung
in Git und Dateisystem verifizieren, den gemergten Arbeitsbranch löschen und
das Goal erst dann als complete markieren.
```

## Abschlusskriterien

- P0 bis P5 jeweils mit bestandenem Done-Gate committed;
- reale Disgruntled-LegalAction vollständig semantisch und planseitig gebunden;
- `runner.convert_run_window` bleibt alleiniger Owner;
- Positiv-, Verzichts-, Unvollständigkeits- und Real-Engine-Fälle grün;
- Rent 02/04 ohne bekannten Coverage-Runtimefehler;
- AI-Typecheck, aktive AI-Gates und drei AI-Shards grün;
- Final Review und Wissensstand aktuell;
- lokal nach `main` integriert;
- Worktree und Arbeitsbranch nachweislich entfernt;
- `/Goal` als complete markiert.
