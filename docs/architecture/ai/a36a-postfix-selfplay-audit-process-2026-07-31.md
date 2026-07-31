# A36A Postfix Selfplay – Audit- und Implementierungsprozess

Stand: 2026-07-31
Branch: `codex/a36a-postfix-selfplay-audit`
Worktree: `C:\Projekte\NETGRID_AI_A36A_POSTFIX_SELFPLAY`
Audit-Ausgangscommit: `bba28dff5f109a77b6db2a9c7d2d588dc1c698f4`
Freigabe: vollständige Umsetzung nach Nutzerabstimmung

## /Goal

Die drei belegten Fehler D45, D47 und Zustand 107 werden mit
spielgleichen roten Decision-Checkpoints abgesichert und durch generische,
plan-first-konforme Verbesserungen behoben. Parallel wird die
Deck-Doctrine so erweitert, dass sie aus Kartenfähigkeiten konkrete
Provider, Abhängigkeiten, Engine-Linien und Entwicklungstendenzen ableitet,
ohne Karten- oder Zielentscheidungen aus den zuständigen Planmodulen zu
ziehen. Jeder Arbeitsschritt wird einzeln committed; nach vollständiger
Verifikation wird der Branch lokal nach `main` integriert und der Worktree
entfernt.

Deckpaarung der führenden Evidence:

- Runner: `Rent-I-Con: Das Shellspiel`
  (`standard_runner_rent_i_con_shellspiel_2026_07_17`,
  `fnv1a:518ccd75`)
- Corp: `Universal Fast Advance`
  (`standard_corp_universal_fast_advance`,
  `fnv1a:94aba061`)

## Ausgangslage und Evidence

Das vollständige Hard-vs.-Hard-Selfplay
`a36a-postfix-selfplay-20260731-002` endete nach 85 Decisions replay-sauber
mit 7:0 für die Corp. Alle 85 Decisions wurden einzeln klassifiziert.
Belegt sind:

- **D45:** Bodyweight™ Synthetic Blood wird mit dem letzten Click in einen
  garantierten Drei-Karten-Überlauf gespielt, obwohl Rent-I-Con legal
  installierbar ist und die bekannte Coverage-Lücke schließt.
- **D47:** Der nachfolgende Pflicht-Discard verwirft Rent-I-Con als einzige
  unmittelbar verfügbare Universal-Coverage, obwohl bestehende Pläne
  `find_breaker_first` melden.
- **Zustand 107:** Ein zweiter Seed bricht nach 107 korrekten Actions mit
  `step_target_mismatch` im Plan `runner.shell_traders_pipeline` ab, weil
  dessen Candidate-Filter die gebundene Zielkarteninstanz nicht erneut
  prüft.
- Der vollständige Hint-/Consumer-Audit beider Decks ist grün. Die Ursache
  liegt nicht in fehlenden Karten-Hints, sondern in semantischer
  Klassifikation, planübergreifender Endzustandsbewertung,
  Planbedarf/Kartenhaltung und exakter Zielmaterialisierung.

Führende Audit-Evidence:
`docs/reviews/ai/a36a-postfix-selfplay-evidence-2026-07-31.md`.

## Architektur-Preflight und Ownership

Vor dem ersten Codepatch gelten
`packages/ai/AGENTS.md`,
`docs/architecture/ai/README.md` und die relevanten Verträge aus
`docs/architecture/ai/ai-plan-layer-target-state-wip.md`.

Die fachliche Ownership wird nicht verändert:

- `runner.rig_and_coverage` besitzt Coverage-, Provider- und
  Recovery-Bedarfe.
- `runner.develop_board_and_hand` besitzt planfähige Handentwicklung und
  Draw-/Durchsatzrouten.
- `runner.shell_traders_pipeline` besitzt konkrete Shell-Traders-Quellen,
  Zielkarten, Counter- und Installationsfortsetzungen.
- Run-/Pressure-Pläne besitzen Run-, Break- und Probe-Entscheidungen.
- Der TurnPlanner vergleicht zertifizierte Restzuglinien; er erhält keine
  karten- oder deckspezifische Sonderpriorität.
- Choice-Resolver vervollständigen nur die Payload einer bereits gebundenen
  Action. Sie dürfen weder `actionId`, Executor, Plan, Route, Ziel noch
  Strategie neu wählen.

Wiederverwendet werden insbesondere `AiDeckStrategyProfile`,
`CapabilityPlanNeed`, `ProjectedDecisionFrame`, `TurnProjectionDelta`,
`ProjectedHandDisposition`, `projectedCleanup` und
`PlanExecutionOrigin`. Es entsteht weder ein zweiter Scheduler noch eine
parallele Bewertungs- oder Fallbackautorität.

## Verbindliche Arbeitspakete

### P0 – Evidence, Prozessvertrag und Main-Abgleich

- Auditbericht, geschlossenen Decision-Nenner und Wissenslog versionieren.
- Diesen Umsetzungsvertrag mit Invarianten, Nichtzielen und Gates
  versionieren.
- Danach den inzwischen fortgeschrittenen lokalen `main` defensiv in den
  Arbeitsbranch integrieren und Konflikte in Wissens-/Architekturdateien
  absichtlich auflösen.

**Gate:** eigener Dokumentationscommit, sauberer Diff, aktueller
`main`-Stand im Arbeitsbranch.

### P1 – Rote spielgleiche Checkpoints

- Private Checkpoints für Zustand 107 sowie D45 und D47 aus der lokalen
  Audit-Evidence in minimale versionierte Szenarien überführen.
- Rot belegen:
  - falsche beziehungsweise fehlende Shell-Traders-Zielmaterialisierung;
  - Bodyweight-Linie mit garantiertem Überlauf vor akuter Coverage;
  - Discard der einzigen planakuten Coverage.
- Positive und negative Gegenfälle ergänzen, damit kein pauschales
  Bodyweight-, Draw-, Probe-Run-, Shell- oder Discard-Verbot entsteht.

**Gate:** die drei Fehler sind auf dem unveränderten Verhalten reproduzierbar
rot; Engine-/Replay-Integrität bleibt grün. Der rote Checkpoint-Commit darf
keine Verhaltensänderung enthalten.

**Rotnachweis:** Auf dem mit `main` abgeglichenen Stand reproduzieren die
Checkpoints D45, D47 und Zustand 107 exakt die drei Befunde. Der fokussierte
Lauf umfasst 43 Tests: 39 bestehende beziehungsweise Gegenfalltests sind
grün; rot bleiben D45, D47, der Zustand-107-Runtimefehler und die neue
planlokale Ziel-Gegenprobe. Der Roomy-Hand-Gegenfall bestätigt, dass
Bodyweight™ Synthetic Blood bei ausreichender Cleanup-Kapazität weiterhin
zulässig ist.

### P2 – Semantische Provider- und Doctrine-Grundlage

- Breaker und Breaker-Unterstützung generisch trennen. Eine Karte, die
  Credits für Icebreaker bereitstellt, wird dadurch nicht selbst zum
  Breaker.
- Provider-Definitionen von konkreten Kopien unterscheiden.
- Capability-Abhängigkeiten, Provider-Kritikalität, kompatible
  Ressourcenbeziehungen und marginale Additivität modellieren.
- Generische Engine-Linien ableiten:
  - persistente Rig-Entwicklung;
  - konsumierbare Coverage mit Recovery;
  - verzögerte Installation/Staging;
  - kompatible wiederkehrende Economy;
  - Kartendurchsatz bis zur nachweisbaren Bereitschaft.
- Planmodule dürfen abstrakte Doctrine-Beiträge deklarieren; die Doctrine
  darf daraus keine konkrete Action-, Karteninstanz- oder Zielentscheidung
  ableiten.

**Gegenfälle:** Deck ohne Shell erzeugt keine Staging-Linie; Deck ohne
Recovery keinen Recovery-Schwerpunkt; stabiles konventionelles Breaker-Deck
keinen Recyclingmodus; Bypass-/Tempo-Deck behält seine eigene Linie;
Recurring Credits zählen nur bei kompatibler Nachfrage; zusätzliche
Shell-Kopien können additiv, redundante Recovery-Kopien nicht automatisch
additiv sein.

**Ist-Nachweis:** Das generische Provider-/Abhängigkeitsmodell unterscheidet
Providerdefinitionen und Kopien, klassifiziert Rent-I-Con als einzige
Breaker-Providerdefinition des geprüften Decks und hält Cortical Cybermodem,
Cloak sowie Vewy Vewy Quiet korrekt als Breaker-Unterstützung. Die
Doctrine-Gegenfälle und bestehenden Strategie-/Capability-Tests bestehen
mit 58/58 Tests; der AI-Typecheck ist mit 8-GB-Heap grün.

### P3 – Doctrine-Verbrauch in bestehenden Plan-Ownern

- Der bestehende Fluss bleibt
  `ownDeckStrategyProfile → Strategic Intent → Planmodule/PlanNeeds →
TurnPlanner`.
- `runner.rig_and_coverage` veröffentlicht konkrete Coverage- und
  Recovery-Bedarfe aus der generischen Doctrine.
- `runner.develop_board_and_hand` kann dafür geeignete persistente
  Entwicklung, Staging, Recovery und kompatible Recurring-Quellen als
  plangebundene Supportphasen verwenden.
- Früher Kartendurchsatz wird als Bereitschaftstendenz modelliert:
  hohe Such-/Draw-Neigung nur solange Kernabhängigkeiten fehlen und
  ausreichende Handkapazität beziehungsweise eine vorgelagerte
  Staging-Linie besteht.
- Erste Recovery-Infrastruktur darf bei unterstützter Engine-Linie
  vorausschauend wertvoll sein; redundante Kopien benötigen belegten
  Zusatznutzen.

**Gate:** Doctrine beeinflusst ausschließlich Intent, Planbedarfe und
planinterne Routen. Kein globaler Kartenbonus und kein Deckname-Sonderfall.

### P4 – Zertifizierte Zugendprojektion und Kartenhaltung

- Konkrete Credits, Clicks, bekannte Kartenänderung, bekannte
  Quellenverbräuche, Cleanup-Discardbereich und
  `ProjectedHandDisposition` für vergleichbare Restzuglinien projizieren.
- Bodyweight und andere Draw-Effekte mit ihrer tatsächlichen bekannten
  Handänderung und dem sicheren Cleanup-Überlauf bewerten.
- Reservewerte bleiben planabhängig; ein Plan darf einen begründeten
  Reserveboden besitzen. Der Turnvergleich muss jedoch alle Linien nach
  demselben tatsächlichen Endzustandsvertrag sehen.
- Ein `CapabilityPlanNeed` kann die konkrete einzige bekannte
  Providerinstanz als `support_for_need` beziehungsweise `campaign_hold`
  binden, sofern keine gleichwertige, ausführbare Alternative oder
  Recovery-Route existiert.
- Der Discard-Resolver setzt nur diese bereits planseitig ermittelte
  Disposition in der Payload um.

**Gate:** D45 und D47 werden grün; `actionId`, Executor,
PlanExecutionOrigin und Plan-Owner des Pflichtfensters bleiben stabil.

### P5 – Exakte Shell-Traders-Zielbindung

- `runner.shell_traders_pipeline` filtert aktuelle Candidates gegen die
  gebundene `targetCardInstanceId`.
- Quelle, Ziel, Action und Step werden bei der Rematerialisierung exakt
  geprüft.
- Fehlt der exakte Candidate, blockiert/replant der Plan an der bestehenden
  Grenze; ein anderes Ziel wird nie als Ersatz materialisiert.
- Der allgemeine harte `step_target_mismatch`-Schutz bleibt unverändert.

**Gate:** Zustand 107 und Ziel-Gegenproben werden grün; Planmodul und
Ausführungsursprung bleiben `runner.shell_traders_pipeline`.

### P6 – Breite Verifikation und neues Selfplay

- fokussierte Unit-, Plan-, Choice-, Projection-, Doctrine- und
  Decision-Checkpoint-Tests;
- AI-Typecheck und bestehende Hint-/Consumer-/Doctrine-Gates;
- vollständiger Lauf `corepack pnpm test:ai:shards`;
- isoliertes In-Process-Selfplay mit exakt den beiden bekannten Decks,
  festen Seeds und ohne Server, Standardports oder Haupt-SQLite;
- vollständige Spielanalyse nach dem NETGRID-Decision-Audit-Verfahren,
  einschließlich aller KI-Decisions, Replay, Nenner, D45/D47/D107 und
  negativer Kontrollen.

Ein abweichender neuer Spielverlauf ist zulässig; erfolgreich ist nur ein
Lauf ohne verdeckten harten Fehler und ohne Regression der belegten
Invarianten.

### P7 – Abschluss, Integration und Bereinigung

- Evidence-Bericht, Prozessseite und Wissenslog mit Ist-Ergebnissen,
  Testzahlen und verbleibenden offenen Beobachtungen abschließen.
- Jeden fachlich abgeschlossenen Schritt einzeln committen.
- Arbeitsbranch defensiv auf den dann aktuellen lokalen `main` abgleichen,
  Abschlussgates wiederholen und lokal nach `main` integrieren.
- Merge-Stand verifizieren, Worktree entfernen und den vollständig
  integrierten Arbeitsbranch löschen.

## Nichtziele

- kein pauschales Verbot von Probe-Runs;
- keine decknamen- oder matchbezogene Sonderregel;
- kein pauschales Bodyweight-, Draw-, Discard- oder Shell-Verbot;
- keine zweite Choice-, Action-, Ziel- oder Schedulerautorität;
- kein Umbau der Engine-Regelautorität oder des LegalAction-Vertrags;
- keine Ausweitung privater Debugsichtbarkeit auf öffentliche Datenflächen;
- keine Arbeit an Why-not-Abdeckung, sofern sie nicht unmittelbar aus bereits
  vorhandenen plan-owned Blockergründen ohne neue Entscheidungslogik folgt;
- keine Server-/Webclient-Starts und kein Zugriff auf Standardports oder die
  SQLite-Dateien des primären Checkouts.

## Abbruch- und Replangrenzen

Der Paketprozess hält an, wenn ein roter Spielzustand nicht reproduzierbar
ist, ein Fix eine zweite Entscheidungsautorität erfordern würde oder ein
breites Gate eine nicht lokal erklärbare Regression zeigt. Ein einzelner
neuer Selfplay-Ausgang ersetzt keine strukturellen Tests. Neue
Informationen dürfen den nächsten Paketinhalt präzisieren, aber nicht die
festgelegten Ownership- und Safety-Invarianten abschwächen.

## Abschlusskriterien

- D45, D47 und Zustand 107 sind spielgleich rot gesichert und anschließend
  grün.
- Alle vorgesehenen Gegenfälle bestehen.
- Doctrine-Modell und sein Verbrauch bleiben generisch und plan-first.
- Keine neue Fallback-, Resolver-, Choice-, Ziel- oder
  Schedulerentscheidung ist entstanden.
- AI-Typecheck, vollständige AI-Shards, Replay und isoliertes Selfplay sind
  grün.
- Der Abschlussbericht benennt jede geprüfte KI-Decision und trennt
  behobene Fehler von verbleibenden qualitativen Beobachtungen.
- Alle Pakete sind einzeln committed, lokal in `main` integriert und
  Worktree sowie Branch verifiziert entfernt.

## Ist-Abschluss P1–P6

Die fachlichen und technischen Gates sind erfüllt:

- D45, D47 und Zustand 107 wurden zunächst spielgleich rot gesichert und
  anschließend grün gemacht.
- Doctrine, Planbeiträge, Handdisposition, Restzugprojektion und
  Shell-Traders-Fortsetzung bleiben bei den oben festgelegten Ownern.
- Im ersten Postfix-Selfplay wurden zusätzlich zwei generische Restursachen
  gefunden und mit Gegenproben beseitigt:
  - Vorbereitungen mit null Shell-Countern werden abgelehnt, weil kein
    letztes Counter-Entfernungsereignis eintreten kann.
  - Der generische Marker `action_gated_search` ersetzt nicht mehr die
    spezifischen Utility-Familien Recovery, Programmsuche, Stacksuche oder
    Hidden-Zone-Suche.
- Das identische Abschluss-Selfplay
  `a36a-postfix-selfplay-20260731-002` endet nach 109 Decisions mit 7:0 für
  die Corp. Replay und StateHash sind konsistent; illegale Actions,
  Fallbacks, Timeouts, Runtimefehler und harte Planfehler stehen jeweils bei
  null.
- Der geschlossene Decision-Nenner beträgt 109/109. Das vollständige Ledger
  liegt in
  `docs/reviews/ai/a36a-postfix-selfplay-final-audit-2026-07-31.md`.
- `corepack pnpm test:ai:shards` besteht mit 542 Datei-Shards und 4432 Tests.
  Der AI-Typecheck besteht mit `NODE_OPTIONS=--max-old-space-size=8192`.

Als qualitative Restpunkte bleiben eine stärkere Bewertung der
Wiederherstellungsdauer vor dem Konsum einer kritischen Single-Definition-
Coverage, die serverübergreifende Remote-/Zentral-Allokation des
Corp-Defense-Portfolios und ein zeilenübergreifenderes
`scoreWindowMissed`-Messverfahren. Diese Punkte rechtfertigen keine lokalen
Sonderboni oder eine neue Entscheidungsautorität.
