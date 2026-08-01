# Generische KI-Fähigkeitsmigration – sequenzieller Umsetzungsprozess

Status: **abgeschlossen**

Quelle: Architekturreview der produktiven KI vom 01.08.2026 und
anschließender Nutzerauftrag, die sieben priorisierten Korrekturschritte
zunächst umzusetzen.

Primärer Agent: `release-implementation-agent`

Arbeitsbranch: `codex/ai-generic-capability-migration`

Worktree: `C:\Projekte\NETGRID_AI_GENERIC_CAPABILITY_MIGRATION`

## Zielprüfung

Die Vorgabe ist für einen sequenziellen Paketprozess ausreichend präzise.
Der Endzustand ist eine verlustfreie, actiongebundene Semantikbrücke von
Engine und aktiver Karten-Hint-Quelle zu `ActionSemanticCandidate` und
Plan-Step. Direkte Karten-ID- oder Kartentext-Fallbacks werden dort entfernt,
wo bereits ein vollständiger generischer Vertrag vorhanden ist oder in diesem
Prozess eng ergänzt werden kann.

Nicht jede individuelle Kartenmechanik wird vereinheitlicht. Zustandsabhängige
Folgen mit eigenen Kosten-, Fort- oder Encounterregeln behalten ein
planlokales Modell und erhalten beziehungsweise verwenden einen exakten,
Engine-zertifizierten Quote. Eine gemeinsame Effektfamilie allein darf keine
gemeinsame Rez- oder Placement-Heuristik erzeugen.

## Gesamtziel

Die produktive KI erkennt wiederverwendbare Kartenfähigkeiten aus aktuellen
`LegalActions`, side-sicheren Engine-Facts und der einzigen aktiven
Karten-Hint-Quelle. Die Planmodule wählen aktuelle Actions nach typisierten
Fähigkeiten, Zielen, Kosten und Fensterkontext. Karten-IDs bleiben auf Lookup,
konkrete Source-/Instanzbindung, Lifecycle, Engine-Dispatch und Diagnostik
begrenzt.

Nach Abschluss gilt:

1. Strukturierte Hint-Effekte bleiben bis zum `ActionSemanticCandidate`
   erhalten.
2. Action-Effekte werden nur bei eindeutiger Action-/Ability-Bindung
   produktiv verwendet; passiver Kartenkontext bleibt davon getrennt.
3. Die freigegebenen eindeutigen Legacy-Fallbacks sind entfernt.
4. Plan-Steps können typisierte funktionale Anforderungen ausdrücken.
5. Corp-Placement und Defense verwenden strukturierte Scope-, Subtyp-, Fort-
   und Fensterbedingungen.
6. Zustandsabhängige Rez-/Install-/Encounterfolgen verwenden Engine-Quotes
   und ihren bestehenden Planowner.
7. Die Blink-spezifische Risikofamilie und ihre öffentlichen Outcome-Felder
   sind funktional benannt.

## Annahmen

- `data/ai/ai-card-hints-active.json` bleibt die einzige statische
  Karten-Hint-Quelle.
- Es entsteht keine persistierte Derived-Facts-, Compiler- oder Overlaydatei.
- Die bestehende `ActionSemanticCandidate`-Projektion ist die zulässige
  laufzeitinterne Semantikbrücke.
- Die Engine bleibt alleinige Regelautorität. Hints klassifizieren
  strategische Funktion und bestätigen niemals eigenständig Legalität oder
  einen unbekannten aktuellen Betrag.
- Bestehende vollständige Engine-Payloads und Quotes werden bevorzugt. Neue
  Payloadfelder werden nur ergänzt, wenn eine aktuelle Wirkung andernfalls
  nicht side-sicher und exakt projizierbar ist.
- Weitergehende Teststrategie, neue Baseline-Abnahmebedingungen und
  langfristige Play-Strength-Metriken werden nach diesem Prozess gesondert
  diskutiert. Paketnahe Regressionstests und bestehende Pflichtgates bleiben
  Bestandteil der Umsetzung.

## Nicht-Ziele

- keine neue LegalAction-Erzeugung durch die KI;
- keine neue Entscheidungsautorität außerhalb bestehender Planmodule;
- kein Hint-Compiler und keine zweite aktive Hint-Quelle;
- keine allgemeine Vereinheitlichung fachlich verschiedener
  kartenspezifischer Rez- oder Folgekontrakte;
- keine Neuabstimmung globaler Scores oder Prioritätsklassen;
- keine umfassende Überarbeitung aller 618 Karten-Hints;
- keine Produktversionsänderung;
- kein Push und kein Pull Request;
- keine umfassende neue Behavior-Baseline in diesem Prozess.

## Controller-Invarianten

1. Genau ein Paket ist aktiv; kein Paket wird übersprungen.
2. Jeder aktuelle Head bleibt an eine vorhandene `LegalAction`, `actionId`
   und `stateVersion` gebunden.
3. Choice-Auflösung ändert weder Plan, Step, Route, Action-ID noch Executor.
4. Hints überschreiben keine widersprechenden Engine-Facts.
5. Fehlende oder mehrdeutige Action-/Ability-Bindung bleibt fail-closed.
6. `corp.defend_servers` bleibt alleiniger Owner für globale ICE-Allokation,
   Placement, Schutzbewertung und Rez-Entscheidung.
7. Runner-Search, Economy, Run/Access, Tag/Survival und Resource-Lifecycle
   bleiben in ihren bestehenden Planmodulen.
8. Direkte Definition-IDs sind nur für Lookup, konkrete Sourcebindung,
   Lifecycle, Engine-Dispatch oder ausdrücklich dokumentierte individuelle
   Modelle zulässig.
9. Nach jedem Paket laufen paketnahe Tests, AI-Typecheck und
   `git diff --check`; Engine-/Shared-Änderungen erhalten zusätzlich ihre
   paketnahen Typechecks und Tests.
10. Jedes abgeschlossene Paket wird separat committed.

## Automatische Fehlerbehandlung

- Ein roter Test wird im aktiven Paket eng diagnostiziert und behoben.
- Ein fehlender generischer Vertrag wird nicht durch einen neuen ID- oder
  Textfallback kaschiert.
- Ein Engine-/Hint-Widerspruch behält die Engine-Wirkung und erzeugt
  diagnostische Mismatch-Evidence.
- Eine nicht exakt bindbare Actionsemantik wird nicht planfähig gemacht.
- Neue Erkenntnisse außerhalb des Paketumfangs werden als Follow-up notiert
  und erweitern das aktive Paket nicht still.

## Sicherheitsblocker

Der Prozess stoppt bei:

- IllegalAction oder stale/future Action-Referenz;
- Hidden-Info-Leak;
- Replay-/StateHash-Abweichung;
- neuem zweiten Action-Chooser oder planfremdem Override;
- Choice-Resolver mit eigener Ziel-, Karten-, Server- oder Strategieauswahl;
- Engine-Quote, der nicht an aktuelle Action, StateVersion, Quelle und Ziel
  gebunden werden kann;
- fachlich notwendiger Regelentscheidung, die aus dem aktuellen Regelvertrag
  nicht eindeutig folgt.

## State Machine

```text
planned
→ package_active
→ package_verifying
→ package_committed
→ next_package
→ final_verifying
→ main_integrating
→ worktree_cleaning
→ complete

package_active/package_verifying
→ blocked
→ removal_condition_satisfied
→ package_active
```

## Paketfolge

| Paket | Schwerpunkt                                     | Hauptowner                     |
| ----- | ----------------------------------------------- | ------------------------------ |
| GC00  | Prozessartefakt und Ausgangsinventar            | Prozess                        |
| GC01  | Strukturierte Hint-Effekte                      | Action-Semantik                |
| GC02  | Exakte Action-/Ability-Bindung                  | Action-Semantik                |
| GC03  | Eindeutige Legacy-Fallbacks                     | bestehende Domainowner         |
| GC04  | Typisierte Plan-Step-Fähigkeiten                | Plan-Kernel                    |
| GC05  | Corp-Placement-/Defense-Profile                 | `corp.defend_servers`          |
| GC06  | Engine-gequotete Folgekontrakte                 | Engine + `corp.defend_servers` |
| GC07  | Generische Zufalls-Break-/Schadensverträge      | Run-Analyse + Engine           |
| GC08  | Finaler Abgleich, Wissenspflege und Integration | Prozess                        |

## Umsetzungsstand

| Paket | Status        | Commit                 |
| ----- | ------------- | ---------------------- |
| GC00  | abgeschlossen | `de6e43e3e`            |
| GC01  | abgeschlossen | `3aac85c5c`            |
| GC02  | abgeschlossen | `2a352d13c`            |
| GC03  | abgeschlossen | `ce3d9045e`            |
| GC04  | abgeschlossen | `80463675a`            |
| GC05  | abgeschlossen | `b0d6e6294`            |
| GC06  | abgeschlossen | `ede351ed0`            |
| GC07  | abgeschlossen | `64a97667a`            |
| GC08  | abgeschlossen | dieser Abschlusscommit |

## GC00 – Prozessartefakt und Ausgangsinventar

### Ziel

Verbindlichen Scope, Owner, Paketfolge, Prüfpfade und Grenzen vor der ersten
Codeänderung festhalten.

### Arbeit

- Prozessartefakt anlegen;
- direkten Karten-ID-Bestand und Textparser als Ausgangsevidence erfassen;
- relevante vorhandene Engine-, Hint-, Candidate- und Planverträge benennen;
- fremde Änderungen im Hauptworkspace klassifizieren und unangetastet lassen.

### Done-Gate

- Prozessartefakt vollständig;
- Worktree und Branch isoliert;
- kein produktiver Code geändert;
- `git diff --check` grün.

### Commit

`docs(ai): plan generic capability migration`

## GC01 – Strukturierte Hint-Effekte verlustfrei projizieren

### Ziel

Die vorhandenen `AiHintStructuredEffect`-Informationen als typisierten,
read-only Funktionsvertrag im `ActionCardSemanticProfile` und
`ActionSemanticCandidate` erhalten.

### Arbeit

- gemeinsamen Action-Funktionseffekttyp definieren beziehungsweise den
  vorhandenen Hint-Typ kontrolliert wiederverwenden;
- `kind`, `timing`, `scope`, `resource`, Betrag/Betragsart, Economy-Modus,
  Ziel, Wiederholbarkeit und Endlichkeit transportieren;
- bestehende `effectTargets` als abgeleitete Kompatibilitätsansicht erhalten,
  solange aktuelle Consumer noch nicht migriert sind;
- Hint-/Engine-Provenienz und Klassifikationsstatus sichtbar halten;
- Invarianten und fokussierte Projektionstests ergänzen.

### Done-Gate

- kein strukturiertes Effektfeld geht im Hint→Candidate-Pfad verloren;
- keine Legalität oder aktuelle Menge wird aus Hints erfunden;
- bestehende Consumer bleiben funktional stabil.

### Commit

`feat(ai): retain structured functional effects in action semantics`

## GC02 – Action-/Ability-Bindung präzisieren

### Ziel

Produktive Action-Effekte werden nur an diejenige LegalAction gebunden, deren
Ability beziehungsweise CardImplementation-Primitiv eindeutig feststeht.

### Arbeit

- passiven Kartenkontext von ausführbaren Action-Effekten trennen;
- CardImplementation-Ability-ID/-Key und Engine-EffectKind vorrangig binden;
- Hint-Schema nur soweit nötig um action-/ability-bezogene Semantik ergänzen;
- Multi-Ability- und unresolved-Ability-Fälle fail-closed testen;
- bestehende Plan-/Step-/Routebindung unverändert sichern.

### Done-Gate

- eine Action erhält keine Effekte einer anderen Ability derselben Karte;
- Single-Ability-Inferenz bleibt side-safe und deterministisch;
- unresolved Ability erzeugt keine produktive Capability.

### Commit

`feat(ai): bind functional effects to exact card actions`

## GC03 – Eindeutige Legacy-Fallbacks entfernen

### Ziel

Bereits generisch vollständig beschreibbare Fälle verwenden keine
Karten-ID- oder Kartentext-Erkennung mehr.

### Arbeit

- Grubb-ID-Fallback zugunsten `run_remainder_strength_bonus` entfernen;
- SeeYa-ID-Fallback zugunsten actiongebundener Expose-Semantik entfernen;
- Fixed-Pool-Economy-Liste durch strukturierte Economy-Projektion ersetzen;
- Team-Restructuring-ID-/Textfallback durch Engine-Capability ersetzen;
- Tag-Descriptor-Registry durch LegalAction-/CardImplementation-Effektvertrag
  und bestätigende Hints ersetzen;
- fokussierte Positiv- und Gegenfalltests je Familie ergänzen.

### Done-Gate

- die fünf freigegebenen Fallbackfamilien enthalten keine produktive
  Definition-ID- oder Rules-Text-Entscheidung mehr;
- Planowner und ausgewählte Route bleiben erhalten;
- Engine-Facts bleiben autoritativ.

### Commit

`refactor(ai): remove generic capability id fallbacks`

## GC04 – Typisierte Funktionsanforderungen für Plan-Steps

### Ziel

Plan-Steps können neben `semanticActionType` strukturierte funktionale
Effektanforderungen gegen aktuelle Kandidaten prüfen.

### Arbeit

- kleinen side-neutralen `FunctionalEffectRequirement`-Vertrag definieren;
- Match auf Effektart, Timing, Scope, Ressource, Ziel und relevante
  Wiederholungs-/Endlichkeitsmerkmale implementieren;
- Target-, Kosten- und Fensterprüfung weiterhin separat erhalten;
- `requiredSourceDefinitionIds` nur noch für exakte Source-/Lifecyclebindung
  zulassen und per Kommentar/Invariante begrenzen;
- erste vorhandene ID-gebundene Route auf funktionalen Match migrieren.

### Done-Gate

- Capability und Target müssen weiterhin gemeinsam passen;
- unvollständige oder nur kartennamentliche Signale reichen nicht;
- keine Route akzeptiert einen Kandidaten mit falscher Abilitywirkung.

### Commit

`feat(ai): match plan steps by structured functional effects`

## GC05 – Corp-Placement- und Defense-Profile strukturieren

### Ziel

`corp.defend_servers` erhält wiederverwendbare, strukturierte Facts für
Scope, betroffene ICE-Subtypen, Fortbindung, Positions- und Fensterkontext.

### Arbeit

- Target-/Affected-Profile um harte Subtyp-, Scope-, Same-Fort- und
  Encounterbedingungen ergänzen;
- die kartentextbasierte ICE-Fact-Ableitung für strukturierte Engine-
  Subroutinen und Hints zurückdrängen;
- Encoder Inc, Data Masons und Tesseract auf die neuen Profile migrieren;
- Blood Cat, Paris City Grid und City Surveillance über planlokale
  Tag-/Trace-Zielverträge statt zentrale ID-Guards behandeln;
- keine gemeinsame Rez-Heuristik für fachlich verschiedene Karten einführen.

### Done-Gate

- Placement- und Rezbewertung bleibt vollständig bei
  `corp.defend_servers`;
- Subtyp- und Fortrestriktionen sind hart und strukturiert;
- unbekannte aktuelle Wirkung bleibt fail-closed.

### Commit

`refactor(ai): structure corp defense placement capabilities`

## GC06 – Engine-gequotete zustandsabhängige Folgen

### Ziel

Komplexe Rez-/Install-/Encounterfolgen verwenden exakte Engine-Quotes und
planlokale Modelle statt zentraler Karten-ID-Sperren oder Schätzungen.

### Arbeit

- vorhandene Fort-Run-Rez-Support-Quotes vollständig in die Action-Semantik
  und Defense-Routen einbinden;
- Dr. Dreff aus der generischen Upgrade-ID-Sperre lösen und ausschließlich
  über sein eigenes Quote-Modell produktiv bewerten;
- Fortress Architects nur mit Engine-zertifizierter Post-Rez-Installroute
  zulassen;
- weitere im Scope berührte konditionale Rez-/Install-/Encounterfolgen auf
  bestehende individuelle `fortRunKind`-/Mechanikmodelle abbilden;
- Sourceinstanz, Fort, Action-ID, StateVersion und Zahlbarkeit revalidieren.

### Done-Gate

- keine geschätzten Follow-up-Kosten;
- keine Übertragung von Dr.-Dreff-Regeln auf andere Karten;
- verschwindende Fortsetzung erzeugt `commitment_invalidated` oder eine
  dokumentierte planlokale Blockade statt Ersatzroute.

### Commit

`refactor(ai): bind conditional defense to engine quotes`

## GC07 – Zufalls-Break-/Schadensverträge generalisieren

### Ziel

Das bestehende Blink-Modell wird zu einem wiederverwendbaren funktionalen
Zufalls-Outcome-Vertrag, ohne seine konkrete Spielmechanik zu verändern.

### Arbeit

- Blink-benannte AI-Typen, Funktionen, Evidence und DTO-Felder auf
  `random_break_or_damage` beziehungsweise allgemeine Outcome-Begriffe
  migrieren;
- Engine/PublicContext-Payloads mit generischen Erfolgs-, Roll- und
  Schadensfeldern ausstatten;
- während der Paketmigration nur dort alte Felder lesen, wo aktuelle Producer
  noch nicht atomar umgestellt sind; am Done-Gate verbleibt kein produktiver
  AI-Entscheid auf Blink-Feldnamen;
- Risikoprofil aus funktionaler Karten-/Abilitysemantik statt Definition-ID-
  Registry beziehen;
- Run-Pfad, Encounter-Break, Survival und Recent-Failure-Evidence sichern.

### Done-Gate

- eine zweite Karte mit demselben funktionalen Profil könnte denselben
  Evaluator ohne neue zentrale ID-Abfrage verwenden;
- Zufall bleibt ausschließlich Engine-seitig seed-/record-basiert;
- Hidden-Info-, Replay- und Action-Bindung bleiben unverändert.

### Commit

`refactor(ai): generalize random break damage outcomes`

## GC08 – Finaler Abgleich, Wissenspflege und Integration

### Ziel

Den vollständigen Paketstand verifizieren, aktuellen `main` defensiv
integrieren, Wissen und Review aktualisieren und den Prozess sauber
abschließen.

### Arbeit

- direkte produktive Karten-ID- und Rules-Text-Stellen erneut inventarisieren
  und verbleibende legitime Fälle klassifizieren;
- Prozessstatus, AI-README, Wissenslog und Final Review aktualisieren;
- aktuelles `main` in den Arbeitsbranch integrieren;
- finale Pflichtgates ausführen;
- lokal nach `main` mergen;
- Hauptworkspace prüfen;
- Worktree und gemergten Branch verifiziert entfernen.

### Finale Checks

```text
corepack pnpm --filter @netgrid/shared typecheck
corepack pnpm --filter @netgrid/engine typecheck
corepack pnpm --filter @netgrid/ai typecheck
corepack pnpm check:ai-source-structure
corepack pnpm check:package-boundaries
corepack pnpm check:ai
corepack pnpm test:ai:shards
git diff --check
```

Engine- und Shared-Tests werden zusätzlich vollständig ausgeführt, wenn die
Pakete GC06 oder GC07 deren produktive Verträge ändern.

### Commit

`docs(ai): close generic capability migration`

## Verifikationsregeln

- Fokussierte AI-Testdateien erhalten ein äußeres Zeitfenster von mindestens
  180 Sekunden.
- Vollständige AI-Shards, breite Typechecks und Builds erhalten mindestens
  600 Sekunden.
- Ein fortsetzbarer laufender Testprozess wird weiterverfolgt und nicht wegen
  eines ersten kurzen Toolfensters neu gestartet.
- Timeout, ungeklärte Unhandled Rejection, Hidden-Info-Abweichung oder
  nichtdeterministische Auswahl gelten als rot.
- Nach jedem Paket:

```text
corepack pnpm --filter @netgrid/ai typecheck
<paketnahe Tests>
git diff --check
git status --short
```

## Worktree-, Git- und Integrationsregeln

- Umsetzung ausschließlich im Worktree
  `C:\Projekte\NETGRID_AI_GENERIC_CAPABILITY_MIGRATION`;
- Arbeitsbranch `codex/ai-generic-capability-migration`;
- Hauptworkspace nur für den finalen lokalen Merge;
- keine fremden Änderungen überschreiben;
- genau ein Commit pro abgeschlossenem Paket, enge Fixcommits nur für später
  entdeckte Paketfehler;
- vor dem finalen Merge aktuelles `main` in den Arbeitsbranch integrieren;
- bevorzugter Fast-Forward-Merge nach `main`;
- kein Push und kein Pull Request;
- Worktree erst nach erfolgreicher Main-Integration entfernen;
- Pfadentfernung in Git und Dateisystem verifizieren;
- gemergten Branch anschließend mit `git branch -d` löschen.

## Controller-Prompt-Kern

```text
/Goal Arbeite die generische KI-Fähigkeitsmigration vollständig und
sequenziell von GC00 bis GC08 ab und merge den abgeschlossenen Arbeitsbranch
lokal nach main.

Lies zuerst AGENTS.md, AGENTS.local.md, packages/ai/AGENTS.md, die
Pflichtseiten der Wissensbasis, docs/architecture/ai/README.md, die relevanten
Abschnitte des AI-Plan-Layer-Zielzustands und dieses Prozessartefakt.

Arbeite ausschließlich im Worktree
C:\Projekte\NETGRID_AI_GENERIC_CAPABILITY_MIGRATION auf Branch
codex/ai-generic-capability-migration. Nutze den Hauptworkspace nur für den
finalen Merge. Arbeite immer nur am aktuellen Paket, führe dessen Checks aus
und committe es erst nach bestandenem Done-Gate.

Hints klassifizieren strategische Funktion. Engine und aktuelle LegalActions
bleiben alleinige Autorität für Legalität, aktuelle Ziele, Kosten, Mengen und
Quotes. Erzeuge keine neue ID-, Text-, Fallback- oder Choice-Autorität.

Bei IllegalAction, Hidden-Info-Leak, Replay-/StateHash-Abweichung,
Nondeterminismus, stale/future Action-Referenz, planfremder Auswahl oder nicht
exakt bindbarem Folgequote stoppe im aktuellen Paket und dokumentiere die
Removal Condition.

Nach GC08: aktuelles main integrieren, finale Checks wiederholen, lokal nach
main mergen, main prüfen, den sauberen Arbeits-Worktree entfernen, Entfernung
in Git und Dateisystem verifizieren und den gemergten Arbeitsbranch löschen.
Goal erst danach als complete markieren.
```

## Abschlusskriterien

- GC00 bis GC08 jeweils mit bestandenem Done-Gate committed;
- strukturierte Funktionen erreichen ActionSemanticCandidate und Plan-Step;
- freigegebene Legacy-ID-/Text-Fallbacks entfernt;
- konditionale Defense-Folgen Engine-gequotet und planlokal;
- Blink-Risikovertrag funktional generalisiert;
- keine neue Entscheidungsautorität oder Hidden-Info-Grenzverletzung;
- finale Pflichtgates grün;
- lokal nach `main` integriert;
- Worktree und Arbeitsbranch nachweislich entfernt;
- `/Goal` als complete markiert.
