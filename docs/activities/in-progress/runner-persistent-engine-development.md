# Runner Persistent Engine Development

Status: in Umsetzung – RPED-00 bis RPED-04 abgeschlossen, finale Integration aktiv
Quelle: Nutzerauftrag vom 2026-08-14 und Review-Rückmeldung aus `pasted-text.txt`

## Zielprüfung

Die Vorgabe ist für eine kontrollierte Umsetzung ausreichend präzise. Die
Review-Rückmeldung ist im Kern korrekt und schärft vier notwendige Grenzen:

- gewünschte Reserve und harter Mindestpuffer sind im Ist-Stand verschieden;
- Reserve-Funding benötigt einen expliziten Zielcredit-Vertrag;
- exklusive Hardware-Decks benötigen Replacement- statt Duplicate-Semantik;
- bedingte Run-Folgekapazität ist kein frei verwendbares `+1 action`.

Die Umsetzung beginnt mit einem Diagnose-Gate. Ein Verhalten wird nur dort
geändert, wo ein reproduzierter Entscheidungspfad die Ursache belegt.

## Gesamtziel

Runner-KI soll persistente Multi-Output-Action-Engines und bedingte
Run-Folgekapazitäts-Engines generisch aus strukturierter CardSpec-/Hint-Semantik
erkennen, innerhalb von `runner.develop_board_and_hand` zustandsabhängig
entwickeln, bei gewünschter Reserve zielgebunden finanzieren und exklusive
Hardware-Deck-Ersetzungen nur bei positivem Replacement-Delta zulassen.

Silicon Saloon Franchise und Bodyweight Data Crèche dienen als reale
Regressionen, dürfen aber in produktiver Entscheidungslogik nicht per
Kartenname oder Definition-ID erkannt werden.

## Annahmen

- Die gewünschten Reservewerte 4 Credits normal, 5 im riskanten
  Breaker-Kontext und 6 bei sichtbarer Remote-Bedrohung werden nicht global zu
  harten Mindestwerten für alle persistenten Installationen.
- Für die neu erkannten persistenten Engine-Arten bilden sie jedoch das
  Zielcredit-Gate für `ready_now` und für eine gebundene Funding-Route.
- Die vorhandenen harten Mindestpuffer 2 beziehungsweise 3 und die bestehende
  harte Remote-Bedrohungsgrenze bleiben unverändert.
- Fehlende oder mehrdeutige strukturierte Semantik wird nicht durch Text- oder
  Namensheuristiken ersetzt.

## Nicht-Ziele

- keine manuellen `keyCardIntents` oder Deck-Gewichte;
- keine Nutzung redaktioneller Standarddeck-Guides als KI-Steuerung;
- kein neuer Plan, Chooser, Resolver oder globaler Rohscore-Bonus;
- keine Änderung von Kartenregeln, LegalActions oder Engine-Ausführung;
- kein generisches Action-Capacity-Token aus Data Crèche;
- keine globale Verschärfung aller Runner-Installationsreserven;
- keine Karten-ID-Abfrage in produktiver Bewertungslogik.

## Controller-Invarianten

- Fachlicher Owner bleibt `runner.develop_board_and_hand`.
- Planinstanzen bleiben an
  `runner.develop_board_and_hand:<cardInstanceId>` gebunden.
- Doctrine und strukturierte Semantik beraten; nur der bestehende Plan wählt
  Route und Action.
- Choice-Auflösung ändert weder Plan, Executor noch Action-ID.
- Es werden ausschließlich side-sichere PlayerViews, LegalActions und
  erlaubte eigene Deck-/CardSpec-Metadaten konsumiert.
- Engine-Legalität und `applyAction` bleiben unverändert autoritativ.

## Automatische Fehlerbehandlung

- Unvollständige Engine-Semantik ergibt `not_applicable`, nicht einen
  geschätzten positiven Wert.
- Fehlende Funding-Quotes lassen die Route sichtbar und fail-closed warten.
- Unbewertbare exklusive Deck-Ersetzung wird nicht ausgeführt.
- Ein stärkerer belegter Breaker-, Run- oder Bedrohungsplan darf das
  Entwicklungsprojekt überstimmen; Why-not-Evidence muss dies erklären.
- Neue Findings werden als Follow-up klassifiziert und erweitern kein Paket
  stillschweigend.

## Sicherheitsblocker

Die Umsetzung stoppt, wenn:

- der reale Saloon-Pfad ohne Hidden-Info-Leak nicht reproduzierbar ist;
- eine exklusive Deck-Ersetzung nicht aus sichtbarer strukturierter Semantik
  bewertbar ist;
- Reserve-Funding eine zweite Economy- oder Planentscheidungsautorität
  erfordern würde;
- Tests eine Änderung von Legalität oder Engine-Kartenregeln verlangen.

Removal Condition: Der jeweils fehlende side-sichere Fact-, Quote-, Plan- oder
Semantikvertrag ist am zuständigen Owner ergänzt und durch einen fokussierten
Test nachgewiesen.

## State Machine

```text
prepared
→ diagnostic_gate
→ semantic_engine_support
→ reserve_funding_and_replacement
→ focused_verification
→ simulation_comparison
→ final_integration
→ complete
```

Genau ein Zustand beziehungsweise Paket ist aktiv. Ein Paketwechsel erfolgt
erst nach Done-Gate und Commit.

Aktueller Zustand: `final_integration`.

## Diagnoseergebnis RPED-00

Der 10-Seed-Scan gegen Universal Fast Advance hat die Review-Hypothesen
präzisiert:

- Saloon wurde in Seed 1 bei 46 Credits nicht als fehlende kombinierte Engine,
  sondern wegen Überschneidung einzelner Funktionsgruppen mit vier
  installierten Karten als `redundant_duplicate` bewertet. Ergebnis:
  `currentNeed:none`, `finalInstallFit:-740`, kein eigener Development-Plan.
- In Seed 5 wurde Saloon bei 8 Credits korrekt als Funding-Plan erkannt, aber
  nur auf das bestehende harte Ziel 10 Credits (8 Kosten plus Mindestpuffer 2)
  finanziert. Die gewünschte normale Reserve 4 ist kein Funding-Ziel.
- In Seed 7 erreichte die Economy-Linie 13 Credits, die Installation war nach
  Verbrauch der Zugaktionen aber nicht mehr möglich. Später konnte die
  fehlerhafte Funktionsgruppen-Redundanz den Plan wieder entfernen. Das
  bestätigt Semantik plus Fortsetzung als Ursache, nicht einen fehlenden
  globalen Prioritätsbonus.
- Data Crèche wurde als `memory_support` installiert oder gegen einen stärkeren
  Runplan zurückgestellt. Ihr strukturierter erfolgreicher-Run-Folgeeffekt
  erscheint nicht in der Persistent-Install-Funktionsdeckung.
- Bestehendes Reserve-Funding funktioniert bereits für den harten Mindestpuffer
  und hält `runner.develop_board_and_hand:<cardInstanceId>` als `fund`-Phase.
  Es wird erweitert, nicht ersetzt.
- Seed 9 traf den bereits bekannten unabhängigen Fehler
  `window_origin_missing`; dieser bleibt getrennt und erweitert den aktuellen
  Scope nicht.

Die fokussierten Diagnose-Regressionen bilden diese drei konkreten Lücken ab:
falsche kombinierte Funktionsredundanz, fehlender gewünschter Reservebedarf und
fehlende erfolgreiche-Run-Folgekapazität.

## Umsetzungsergebnis RPED-01

- Die Persistent-Install-Evaluation besitzt jetzt einen versionierten,
  typisierten `engineAssessment` mit Engine-Art, Readiness, Outputs,
  Wiederholbarkeit, Konsumptionsblockern, Deck-Kompatibilität und
  Already-satisfied-Status.
- `multi_output_action_engine` wird ausschließlich aus einer einzelnen
  strukturierten `actionCapabilitySemantics` mit mindestens zwei produktiven
  Outputs, Action-Timing, Click-Ability-Mechanik und ohne terminalen Verbrauch
  abgeleitet. Self-Trash, `source_counter_cost` und Once-per-game sind durch
  Gegenfälle ausgeschlossen.
- Kombinierte Engines erhalten eine atomare Funktionsdeckung. Dadurch ist
  Saloon nicht länger fälschlich redundant zu getrennten Economy-, Draw- oder
  Search-Karten; eine zweite gleichartige Engine bleibt nicht-additiv.
- `successful_run_followup_engine` verlangt den strukturierten
  `future_run_effect` nach erfolgreichem Run, das Ziel `make_run`,
  Wiederholbarkeit und die `requires_successful_run`-Bedingung. Die Semantik
  erscheint in Readiness und Evidence, erzeugt aber weder allgemeine Action
  Capacity noch einen neuen Planowner.
- Readiness ist an bestehende Bedarf-/Admission-Pfade angebunden: fachlich
  blockierte Folge-Engines werden nicht als aktueller Bedarf zugelassen;
  `ready_now` kann nur innerhalb der bestehenden Persistent-Install-Bewertung
  Setup-Bedarf sichtbar machen.

Paketchecks:

- `runner-persistent-install-evaluation.test.ts`: 25/25 grün;
- `git diff --check`: grün;
- AI-Typecheck ausgeführt, aber durch unveränderte Main-Baseline blockiert:
  vier nicht vorhandene `docs/reviews/cards/*-migration-report.json` sowie der
  bereits vorhandene Typfehler in
  `runtime/sneak-preview-coverage-choice-real-engine.test.ts`. Keine Meldung
  betrifft die in RPED-01 geänderten Typen oder Dateien.

## Umsetzungsergebnis RPED-02

- `RunnerHandDevelopmentFundingNeed` führt jetzt verbindliche
  `targetCredits`. Für normale blockierte Karten entsprechen sie weiterhin
  der Bezahlbarkeit; für erkannte persistente Engines umfassen sie zusätzlich
  die gewünschte Reserve.
- Die Engine-Reserve beträgt 4 Credits normal, 5 bei einem installierten
  riskanten Breaker und 6 bei sichtbarer Remote-Score-Bedrohung. Die bisherigen
  harten Mindestpuffer 2/3/6 bleiben für alle anderen persistenten
  Installationen unverändert und erhalten ebenfalls einen expliziten
  Funding-Vertrag.
- Bei 10 Credits und 8 Installationskosten liefert Saloon jetzt Ziel 12,
  Gap 2 und `would_break_floor`. Der vorhandene
  `runner.develop_board_and_hand:<cardInstanceId>` bleibt in Phase `fund`,
  bindet exakt die Funding-Aktion und wechselt erst bei 12 Credits auf die
  unveränderte Install-Action.
- Die Credit-Bank-Cash-out-Admission prüft nun dasselbe Zielcredit-Feld. Ein
  Cash-out darf eine bezahlbare Engine deshalb gezielt auf den geschützten
  Installationsstand bringen, bleibt aber unter dem Bank-Planowner.
- Hardware-Deck-Exklusivität wird aus strukturiertem `hardware_trait`,
  `setup.deck_exclusive`, `deck_unique_replacement` oder dem sichtbaren
  strukturierten Deck-Subtype erkannt.
- Ersetzungen folgen einer konservativen Dominanzregel: zulässig ist nur eine
  strikt neue Funktionsdeckung ohne Verlust vorhandener einzigartiger
  Deck-Funktionen. Verlust oder nicht bewertbare Deck-Semantik ergibt
  `blocked_unvalued_loss`, `replacement_conflict` und keine Action-Route.

Paketchecks:

- Hand-Development, Persistent-Install, Cash-out und angrenzender
  Stakeout-Vertrag: 66/66 grün;
- residente Zielcredit-Fortsetzung: 1/1 fokussierter Runtime-Test grün;
- AI-Typecheck nach Behebung aller paketbezogenen Meldungen erneut
  ausgeführt; verbleibend sind ausschließlich die bereits dokumentierten vier
  fehlenden Migration-Review-JSONs und der unveränderte Sneak-Preview-
  Testtypfehler;
- `git diff --check`: grün.

## Umsetzungsergebnis RPED-03

- Die residente Reserve-Funding-Regression prüft jetzt über zwei Funding-
  Entscheidungen und die anschließende Installation hinweg dieselbe konkrete
  Root- und Executor-Instanz von `runner.develop_board_and_hand`.
- Planmodul, Ausführungszustand, exakte Step-ID, Route und Action-ID bleiben in
  jeder Entscheidung gebunden; es wird kein Fallback und kein zweiter Owner
  eingeführt.
- Eine zweite identische kombinierte Engine bleibt trotz der neuen atomaren
  Engine-Funktionsdeckung ein `redundant_duplicate` mit
  `already_satisfied`-Readiness.
- Die thematische Regression umfasst außerdem vorhandene Breaker-, MU-,
  Handpuffer-, Remote-Bedrohungs- und produktive-Run-Gegenfälle sowie
  konsumierende und generische Kartenfixtures. Damit entsteht weder eine
  allgemeine Überinstallation noch eine Aufwertung bedingter Run-Folgeeffekte
  zu freier Action Capacity.

Paketchecks:

- thematische Vitest-Teilmenge: 37/37 grün;
- exakte residente Plan-Ownership nach der letzten Assertionsschärfung: 1/1
  grün;
- `check:ai-hint-metadata-contracts`, `check:ai-source-structure` und
  `check:ai-generic-card-id-guards`: grün;
- das ergänzende `check:ai-action-capacity` bleibt durch fünf unveränderte
  Main-Baseline-Verstöße für Corp-Zielverträge rot; kein Befund betrifft die
  neue Runner-Engine-Semantik;
- AI-Typecheck erneut ausgeführt; verbleibend sind ausschließlich die bereits
  dokumentierten vier fehlenden Migration-Review-JSONs und der unveränderte
  Sneak-Preview-Testtypfehler.

## Vergleichsergebnis RPED-04

Vergleichsvertrag:

- `Last Call at R&D` gegen `Universal Fast Advance`, `Cheap Bag of Tricks` und
  `Siren Fortress`;
- je Paarung exakt dieselben zehn Seeds wie in der vorherigen Reihe, insgesamt
  30 neue Spiele;
- unveränderte Deck-Fingerprints, 480 Aktionen, `current_candidate` auf beiden
  Seiten und Schwierigkeit `hard`;
- Vergleichsbasis ist die vorherige Reihe mit bereits verdoppelten Saloon- und
  Crèche-Kopien, nicht die ältere Ein-Kopien-Reihe.
- Weil `main` vor der Integration um breite CardSpec-/Engine-Änderungen
  vorgerückt war, wurde die zunächst erzeugte Arbeitsbranch-Reihe verworfen
  und derselbe 3×10-Vertrag nach dem konfliktfreien Main-Abgleich genau einmal
  als finale Endevidence wiederholt. Nur diese 30 post-sync Spiele gehen in
  die folgende Auswertung ein.

| Paarung | Saloon gesehen | Saloon Install/Aktivierung vorher → neu | Crèche gesehen | Crèche Install/Bonus-Run vorher → neu |
| --- | ---: | ---: | ---: | ---: |
| Universal Fast Advance | 7/10 → 6/10 | 2/10 → 1/6 | 5/10 | 2/6 → 3/2 |
| Cheap Bag of Tricks | 7/10 → 6/10 | 2/5 → 2/3 | 9/10 → 10/10 | 3/20 → 7/28 |
| Siren Fortress | 8/10 | 2/12 → 2/11 | 5/10 | 1/3 → 2/4 |
| Gesamt | 22/30 → 20/30 | 6/27 → 5/20 | 19/30 → 20/30 | 6/29 → 12/34 |

Die Stichprobe bestätigt den fachlichen Mechanismus, aber keine pauschale
Nutzungssteigerung beider Karten: Crèche wurde in sechs zusätzlichen Spielen
installiert und erzeugte fünf zusätzliche Bonus-Runs. Saloon wurde bei zwei
weniger Sichtungen in einem Spiel weniger installiert; die Installrate pro
Sichtung bleibt damit nahezu stabil. Wenn Saloon installiert war, wurde die
Karte weiterhin aktiv genutzt. Das Ergebnis ist mit dem bewusst strengeren
Reserve-Gate vereinbar und darf bei nur 30 horizon-zensierten Spielen nicht als
Stärkegewinn oder -verlust interpretiert werden.

Technische Hard-Gate-Signatur der neuen 30 Spiele:

- 0 Replayfehler, 0 Fallbacks und redaktionell side-sichere lokale Reports;
- ein unveränderter `window_origin_missing`-Abbruch in Fast-Advance Seed 9;
- 0 Action-Limit-Partien gegenüber 2 in der Vergleichsbasis;
- ein neu erreichter, fachfremder `missing_plan_module_coverage`-Abbruch für
  Jack ’n’ Joe in Cheap-Bag Seed 2. Der Kontrolllauf desselben Seeds auf
  aktuellem `main` endet regulär; der geänderte Development-Verlauf erreicht
  die schon vorhandene unbesetzte One-shot-Search-Route erst später. Dieser
  Owner-Fund ist ein separater Follow-up und wird weder per Fallback noch durch
  Erweiterung des Engine-Pakets kaschiert.

Wegen der Laufzeitabbrüche und des Action Limits sind Outcome-, Aktionslängen-
und Aktivierungsdeltas horizon-zensiert. Die Reihe liefert daher
Nutzungsevidence, keine belastbare Spielstärkeaussage. Reservewerte 4/5/6,
Breaker-/MU-/Handpuffer-Gegenfälle und produktive Run-Preemption sind durch die
exakten fokussierten Regressionen gesichert; der lokale 3×10-Collector besitzt
für diese Zustandswerte keinen kompatiblen Vorher-/Nachher-Zähler.

Abschlusschecks:

- fokussierte Last-Call-, Engine- und Ownership-Teilmenge: 35/35 grün;
- vollständige AI-Shards vor und nach dem Main-Abgleich ausgeführt: auf dem
  finalen Stand bleiben alle drei Shards mit 130 fehlschlagenden Tests durch
  die auf `main` dokumentierten breiten Baselinefehler rot, vor allem
  ungültige Decision-Checkpoint-StateHashes und CardSpec-/Golden-Artefakte;
- fünf themennah auffällige breite Tests wurden auf Branch und aktuellem
  `main` einzeln ausgeführt und scheitern identisch;
- alle neu geänderten fokussierten Tests sowie die drei verpflichtenden
  `check:ai`-Gates sind auch nach dem Main-Abgleich grün;
- der finale AI-Typecheck meldet weiterhin ausschließlich die vier fehlenden
  Migration-Review-JSONs und den unveränderten Sneak-Preview-Testtypfehler.

Follow-up-Fund:

- Jack ’n’ Joe benötigt für legal sichtbare One-shot-Search-Aktionen eine
  vollständige, plan-first-konforme Owner-Route. Removal Condition: Ein
  bestehender zuständiger Search-/Coverage-Plan bindet die konkrete
  LegalAction oder klassifiziert sie mit sichtbarer Why-not-Evidence; kein
  generischer Development- oder Choice-Resolver-Fallback.

## Paketfolge

| Paket | Titel | Ergebnis |
| --- | --- | --- |
| RPED-00 | Diagnose und Ist-Vertrag | Entscheidungspfad und Ursache sind reproduziert |
| RPED-01 | Typisierte Engine-Semantik | Beide Engine-Arten werden generisch und konsumptionssicher erkannt |
| RPED-02 | Reserve-Funding und Deck-Replacement | Zielcredits und exklusive Ersetzung sind planlokal korrekt |
| RPED-03 | Ownership- und Regressionsevidence | Ergebnis und unveränderte Entscheidungsautorität sind getestet |
| RPED-04 | 3×10 Vergleich und Abschluss | Verhalten ist verglichen, dokumentiert und integrationsbereit |

## Paketdetails

### RPED-00 – Diagnose und Ist-Vertrag

Ziel: Mindestens zwei repräsentative Saloon-Entscheidungen und ein
Data-Crèche-Installationsfenster als reproduzierbare Decision Checkpoints
sichern.

Konkrete Arbeit:

- `developmentRole`, `availability`, `currentNeed`, `strategicFit`, `priority`,
  `finalInstallFit`, `reservePenalty`, `deferReason` und `fundingNeed` erfassen;
- erzeugten Development-Signalzustand mit `phase`, `fundingGap`,
  `priorityClass`, `value` und Funding-Evidence prüfen;
- Gewinner und Why-not-Evidence des Planvergleichs sichern;
- Ursache als Semantik-, Funding-, Kontinuitäts-, Challenger- oder
  Handmanagementproblem klassifizieren.

Checks: engster betroffener Vitest sowie `git diff --check`.

Done-Gate: Ursache und unveränderte Ownership sind testbar dokumentiert.

Commit: `test(ai): capture persistent engine development decisions`

### RPED-01 – Typisierte Engine-Semantik

Ziel: Planlokale, strukturierte Engine-Klassifikation ergänzen.

Konkrete Arbeit:

- `multi_output_action_engine` nur für persistente, wiederholbare
  Runner-Main-Actions mit Action-Kosten, mindestens zwei produktiven
  strukturierten Effekten und ohne Selbst-Trash, terminalen Verbrauch oder
  einmalige Nutzung erkennen;
- `successful_run_followup_engine` nur aus `future_run_effect`,
  `after_successful_run`, `make_run`, Wiederholbarkeit und den bestehenden
  Bedingungen ableiten;
- Readiness als `not_applicable`, `blocked`, `setup`, `ready_now` oder
  `already_satisfied` modellieren;
- Data-Crèche-Semantik ausdrücklich nicht in allgemeine Action Capacity
  umwandeln;
- Readiness in bestehenden Bedarf, Admission und Evidence einbinden, ohne
  neuen globalen Bonus.

Checks: fokussierte Hand-Development-/Hint-Tests, AI-Typecheck bei
Typoberflächenänderung, `git diff --check`.

Done-Gate: reale und generische Kartenfälle bestehen; Selbst-Trash-Gegenfall
bleibt ausgeschlossen.

Commit: `feat(ai): classify persistent runner engines semantically`

### RPED-02 – Reserve-Funding und Deck-Replacement

Ziel: Engine-Installationen nur bei gewünschter Reserve ausführbar machen und
exklusive Hardware-Deck-Ersetzungen bewerten.

Konkrete Arbeit:

- FundingNeed um explizite Zielcredits erweitern;
- für erkannte Engine-Arten Zielcredits als Installationskosten plus
  gewünschte Reserve 4/5/6 ableiten;
- bei 10 Credits für eine 8-Credit-Engine einen Gap von 2 Credits bilden und
  eine gebundene `fund → install`-Route halten;
- vorhandene Funding- und Cash-out-Admissions auf Zielcredits statt bloßer
  Bezahlbarkeit prüfen, ohne generisches Langzeit-Credit-Sammeln zu übernehmen;
- exklusive Decks über `setup.deck_exclusive` beziehungsweise strukturierte
  `hardware_trait:deck_exclusive` erkennen;
- gleiche Funktionsdeckung als `already_satisfied`, anderes exklusives Deck
  als Replacement-Konflikt behandeln;
- Replacement nur zulassen, wenn sichtbarer neuer Nutzen den verlorenen
  einzigartigen Nutzen positiv übersteigt; unbewertbare oder negative Fälle
  fail-closed blockieren;
- vorhandene Stackability-, Capability-Delta-, Duplicate- und
  Displacement-Evidence erweitern statt ein paralleles System einzuführen.

Checks: Funding-, Cash-out-, Replacement- und Runtime-Ownership-Tests,
AI-Typecheck, `git diff --check`.

Done-Gate: Reserve-Gap, sichere Installation, negatives Replacement und
positives Replacement sind reproduzierbar korrekt.

Commit: `feat(ai): fund safe runner engine replacements`

### RPED-03 – Ownership- und Regressionsevidence

Ziel: Architekturgrenzen und angrenzende Runner-Pfade absichern.

Konkrete Arbeit:

- Plan, Step, Route, Executor und Action-ID für positive Fälle prüfen;
- Breaker-, produktiver Run-, Remote-Bedrohungs-, MU- und Handpuffer-Gegenfälle
  sichern;
- zweite identische Engine-Kopie als redundant prüfen;
- mehrere bestehende Runner-Decks beziehungsweise generische Fixtures gegen
  unbeabsichtigte Überinstallation prüfen;
- einschlägige AI-Struktur-/Hint-Gates ausführen.

Checks: thematische Vitest-Teilmenge, `corepack pnpm --filter @netgrid/ai
typecheck`, relevante `check:ai*`-Gates, `git diff --check`.

Done-Gate: Keine zweite Entscheidungsautorität, kein Hidden-Info-Leak und keine
unsichere Installation.

Commit: `test(ai): protect persistent engine plan ownership`

### RPED-04 – 3×10 Vergleich und Abschluss

Ziel: Last Call at R&D gegen dieselben drei Corporation-Paarungen und Seeds wie
die vorherige Reihe vergleichen.

Konkrete Arbeit:

- drei Paarungen mit je zehn Spielen ausführen;
- Sichtung, Installation, Aktivierung, Bonus-Runs, sichere Reserveverletzungen,
  Breaker-Bereitschaft und ausgelassene produktive Runs vergleichen;
- bekannte Crash-/Action-Limit-Ausnahmen getrennt klassifizieren;
- nur belastbares wiederverwendbares Ergebnis in aktuelle Tests oder
  Current-State-Dokumentation zurückführen; Rohreports nicht dauerhaft
  archivieren.

Checks: fokussierte Simulationstests, vollständige AI-Shards wegen breiter
Runner-Wirkung, `git diff --check`.

Done-Gate: Vergleich abgeschlossen, Gates grün oder unabhängige Baselinefehler
sauber getrennt, Worktree sauber.

Commit: `test(ai): validate persistent runner engines in selfplay`

## Verifikationsregeln

- Diagnose beginnt mit dem kleinsten realen Testpfad.
- Ändert ein Paket Typoberflächen oder Hints, laufen Typecheck und zuständiges
  Struktur-/Hint-Gate im selben Paket.
- Vollständige AI-Shards laufen erst in RPED-04.
- Jeder Paketabschluss umfasst Ergebnisnotiz, `git diff --check`, selektives
  Staging und genau einen klaren Paketcommit.
- Ein roter Paketcheck wird ursachenbezogen im aktiven Paket behoben.

## Worktree-, Git- und Integrationsregeln

Arbeits-Worktree:
`C:\Projekte\NETGRID_RUNNER_PERSISTENT_ENGINE_DEVELOPMENT`

Arbeitsbranch:
`codex/runner-persistent-engine-development`

Der Hauptworkspace `C:\Projekte\NETGRID` wird nur für den finalen lokalen
Merge nach `main` genutzt. Es erfolgt kein Push und kein Pull Request.

Nach allen Paketen wird aktuelles `main` defensiv in den Arbeitsbranch
integriert, final verifiziert und bevorzugt per Fast-Forward nach `main`
gemergt. Danach werden Worktree-Pfad und Branch gemäß Skill-Vertrag entfernt
und doppelt verifiziert.

## Controller-Prompt-Kern

```text
/Goal Arbeite Runner Persistent Engine Development vollständig und sequenziell
von RPED-00 bis RPED-04 ab und merge den abgeschlossenen Arbeitsbranch lokal
nach main.

Lies zuerst AGENTS.md, AGENTS.local.md, packages/ai/AGENTS.md, den verbindlichen
KI-Änderungskompass, die einschlägigen Planverträge und dieses Prozessartefakt.
Arbeite ausschließlich im Worktree
C:\Projekte\NETGRID_RUNNER_PERSISTENT_ENGINE_DEVELOPMENT auf Branch
codex/runner-persistent-engine-development. Nutze den Hauptworkspace nur für
den finalen Merge. Arbeite immer nur am aktuellen Paket, führe dessen Checks
aus und committe jedes abgeschlossene Paket. Bei Sicherheitsblocker schreibe
einen Blocker-Report mit Removal Condition. Nach Abschluss final verifizieren,
lokal nach main mergen, main prüfen, Worktree und gemergten Arbeitsbranch
entfernen und die Entfernung verifizieren. Markiere das Goal erst danach als
complete.
```

## Abschlusskriterien

- RPED-00 bis RPED-04 sind jeweils geprüft und committed;
- produktive Erkennung ist vollständig generisch und strukturiert;
- Funding- und Replacement-Verträge sind side-sicher und owner-korrekt;
- fokussierte Tests, Typecheck, relevante Gates und vollständige AI-Shards sind
  bestanden oder unabhängige Baselinefehler klar ausgewiesen;
- Arbeitsbranch ist lokal nach `main` integriert;
- `main` ist sauber und geprüft;
- Arbeits-Worktree und Arbeitsbranch sind entfernt und die Entfernung ist in
  Git und Dateisystem verifiziert;
- erst dann wird das persistente Goal als `complete` markiert.
