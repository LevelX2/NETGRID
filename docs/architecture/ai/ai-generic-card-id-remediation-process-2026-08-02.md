# Generische KI-Karten-ID-Bereinigung – sequenzieller Umsetzungsprozess

Status: **in Arbeit**

Quelle: Architekturprüfung der produktiven KI vom 02.08.2026 und
anschließender Nutzerauftrag zur sorgfältigen Umsetzung der notwendigen
Änderungen.

Primärer Agent: `release-implementation-agent`

Arbeitsbranch: `codex/ai-generic-card-id-migration`

Worktree: `C:\Projekte\NETGRID_AI_GENERIC_CARD_ID_MIGRATION`

## Gesamtziel

Direkte Karten-IDs entscheiden in der produktiven KI nicht mehr darüber,
welche wiederverwendbare Fähigkeit eine aktuelle `LegalAction` besitzt oder
welcher Plan sie ausführen darf. Bestehende Action-Semantik,
`functionalEffects`, strukturierte Hints, Engine-Payloads und Engine-Quotes
tragen diese Information bis zum zuständigen Planowner.

Exakte Definition- oder Instanz-IDs bleiben nur dort erhalten, wo sie selbst
Teil des fachlichen Vertrags sind: konkreter Lookup, Source-/Instanzbindung,
Lifecycle, Engine-Dispatch oder ein begründetes individuelles Planmodell.

## Architekturgrenzen

1. Die Engine bleibt einzige Autorität für Legalität, aktuelle Kosten,
   Mengen, Ziele und zustandsabhängige Wirkung.
2. Hints klassifizieren Fähigkeiten; sie erzeugen weder LegalActions noch
   aktuelle Regelwirkung.
3. Nur der bestehende Planowner wählt eine Route. Es entsteht kein neuer
   Chooser, Override, Resolverplan oder allgemeiner Kartenklassifizierer.
4. Ein produktiver Funktionseffekt muss an die konkrete Action/Ability
   gebunden sein. Reiner Kartenkontext reicht nicht.
5. Planinstanz, Step, Route, Executor, `PlanExecutionOrigin`, `actionId` und
   `stateVersion` bleiben bei jeder Migration erhalten.
6. Fehlende oder mehrdeutige Bindung scheitert fail-closed.
7. Choice-Resolver erhalten keine neue Karten-, Ziel-, Server-, Ressourcen-
   oder Strategieentscheidung.

## Ausgangsinventar und Einordnung

Das produktive Karten-ID-Gate erfasst zu Beginn 32 Literalvorkommen in 304
erreichbaren KI-Quelldateien. Die geprüften Familien sind:

| Familie                               | Ausgangslage                                            | Zielowner und Zielvertrag                                                                                     |
| ------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Armageddon                            | Definition-ID erkennt R&D-Access-Ersatz                 | Run-/Access-Semantik; actiongebundener Access-Replacement-Effekt                                              |
| Lockjaw                               | zwei Definition-ID-Guards öffnen Runfenster             | auslösender Runplan; actiongebundener Strength-/Run-Remainder-Effekt                                          |
| Faked Hit                             | Definition-ID ergänzt Eigenschaden und Bad Publicity    | Runner-Self-Damage beziehungsweise Bad-Publicity-Relevanz; exakte Action-/Engine-Wirkung                      |
| Library Search                        | Definition-ID erzwingt aktive Zentraldruckroute         | zuständiger Run-/Pressure-Plan; funktionaler Future-Run-Effekt plus konkrete RunTargetEvaluation              |
| Prearranged Drop / Promises, Promises | Definition-ID-Fallback für Same-Turn-Access             | Runner-Handentwicklung; actiongebundene Access-Prerequisite                                                   |
| All Nighter                           | Definition-ID erkennt initiale Mehrfachrunroute         | auslösender Runplan; funktionaler Follow-up-Run-Effekt                                                        |
| Junkyard BBS                          | Definition-ID erkennt Recovery-Ability                  | Runner-Recovery; Engine-Ability-/Funktionseffekt                                                              |
| BBS Whispering Campaign               | Definition-ID erkennt installierte Economy              | `corp.economy`; actiongebundene endliche Economy-Semantik                                                     |
| vier Corp-Punish-Adapter              | feste Definition-ID-Liste entdeckt Quotequellen         | `corp.punish`; strukturierte Tag-, Damage- und Credit-Denial-Fähigkeiten, Engine-Quote bleibt autoritativ     |
| Loan from Chiba                       | Definition-ID erkennt und bindet Lifecycle              | `runner.resource_lifecycle`; generische High-Risk-Loan-Semantik, danach exakte Sourceinstanz und Engine-Quote |
| Shell Traders                         | individuelles Modell plus Definition-ID-Boundary-Guards | individuelles `runner.shell_traders_pipeline` bleibt; TurnPlanner reagiert nur auf typisierte Replan-Boundary |
| Social Engineering                    | individuelles Hidden-Bid-/Bypass-Modell                 | bleibt begründetes individuelles Modell mit exakter Sourcebindung                                             |
| neun Future-Run-ICE-Diagnosewerte     | Definition-ID-Tabelle im Diagnosepfad                   | generische ICE-Facts beziehungsweise ausschließlich Simulation/Diagnostik                                     |

## Paketfolge

| Paket     | Schwerpunkt                                                           | Fachlicher Owner                              |
| --------- | --------------------------------------------------------------------- | --------------------------------------------- |
| GP00      | Prozess, Ausgangsinventar und Karten-ID-Strukturgate                  | Prozess / Architekturgate                     |
| GP01      | Armageddon und Lockjaw                                                | Runner Run-/Access-Pläne                      |
| GP02      | Faked Hit                                                             | Self-Damage und Bad-Publicity-Relevanz        |
| GP03      | Library Search, Prearranged Drop, Promises, All Nighter, Junkyard BBS | Runner-Handentwicklung, Runfolge und Recovery |
| GP04      | Whispering Campaign und Corp-Punish-Adapter                           | `corp.economy` und `corp.punish`              |
| GP05      | Loan from Chiba und Shell-Traders-Boundaries                          | Resource-Lifecycle und TurnPlanner-Boundary   |
| GP06      | Diagnosebereinigung, Ausnahmeklassifikation und Wissenspflege         | Diagnostik / Architekturreview                |
| Abschluss | Main-Abgleich, vollständige Gates, Integration und Cleanup            | Prozess                                       |

## Umsetzungsstand

| Paket     | Status        | Commit             |
| --------- | ------------- | ------------------ |
| GP00      | abgeschlossen | `959ec9210`        |
| GP01      | abgeschlossen | `fcc94df13`        |
| GP02      | abgeschlossen | `7e9dffec1`        |
| GP03      | abgeschlossen | `ddc83e9f7`        |
| GP04      | abgeschlossen | `c0bfdaf2a`        |
| GP05      | abgeschlossen | `8de9211fc`        |
| GP06      | abgeschlossen | dieser Paketcommit |
| Abschluss | offen         | –                  |

## Paketregeln

- Genau ein Paket ist aktiv; kein Paket wird übersprungen.
- Vor dem ersten Patch eines Pakets werden bestehende Producer, Consumer,
  LegalAction-Felder, Hints und Tests vollständig nachvollzogen.
- Neue Typen entstehen nur im bestehenden fachlichen Owner oder in der
  bereits vorhandenen gemeinsamen Action-Semantik, wenn mehrere Owner denselben
  side-sicheren Vertrag benötigen.
- Jeder Positivtest besitzt einen Gegenfall ohne passende Fähigkeit oder ohne
  eindeutige Actionbindung.
- Tests sichern neben dem Ergebnis Plan/Step/Route/Executor und unveränderte
  Actionbindung, soweit die betroffene Ebene diese Informationen trägt.
- Nach jedem Paket laufen paketnahe Tests, AI-Typecheck,
  `corepack pnpm check:ai-generic-card-id-guards` und `git diff --check`.
- Jedes bestandene Paket wird separat committed.

## Pakete und Done-Gates

### GP00 – Prozess und ausführbares Strukturgate

- dieses Prozessartefakt anlegen;
- das bereits geprüfte, produktionsgraphbasierte Karten-ID-Gate übernehmen;
- Tests, Simulation, Evaluation, Reports und Diagnosecode aus seinem
  Entscheidungsumfang ausschließen;
- jede verbleibende Literalverwendung zentral mit Kategorie, Begründung und
  erwarteter Vorkommenszahl erfassen;
- Gate in `check:ai` und AI-README einbinden.

Done: Selftest und Gate grün, Ausgangszahl reproduzierbar, keine
Verhaltensänderung.

### GP01 – Run-/Access-Semantik

- Armageddon über actiongebundenen Access-Replacement-Vertrag erkennen;
- Lockjaw über actiongebundenen Strength-/Run-Remainder-Effekt zulassen;
- zuständigen Runplan und konkrete Actionbindung unverändert lassen.

Done: Positiv- und Mismatch-Gegenfälle grün; keine Definition-ID im
betroffenen produktiven Entscheidungsweg.

### GP02 – Faked-Hit-Wirkungen

- Eigenschaden aus exaktem `selfDamage`-/Action-Vertrag ableiten;
- Bad Publicity aus strukturierter aktueller Actionwirkung ableiten;
- keine gedruckte oder aus der ID geschätzte Menge verwenden.

Done: beide Wirkungen actiongebunden, falsche/unvollständige Payload
fail-closed, Plan- und Actionwahl unverändert.

### GP03 – Runner-Hand-, Runfolge- und Recovery-Fähigkeiten

- Library Search, Prearranged Drop, Promises, All Nighter und Junkyard BBS auf
  vorhandene funktionale Actionsemantik umstellen;
- konkrete Runziele und Recovery-Ziele weiterhin im zuständigen Plan bewerten.

Done: jede Familie besitzt Positiv- und Gegenfallnachweis ohne
Definition-ID-Erkennung.

Ergebnis: Library Search sowie die Same-Turn-Access-Vorbereitung werden aus
aktionsgebundenen `functionalEffects` erkannt. Die Engine projiziert den
optionalen Folge-Run und die exakt gebundene Top-Trash-Rückholung in die
jeweilige `LegalAction`; die vorhandenen Run- und Recovery-Owner konsumieren
nur diese Fakten. Das Strukturgate sank dadurch von 28 auf 23 produktive
ID-Vorkommen.

### GP04 – Corp-Economy und Punish

- Whispering Campaign als actiongebundene endliche Economy behandeln;
- Quotequellen für Tag, Damage und Credit Denial aus strukturierten
  Fähigkeiten entdecken;
- der vollständige Engine-Quote bestimmt Wirkung, Reihenfolge und Kosten.

Done: keine feste Kartenliste zur Capability-Entdeckung; Corp-Economy und
Corp-Punish bleiben getrennte Owner.

Ergebnis: Installierte Economy wird nur bei einer aktuellen positiven
Auszahlung und einem sichtbaren positiven Stored-Credit-Pool bewertet. Die
Punish-Quotequellen entstehen ausschließlich aus überprüften strukturierten
Tag-, Trace-, Damage-, Credit-Denial- und Hardware-Trash-Hints. Bei
reihenfolgeabhängigen Damage-Sequenzen fragt der begrenzte Adapter beide
Reihenfolgen an, statt eine Wirkung aus Hint-Mengen zu schätzen; der
Punish-Plan entscheidet anhand der Engine-Quotes. Das Strukturgate sank von 23
auf 18 produktive ID-Vorkommen.

### GP05 – Lifecycle und Replan-Boundary

- Loan-Lifecycle generisch entdecken und anschließend an exakte Sourceinstanz
  und Engine-Quote binden;
- Shell-Traders-Pipeline als individuelles Modell erhalten;
- gemeinsame TurnPlanner-Schichten nur auf typisierte Replan-Boundary reagieren
  lassen.

Done: keine querliegende Karten-ID-Entscheidung; Lifecycle-/Planidentität und
`PlanExecutionOrigin` bleiben stabil.

Ergebnis: Der Resource-Lifecycle wird über die exakt gebundene, aktuelle
`LegalAction` mit `cardImplementationLifecycleAction` entdeckt. Definition und
Sourceinstanz werden erst danach als Lifecycle-Identität übernommen; Betrag
und Zahlungsstatus stammen weiterhin ausschließlich aus der Engine-Payload.
Ein unvollständig gebundener kartenspezifischer `EndTurn` wird fail-closed
verworfen. Die beiden allgemeinen TurnPlanner-Pfade reagieren über denselben
typisierten Delayed-Install-Replanning-Vertrag statt über die Shell-Traders-ID;
das individuelle `runner.shell_traders_pipeline` bleibt unverändert Owner.
Das Strukturgate sank dadurch von 18 auf 12 produktive ID-Vorkommen.

### GP06 – Diagnostik, Ausnahmen und Wissenspflege

- Future-Run-ICE-Diagnoseklassifikation aus generischen Facts ableiten oder in
  den reinen Simulations-/Diagnosebereich verschieben;
- Karten-ID-Gate auf die tatsächlich verbleibenden legitimen Ausnahmen
  reduzieren;
- Social Engineering und verbleibende individuelle Modelle begründen;
- AI-README, Wissenslog und Final Review aktualisieren.

Done: keine `review_required`-Freigabe bleibt ohne dokumentierten Restpunkt;
alle verbleibenden produktiven IDs sind konkrete Bindung oder individuelles
Planmodell.

Ergebnis: Die neun historischen Future-Run-ICE-Klassen liegen nun zusammen mit
ihrem einzigen Consumer im Simulationsbereich; die produktive
ICE-Platzierungs-Runtime exportiert nur generische Kartenfakten und
Engine-Kostenverträge. Im produktiven Importgraph verbleiben drei zentral
klassifizierte Vorkommen der Kategorie `individual_plan_model`: zweimal Shell
Traders (Signaltyp und Sourceerkennung des dedizierten Plans) sowie einmal
Social Engineering (Sourcebindung des Secret-Bid-/Bypass-Plans). Es verbleibt
keine `review_required`-Freigabe. Das Gate sank von 12 auf 3 produktive
ID-Vorkommen.

## Finale Checks

```text
corepack pnpm --filter @netgrid/ai typecheck
corepack pnpm check:ai-source-structure
corepack pnpm check:package-boundaries
corepack pnpm check:ai
corepack pnpm test:ai:shards
git diff --check
```

Engine-/Shared-Typechecks und paketnahe Engine-Tests kommen hinzu, sobald ein
Paket deren produktive Verträge ändert.

## Worktree-, Git- und Integrationsregeln

- Umsetzung ausschließlich im oben genannten Worktree und Branch;
- Haupt-Checkout ausschließlich für den finalen lokalen Merge;
- fremde Änderungen im Haupt-Checkout bleiben unangetastet;
- kein Push und kein Pull Request;
- vor dem finalen Merge aktuelles `main` in den Arbeitsbranch integrieren;
- bevorzugter Fast-Forward-Merge nach `main`;
- Worktree erst nach erfolgreicher Main-Verifikation entfernen;
- Entfernung in Git und Dateisystem verifizieren;
- gemergten Arbeitsbranch anschließend mit `git branch -d` löschen;
- `/Goal` erst danach als `complete` markieren.

## Controller-Prompt-Kern

```text
/Goal Arbeite die generische KI-Karten-ID-Bereinigung vollständig und
sequenziell von GP00 bis GP06 ab. Ersetze Fähigkeitsentscheidungen durch
actiongebundene Funktionseffekte, LegalActions und Engine-Quotes im bestehenden
Planowner. Erhalte exakte Definition-/Instanzbindung nur für Lookup,
Lifecycle, Engine-Dispatch und begründete individuelle Planmodelle. Erzeuge
keine neue Karten-ID-, Text-, Fallback-, Choice- oder Planautorität.

Arbeite ausschließlich im Worktree
C:\Projekte\NETGRID_AI_GENERIC_CARD_ID_MIGRATION auf Branch
codex/ai-generic-card-id-migration. Prüfe und committe jedes Paket einzeln.
Integriere danach aktuelles main, wiederhole die finalen Gates, merge lokal
nach main und entferne Worktree sowie gemergten Branch verifiziert. Markiere
das Goal erst anschließend als complete.
```
