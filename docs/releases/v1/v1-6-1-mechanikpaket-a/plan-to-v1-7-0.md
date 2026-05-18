# V1.6.1 bis V1.7.0 Detailplanung (Mechanikpakete A bis D)

Stand: 2026-05-09
Status: detailgeplant (nur Planung, keine Implementierung)

## Ziel und Rahmen
Diese Planung beschreibt die naechsten vier Releases `V1.6.1`, `V1.6.2`, `V1.6.3` und `V1.7.0` so, dass danach direkt ein requirements-getriebener Implementierungsstart moeglich ist.

Verbindliche Leitlinien:

- Engine-Korrektheit, Hidden-Info-Schutz, Replay/StateHash-Determinismus und LegalAction-only bleiben harte Gates.
- Keine Engine-/UI-/Server-Implementierung in diesem Dokument.
- Keine Scope-Verschiebung zu V2.x-Produktfeatures.
- Deck-Legal-AI-Approval Batch B-G bleibt separater Gate-Strang.

## Verwendete Quellen
Pflichtquellen und relevante Planungs-/Matrixartefakte:

- `AGENTS.md`, `AGENTS.local.md`
- `KI-Wissen-NETGRID/00 Projektstart.md`
- `KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Index.md`
- `KI-Wissen-NETGRID/02 Wissen/Prozesse/Arbeitsworkflow Wissenspflege und Projektanfragen.md`
- `KI-Wissen-NETGRID/00 Steuerung/Regeldatei KI-Wissenspflege.md`
- `docs/codex/CODEX_STATUS.md`
- `docs/codex/CODEX_RUNBOOK_NETGRID_MVP_0_1_0_2.md`
- `docs/derived/NETGRID_CONSOLIDATED_RELEASE_ROADMAP.md`
- `docs/derived/MECHANICS_COVERAGE_MATRIX.md`
- `data/rules/mechanics-coverage-1.2.2.json`
- `data/local/card-import/onr-v1-limited/onr-v1-basisset-mechanics-release-matrix.local.csv`
- `data/local/card-import/onr-v1-limited/onr-v1-effect-logic-priority.local.md`
- `data/local/card-import/onr-v1-limited/onr-v1-open-card-review.local.md`
- `docs/derived/DECK_LEGAL_AI_APPROVAL_BATCH_PLAN.md`
- `docs/KI-Player/NETGRID_KI_Releaseplanung_Codex_Briefing.md`

## 1) Ist-Stand (vor V1.6.1)

### 1.1 Abgeschlossene Grundlage

- `V1.6.0` ist final gruen (Tutorial/Regelhilfe).
- Mechanikfoundation vorhanden: Damage/Flatline, Trace/Link, Hidden-Zone-Tools, Hosting/Counter-Basis, Event Modification (V1.2.0), Replacement (V1.2.1), Special Zones/Owner/Controller (V1.2.2).
- Karten-/Format-/Pipeline-Basis vorhanden: V1.2.3, V1.3.0, V1.3.1.
- KI-Basis bis planbasiert/Belief/Simulation vorhanden (V1.4.x), plus Replay-/Tutorial-Schicht (V1.5.0/V1.6.0).

### 1.2 Aktueller Release-Fokus laut Roadmap

- Sequenz nach `V1.6.0`: `V1.6.1 -> V1.6.2 -> V1.6.3 -> V1.7.0` (danach V1.7.1+).
- Geplanter Erst-Release fuer noch nicht spielbare O:NR-v1-Karten:
  - `V1.6.1`: 111
  - `V1.6.2`: 50
  - `V1.6.3`: 23
  - `V1.7.0`: 36

### 1.3 Matrixbefund (lokale O:NR-v1-Planungsmatrix)

- Gesamtkarten in lokaler Matrix: 374
- Bereits umgesetzt (lokal markiert): 45
- Nicht spielbar mit geplantem Erstrelease: 329
- Effektlogik-Zuordnung ist fuer die vier Zielreleases vorhanden und passt in der Summierung zu den Roadmap-Kartenzahlen.

### 1.4 Relevante Befunde fuer Risikoabsicherung

- In den 220 Karten der vier Zielreleases haben 108 Karten zusaetzlich fehlende Effekte, die in spaeteren Releases verortet sind (`V1.7.1` bis `V1.9.0`).
- `V1.6.3` enthaelt laut Zielpaket `L2_ChoiceFlow_Gegnerentscheidung_und_Guessing`, aber die lokale Effektmatrix weist aktuell 0 Karten mit diesem Effekt aus.
- `V1.7.0` enthaelt laut Zielpaket `L2_Deck_Unique_Constraint`, aber die lokale Effektmatrix weist aktuell 0 Karten mit diesem Effekt aus.
- Konsequenz: Vor jedem Release ist ein harter Release-Assignment-Preflight notwendig (blocking vs non-blocking Effekte pro Karte explizit).

## 2) Abhaengigkeits- und Reihenfolgelogik ueber alle vier Releases

### 2.1 Technische Abhaengigkeiten

1. `V1.6.1` muss zuerst laufen, weil Damage/Prevention/Core-/Brain-Erweiterung plus Per-Card-Resolver-Gate die hoechste Querabhaengigkeit auf spaetere Kartenfreigaben hat.
2. `V1.6.2` baut auf stabilen Resolver-/Damage-Fenstern auf und normalisiert Corp-lastige Asset/Node/Modifier-Muster.
3. `V1.6.3` setzt auf `V1.6.2` auf, weil Upgrade-Faehigkeiten und Uninstall-Lifecycles in denselben Persistenz-/Control-/Visibility-Vertraegen haengen.
4. `V1.7.0` folgt danach, weil Hosting/Recurring/Subtypen auf stabilem Install-/Uninstall-/Persistenzvertrag aufsetzen muessen.

### 2.2 Fachliche Abhaengigkeiten (Kartenhebel)

- `V1.6.1` schliesst den groessten unmittelbaren Kartenhebel (111) und reduziert zugleich Risiko fuer Damage-/Replacement-nahe Karten.
- `V1.6.2` ist stark Corp-board-lastig (32 Asset/Node von 50) und bereitet Upgrade-/Region-/Serverlogik fuer `V1.6.3` vor.
- `V1.6.3` ist praktisch ein Upgrade-Lifecycle-Release (20 Upgrade-Karten von 23).
- `V1.7.0` ist runnerlastig (32 Runner-Karten von 36) und verbindet Subtypen/Recurring/Hosting erstmals breit.

### 2.3 Testseitige Abhaengigkeiten

- Jede Stufe erweitert dieselben Pflichtgates: Unit, Szenario, Visibility, Replay/StateHash, KI-Smokes.
- Kein Release darf eigene neue Testtypen erfinden; stattdessen werden bestehende Gates erweitert.
- Release-Preflight muss sicherstellen, dass keine Karte freigegeben wird, deren blockierender Effekt erst spaeter geplant ist.

## 3) Detailplanung pro Release

## V1.6.1 - Mechanikpaket A

### Zielbild
Engine-seitig robuste Damage-/Prevention-/Core-Brain-Erweiterung plus Per-Card-Resolver-Test-Gate, mit kontrollierter Erstfreigabe von 111 Karten.

### Scope

- `L1B_PerCard_Resolver_Test_Gate`
- `L2_Damage_Familien_und_Flatline_Integration`
- `L3_Core_Brain_Damage_Erweiterungen`
- `L3_Prevention_Avoid_Replacement`

### Nicht-Scope

- Keine Plattformfeatures (Account/Cloud/Matchmaking/Ranking/Turnier)
- Keine neuen KI-Deckfreigaben ausser expliziter `ai_supported`-Gates je Karte
- Keine Vorziehung von `V1.6.2+`-Effekten

### Benoetigte Mechanikbausteine

- Damage-Effektfamilien von bestehendem `implemented_limited` auf breite runtime-faehige Per-Card-Abdeckung heben.
- Replacement-/Prevent/Avoid-Vertrag von test-only Pilot auf reale Kartenpfade erweitern.
- Core-/Brain-Damage-Folgen (Handsize-/Flatline-/StateHash-Vertrag) konsistent machen.
- Per-Card-Resolver-Gate verpflichtend vor jeder Kartenpromotion.

### Betroffene Karten-/Effektgruppen

- Kartenmenge: 111 (Runner 69, Corp 42)
- Schwerpunkte nach Effektlogik (innerhalb V1.6.1-Korb):
  - `L1B_PerCard_Resolver_Test_Gate`: 58
  - `L2_Damage_Familien_und_Flatline_Integration`: 39
  - `L3_Prevention_Avoid_Replacement`: 31
  - `L3_Core_Brain_Damage_Erweiterungen`: 8
- Zusatzbefund: 35/111 Karten fuehren zusaetzliche spaetere Effektabhaengigkeiten in der Matrix und brauchen Preflight-Einordnung.

### Architektur-/Daten-/Manifestanpassungen (Plan)

- Neues Releasepaket (Requirements/Spec/Testmatrix/Review):
  - `docs/releases/v1/v1-6-1-mechanikpaket-a/`
- Datenartefakte:
  - `data/rules/mechanics-coverage-1.6.1.json`
  - `data/manifests/card-implementation-manifest-1.6.1.json`
  - `data/scenarios/v161-card-release-smoke.json`
- Falls AI-Support pro Karte erweitert wird:
  - batch-spezifisches AI-Hint-Artefakt + SzenarioRefs, keine pauschale KI-Freigabe.

### Teststrategie

- Unit:
  - Damage-Typen, Core-/Brain-Folgen, Prevention/Avoid/Replacement-Reihenfolge, Kosten-/Target-Revalidierung.
- Szenario:
  - Positiv/Negativ je Effektfamilie, mindestens ein Multi-Effect-Konfliktfall.
- Visibility:
  - Keine Leaks in PlayerView/PublicEvent/WebSocket/Reconnect/Undo/Errors/Logs/DecisionDebug.
- Replay/StateHash:
  - Determinismus fuer unveraenderte, verhinderte, ersetzte und modifizierte Events.
- KI-Smokes:
  - LegalAction-only durch neue Fenster, keine Hangs, kein Hidden-Info-Zugriff.

### Gate-Kriterien (Release fertig)

- Alle 4 Paket-Effektfamilien als runtime-faehige Kartenpfade implementiert und getestet.
- Keine Hidden-Info-Leaks in Damage-/Prevention-/Replacement-Pfaden.
- Manifest- und Szenarioabdeckung fuer jede neu freigegebene Karte vorhanden.
- `lint`, `typecheck`, `test`, `build` sowie Release-spezifische Smokes gruen.

### Hauptrisiken + Gegenmassnahmen

- Risiko: Test-only Foundation wird ungeprueft auf breite Runtime uebertragen.
  - Gegenmassnahme: pro Karteneffekt Pflicht-Pilottest + Konfliktfalltest.
- Risiko: Undo/Replay-Divergenz bei Replacement.
  - Gegenmassnahme: eigener Replay/Undo-Regressionsblock pro Effektkette.
- Risiko: Karten mit spaeteren Blockern werden zu frueh versprochen.
  - Gegenmassnahme: Release-Assignment-Preflight (blocking/non-blocking) vor Freeze.

### Ready-for-Implementation-Checkliste V1.6.1

- [ ] V1.6.1-Requirements nennen exakt die 4 Effektbausteine und No-Scope.
- [ ] Alle 111 Karten haben Per-Card-Resolver-Reviewstatus (`ready` oder `deferred`).
- [ ] Fuer alle 35 Karten mit spaeteren Effekten liegt eine dokumentierte Blocking-Entscheidung vor.
- [ ] Testmatrix deckt Unit/Szenario/Visibility/Replay/KI separat ab.
- [ ] Manifest-/Coverage-/Scenario-Artefakte sind vorab strukturell definiert.

## V1.6.2 - Mechanikpaket B

### Zielbild
Corp-board-zentrierte Normalisierung fuer Assets/Nodes und persistente Modifier, mit Erstfreigabe von 50 Karten.

### Scope

- `L2_Globale_Statische_Modifier_ICE_Cost_Strength`
- `L3_Generische_Asset_Node_Faehigkeiten`
- `L3_Persistente_Modifier_und_Sonderzustaende`

### Nicht-Scope

- Keine Upgrade-Lifecycle-Vorziehung aus `V1.6.3`
- Keine Subtypen-/Hosting-Breite aus `V1.7.0`
- Keine V1.7.1+ Run/Search/Counter-Familien

### Benoetigte Mechanikbausteine

- Einheitlicher Resolververtrag fuer aktive/passive Asset-/Node-Effekte.
- Persistente Modifier mit sauberem Start-/Ende-Lifecycle.
- Globale ICE-Kosten-/Staerkemodifier mit deterministischem Recompute-Vertrag.

### Betroffene Karten-/Effektgruppen

- Kartenmenge: 50 (Corp 45, Runner 5)
- Typfokus: 32 Asset/Node, 9 Agenda, 4 Upgrade.
- Effektfokus im Korb:
  - `L3_Generische_Asset_Node_Faehigkeiten`: 36
  - `L3_Persistente_Modifier_und_Sonderzustaende`: 26
  - `L2_Globale_Statische_Modifier_ICE_Cost_Strength`: 17
- Zusatzbefund: 42/50 Karten tragen zusaetzliche spaetere Effektzuordnungen in der Matrix.

### Architektur-/Daten-/Manifestanpassungen (Plan)

- `docs/releases/v1/v1-6-2-mechanikpaket-b/`
- `data/rules/mechanics-coverage-1.6.2.json`
- `data/manifests/card-implementation-manifest-1.6.2.json`
- `data/scenarios/v162-card-release-smoke.json`
- Persistenz-/Modifier-Resolverlisten in den Katalog-/Manifestdaten als Pflichtfelder markieren.

### Teststrategie

- Unit:
  - globale Modifier-Recompute, Rez/Install/Trash-Lifecycle, persistente Flag-Aufhebung.
- Szenario:
  - Asset/Node-Aktivierung ueber mehrere Turns, Interaktion mit Damage/Tag/Run-Basis.
- Visibility:
  - side-sichere Darstellung persistenter Status- und Modifierinformationen.
- Replay/StateHash:
  - turnuebergreifende Modifier muessen statehash-stabil bleiben.
- KI-Smokes:
  - KI nutzt neue Asset/Node-Lines nur aus LegalActions, keine Hidden-Abkuerzungen.

### Gate-Kriterien (Release fertig)

- Alle drei Paketbausteine sind in realen Kartenpfaden nachgewiesen.
- Persistente Zustandsaenderungen sind deterministisch rueckrechenbar.
- Reconnect-/Undo-/Replay-Regression fuer neue Boardzustandslogik gruen.
- Keine Scope-Ausweitung in Upgrade-/Subtypen-/Hosting-Familien.

### Hauptrisiken + Gegenmassnahmen

- Risiko: Persistente Modifier bleiben nach Kartenwechsel haengen.
  - Gegenmassnahme: Lifecycle-Invariantentests (install, rez, trash, move, control-change).
- Risiko: Corp-board-spezifische Effekte leaken internen Zustand.
  - Gegenmassnahme: spezielle Visibility/DecisionDebug-Redaction-Tests.
- Risiko: Zu viele Karten haengen in Wahrheit an spaeteren Familien.
  - Gegenmassnahme: verbindlicher `freigabefaehig_in_v162`-Filter im Manifest.

### Ready-for-Implementation-Checkliste V1.6.2

- [ ] Asset/Node-Resolververtrag inkl. Persistenz-Lifecycle ist spezifiziert.
- [ ] Kartenkorb 50 ist in `freigabefaehig` vs `deferred` aufgeteilt.
- [ ] Fuer alle 42 Karten mit spaeteren Matrix-Effekten ist die Blocking-Entscheidung dokumentiert.
- [ ] Reconnect/Undo/Replay-Tests fuer persistente Modifier sind explizit gelistet.
- [ ] Kein Ticket in V1.6.2 enthaelt `V1.6.3+`-Mechanikcode als Pflicht.

## V1.6.3 - Mechanikpaket C

### Zielbild
Upgrade-/Uninstall-/ChoiceFlow-Haertung als Lifecycle-Release, mit Erstfreigabe von 23 Karten.

### Scope

- `L2_ChoiceFlow_Gegnerentscheidung_und_Guessing`
- `L3_Generische_Upgrade_Faehigkeiten`
- `L3_Uninstall_und_InstalledCard_Destroy`

### Nicht-Scope

- Keine Subtypen-/Hosting-/Recurring-Breite aus `V1.7.0`
- Keine HiddenZone-/Run-Breite aus `V1.7.1`

### Benoetigte Mechanikbausteine

- Generischer Upgrade-Resolververtrag (Install/Rez/Serverbindung/Access-Folgen).
- Uninstall/Destroy-Lifecycle fuer installierte Karten inklusive Kaskaden.
- Deterministische ChoiceFlows fuer Gegnerentscheidungen/Guessing.

### Betroffene Karten-/Effektgruppen

- Kartenmenge: 23 (Corp-only)
- Typfokus: 20 Upgrades, 3 ICE.
- Effektfokus:
  - `L3_Generische_Upgrade_Faehigkeiten`: 20
  - `L3_Uninstall_und_InstalledCard_Destroy`: 3
  - `L2_ChoiceFlow_Gegnerentscheidung_und_Guessing`: aktuell 0 Karten in lokaler Effektmatrix
- Zusatzbefund: 12/23 Karten enthalten zusaetzliche spaetere Effektzuordnungen.

### Architektur-/Daten-/Manifestanpassungen (Plan)

- `docs/releases/v1/v1-6-3-mechanikpaket-c/`
- `data/rules/mechanics-coverage-1.6.3.json`
- `data/manifests/card-implementation-manifest-1.6.3.json`
- `data/scenarios/v163-card-release-smoke.json`
- Zusatzartefakt Pflicht: Matrix-Normalisierung fuer ChoiceFlow-Zuordnung (weil aktuell 0 Mappingtreffer).

### Teststrategie

- Unit:
  - Upgrade-Install/Rez/Access/Trash, uninstall/destroy-Kaskaden, choice revalidation.
- Szenario:
  - Ambush-/Upgrade-Interaktionen, Guessing-Choice mit legalen/illegalen Pfaden.
- Visibility:
  - keine Leaks aus Guessing/Choice-Informationen.
- Replay/StateHash:
  - identische Choice-Reihenfolge bei gleicher Seed-/Actionfolge.
- KI-Smokes:
  - KI-Choice-Handhabung strikt LegalAction-basiert.

### Gate-Kriterien (Release fertig)

- Upgrade- und Uninstall-Familie ist deterministisch und regressionssicher.
- ChoiceFlow-Faelle sind explizit getestet oder als `deferred` markiert.
- Ownership-/Control-Invarianten bleiben ungebrochen.

### Hauptrisiken + Gegenmassnahmen

- Risiko: ChoiceFlow ist im Matrixmodell unterdefiniert (0 Kartenzuordnung).
  - Gegenmassnahme: zwingender Preflight zur Effektklassifikation vor Requirements-Freeze.
- Risiko: Upgrade/Uninstall bricht Host-/Control-Kaskaden.
  - Gegenmassnahme: Invariantentests gegen V1.2.2-Owner/Controller-Vertrag.

### Ready-for-Implementation-Checkliste V1.6.3

- [ ] ChoiceFlow-Effektmodell hat mindestens eine verifizierte Kartenzuordnung oder ist begruendet deferred.
- [ ] Upgrade-/Uninstall-Lifecycle-Spezifikation ist abgeschlossen.
- [ ] 23er Kartenkorb ist mit eindeutigen ResolverRefs und requiredMechanics versehen.
- [ ] Guessing-/Gegnerentscheidungsfaelle haben eigene Visibility- und Replay-Tests.
- [ ] Keine Karte mit blockierendem `V1.7.x+`-Effekt wird ohne Ausnahmeentscheidung freigegeben.

## V1.7.0 - Mechanikpaket D

### Zielbild
Subtypen/Hosting/Recurring/Unique-Vertrag stabilisieren und 36 Karten kontrolliert erstfreigeben.

### Scope

- `L2_Deck_Unique_Constraint`
- `L2_Hosting_und_Hosted_Resource_Modelle`
- `L2_Recurring_Pools_und_StartOfTurn_Resolver`
- `L3_Programm_Subtypen_Daemon_Stealth_Worm_BaseLink`

### Nicht-Scope

- Keine Run-/Search-/Multiaccess-Erweiterung aus `V1.7.1`
- Keine Trace-/Tag-/Handsize-Breite aus `V1.7.2`

### Benoetigte Mechanikbausteine

- Hosting-/Hosted-Objektmodell fuer reale Kartenmuster haerten.
- Recurring-/Start-of-turn-Resolver als allgemeine Turn-Economy-Bausteine.
- Programmsubtypen (Daemon/Stealth/Worm/BaseLink-Kontext) mit KI-kompatiblen Rollen verbinden.
- Unique-Constraint runtime-seitig in Deck-/Install-Lebenszyklus sauber verankern.

### Betroffene Karten-/Effektgruppen

- Kartenmenge: 36 (Runner 32, Corp 4)
- Typfokus: 19 Programme, 11 Ressourcen.
- Effektfokus:
  - `L3_Programm_Subtypen_Daemon_Stealth_Worm_BaseLink`: 21
  - `L2_Recurring_Pools_und_StartOfTurn_Resolver`: 15
  - `L2_Hosting_und_Hosted_Resource_Modelle`: 3
  - `L2_Deck_Unique_Constraint`: aktuell 0 Karten in lokaler Effektmatrix
- Zusatzbefund: 19/36 Karten haben spaetere Effektzuordnungen.

### Architektur-/Daten-/Manifestanpassungen (Plan)

- `docs/releases/v1/v1-7-0-mechanikpaket-d/`
- `data/rules/mechanics-coverage-1.7.0.json`
- `data/manifests/card-implementation-manifest-1.7.0.json`
- `data/scenarios/v170-card-release-smoke.json`
- Matrix-Normalisierung fuer Unique-Constraint-Effektzuordnung als Pflicht vor Freeze.

### Teststrategie

- Unit:
  - Hosting-Kaskaden, hosted-state cleanup, recurring refresh, unique constraint enforcement.
- Szenario:
  - Runner-Subtype-Linien, recurring pools ueber mehrere Turns, hosting + trash/remove.
- Visibility:
  - kein Leak ueber verdeckte hosting- oder pool-spezifische Details.
- Replay/StateHash:
  - Start-of-turn-Resolver und recurring refresh deterministisch.
- KI-Smokes:
  - Rig-/Planbewertung fuer Subtypen nur bei `ai_supported` Karten; keine Hidden-Abkuerzung.

### Gate-Kriterien (Release fertig)

- Hosting-/Recurring-/Subtype-Pfade deterministisch und side-sicher.
- Unique-Constraint ist klar als runtime-Regel getestet oder sauber deferred dokumentiert.
- KI-Regressionssmokes bleiben bei neuen Runner-Rig-Mustern stabil.

### Hauptrisiken + Gegenmassnahmen

- Risiko: Unique-Constraint nicht im Kartenmapping sichtbar (0 Treffer).
  - Gegenmassnahme: vor Freeze explizite Zuordnungsentscheidung (aktivieren oder aus Scope nehmen).
- Risiko: Hosting + Recurring erzeugen Lifecycle-Leichen.
  - Gegenmassnahme: harte cleanup-/turn-boundary-Invariantentests.

### Ready-for-Implementation-Checkliste V1.7.0

- [ ] Unique-Constraint-Plan ist konkretisiert (aktive Kartenfaelle oder deferred mit Begruendung).
- [ ] Hosting-/Recurring-/Subtype-Vertraege sind als einzelne Testblöcke spezifiziert.
- [ ] 36er Kartenkorb hat pro Karte resolverRef, requiredMechanics, scenarioRef.
- [ ] Karten mit spaeteren Blockern sind dokumentiert verschoben oder isoliert freigegeben.
- [ ] KI-Smokes fuer Runner-Rig/Subtypen sind als Gatebedingung fixiert.

## 4) Abhaengigkeitsmatrix (Mechanik -> Release -> Vorbedingungen -> Risiken -> Tests)

| Mechanikbaustein | Zielrelease | Vorbedingungen | Hauptrisiko | Pflichttests |
|---|---|---|---|---|
| L1B_PerCard_Resolver_Test_Gate | V1.6.1 | ResolverRef-/requiredMechanics-Disziplin aus V1.3.1 | Kartenspezifische Luecken bleiben unentdeckt | Per-Card Unit + mindestens 1 Szenario pro Karte |
| L2_Damage_Familien_und_Flatline_Integration | V1.6.1 | V0.94/V1.1.1 Damage-Basis | Hidden-Info-Leaks bei Damage/Discard | Damage Unit + Visibility + Undo-Barrier + Replay |
| L3_Core_Brain_Damage_Erweiterungen | V1.6.1 | Core-Damage-Basis aus V1.1.1 | Handsize-/Flatline-Divergenz | Core/Brain Lifecycle Unit + Turnboundary Szenario |
| L3_Prevention_Avoid_Replacement | V1.6.1 | V1.2.0/V1.2.1 Foundation | Nichtdeterministische Fenster/Mehrfachanwendung | Conflict-Szenarien + Replay/StateHash + Visibility |
| L2_Globale_Statische_Modifier_ICE_Cost_Strength | V1.6.2 | Modifier-Basis V0.98 | stale/globaler Modifierzustand | Recompute-/Lifecycle-Unit + Reconnect-Smoke |
| L3_Generische_Asset_Node_Faehigkeiten | V1.6.2 | Asset/Node-Grundpfade + L1B | Sonderfaelle als One-off-Logik | Standardisierte Resolvertests + Access/Trash-Szenarien |
| L3_Persistente_Modifier_und_Sonderzustaende | V1.6.2 | V1.6.2 Asset/Node-Resolver + V1.2.2 Ownership | Persistenzleichen ueber Zuege | Turnuebergreifende StateHash-/Undo-/Replay-Regression |
| L2_ChoiceFlow_Gegnerentscheidung_und_Guessing | V1.6.3 | Choice-Framework (V0.93, V1.2.x) | Matrixunterdeckung (0 Zuordnungen) | Choice-Revalidation + Leaktests + deterministische Reihenfolge |
| L3_Generische_Upgrade_Faehigkeiten | V1.6.3 | V1.6.2 Persistenz-/Serverzustand | Upgrade-Ambush/Access-Fehler | Upgrade-Lifecycle-Unit + Access-Szenarien |
| L3_Uninstall_und_InstalledCard_Destroy | V1.6.3 | V1.2.2 Owner/Controller + Hosting-Basis | Kaskadenfehler bei remove/trash | Kaskaden-/Invariantentests + Replay |
| L2_Deck_Unique_Constraint | V1.7.0 | Deck-/Runtime-Validierung V1.3.0 | Keine klare Kartenzuordnung (0 Treffer) | Deck-/Install-Constraint Tests + Regression |
| L2_Hosting_und_Hosted_Resource_Modelle | V1.7.0 | Hosting-Basis V0.99 + Uninstall-Regeln V1.6.3 | orphaned hosted cards | Hosting-Kaskaden + cleanup + visibility |
| L2_Recurring_Pools_und_StartOfTurn_Resolver | V1.7.0 | Turn-Boundary-Vertrag + Persistenz | Nichtdeterministische Refresh-Reihenfolge | Start-of-turn Sequenztests + StateHash |
| L3_Programm_Subtypen_Daemon_Stealth_Worm_BaseLink | V1.7.0 | Breaker-/Subtype-Basis + Trace-Basis | falsche subtype-basierte KI/Resolverabkuerzung | Subtype-Unit + KI-Smokes + no-hidden-info |

## 5) Konsistenzpruefung gegen Vorziehen/Doppelplanung

Durchgaengige Regeln:

1. Ein Effektbaustein hat genau ein erstes Zielrelease.
2. Karten mit blockierenden spaeteren Effekten werden nicht implizit vorgezogen.
3. `V1.6.1` bis `V1.7.0` enthalten keine `V1.7.1+`-Implementierung als Muss.
4. KI-Freigaben bleiben kartenweise und getrennt vom reinen Human-Playable-Unlock.
5. V2.x bleibt gesperrt, bis die V1.6.1-V1.9.0-Linie gruen ist.

Pflicht-Preflight je Release:

- `release_assignment_validation`: jede Karte im Korb wird als `freigabefaehig`, `teilweise_blockiert` oder `deferred` markiert.
- `effect_mapping_sanity`: Zielpaket-Effekte muessen in der Matrix real zugeordnet sein (sonst explizit deferred).

## 6) Umsetzungsreihenfolge mit Meilensteinen

1. M0 - Globaler Vierer-Preflight
   - Matrix-/Manifest-/Status-Sync, Effektmapping sanity (`ChoiceFlow`, `Deck_Unique`), Kartenkorb-Schnitt.
2. M1 - V1.6.1 Requirements Freeze
   - Scope fix, 111-Korb validieren, Testmatrix fixieren.
3. M2 - V1.6.1 Umsetzung + Final Gate
   - Damage/Prevention/Core/Resolver-Gate gruen.
4. M3 - V1.6.2 Requirements Freeze
   - 50-Korb nach realer Freigabefaehigkeit schneiden.
5. M4 - V1.6.2 Umsetzung + Final Gate
   - Asset/Node/Persistenz stabil, Reconnect/Replay gruen.
6. M5 - V1.6.3 Requirements Freeze
   - Upgrade/Uninstall/ChoiceFlow klaeren, 23-Korb fixieren.
7. M6 - V1.6.3 Umsetzung + Final Gate
   - Upgrade-Lifecycle deterministic, Guessing side-sicher.
8. M7 - V1.7.0 Requirements Freeze
   - Subtypen/Hosting/Recurring/Unique-Klärung, 36-Korb fixieren.
9. M8 - V1.7.0 Umsetzung + Final Gate
   - Runner-subtype/hosting recurring stabil und regressionsgruen.

## 7) Warum diese Reihenfolge die beste Loesung ist

- Hoher frueher Kartenhebel: `V1.6.1` reduziert den groessten Blockercluster sofort.
- Risikoentkopplung: Die gefaehrlichsten Event-/Damage-Fenster kommen vor den breiten Board-/Subtype-Releases.
- Technische Stabilitaet: Persistenz/Upgrade/Uninstall werden vor Hosting/Recurring gehartet.
- Testbarkeit: Jeder Schritt bleibt als eigener Gateblock klein genug fuer saubere Ursachenanalyse.
- Projektpassung: Sequenz folgt exakt der verbindlichen Roadmap und respektiert die bestehenden No-Scope-Grenzen.

## 8) Gesamt-Ready-for-Implementation (vier Releases)

- [ ] Fuer alle vier Releases liegen je Requirements, Spec, Testmatrix, Requirements-Review vor.
- [ ] Jeder Kartenkorb (`111/50/23/36`) ist in freigabefaehig vs deferred aufgeloest.
- [ ] Effektmapping-Sanity ist fuer `L2_ChoiceFlow` und `L2_Deck_Unique` entschieden.
- [ ] Kein Release enthaelt unkontrolliert blockierende spaetere Effekte.
- [ ] Unit/Szenario/Visibility/Replay-StateHash/KI-Smoke-Gates sind je Release explizit und getrennt.
- [ ] Deck-Legal-AI-Approval bleibt als separater Batch-Track dokumentiert.
