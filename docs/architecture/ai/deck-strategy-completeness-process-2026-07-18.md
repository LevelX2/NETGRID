# Deck Strategy Completeness Process 2026-07-18

Status: in Bearbeitung

Quelle/Vorgabe: Vollprüfung der aus Decks abgeleiteten strategischen Pläne und ihrer produktiven Konsumenten vom 2026-07-18; direkte Umsetzung mit `paketprozess-worktree-goal`.

## Zielprüfung

Die Vorgabe ist für eine automatische sequenzielle Umsetzung ausreichend präzise. Der erwartete Endzustand, die betroffenen AI-Artefakte, die aktiven Deckbestände, die erkannten Ableitungs- und Consumer-Lücken sowie die lokalen Integrationsregeln sind bestimmt.

Kleine fachliche Spielräume werden konservativ geschlossen:

- Neue produktive Strategie-IDs erhalten nur begrenzte, semantisch passende Wirkung über vorhandene `LegalActions`.
- Alternative Runner-Zugangswege ersetzen keine echte Breaker-Coverage, dürfen aber belegte harte Fehlklassifikationen in konditionale Gaps umwandeln.
- Nicht konsumierte Profilfelder werden nur entfernt, wenn ihre Information bereits verlustfrei durch produktive StrategyScores, DeckCapabilities oder Diagnostik abgedeckt ist.
- Aktive Standarddecks sind der verbindliche aktuelle Bestands-Gate; historische Snapshots bleiben zusätzliche Regressionsevidence.

## Gesamtziel

Die Deckstrategie-Ableitung erkennt alle aktiven Decks fachlich plausibel, erzeugt keine systematisch falschen oder rein alphabetisch gewählten Primärlinien, und jede als produktiv deklarierte Strategy-ID besitzt einen vollständigen Pfad über StrategicIntent, Target/Reserve, TacticalGoals und begrenzten Action-Fit. Redundante ungenutzte Metadaten sind entfernt; verbleibende Metadaten haben dokumentierte produktive oder diagnostische Konsumenten. Ein katalogweites Gate verhindert erneute Ableitungs- und Consumer-Lücken.

## Nicht-Ziele

- Keine Änderung von Rules Engine, LegalActions oder Kartenregeln.
- Keine neuen Kartenmechaniken oder Decklisten.
- Keine pauschale Garantie, dass jedes historische Demo-Snapshot eine produktive Strategie besitzt.
- Kein Push, Pull Request oder Remote-Merge.
- Keine allgemeine KI-Balancing-Runde außerhalb deckstrategischer Ableitung und Konsumenten.

## Controller-Invarianten

- Genau ein Paket ist aktiv; kein Paket wird übersprungen.
- Regeln, LegalActions, HardGates, Reachability, Kosten, Survival und sichere Closeouts überstimmen Strategie.
- Produktive Strategy-IDs dürfen nie auf `family: unknown`, unbekannte Targets oder einen unbeabsichtigten Recover-/Setup-Fallback fallen.
- Unbekannte Supportdimensionen sind Fehler und dürfen nicht generisch auf Anchor-Signale zurückfallen.
- Strategy-Evidence bleibt side-safe, deterministisch und deckintern.
- Jedes Paket endet mit Checks, `git diff --check`, Dokumentation und eigenem Commit.

## Automatische Fehlerbehandlung

- Rote fokussierte Tests werden im aktuellen Paket eng diagnostiziert und behoben.
- Neue `main`-Commits werden vor der finalen Integration defensiv in den Arbeitsbranch eingebunden.
- Fachlich kompatible Konfliktintentionen bleiben erhalten; widersprüchliche Verträge werden als Blocker dokumentiert.
- Warnungen werden als erwartete Diagnostik, Remediation oder Blocker klassifiziert und nicht still ignoriert.

## Sicherheitsblocker

- Eine neue Strategie benötigt Actions, die nicht aus bestehenden `LegalActions` ableitbar sind.
- Eine Consumer-Anbindung würde Hidden-Info oder gegnerische Decklisten offenlegen.
- Ein Merge-Konflikt definiert denselben Runtime-Vertrag fachlich widersprüchlich.
- Der Hauptworkspace oder Ziel-Worktree enthält vor Cleanup nicht zugeordnete Änderungen.

## State Machine

`prepared -> package_active -> package_verified -> package_committed -> next_package -> final_verification -> main_merge -> cleanup_verified -> complete`

Bei Sicherheitsblocker: `package_active -> blocked_report`.

## Paketfolge

1. `DSC-00` Prozess, Baseline und reproduzierbare Bestandsmatrix.
2. `DSC-01` Aggregationsfehler und explizite Supportdimensionen.
3. `DSC-02` Vollständige Runtime-Verträge für neue Corp-Strategien.
4. `DSC-03` Anchor-Scoring, Sättigung und Tie-Behandlung.
5. `DSC-04` Konditionale alternative Runner-Zugangswege.
6. `DSC-05` Metadaten-Konsumenten und Profilbereinigung.
7. `DSC-06` Katalogweites Liveness-/Plausibilitäts-Gate, Abschlussreview und Integration.

## Fortschritt

- `DSC-00`: abgeschlossen und committed (`0f368b812`).
- `DSC-01`: abgeschlossen und committed (`1a114def3`).
- `DSC-02`: abgeschlossen und committed (`fb5dda338`); zentraler Runtime-Registry-Vertrag deckt alle 24 Taxonomie-IDs ab. Die vier neueren Corp-Strategien sind über Intent-Familie, Rollenstatus, Target/Reserve, CorpEnginePlan, TacticalGoal, Action-Fit und Discard-Fit angebunden. Reale Standarddeck-Regressionen sowie 75 fokussierte Tests und AI-Typecheck sind grün.
- `DSC-03`: abgeschlossen und committed (`a9a980641`); Anchor-Provenienz derselben Karte wird gedämpft zusammengeführt, Kopienzahl besitzt abnehmenden Grenznutzen, eine Sättigungskurve hält Rangunterschiede sichtbar, Evidenzvielfalt entscheidet vor lexikografischer Reihenfolge und exakte Cutoff-Ties bleiben vollständig erhalten. Alle 40 Standarddecks sowie 2.790 AI-Tests in drei Shards sind grün.
- `DSC-04`: abgeschlossen und committed (`3a26dfdf4`); allgemeine First-/Chosen-ICE-Bypass-Evidenz kann genau eine fehlende Coverage-Klasse konditional überbrücken, ohne einen Breaker zu erfinden. StrategicIntent übernimmt den produktiven Hard-/Soft-Gap-Vertrag und Runtime-Rollen kennzeichnen den Zugang als `conditional`. King of the Road ist produktiv, Ghost Circuit bleibt mit zwei echten Coverage-Lücken neutral.
- `DSC-05`: abgeschlossen; alle abgeleiteten öffentlichen Metadatengruppen sind als produktiv/diagnostisch oder rein diagnostisch klassifiziert und besitzen benannte Consumer. Die erklärenden Seitenprofile und Legacy-Zählungen bleiben erhalten, Inspector-Warnungen tragen Kartenprovenienz, und AI007 zeigt die reale StrategicIntent-Wirkung korrekt an. AI-/Web-Typechecks sowie 71 fokussierte Tests sind grün.
- `DSC-06`: ausstehend.

## Paketdetails

### DSC-00 Prozess, Baseline und Bestandsmatrix

Ziel: Prozessvertrag und reproduzierbare Ausgangslage für 40 aktive Standarddecks und 21 versionierte Snapshots sichern.

Arbeit:

- Prozessartefakt anlegen.
- Ausgangsbefunde und aktuelle Gate-Lücken festhalten.
- Fokussierte Baselinechecks bestimmen.

Kernartefakte: dieses Prozessdokument, bestehende Strategy-/Runtime-Tests.

Checks: Worktree-/Branch-Prüfung, `git diff --check`.

Done-Gate: Paketfolge, Abnahmekriterien und `/Goal` sind versioniert.

Commit: `docs(ai): define deck strategy completeness process`

### DSC-01 Aggregationsfehler und explizite Supportdimensionen

Ziel: Rush-Erkennung und Supportbewertung liefern reale, nachvollziehbare Werte.

Arbeit:

- Runtime-Kosten aus dem tatsächlichen `numeric`-Vertrag lesen.
- Eigene Auswertung für `tempoSource`, `boardSafety`, `advancementWindow`, `remoteSafety`, `drawSource`, `safety`, `recycleSource` und `drawOrShuffle` einführen.
- Unbekannte Supportdimensionen hart ablehnen.
- Evidence-Deduplizierung dimensionssicher machen.
- Reale Deckregressionen unter anderem für Chrome Rush Bureau ergänzen.

Checks: fokussierte DeckStrategy-Tests, AI-Typecheck, `git diff --check`.

Done-Gate: `corp.rush_score` kann mit realen günstigen ICE erkannt werden; keine Supportdimension nutzt unbeabsichtigt den Default-Anchor-Fallback.

Commit: `fix(ai): repair deck strategy support aggregation`

### DSC-02 Vollständige Runtime-Verträge für neue Corp-Strategien

Ziel: `corp.action_tempo`, `corp.overadvance_value`, `corp.draw_engine` und `corp.deck_recycle_engine` besitzen produktive Konsumenten.

Arbeit:

- Zentralen Strategy-Runtime-Vertrag für alle Strategy-IDs einführen oder bestehende Mappings lückenlos vereinheitlichen.
- Families, Rollenstatus, Targets, Reserve, Phasen, CorpIntent-Projektion, TacticalGoals, Action-Fit und relevante Discard-/Remote-Signale anbinden.
- Produktive Realdeck-Tests für alle vier Strategien ergänzen.

Checks: StrategicIntent-, RuntimeContext-, TacticalGoal-, ActionFit-, CorpIntent- und DeckStrategy-Tests; AI-Typecheck; `git diff --check`.

Done-Gate: Keine produktive Taxonomie-ID ergibt `unknown`, `target_unknown_for_strategy` oder unbeabsichtigten Recover-/Setup-Fallback.

Commit: `feat(ai): connect complete corp strategy runtime contracts`

### DSC-03 Anchor-Scoring, Sättigung und Tie-Behandlung

Ziel: Primärstrategien spiegeln Evidenzqualität und Deckschwerpunkt statt Mehrfachzählung oder Alphabet wider.

Arbeit:

- Mehrfachbelege derselben Karte gedämpft statt voll additiv bewerten.
- Kopienzahl mit abnehmendem Grenznutzen werten.
- Evidenzvielfalt als deterministischen Rankingfaktor verwenden.
- Exakte Gleichstände am Primary-Cutoff explizit erhalten statt per ID abzuschneiden.
- Realdeck-Erwartungen gegen offensichtliche Deckschwerpunkte absichern.

Checks: DeckStrategy-Tests, deterministische Bestandsmatrix, AI-Typecheck, `git diff --check`.

Done-Gate: Kein Primär-Cutoff verwirft eine exakt gleichrangige Strategie nur aufgrund lexikografischer Reihenfolge; Sättigung ist gegenüber der Baseline reduziert.

Commit: `fix(ai): calibrate deck strategy anchors and ties`

### DSC-04 Konditionale alternative Runner-Zugangswege

Ziel: Belegte Bypass-/Umgehungslinien werden als konditionale Reachability anerkannt, ohne Breaker-Coverage zu erfinden.

Arbeit:

- Alternative Zugangssignale konservativ in Breaker-Coverage-Gaps einbeziehen.
- King of the Road als konkrete False-Negative-Regression absichern.
- Ghost Circuit explizit als echte Coverage-Lücke oder bewusst konditionale Strategie klassifizieren.

Checks: DeckStrategy-, RunnerIntent- und relevante Reachability-Tests; AI-Typecheck; `git diff --check`.

Done-Gate: King of the Road besitzt eine produktive belegte Linie; Ghost Circuit wird nicht durch unbelegte Coverage produktiv gemacht.

Commit: `fix(ai): recognize conditional runner access paths`

### DSC-05 Metadaten-Konsumenten und Profilbereinigung

Ziel: Jedes verbleibende Profilfeld besitzt einen produktiven oder diagnostischen Konsumenten.

Arbeit:

- Unverbrauchte Runner-/Corp-Teilprofile und `legacySignalCounts` auf Informationslücke prüfen.
- Redundante Felder entfernen; benötigte Felder gezielt konsumieren.
- Warnungen mit Kartenprovenienz ausgeben und rein diagnostischen Status kenntlich halten.
- Typen, Debug und Fixtures konsistent aktualisieren.

Checks: Typecheck, DeckStrategy-/Debug-/Intent-Tests, statischer Consumer-Check, `git diff --check`.

Done-Gate: Keine unklassifizierten ungenutzten öffentlichen Profilfelder verbleiben.

Commit: `refactor(ai): close deck strategy metadata consumer gaps`

### DSC-06 Katalogweites Gate, Abschlussreview und Integration

Ziel: Der vollständige aktuelle Deckbestand und jede produktive Strategy-ID sind dauerhaft abgesichert.

Arbeit:

- Gate auf alle 40 aktiven Standarddecks und die relevanten versionierten Snapshots erweitern.
- Strategy-ID-Liveness, Family-/Target-Vertrag, unbekannte Supportdimensionen, Primär-Cutoff-Ties, Warnungsprovenienz und deterministische Ausgabe prüfen.
- Abschlussreview und Wissensstatus aktualisieren.
- Vollständige AI-Checks ausführen, aktuelles `main` integrieren, final verifizieren und lokal nach `main` mergen.
- Worktree und Branch nach Skill-Vertrag entfernen und doppelt verifizieren.

Checks: fokussierte Gates, `@netgrid/ai` Typecheck, vollständiger `@netgrid/ai`-Testlauf, `git diff --check`; nach Merge Main-Prüfung.

Done-Gate: Alle Checks grün, Abschlussreview versioniert, Arbeitsbranch in `main`, Worktree und Branch nachweislich entfernt.

Commit: `test(ai): gate complete deck strategy runtime coverage`

## Verifikationsregeln

- Fokussierte Tests laufen vor breiten Gates.
- Tests verwenden reale aktive Decks, wenn eine Aussage den aktuellen Bestand betrifft.
- Neue produktive Runtime-Wirkung benötigt mindestens einen End-to-End-Nachweis über StrategyProfile und StrategicIntent bis zur Action-/Goal-Ebene.
- Paketabschluss immer mit `git diff --check`.
- Final mindestens:
  - `corepack pnpm --filter @netgrid/ai typecheck`
  - `corepack pnpm --filter @netgrid/ai test`
  - aktualisiertes DeckStrategy-Gate

## Worktree-, Git- und Integrationsregeln

- Arbeitsbranch: `codex/deck-strategy-completeness`
- Arbeits-Worktree: `C:\Projekte\NETGRID_DECK_STRATEGY_COMPLETENESS`
- Integrationsbranch: lokaler `main`
- Hauptworkspace nur für finalen lokalen Merge verwenden.
- Jedes Paket erhält einen eigenen Commit.
- Push/PR nur auf ausdrücklichen Nutzerwunsch.
- Cleanup erst nach erfolgreichem Main-Merge und sauberem Worktree.

## Verbindliches /Goal

`/Goal Arbeite Deck Strategy Completeness vollständig und sequenziell von DSC-00 bis DSC-06 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main.`

Lies zuerst `AGENTS.md`, `AGENTS.local.md`, die Pflichtseiten der Wissensbasis, `agents/release-implementation-agent.md` und dieses Prozessartefakt. Arbeite ausschließlich im Worktree `C:\Projekte\NETGRID_DECK_STRATEGY_COMPLETENESS` auf Branch `codex/deck-strategy-completeness`. Nutze den Hauptworkspace nur für den finalen Merge. Stelle keine Zwischenfragen, solange konservative automatische Fortsetzung möglich ist. Arbeite immer nur am aktuellen Paket, führe Paketchecks aus, dokumentiere Ergebnisse und committe jedes abgeschlossene Paket. Bei Sicherheitsblocker stoppe mit Blocker-Report und Removal Condition. Nach Abschluss final verifizieren, aktuelles `main` integrieren, lokal nach `main` mergen, `main` prüfen, den sauberen Arbeits-Worktree entfernen, dessen Entfernung in Git und Dateisystem verifizieren, den gemergten Arbeitsbranch löschen und das Goal erst dann als complete markieren.

## Abschlusskriterien

- Alle sieben Pakete sind abgeschlossen und committed.
- Alle aktiven Standarddecks wurden durch das neue Gate geprüft.
- Jede produktive Strategy-ID besitzt einen vollständigen Consumer-Vertrag.
- Rush-, Support-, Tie- und alternative Runner-Zugangsfehler sind regressionsgesichert.
- Verbleibende Profilmetadaten sind konsumiert oder explizit diagnostisch.
- Arbeitsbranch ist lokal in `main` integriert.
- Arbeits-Worktree und gemergter Branch sind entfernt und die Entfernung ist doppelt verifiziert.
