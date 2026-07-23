# Aktueller Projektstatus

Stand: 2026-07-23

## Führender Produktstand

- NETGRID ist eine private Version-0-Webanwendung mit deterministischer Rules
  Engine, lokalem/private-LAN-Multiplayer, SQLite-Storage, Deckbibliothek,
  Kartenkatalog, Replay-/Undo-Grundlage, Human-vs-Human, Human-vs-KI und einem
  beobachtbaren KI-vs-KI-Matchmodus.
- Die Engine ist alleinige Regelautorität. UI, Server und KI reichen nur
  vorhandene `LegalActions` ein; `applyAction` revalidiert den vollständigen
  Vertrag.
- Hidden-Info-Schutz, Replay, StateHash und seedbasierte Zufallsnachweise sind
  verbindliche Gates.
- Der detaillierte Release-/Phasenstand liegt in `docs/codex/CODEX_STATUS.md`;
  die konsolidierte Folgeplanung liegt unter
  `docs/releases/roadmaps/netgrid-consolidated-release-roadmap.md`.
- Matches sind standardmäßig öffentlich und besitzen dafür genau den
  unveränderlichen Erstellungsflag `isPublic`. Öffentliche offene Matches sind
  beitretbar, aktive Matches über eine Hidden-Info-sichere read-only
  Projektion zuschaubar und beendete Matches als Full-Information-Lern-Replay
  in derselben Oberfläche wie die laufende Partie abspielbar. Oben wird
  zwischen Runner und Korp gewechselt; die jeweilige eigene Hand erscheint
  normal im Board. Eine künstliche Analysefläche oder ein separates
  Gegnerhandfenster gibt es nicht. Alle vorhandenen Matches werden einmalig
  rückwirkend öffentlich normalisiert; der Auditstand beträgt 21/21
  öffentliche und 19/19 replayfähige terminale Matches.
- Der globale Bereich `Spiele` ordnet diese öffentlichen Matches als offen,
  laufend und abgeschlossen, filtert nach diesen Zuständen und führt direkt
  zu Beitritt, Zuschaueransicht oder Replay. `Meine Spiele` ist davon getrennt
  und liefert nur serverseitig gebundene Matches des angemeldeten Accounts,
  einschließlich eigener privater Partien. Abgeschlossene Ergebnisse liegen
  als immutable Snapshots in der kompakten Matchzeile; warme Listenabrufe
  hydrieren keine vollständigen Historien mehr. Führend ist
  `docs/reviews/public-game-directory-and-personal-history-final-review-2026-07-20.md`.

## Engine und Karten

- Originalset, Classic und Proteus besitzen versionierte Kartendaten,
  Supportmanifeste und Engine-Implementierungen.
- Classic ist mit 54/54 Karten technisch abgeschlossen und als optionales
  Zusatzset verfügbar.
- Proteus ist mit 154/154 Karten engine-/human-playable. Technisches
  `ai_supported` ist von Play-Strength-Readiness und Default-/Random-Pool-
  Promotion getrennt.
- Die einmalige Proteus-Spoiler-Importpipeline und ihre blockierte
  Planungskopie sind entfernt. Aktuell führend sind die unveränderte
  Spoilerquelle, `data/cards/proteus-cards.json`, das Supportmanifest und die
  Runtime-Implementierungen.
- Kartenimplementierungen, PlayerViews, PublicEvents, Replay und StateHash
  werden durch paketnahe Engine- und Visibilitytests abgesichert.
- Normale Creditgewinne von Runner und Korp verwenden eine zentrale,
  typisierte Gain-Pipeline. Sie unterscheidet Grundbetrag, zusätzliche
  Regelcredits, abgefangene Credits und tatsächliche Gutschrift; deklarative
  Effekte, Resolver, Access, Run, Trace, Subroutinen, Turneffekte,
  gehostete Entnahme und temporäre Pool-Gutschriften sind angebunden. Setup,
  Setzen, Bezahlen und Verlust bleiben getrennte Semantiken. Elena Laskova
  modifiziert dadurch auch Resolver wie Finders Keepers korrekt innerhalb
  derselben Gain-Auflösung. Führend ist
  `docs/reviews/engine/central-credit-gain-pipeline-final-review-2026-07-19.md`.
- Allgemeine Asset-/Upgrade-Rezfenster während Runs gelten über alle
  Corp-Server. ICE-Rez und fortgebundene Sonderfenster bleiben am Runziel;
  Encounter und laufende Trace-Versuche öffnen kein zusätzliches normales
  Rezfenster. Im Movement entscheidet der Runner zuerst über das normale
  Jack-out; erst nach „Weiter“ öffnet die Engine das blockierende
  Nicht-ICE-Rezfenster. Danach gibt es vor Approach beziehungsweise Access
  kein zweites normales Jack-out. Kartenspezifische Rez-Interrupts bleiben
  davon getrennt. Der konkrete Hacker-Tracker-Fall rezzt die Karte in Remote 2
  während eines Runs auf Remote 1 und führt sie anschließend regelkonform in
  den Trace. Führend sind die abgeschlossene Activity
  `act-2026-07-19-post-jack-out-root-rez-window` und
  `docs/reviews/engine/global-run-rez-windows-final-review-2026-07-16.md`.
- Installierte Corp-Assets mit semantischem Zugriffseffekt wirken
  standardmäßig nur gerezzt. Der aktive Pool umfasst zehn Access-Nodes unter
  56 Corp-Assets: sieben folgen dem Rez-Default, `Virus Test Site` ist die
  einzige belegte installierte Unrezzed-Ausnahme und macht dann genau 1 Net
  Damage; Bel-Digmo und Stereogram wirken nur aus R&D beziehungsweise
  Archives. Führend ist
  `docs/reviews/engine/node-access-rez-contract-final-review-2026-07-15.md`.
- City Surveillance löst Runner-Mehrfachziehen als fortsetzbare Sequenz auf:
  Vor jeder tatsächlich gezogenen Karte kann die Korp eine installierte,
  bezahlbare Draw-Tax-Quelle rezzen; danach wählt der Runner pro gerezzter
  Quelle einzeln 1 Credit oder 1 Tag. `Jack 'n' Joe`, Fünf-Karten-Draws,
  mehrere Quellen und Crash Everetts Zusatzdraw sind abgedeckt. Effekte ohne
  das Wort „draw“, insbesondere `Arasaka Owns You` mit „refresh your hand“,
  verwenden keinen Draw-Tax-Pfad. Führend ist
  `docs/reviews/engine/city-surveillance-draw-sequence-final-review-2026-07-14.md`.

## KI

- Das WIP-Zielkonzept
  `docs/architecture/ai/ai-plan-layer-target-state-wip.md` führt die
  verteilten Verträge für Deckstrategie, Strategic Intent, Tactical Goals,
  Tactical Plans, Portfolio, Ressourcen und Folgeaktionen zu einer
  Plan-first-Zielarchitektur zusammen. Im Zielzustand wählen getrennte
  Runner-/Corp-Scheduler zuerst einen autoritativen Plan und Step; erst
  innerhalb dieses Steps wird eine vorhandene LegalAction ausgewählt.
  Aktuelle und angestrebte Planmodule, Lebenszyklus, Parent-/Supportpläne,
  Commitments, EndTurn-Invariante, Highlighter-R&D- und
  Manhunt-Flatline-Akzeptanzszenarien sowie spätere Implementierungsgates sind
  dokumentiert. Dies ist ein Architekturziel und noch keine Behauptung über
  den vollständig erreichten Runtime-Stand.
- Runner-Fehlentscheidungen aus dem aktiven Match
  `match_fd22cad3cc454a9e` sind ohne produktive Laufzeitänderung als exakte
  Decision-Checkpoints gesichert. Die zweite redundante
  `Psychic Friend`-Installation und drei sofortige Zugenden mit vier
  Restklicks bleiben rote `behavior_regression`-Evidence. Erste sinnvolle
  `Matador`-/`Psychic Friend`-Installationen, null-Klick-Zugenden und ein
  sicherer sofortiger Zugabschluss für den deterministischen Corp-Deckout
  schützen die zulässigen Nachbarfälle.
- Diagnosemetriken zählen im 60-Spiele-Current-State-Lauf 22 vorzeitige
  Runner-Zugenden und 16 redundante negativ bewertete Installationen; 29
  sichere Deckout-Zugenden werden separat erkannt. Der Lauf besitzt keine
  Illegal-Action-, Replay-, Runtime-, Hidden-Info- oder Redaktionsverletzung,
  erreicht aber in einem davon unabhängigen reproduzierbaren Slot das
  480-Aktionen-Limit. Führend sind
  `docs/reviews/ai/runner-action-valuation-regression-evidence-2026-07-23.md`
  und
  `docs/reviews/ai/runner-action-valuation-regression-final-review-2026-07-23.md`.

- Die Economy-KI besitzt einen gemeinsamen side-sicheren Vertrag von der
  LegalAction-Ressourcenprojektion bis zur Planebene. Kleine monotone
  Grundwerte ordnen vergleichbare liquide Sofortgewinne; typisierte
  `CreditDemand`s geben akuten Breaker-/Run-/Score-/Rezblockern Vorrang vor
  Vordergrund-, Next-turn- und Reservebedarf. Der höchste kompatible
  Bedarfsbonus gilt für alle Economy-Action-Typen genau einmal.
  `FundingRoute`s planen begrenzt über Same-turn, nächsten eigenen Zug und
  höchstens drei eigene Züge. Kontingente Routen dürfen gewählt werden, lösen
  harte Blocker aber nicht ohne garantierte Route. Planportfolio-
  Reservierungen verhindern Doppelverwendung derselben Credits.
- Corporate Coup und BBS sind finite Auszahlungspools ohne strategisches
  Halten; Broker bleibt eine eigenständige Aufbau-/Cashout-Bank. Gemischte
  Actions verrechnen Kartenverbrauch und Draw als Netto-Handdelta,
  verzögerte Economy braucht einen passenden Reserveplan. Der vergleichbare
  Abschlusslauf über 60 Spiele und 10.957 Entscheidungen hat keine Hard
  Failures, Action-Limits oder klar dominierte Planwahl. Führend sind
  `docs/architecture/ai/ai-economy-funding-routes-implementation-process-2026-07-21.md`
  und
  `docs/reviews/ai/ai-behavior-baseline-v1-economy-funding-routes-2026-07-21.md`.

- Die Aktionsökonomie besitzt nun denselben durchgängigen Vertrag:
  `PlayerView.own.clicks` liefert den aktuellen Bestand, LegalActions und
  normalisierte Kartenhints projizieren unmittelbare, eingeschränkte,
  gespeicherte, wiederkehrende, zufällige und geschuldete Kapazität.
  Typisierte `ActionDemand`s und begrenzte `ActionCapacityRoute`s bewerten
  Quellen nach ihrer garantierten kompatiblen Folge statt nach einem hohen
  pauschalen Aktionswert. Planportfolio-Reservierungen verhindern
  Doppelverwendung; wiederkehrende Quellen werden nur über einen nutzbaren
  Horizont amortisiert.
- Overtime kann garantierte Same-turn-Scorefolgen schließen, Corporate Boon
  darf für eine gebundene spätere Linie gehalten werden, und eingeschränkte
  Bursts ohne kompatiblen Demand oder Planbeitrag werden nicht von einem
  allgemeinen Handkartenplan erzwungen. Selbstfinanzierende Runs gelten
  bereits in ihrer Quellaktion als konvertiert. Der vergleichbare
  P7-Abschluss über 60 Spiele und 11.040 Entscheidungen hat keine Hard
  Failures, keine
  verpassten Scorefenster, keine dominierte Planwahl und bei 45 Nutzungen
  null Fehlkonversionen. Der finale Integrationslauf nach Einbindung des
  aktuellen Main-Stands umfasst 10.974 Entscheidungen und 43 Nutzungen mit
  43 Folgekonversionen sowie weiterhin null Fehlkonversionen. Führend sind
  `docs/architecture/ai/ai-action-capacity-routes-implementation-process-2026-07-22.md`
  und
  `docs/reviews/ai/ai-behavior-baseline-v1-action-capacity-routes-2026-07-22.md`.

- Die Deckstrategie-Ableitung ist für 40 aktive Standarddecks, 21 versionierte
  Snapshots und alle 24 Strategy-IDs vollständig gegatet. 39 aktive Decks
  besitzen eine produktive Primärstrategie; Ghost Circuit bleibt wegen zwei
  realer Breaker-Coverage-Lücken bewusst neutral. Runtime-, Target-/Reserve-,
  Goal-, Action-Fit- und Metadaten-Consumerverträge sind geschlossen; ein
  Deckstrategie-Run kann eine ausdrücklich höher bewertete begonnene
  Broker-Bankaufladung nicht mehr blockieren. Führend ist das Abschlussreview
  vom 18.07.2026 unter `docs/reviews/ai/`.
- Die Vollbestandsremediation aller 618 aktiven Kartenhints ist umgesetzt und
  verifiziert. 17 konkrete Kartenfehler und 28 rohe Signaltransporte wurden
  korrigiert, alle coverage-pflichtigen Taktiksignale besitzen Consumer oder
  explizite Policy, und Value-, Pair-, Mechanik- sowie Szenariometadaten sind
  runtimewirksam oder ausdrücklich Evidence-only. Alle Hints sind geprüft;
  Hint-Quality und Target-Profile-Gates stehen bei null offenen Fällen.
  Führend sind der Vollbestandsaudit, der Remediationprozess und das
  Abschlussreview vom 18.07.2026.
- Die Semantic Runtime ist der einzige produktive Entscheidungsweg.
- `@netgrid/ai` exportiert nur Live-Verträge; Simulation, Selfplay und
  Benchmarks liegen unter `@netgrid/ai/simulation`.
- Alte Corp-/Runner-Planer, Baseline-Selectoren, Shadow-/META-/Readiness-
  Runtime, Kill-Switches und der frühere AI-Monolithtest sind entfernt.
- Ein Repository-Gesamtcheck hat zusätzlich elf verwaiste Helfermodule der
  früheren KI-Baseline-/Legacy-Bewertung entfernt; der anschließende
  Importscan enthält keine ungenutzten App-/Package-Module mehr.
- Der Coverage-Restpfad ist fail-closed und darf nur ausdrücklich sichere
  Engine-Fortsetzungen auswählen.
- Der produktive Auswahlweg ist über `AiDecisionDebug.decisionChain`
  verhaltensneutral beobachtbar: LegalActions, semantische Ausschlüsse,
  Rohscore-Sieger, Plan-Mapping, Plan-vs.-Score-Arbitration, feste
  Sonderprioritäten, nachgelagerte Anpassung und Choice-Auflösung werden
  side-sicher getrennt ausgewiesen. Spielgleiche Decision-Checkpoints können
  diese Auswahlroute zusätzlich zur finalen Action prüfen.
- Der bestehende SQLite-KI-Trace ist die einzige dauerhafte Diagnoseablage für
  diese Kette: `summary` speichert sie kompakt, `detailed` vollständig im
  gleichen `ai_decision_traces.trace_json`; ein zweiter Speicherpfad entsteht
  nicht.
- Der bestehende Plan `corp.create_score_window` erkennt vollständige
  Same-Turn-Konversionspfade aus Aktionsgewinn, Advancement-Platzierung,
  Countertransfer und Basic Advances. Vapor Ops und andere Werkzeuge werden
  funktionsbasiert erkannt; ungeschützte Agenda-Installationen bleiben ohne
  garantierten Abschluss gesperrt.
- Die spielgleiche Runner-Endgame-Remediation aus Match 424A trennt vorhandene
  Breaker-Coverage von fehlender Gesamtbezahlbarkeit, bewertet Run-Events über
  ihren wirklichen Zielpfad, schützt finanzierte neue Entwicklung und lässt
  negative Backup- oder Hintergrund-Bankpläne bei akut besserer sichtbarer
  Konvertierung weichen. Fall Guy wird im konkreten legalen
  Tag-Vermeidungsfenster statt `pass` genutzt. Führend ist
  `docs/reviews/ai/ai-match-424a-runner-endgame-remediation-final-2026-07-15.md`.
- Die Corp-Entscheidungsfenster aus Match e2f2 sind mit zehn spielgleichen
  Checkpoints geschlossen. Rez-Ertrag, Mehrkarten-Draw und Credit-Überschuss
  werden getrennt bewertet; erfolgreicher R&D-Druck bleibt über Runner-Züge
  bestehen. Matchpoint-HQ-Schutz verlangt sichtbare Agendaexposition und geht
  einem garantiert vollständigen Same-Turn-Scorepfad nicht vor. Der
  45-Karten-Audit von `Universal Fast Advance` meldet null Blocker und null
  Warnungen; 444 AI-Testdateien mit 3.109 Tests sind grün. Führend ist
  `docs/reviews/ai/match-e2f2-corp-decision-windows-remediation-final-review-2026-07-22.md`.
- Die ECFE3CE-Remediation führt sichtbare Trace-Vermeidung und spätere
  ICE-Kosten durch einen gemeinsamen Credit-Pool und revalidiert Run-Sperren
  quellenunabhängig im tiefsten `startRun`-Pfad. Fang, All-Nighter, Private LDL
  Access, Bodyweight Synthetic Blood und TKO 2.0 sind von der Hintquelle bis
  zu ihren produktiven Consumern korrigiert. Die getrennte Broker-Analyse
  bestätigt Optimierungsbedarf bei letztem Lade-Klick, Mehrkopien-
  Amortisation, Quellenwahl und einem frühen Cashout; Broker-Code wurde dafür
  noch nicht geändert. Führend ist
  `docs/reviews/ai/match-ecfe3ce-engine-hints-remediation-final-2026-07-16.md`.
- Die zwei zuletzt abgeschlossenen Corp-KI-Spiele vom 17.07.2026 sind mit
  192/192 Decisions analysiert und behoben. Geschützte Scorelines können
  spekulative Punish-Pläne konvertieren, Score-Remote-Roots bleiben für
  Agenden frei, contestable Agenda-Risiken berücksichtigen den Punktwert und
  ausreichend geschützte Matchpoint-Linien werden nicht pauschal blockiert.
  Nicht-ICE-Rezzes verwenden durchgängig `rez_card`; beide Match-Deck-Audits
  melden null Hint-Blocker und null Warnungen. Führend ist
  `docs/reviews/ai/latest-two-corp-match-remediation-final-review-2026-07-17.md`.
- Das vollständig analysierte Corp-KI-Spiel
  `match_e653f50ac25eed22` ist mit 128/128 Decisions behoben. Verteiltes
  Advancement projiziert pro Ziel statt als Gesamtmenge, riskante
  Agenda-Installationen können eine fälschlich garantierte Same-Turn-Bindung
  nicht mehr absolut durchsetzen, und Synchronized Attack bezahlt
  HQ-Retain-Choices wertbasiert oberhalb einer Fünf-Credit-Reserve. Leere
  Scoring-Remotes bleiben erlaubte Hintergrundprojekte, stehen ohne
  unmittelbaren Scorepfad aber hinter R&D-Grundschutz; kritischer direkter
  Scoreline-Schutz bleibt erhalten. Der 55-Karten-Deckaudit meldet null
  Hint-/Runtime-Lücken und null Strategiewarnungen. Führend ist
  `docs/reviews/ai/match-e653f50a-corp-remediation-final-review-2026-07-19.md`.
- Die Planebene besitzt zusätzlich ein begrenztes Planportfolio: kurzfristige
  Score- und Gefahrenpläne bleiben Vordergrund beziehungsweise Interrupt,
  während Broker-/Bank-Zyklen und langfristige Corp-Scoring-Remotes mit
  höchstens einer Hintergrundaktion pro Zug fortgesetzt werden können.
  `RemoteDoctrineProfile` leitet den Remote-Bedarf aus der eigenen Deckstrategie
  ab; Fast Advance erzeugt keinen pauschalen Glacier-Ausbau. Zielremotes werden
  über Züge gebunden und anhand sichtbarer Pfadkosten sowie Runner-Erholung
  statt nur ICE-Anzahl bewertet.
- Aktuelle Benchmarks vergleichen `random_legal_bot` mit
  `current_candidate`; historische Profilnamen sind keine Runtimeoption mehr.
- AI Behavior Baseline v1 ergänzt diese Profilvergleiche um einen festen
  deckübergreifenden `current_candidate`-Selfplay-Lauf mit sechs Slots, zehn
  Seeds je Slot, 480 Aktionen und normalisierten Verhaltensraten. Der erste
  Lauf umfasst 60 Spiele und 11.144 Entscheidungen; alle Safety-Gates außer
  zwei Aktionslimits im Hybrid-Score/Punish-Slot sind grün. Führend sind
  `docs/architecture/ai/ai-behavior-baseline-v1-process-2026-07-12.md` und
  `docs/reviews/ai/ai-behavior-baseline-v1-initial-run-review-2026-07-12.md`.
- Run-produzierende Kartenfähigkeiten werden inzwischen vor der Auswahl über
  dieselbe Ziel-, Route-, Release- und Commitment-Prüfung wie normale Runs
  geführt. Privates Topdeck-Wissen bleibt als geordnete Sequenz erhalten,
  wandert bei einem bekannten Draw positionsgenau nach HQ und wird bei
  Shuffle oder Reorder invalidiert. Effekt-Consumer prüfen zusätzlich den
  tatsächlichen Zonen-/Aktivzustand; Strategic Runtime, Board-Triage und
  Plan-Memory teilen eine Punkte- und Deadline-Feasibility. Der feste
  Vergleich über 60 Spiele und 11.836 Entscheidungen ist ohne Hard Failure
  akzeptiert. Führend sind
  `docs/architecture/ai/ai-seed01-seed09-seed02-behavior-hardening-process-2026-07-20.md`
  und
  `docs/reviews/ai/ai-behavior-baseline-v1-seed01-seed09-seed02-hardening-candidate-2026-07-20.md`.
- Selfplay- und Testspiel-Laufzeiten sind ohne fachliche Abstriche gehärtet:
  semantische Ableitungen werden nur innerhalb einer Entscheidung
  wiederverwendet, Vollhistorie und echter 80-Ereignis-Tail teilen bereinigte
  Eventobjekte, und Side-Safety arbeitet strukturell ohne Vollstringkopie. Der
  feste 240-Aktionen-Fall sank bei bitgleicher Summary, ActionSequence und
  StateHash um 21,8 Prozent. Baseline-Slots laufen ab vier Slots konservativ in
  isolierten Prozessen; vollständige Raw-Evidence wird atomar gestreamt und
  optional verlustfrei als `.gz` geschrieben. Führend sind
  `docs/architecture/ai/ai-selfplay-performance-optimization-process-2026-07-20.md`
  und
  `docs/reviews/ai/ai-selfplay-performance-optimization-final-review-2026-07-20.md`.
- Das anschließende Profil der eigentlichen KI-Kernlaufzeit hat identische
  Runner-Run-Target-, Handentwicklungs- und Install-Fit-Ableitungen innerhalb
  einer Entscheidung sowie allokationsintensive Markerprüfungen als weitere
  Schwerpunkte bestätigt und optimiert. Der bereits optimierte feste
  240-Aktionen-Lauf sank bei bitgleichen kompakten und vollständigen
  Raw-Artefakten nochmals von 22,854 auf 18,512 Sekunden; die profiliert
  gemessene KI-Entscheidungszeit sank von 11,664 auf 5,051 Sekunden. Der
  Standard-Benchmark profitiert automatisch über seinen öffentlichen
  `chooseAiAction`-Pfad. Führend sind
  `docs/architecture/ai/ai-core-runtime-performance-followup-process-2026-07-20.md`
  und
  `docs/reviews/ai/ai-core-runtime-performance-followup-final-review-2026-07-20.md`.
- Der Runner-Survival-Progress-Vertrag bindet Basic Credits jetzt an eine
  sichtbare konkrete Reaktions- oder Prevention-Lücke. Ohne Handgewinn,
  Risikoreduktion oder verringerte Reservelücke verliert der Plan seine TTL
  und seine absolute Arbitration. Im 60-Spiele-Panel sinken die bestätigten
  nichtprogressiven Survival-Credit-Folgen in Net-Damage-08/-09 und
  Hybrid-04/-07 vollständig auf null; C-09 nutzt nur einen konkret
  finanzierenden Credit von 3 auf das sichtbare Ziel 4 und endet nach 416
  statt 480 Aktionen regulär. Drei unabhängige Action-Limits in Net-Damage-07,
  Hybrid-01 und Hybrid-05 bleiben offen. Führend ist
  `docs/reviews/ai/ai-behavior-baseline-v1-runner-survival-progress-2026-07-18.md`.
- Der Planportfolio-Rollout wurde zusätzlich gegen einen isolierten
  Hybrid-Control am exakten Ausgangs-Commit geprüft. Control und Kandidat
  besitzen jeweils vier bereits vorhandene Aktionslimit-Partien; alle übrigen
  Safety-Gates sind grün. Plan-Konversion und No-Progress verbesserten sich
  leicht, gestiegene Bank-/Plan-Mismatch-Findings und eine Seed-Verschiebung
  bleiben offenes Review-Risiko. Führend:
  `docs/reviews/ai/ai-planportfolio-remote-doctrine-final-review-2026-07-12.md`.
- Aktive AI-Gates: 618 geprüfte Hints, 599 Karten mit statisch gepflegten
  Action-Signalen, 0 zurückgestellt und 0 Target-Profile-Gaps. Der
  Taktiksignalvertrag umfasst 671 Signale und 294 coverage-pflichtige
  Einträge ohne offene Pflichtlücke; das Hint-Quality-Gate meldet 0 Fehler und
  0 Warnungen. `data/ai/ai-card-hints-active.json` ist die einzige statische
  Karten-Hint-Quelle für Runtime, Deckstrategie und Inspector. Die frühere
  Compile-/Derived-Facts-/Manual-Overlay-Pipeline ist entfernt; der Inspector
  baut seine Darstellung direkt aus dieser Quelle auf und besitzt keinen
  zweiten Semantikindex.
- Die neun am 19.07.2026 identifizierten AI-Komplexitätsschwerpunkte wurden
  durch fachliche Owner- und Testsuite-Schnitte aufgeteilt. Der produktive
  Importgraph bleibt frei von Laufzeit- und Typzyklen. Die damalige
  Größen-Gate-Remediation ist als historische Umsetzungsevidence dokumentiert;
  aktuelle Gates verwenden keine Datei-, Zeilen-, Testgrößen- oder
  Runtime-Root-Caps. Führend sind
  `docs/architecture/legacy-simplification-process-2026-07-19.md` und
  `docs/reviews/ai/ai-source-structure-gate-remediation-final-review-2026-07-19.md`.
- Führende Artefakte:
  - `docs/architecture/ai/README.md`
  - `docs/architecture/ai/ai-current-state-cleanup-process-2026-07-09.md`
  - `docs/reviews/ai/ai-current-state-cleanup-final-review-2026-07-09.md`
  - `docs/architecture/ai/corp-score-conversion-capability-contract.md`
  - `docs/architecture/ai/corp-score-conversion-plan-process-2026-07-10.md`
- Der Proteus-AI-Rollout ist lokal in `main` integriert: 154/154 Karten sind
  technisch `ai_supported`, alle 114 Pilotdeck-Karten sind an elf
  Familien-Szenarien gebunden und vier qualifizierte Snapshots liegen im
  AI-Deckpool 1.1.0. Play-Strength bleibt ein getrenntes Gate.

## Server, Web und lokaler Betrieb

- Der Spielstart `Simulation` erstellt ein persistiertes `ai_vs_ai`-Regelmatch
  und öffnet das normale side-sichere Spielbrett. Pause, Einzelschritt,
  getaktetes Weiter, schneller Einzelschritt-Takt und aktiver Abbruch sind
  verfügbar; der frühere interaktive Batchlauf mit 120-Aktionen-Limit ist aus
  diesem Startpfad entfernt. Ein deterministischer Regressionslauf endete nach
  183 Aktionen regulär und blieb nach Reconnect, Replay und StateHash grün.
  Führend sind
  `docs/architecture/ai/ai-vs-ai-observer-process-2026-07-13.md` und
  `docs/reviews/ai/ai-vs-ai-observer-implementation-review-2026-07-13.md`.
- SQLite ist der einzige konfigurierbare Laufzeitstorage. Backup, Restore,
  Inspect, Maintenance, Retention-Schutz und Cleanup arbeiten auf der
  aktuellen SQLite-Datenbank. JSON-Storage und Alt-Schema-Migrationen sind
  entfernt; private Matchdecks werden ausschließlich je Teilnehmer
  gespeichert.
- Wachsende Matchtabellen werden append-or-truncate persistiert; ausführlicher
  KI-Debug liegt dauerhaft nur im Trace-Ledger. Backups sind über
  `VACUUM INTO` konsistent und kompakt, und `storage:optimize` sichert,
  normalisiert, vakuumiert und prüft die Datenbank kontrolliert. Private
  Accountstatistiken verwenden SQL-Aggregate und indexgestützte
  Keyset-Pagination. Führend ist
  `docs/reviews/architecture/sqlite-matchstorage-optimization-final-review-2026-07-19.md`.
- Normale Spieler- und KI-Aktionen verwenden auf SQLite einen bounded
  Aktionsload und einen atomaren Delta-Save. Der PublicEvent-Tail bleibt mit
  Chronicle-Kontext identisch, Receipts und KI-Traces werden gezielt geladen,
  und Versions- oder Historydrift verhindert jeden Teilcommit. Vollständige
  Undo-, Replay-, Maintenance- und Lifecycle-Pfade bleiben unverändert.
  Die lokale 1-/10-/25-Match-Probe blieb mit 36 exakt einmal persistierten
  Receipts grün. Führend ist
  `docs/reviews/architecture/delta-action-persistence-final-review-2026-07-19.md`.
- Die geschlossene V2.0-Passwort-Account-Alpha ist umgesetzt. Accounts werden
  nur durch lokalen Admin-Bootstrap oder einmalige Einladung angelegt;
  widerrufbare Account-Sessions laufen über ein `HttpOnly`-Cookie und bleiben
  von Maintenance- und Match-Capabilities getrennt. E-Mail, Passkeys, MFA und
  öffentliche Registrierung sind noch nicht enthalten. Der CSRF-Nachweis ist
  stabil an die einzelne Session gebunden; Session-Restore, Reload und mehrere
  Tabs invalidieren einander nicht.
- Ein Account kann bis zu 50 ownergebundene persönliche Server-Decks halten.
  40 kuratierte Standard-Decks sind direkt spielbar oder kopierbar; interne
  KI-, Test- und ausgemusterte Decks sind in der normalen UI unsichtbar.
  Matchstarts erzeugen weiterhin ausschließlich neu validierte immutable
  Snapshots. Führend sind
  `docs/releases/v2/v2-0-auth-privacy-cloud-decks/password-accounts-cloud-decks-final-review-2026-07-18.md`
  und `docs/runbooks/account-alpha-operations.md`.
- Der einmalige JSON-/Alt-SQLite-Import wurde am 2026-05-06 abgeschlossen und
  ist seit dem Current-State-Projekt-Cleanup kein Start-/CLI-/Health-Vertrag
  mehr.
- Der normale lokale Startpfad ist `scripts/start-netgrid.ps1`.
- Der Webclient zeigt die bewusst gesetzte Produktversion `V0.9` getrennt von
  einer fortlaufenden Git-Buildkennung. Die Optionen nennen zusätzlich Commit,
  Quellstand und lokalen Entwicklungsstatus; ein nicht sauberer Arbeitsbaum
  wird als `-dev` gekennzeichnet. Führend ist
  `docs/decisions/product-version-and-build-identification-2026-07-17.md`.
- Storage-, Cleanup-, Recovery- und KI-Trace-Maintenance bilden nach ARC-001
  eine eigenständige Control Plane. Private LAN-Adressen sind kein
  Adminnachweis mehr. Passwort, kurzlebige serverseitige Sitzung, CSRF und
  frische Reauthentifizierung schützen die Wartungsfunktionen; aktiver und
  anderer nicht-terminaler Matchzustand ist vom Cleanup ausgeschlossen.
- Lokales HTTP ist nur auf Loopback erlaubt. Remote-/Tablet-Maintenance ist im
  `private_internet`-Profil standardmäßig aus und verlangt eine eigene
  HTTPS-Origin sowie explizit benannte Proxy-Adressen. Führend sind
  `docs/architecture/maintenance/maintenance-control-plane-security-process-2026-07-11.md`,
  `docs/runbooks/maintenance-control-plane.md` und das ARC-001-Final-Review.
- Die verwaiste Next-Demo-Route `/api/game` mit globalem V0.8-GameState ist
  entfernt. Produktive Matches laufen über den Multiplayer-Server; das lokale
  Tutorial bleibt ein ausdrücklich isolierter Modus.
- Der Playtest-Fund vom 11. Juli 2026 ist als sequenzieller Paketprozess
  geschlossen: Window- und Access-Darstellung, öffentliche Chronicle-
  Choice-Texte sowie Auto-End bei offenen Runs und Bestätigungen sind
  gehärtet. `Lockjaw`-Tap und das nicht bezahlbare HQ-ICE wurden als
  regelkonforme Nichtfehler belegt. Führend:
  `docs/reviews/current-game-findings-remediation-final-review-2026-07-11.md`.

## Current-State-Struktur

- `docs/architecture/current-state-project-cleanup-process-2026-07-10.md`
  dokumentiert die projektweite Bereinigung und ihre Einzelcommits.
- Historische nummerierte AI-Prozessscripts und ihre Rohreports werden durch
  `docs/reviews/ai/ai-historical-process-rollup-2026-07-10.md` ersetzt.
- Die Kartenregistrierung liegt in `packages/shared/src/card-definitions.ts`;
  produktive Consumer verwenden nur `CARD_DEFINITIONS` und
  `CARD_DEFINITIONS_BY_ID`.
- Teststufen, drei feste AI-Shards und Package-Boundaries sind unter
  `docs/architecture/test-tiers-and-package-boundaries-2026-07-10.md`
  ausführbar festgeschrieben.
- Für lokalisierte Kartenassets werden nur Art-Quellen und Full-PNGs
  versioniert. Die Retention-Regel steht in
  `docs/architecture/card-asset-retention-2026-07-10.md`.

## Aktuelle Risiken und offene Gates

- `apps/web/app/page.tsx`, `apps/web/app/chronicle.ts`,
  `apps/server/src/multiplayer.test.ts` und mehrere Corp-AI-Scoringdateien sind
  verbleibende Komplexitätsschwerpunkte.
- Das AI-Source-Structure-Gate ist grün und schützt den zyklenfreien Laufzeit-
  und Typimportgraph sowie qualitative Modulgrenzen. Historische Datei-,
  Zeilen-, Testgrößen- und Fanout-Ratchets sind keine Architektur-Gates mehr.
- Das Engine-Architektur-Zielgate ist grün. Mark-Counter-Anzeigen werden über
  generische Kartendefinitionsmetadaten statt direkter Karten-ID-Verzweigungen
  projiziert.
- Der Engine Architecture Refresh vom 18.07.2026 ist vollständig umgesetzt:
  Runtime-Port-Verträge sind statisch typisiert, der produktive relative
  Importgraph ist zyklenfrei und Turn-, Damage-, Access- sowie Run-Domänen sind
  fachlich geteilt. CardImplementations werden deterministisch nach Set, Seite
  und Typ registriert.
- Interne Ability-Payload-Discriminatorfelder sind normalisiert und werden
  nicht in PublicEvents weitergereicht. Einzelne historisch benannte
  Präsentations-/Mechanikfelder bleiben nur dort bestehen, wo aktuelle
  Producer und Consumer sie noch verwenden; führend ist das Final Review
  `docs/reviews/engine/engine-architecture-refresh-final-review-2026-07-18.md`.
- `public-context.ts` und der große Per-Card-Longtail-Test bleiben als
  begrenzte nächste Architekturpunkte
  dokumentiert; sie sind keine roten Korrektheits- oder Release-Gates.
- Umfangreiche Benchmark-Rohdaten gehören nach `data/local/`; versioniert
  werden nur kleine aktuelle Summaries und reproduzierbare Fixtures.
- Offizielle Artworks, Frames, Logos und externe Kartendatenbankabhängigkeiten
  bleiben ohne eigenes Rechts-/Asset-Gate ausgeschlossen.

## Arbeits- und Abschlussregel

- Neue Arbeit wird gegen diesen Current State und `docs/codex/CODEX_STATUS.md`
  geprüft.
- Historische Aussagen sind keine aktuelle Runtimefreigabe.
- Parallele Worktrees werden vor Main-Integration defensiv abgeglichen.
- Push, Pull Request und Remote-Integration erfolgen nur auf Nutzerwunsch.
