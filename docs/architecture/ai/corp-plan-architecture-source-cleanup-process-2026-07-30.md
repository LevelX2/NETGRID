# Corp-Planarchitektur – verhaltensneutraler Source-Cleanup

Stand: 2026-07-30

Status: abgeschlossen

Quelle/Vorgabe: Nutzerauftrag vom 30.07.2026

## Zielprüfung

Die Vorgabe ist für eine direkte sequenzielle Umsetzung ausreichend präzise.
Gesamtziel, Nicht-Ziele, fachliche Owner, betroffene Runtime, Verifikationsgates
und Worktree-/Branch-Regeln sind bestimmt.

## Gesamtziel

Die bereits fachlich korrekte Corp-Planarchitektur wird ausschließlich
strukturell bereinigt. Umfangreiche Defense-, Economy-, Score-/Defense-
Continuity- und Action-Disposition-Provider werden aus
`packages/ai/src/runtime/plan-first-live-runtime.ts` in klar benannte
Planmodule verschoben oder über kleine Adapter gekapselt.

Der Endzustand darf Spielverhalten, Aktionsauswahl, Prioritäten,
Schwellenwerte, Planbindung, Zufallsentscheidungen, Debug-Evidence,
`LegalActions`, Replay oder `StateHash` fachlich nicht verändern.

## Arbeitsbereich

- Hauptcheckout: `C:\Projekte\NETGRID`
- Arbeits-Worktree:
  `C:\Projekte\NETGRID_CORP_PLAN_ARCHITECTURE_CLEANUP`
- Arbeitsbranch: `codex/corp-plan-architecture-cleanup`
- Basis: `main` auf `d31a83feb`
- Der Hauptcheckout wird erst für den finalen lokalen Fast-Forward-Merge
  verwendet.
- Standardports, Hauptinstanz und Hauptdatenbanken werden nicht gestartet,
  gestoppt oder verwendet.

## Verbindliches /Goal

`/Goal Arbeite den verhaltensneutralen Corp-Planarchitektur-Source-Cleanup
vollständig und sequenziell von CP00 bis CP50 ab und merge den abgeschlossenen
Arbeitsbranch lokal nach main. Lies zuerst AGENTS.md, AGENTS.local.md, die
Wiki-Pflichtseiten, packages/ai/AGENTS.md, die führenden AI-Architekturartefakte
und dieses Prozessartefakt. Arbeite ausschließlich im Worktree
C:\Projekte\NETGRID_CORP_PLAN_ARCHITECTURE_CLEANUP auf Branch
codex/corp-plan-architecture-cleanup. Nutze den Hauptworkspace nur für den
finalen Merge. Arbeite immer nur am aktuellen Paket, führe die Paketchecks aus,
dokumentiere sie, prüfe git diff --check und committe jedes abgeschlossene
Paket einzeln. Bei einem Sicherheitsblocker stoppe mit Blocker-Report und
Removal Condition. Nach Abschluss: final verifizieren, aktuelles main
integrieren, lokal nach main mergen, main prüfen, den sauberen Worktree
entfernen und seine Entfernung in Git und Dateisystem verifizieren, den
gemergten Arbeitsbranch löschen und Goal erst dann als complete markieren.`

## Controller-Invarianten

1. Rules Engine und aktuelle `LegalActions` bleiben die einzigen
   Regel-/Aktionsquellen.
2. Der Turn Planner bleibt Dirigent und Informationsgrenzen-Manager. Er erhält
   keine neue fachliche Auswahlheuristik.
3. `corp.defend_servers` bleibt alleiniger Owner für ICE-Installation, ICE-
   Server-Zuordnung, Defense-Wirkung und Rez-Entscheidung.
4. `corp.score_agenda` bleibt alleiniger Owner für Agenda-Installation,
   Advancement und Scoring.
5. `corp.economy` bleibt Owner für Economy-Aktionen und finanziert Defense-
   oder Scorebedarf nur über den bestehenden exakten Parent-/Need-Vertrag.
6. Continuity-/Receipt-Adapter lesen und validieren bestehende residente
   Zustände. Sie erzeugen weder Actions noch Planinstanzen und wählen keinen
   Executor.
7. Action-Dispositionen bleiben Coverage- und Diagnoseevidence des
   zuständigen Plans. Sie sind kein negativer Action-Chooser.
8. Reihenfolgen, Schwellen, Evidence-Codes, Rückgaben, Unknown-/Fallback-
   Bedingungen und Sortierungen werden bytegetreu oder semantisch identisch
   übernommen.
9. Keine neuen Zufallsquellen, keine zusätzlichen RNG-Aufrufe und keine
   Veränderung an RandomCounter/RandomDrawRecords.
10. Keine Tests werden abgeschwächt oder nur auf neue Dateinamen umgeschrieben.

## Bestandsaufnahme und Verschiebungsgrenzen

### Aufrufer

Die vier benannten Provider sind private Top-Level-Funktionen der
Plan-first-Live-Runtime:

| Provider                            | direkter Aufrufer |
| ----------------------------------- | ----------------- |
| `corpActionDispositions`            | `corpContext`     |
| `corpResidentScoreAgendaInstanceId` | `buildCorpDomain` |
| `corpTurnLiquidityDevelopmentNeed`  | `buildCorpDomain` |
| `corpQualitativeIceStagingSignal`   | `buildCorpDomain` |

Es existieren keine externen Produktivimporte dieser Provider. Tests erreichen
sie über den öffentlichen `chooseAiAction`-/Plan-first-Pfad.

### Typ- und Abhängigkeitsbild

- `corpResidentScoreAgendaInstanceId` liest ausschließlich
  `ResidentPlanPortfolio`, `TurnPlanCommitment`, `TurnPlanExecutionLease`,
  residente Score-/Defense-Modulzustände und die aktuelle side-sichere
  `AiDecisionInput`-Sicht. Die Kartentypvalidierung bleibt beim bestehenden
  Rules-/PlayerView-Vertrag.
- `corpTurnLiquidityDevelopmentNeed` erzeugt ausschließlich
  `CorpEconomyLiquidityDevelopmentSignal`. Unmittelbar zugehörig sind die
  exakte Basic-Credit-Projektion, das sichtbare Liquiditätsziel sowie die
  residente P6-Cadence-/Sättigungsprüfung.
- `corpQualitativeIceStagingSignal` erzeugt ausschließlich
  `CorpDefenseSignal`. Unmittelbar zugehörig sind aktuelle vollständige
  Post-Install-Rez-Quote-Prüfung und die globale Defense-
  Installationsbewertung. Geteilte generische Kosten- und Archive-Facts werden
  nicht dupliziert, sondern über einen schmalen read-only Adapter konsumiert.
- `corpActionDispositions` konsumiert planübergreifend bereits erzeugte
  Domain-Signale. Seine bestehende Prüfungsreihenfolge ist ein
  Konfliktauflösungsvertrag. Sie wird als explizit geordnete Folge
  ownerbezogener Contributor-Funktionen erhalten; der globale Collector
  komponiert nur den ersten anwendbaren Beitrag pro Action.

### Bestehende Testevidence

Die Funktionen sind über Plan-first-Runtime-, Corp-Core-/Defense-Plan-,
Turn-Planner-, Authority-/Structure-, Decision-Checkpoint- und Behavior-
Baseline-Tests indirekt abgedeckt. Evidence-Codes wie
`corp_engine_certified_basic_liquidity_development`,
`corp_basic_credit_rejected_visible_liquidity_demand_satisfied`,
`corp_defense_exact_route_requires_parent_funding:*` und die bestehenden
Score-/Defense-Dispositionen sind bereits in Runtime- und Checkpointtests
gebunden.

Es werden zusätzlich reine Modulvertragstests für die neuen Adapter angelegt,
ohne bestehende End-to-End-Erwartungen zu ersetzen.

## Annahmen

- Dateinamen werden nach tatsächlicher geschlossener Verantwortung gewählt;
  bevorzugt:
  - `plans/corp-defense-domain-signals.ts`
  - `plans/corp-economy-domain-signals.ts`
  - `plans/corp-score-defense-continuity.ts`
  - `plans/corp-action-disposition-contributors.ts`
- Ein bestehender Low-Level-Fact darf im Live-Runtime-Modul bleiben, wenn er
  von Runner und Corp oder von mehreren fachlich unabhängigen Corp-Domains
  geteilt wird. Der neue Provider erhält ihn dann als typisierten read-only
  Adapter.
- Source-Structure-Tests dürfen um positive Ownership-Grenzen ergänzt werden.
  Bestehende Verbote und Assertions bleiben erhalten.

## Nicht-Ziele

- keine Änderung an Prioritäten, Scores, Schwellwerten oder Tie-Breaks;
- keine Umbenennung bestehender Evidence-Codes;
- kein neues Plan-, Scheduler-, Turn-Planner- oder Memory-System;
- keine neue Aktionsautorität oder zusätzliche LegalAction-Materialisierung;
- kein Cleanup außerhalb der genannten Corp-Provider und unmittelbar
  notwendiger Import-/Test-/Dokumentationsanpassungen;
- keine Produktversionserhöhung;
- kein Server-/Webclient-Start und kein Browserlauf;
- kein Push und kein Pull Request.

## Sicherheitsblocker

Die Umsetzung stoppt für den betroffenen Teil, wenn:

- eine Verschiebung eine Import- oder Typzyklusauflösung nur durch neue
  fachliche Autorität ermöglichen würde;
- identisches Verhalten nur durch Änderung einer Schwelle, Sortierung,
  Fallbackbedingung oder Evidence erreichbar wäre;
- die Vorher-Baseline rot und nicht deterministisch reproduzierbar ist oder
  der rote Stand nicht eindeutig als bereits vor dem Cleanup vorhanden
  klassifiziert werden kann;
- ein Nachher-Lauf von der Baseline in ActionSequence, harten Gates,
  Replay/StateHash oder Debug-Evidence abweicht;
- aktuelles `main` beim Integrationspunkt einen fachlich widersprüchlichen
  Vertrag eingeführt hat.

Removal Condition ist jeweils eine belegte, side-sichere und
autoritätsneutrale Adaptergrenze oder eine ausdrückliche Architekturentscheidung
des Nutzers.

## Automatische Fehlerbehandlung

- Roten Paketcheck eng auf das aktive Paket zurückführen; kein Fortgang mit
  offenem Done-Gate.
- Bei Formatfehlern nur paketbezogen formatieren.
- Bei Importzyklen zuerst geteilte Typen von Runtimecode trennen; keine
  Barrels oder dynamischen Imports als Umgehung.
- Bei Behavior-Abweichung Sourceänderung gegen die dokumentierte Vorher-
  ActionSequence und Evidence zurückverfolgen. Keine Metrikoptimierung.
- Fremde Änderungen in `main` werden vor dem finalen Merge verstanden und
  defensiv integriert; kein pauschales Revert.

## State Machine

`PREPARED -> BASELINE_RECORDED -> CONTINUITY_EXTRACTED ->
ECONOMY_EXTRACTED -> DEFENSE_EXTRACTED -> DISPOSITIONS_EXTRACTED ->
FINAL_VERIFIED -> MAIN_MERGED -> WORKTREE_REMOVED -> COMPLETE`

Genau ein Paket ist aktiv. Kein Übergang erfolgt ohne das Done-Gate des
aktuellen Pakets.

## Paketfolge

### CP00 – Prozess, Inventar und Vorher-Baseline

Ziel: Verschiebungsgrenzen festschreiben und unverändertes Verhalten vor dem
Refactoring dokumentieren.

Arbeit:

- Prozessartefakt und `/Goal` anlegen;
- Dependency-/Caller-/Testinventar bestätigen;
- Abhängigkeiten im Worktree installieren;
- Standard-AI-Behavior-Baseline mit sechs Slots, zehn Seeds und 480 Aktionen
  ausführen;
- Hard-Gates und Konfiguration im Artefakt dokumentieren.

Checks:

- Worktree/Branch/status;
- Baseline-Runner erfolgreich;
- Baseline-Hard-Gates dokumentiert und ein roter Startstand seriell
  reproduziert;
- `git diff --check`.

Done-Gate: Baseline vollständig dokumentiert, ein vorhandener roter Startstand
deterministisch klassifiziert und referenzierbare kompakte JSON unter
`data/local/`; Prozessartefakt committed.

Commit: `docs(ai): plan corp architecture source cleanup`

### CP10 – Score-/Defense-Continuity-Adapter

Ziel: Score-/Defense-Ausführungskontinuität aus der Live-Runtime in einen
read-only Continuity-/Execution-Receipt-Adapter verschieben.

Arbeit:

- `corpResidentScoreAgendaInstanceId` kapseln;
- Commitment-, Lease-, Parent-/Executor- und StateVersion-Prüfungen
  unverändert übernehmen;
- fokussierte Adaptertests für Immediate Receipt, residenten Defense-Receipt
  und fail-closed Gegenfälle ergänzen.

Checks:

- neue Modultests;
- betroffene Plan-first-Runtime-/Turn-Commitmenttests;
- AI-Typecheck;
- `check:ai`;
- `git diff --check`.

Done-Gate: gleiche Rückgaben und keine neue Autorität.

Commit: `refactor(ai): isolate corp score defense continuity`

### CP20 – Economy-Domain-Signale

Ziel: Liquiditäts- und Economy-Details in einen klaren Economy-Provider
verschieben.

Arbeit:

- `corpTurnLiquidityDevelopmentNeed`,
  `corpExactCurrentBasicLiquidCreditCandidate`,
  `corpVisibleLiquidityDemandTarget` und residente Cadence-/Sättigungshelper
  kapseln;
- alle numerischen Bedingungen, Zielberechnungen und Evidence-Codes
  unverändert übernehmen;
- Providervertrag fokussiert testen.

Checks:

- neue Economy-Provider-Tests;
- Corp-Core-/Scheduler-/Runtime-Checkpointtests;
- AI-Typecheck;
- `check:ai`;
- `git diff --check`.

Done-Gate: identische Economy-Signale und Basic-Credit-Dispositionen.

Commit: `refactor(ai): isolate corp economy domain signals`

### CP30 – Defense-Domain-Signale

Ziel: qualitative ICE-Staging- und globale Installationsdetails einem
Defense-Provider zuordnen.

Arbeit:

- `corpQualitativeIceStagingSignal` und aktuelle vollständige
  Post-Install-Rez-Quote-Prüfung verschieben;
- die globale Defense-Installationsbewertung mit identischer
  Known-/Unknown-/Funding-only-Semantik kapseln;
- geteilte Kosten-/Archive-Facts ausschließlich über typisierte read-only
  Abhängigkeiten anbinden;
- ICE-Install-/Rez-Ownership unverändert bei `corp.defend_servers` halten.

Checks:

- neue Defense-Provider-Tests;
- Corp-Defense-/Core-/Agenda-/Turn-Planner-Tests;
- AI-Typecheck;
- `check:ai`;
- `git diff --check`.

Done-Gate: identische Defense-Signale, Quotes, Schwellen und Dispositionen.

Commit: `refactor(ai): isolate corp defense domain signals`

### CP40 – Ownerbezogene Action-Disposition-Contributors

Ziel: die globale Dispositionsaggregation auf dünne, geordnete Komposition
reduzieren.

Arbeit:

- bestehende Reihenfolge in explizite, ownerbezogene Contributor-Gruppen
  zerlegen;
- jede Begründung beim zuständigen Planprovider oder einem eindeutig
  zugeordneten Contributor halten;
- erster anwendbarer Beitrag pro Action, Dispositionstyp, Owner und
  Evidence-Code exakt beibehalten;
- keine neue negative Auswahl- oder Fallbackautorität einführen.

Checks:

- Contributor-Reihenfolge und Ownervertrag;
- Plan-Scheduler-/Coverage-/Authority-/Runtimetests;
- alle drei AI-Testshards;
- AI-Typecheck;
- `check:ai`;
- `git diff --check`.

Done-Gate: globaler Collector komponiert nur; vollständige bestehende
Coverage bleibt grün.

Commit: `refactor(ai): compose corp action disposition contributors`

### CP50 – Nachher-Baseline, Wissenspflege und Abschluss

Ziel: Verhaltensneutralität und Projektabschluss belegen.

Arbeit:

- Standard-Baseline mit CP00-JSON als Vergleich erneut ausführen;
- Hard-Gates, ActionSequence, Konfiguration, Replay-/StateHash- und
  Evidence-Parität prüfen;
- vollständige AI-Suite, Typecheck und Architekturchecks ausführen;
- Review, Wissensstatus und Monatslog mit wiederverwendbarem Architekturstand
  aktualisieren;
- aktuelles `main` integrieren und alle finalen Checks wiederholen.

Checks:

- Behavior-Vergleich kompatibel und ohne Verhaltensdelta;
- AI vollständig;
- Workspace-Typecheck;
- `check:ai`, `check:package-boundaries`,
  `check:engine-source-structure`;
- Format der geänderten Dateien;
- `git diff --check`;
- sauberer Arbeitsbranch.

Done-Gate: alle Source-/Test-/Architekturgates grün, die vorhandenen roten
Baseline-Fälle ohne neue Abweichung exakt reproduziert, Dokumentation aktuell,
Branch lokal nach `main` gemergt, Main sauber, Worktree und Arbeitsbranch
verifiziert entfernt.

Commit: `docs(ai): verify corp architecture source cleanup`

## Abschlusskriterien

Der Prozess ist erst abgeschlossen, wenn:

1. CP00 bis CP50 jeweils mit eigenem Commit abgeschlossen sind;
2. alle vier Zielverantwortungen aus der Live-Runtime gekapselt sind oder ein
   dokumentierter echter Blocker den kleinsten verbleibenden Adapter erklärt;
3. Vorher-/Nachher-Baseline kompatibel und verhaltensidentisch ist;
4. Tests, Typechecks, Source-Structure, Replay-/StateHash- und Hidden-Info-
   Verträge grün sind;
5. die Wissensbasis den bereinigten Current State führt;
6. der Branch lokal nach `main` integriert ist;
7. Worktree-Pfad und Arbeitsbranch sicher entfernt und doppelt verifiziert
   sind.

## CP00-Ergebnis – Vorher-Baseline

Ausgeführt auf unverändertem Start-Commit `d31a83feb` vor jeder
Sourcecodeänderung:

```text
Slots: 6
Seeds: 10 je Slot
Spiele: 60
MaxActions: 480
Controller: Runner und Corp current_candidate
Worker: 4
Entscheidungen: 12.527
```

Lokale, nicht versionierte Referenzartefakte:

- `data/local/corp-plan-architecture-cleanup-before-2026-07-30.json`
- `data/local/corp-plan-architecture-cleanup-before-2026-07-30.md`
- `data/local/corp-plan-architecture-cleanup-before-2026-07-30-raw.json.gz`

Der aktuelle Startstand ist bereits rot:

| Gate                                               | Wert |
| -------------------------------------------------- | ---: |
| Illegal Actions                                    |    7 |
| Runtime Errors                                     |    7 |
| klassifizierte Runtimefehler                       |    7 |
| `missing_plan_module_coverage` / Owner `scheduler` |    7 |
| Action-Limit-Spiele                                |    1 |
| Replayfehler                                       |    0 |
| Fallbacks                                          |    0 |
| Timeouts                                           |    0 |
| Hidden-Info-Findings                               |    0 |
| `no_legal_action_failure`                          |    0 |
| Redaction-safe                                     |   ja |

Die sieben Runtimefehler betreffen vorhandene Corp-Coverage-Lücken in
`strategy_panel_net_damage_black_ice` und
`strategy_panel_hybrid_score_punish_cheap_bag`. Der Action-Limit-Fall liegt in
`strategy_panel_fast_advance_chrome_rush` /
`ai-behavior-baseline-v1-08`. Diese Funde existieren vor dem Cleanup und
werden wegen des strikten Verhaltensneutralitätsauftrags weder korrigiert noch
umklassifiziert.

Zur Reproduzierbarkeitsprüfung wurde
`strategy_panel_net_damage_black_ice` /
`ai-behavior-baseline-v1-03` seriell mit `--workers 1` erneut ausgeführt. Beide
Läufe enden identisch nach 74 Entscheidungen mit
`finalStateHash=fnv1a:4c75957a` und
`missing_plan_module_coverage` für dieselbe Krumz-Install-Action bei
`stateVersion=74`.

Damit ist der rote Startstand deterministisch und eindeutig unabhängig von
den noch nicht begonnenen Sourceänderungen. Die zulässige Fortsetzung ist
eine reine Paritätsprüfung: CP50 muss Konfiguration, ActionSequences,
StateHashes, TerminationKinds, Runtime-Failure-Evidence, Hard-Gate-Zähler und
Verhaltensmetriken exakt reproduzieren. Jede neue oder verschwundene
Abweichung wäre eine unzulässige Verhaltensänderung.

## Abschlussstand CP10 bis CP40

Die vier Strukturpakete wurden sequenziell und jeweils separat committed:

| Paket | Ergebnis                                                | Commit      |
| ----- | ------------------------------------------------------- | ----------- |
| CP10  | read-only Score-/Defense-Continuity-Adapter             | `14dd566b6` |
| CP20  | Economy- und Liquiditätssignale                         | `9eab51c5d` |
| CP30  | Defense-Domain-Signale und Rez-Quote-Adapter            | `215945c2e` |
| CP40  | geordnete ownerbezogene Action-Disposition-Contributors | `ec8732aa0` |

Neue fachliche Module:

- `packages/ai/src/plans/corp-score-defense-continuity.ts`
- `packages/ai/src/plans/corp-economy-domain-signals.ts`
- `packages/ai/src/plans/corp-defense-domain-signals.ts`
- `packages/ai/src/plans/corp-action-disposition-contributors.ts`

Geteilte Kosten-, Archive-, Karten- und Domain-Fakten bleiben dort, wo sie
bereits von mehreren fachlichen Pfaden benötigt werden. Die neuen Provider
konsumieren sie über typisierte read-only Faktenadapter. Diese Adapter
erzeugen keine Actions, Planinstanzen, Prioritäten oder Executor-Auswahl.

Die historische First-Match-Reihenfolge der Dispositionen liegt unverändert
im einzelnen Action-Contributor. Der globale Collector baut nur den
Defense-Disposition-Index, bestimmt die exakte Basic-Credit-Action und ruft
den Contributor in ursprünglicher Kandidatenreihenfolge auf. Owner,
Dispositionstyp und Evidence-Code bleiben Teil jedes Beitrags.

`plan-first-live-runtime.ts` sank gegenüber der Basis von 18.050 auf 16.275
Zeilen. Die entfernten 1.775 Zeilen sind ausschließlich verschobene
Provider- und Kompositionslogik.

## CP50-Ergebnis – Nachher-Baseline und Vollverifikation

Die Standard-Baseline wurde auf `ec8732aa0` mit dem CP00-JSON als
Vergleich erneut ausgeführt:

```text
Slots: 6
Seeds: 10 je Slot
Spiele: 60
MaxActions: 480
Controller: Runner und Corp current_candidate
Worker: 4
Entscheidungen: 12.527
comparableToBaseline: true
```

Lokale, nicht versionierte Nachher-Artefakte:

- `data/local/corp-plan-architecture-cleanup-after-2026-07-30.json`
- `data/local/corp-plan-architecture-cleanup-after-2026-07-30.md`
- `data/local/corp-plan-architecture-cleanup-after-2026-07-30-raw.json.gz`

Der kanonische kompakte Result-Block ist nach Entfernung ausschließlich der
Laufmetadaten `generatedAt` und `gitHead` exakt identisch. Zusätzlich sind
alle sechs vollständigen Raw-Slots bytewertgleich als JSON-Struktur. Damit
stimmen alle 60 Spielzusammenfassungen und sämtliche 12.527
`actionSequence`-Einträge einschließlich Auswahl, Timingpunkt, Debug-Evidence,
StateHash, Termination, Fehlerklassifikation und Replay-Evidence exakt
überein.

Der vorhandene rote Gate-Stand ist erwartungsgemäß unverändert:

| Gate                                               | Vorher | Nachher |
| -------------------------------------------------- | -----: | ------: |
| Illegal Actions                                    |      7 |       7 |
| Runtime Errors                                     |      7 |       7 |
| `missing_plan_module_coverage` / Owner `scheduler` |      7 |       7 |
| Action-Limit-Spiele                                |      1 |       1 |
| Replayfehler                                       |      0 |       0 |
| Fallbacks                                          |      0 |       0 |
| Timeouts                                           |      0 |       0 |
| Hidden-Info-Findings                               |      0 |       0 |
| `no_legal_action_failure`                          |      0 |       0 |

Diese bekannten Startbefunde wurden nicht behoben, abgeschwächt oder
umklassifiziert, weil dies den verhaltensneutralen Auftrag verletzt hätte.

Abschlussgates:

- AI-Shard 1: 180 Testdateien, 1.738 Tests grün;
- AI-Shard 2: 179 Testdateien, 1.489 Tests grün;
- AI-Shard 3: 179 Testdateien, 1.145 Tests grün;
- Workspace-Typecheck grün;
- `check:ai` grün, `production=752`, `runtimeCycles=0`, `typeCycles=0`;
- `check:package-boundaries` grün, `files=1990`;
- `check:engine-source-structure` grün, `production=1012`,
  `relativeCycles=0`;
- geänderte Dateien formatiert und `git diff --check` grün.
