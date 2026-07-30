# AI-Architektur

## Current State

- `@netgrid/ai` ist die produktive Live-Fassade.
- `data/ai/ai-card-hints-active.json` ist die einzige statische
  Karten-Hint-Quelle. Runtime, Deckstrategie und Inspector greifen direkt auf
  sie zu; es gibt keinen Hint-Compiler, keine Derived-Facts-Zwischenebene und
  keine manuellen Overlay-Dateien mehr.
- Match-Simulation, Selfplay und Benchmarks werden ausschließlich über
  `@netgrid/ai/simulation` importiert.
- Die KI konsumiert nur side-sichere `PlayerView`, erlaubte `PublicEvents`,
  vorhandene `LegalActions` und ausdrücklich erlaubte Metadaten.
- Die Engine bleibt alleinige Regelautorität. Die KI erzeugt keine
  LegalActions und führt keine Ersatzaction außerhalb der gewählten Action-ID
  aus.
- `corp.create_score_window` kann vollständige Same-Turn-Scorepfade aus
  Installation, Aktionsgewinn, Advancement-Platzierung, Countertransfer und
  Basic Advances generisch kombinieren. Gewöhnliche ungeschützte
  Agenda-Installationen sind nur bei garantiertem Closeout zulässig. Eine
  eng gebundene Same-Turn-Linie aus Defense-ICE und exakt zugehöriger Agenda
  darf stattdessen ein bezahlbares Stop-ICE oder dosiert eine sichtbare
  Steuer-/Disruptionswirkung als gestuften Schutz akzeptieren; dies bleibt
  vollständig im Score-/Defense-Plan und wird im nächsten Zug neu bewertet.
- Corp-Entscheidungsfenster bewerten Rez-Kosten gegen sichtbaren marginalen
  Tax und Stop-Wirkung, Mehrkarten-Draw getrennt vom kontextuellen ersten Draw
  und Basic Credits gegen eine konkrete Überschussgrenze. Wiederholter
  erfolgreicher Zentraldruck bleibt über Runner-Züge erhalten. Matchpoint-HQ-
  Schutz verlangt sichtbare Agendaexposition und verdrängt keinen garantiert
  noch im selben Corp-Zug abschließbaren Scorepfad; dessen Install- und
  Advance-Schritte erhalten keine widersprüchlichen Exposure-Strafen.
- `PlanPortfolioSnapshot` koordiniert einen Interrupt, einen Vordergrundplan
  und höchstens zwei fortsetzbare Hintergrundprojekte. Broker-/Bank-Zyklen und
  strategieabhängige Corp-Scoring-Remotes besitzen begrenzte Zugkadenz,
  redigierte Mehrplan-Beiträge und deterministische Zielbindung.
- Wiederholbare Economy- und Bankaktionen werden nach sichtbarer Reserve,
  konkretem Fundingbedarf, kombiniertem Credit-Zugriff und legalen
  Entwicklungsalternativen marginal bewertet. Ein Bankaufbau ohne konkreten
  Fundingbedarf bleibt eine überstimmbare Hintergrundoption; es gibt keine
  absolute kartenspezifische Nutzungsgrenze.
- Die Runner-Opening-Hand-Bewertung trennt direkt gehaltene Breaker von
  ausführbarem Breaker-Zugriff. Ein in der Hand liegender, sofort bezahlbarer
  und semantisch bestätigter Programmsucher zählt als Zugriff, wenn im eigenen
  Deck mindestens eine belastbare Standard-Coverage für Wall, Code Gate,
  Sentry oder Universal-ICE liegt. Sucher nur im Deck, unbezahlbare Sucher und
  ausschließlich spezielle oder niedrigkonfidente Coverage umgehen die
  Mulligan-Grenzen nicht.
- Ein Bankplan ohne konkreten Fundingbedarf bleibt auch gegenüber seinem
  eigenen Rohscore überstimmbar, wenn ein sichtbarer Schadensdruck den
  Handpuffer priorisiert. Gerade finanzierte neue Entwicklung bleibt dagegen
  planbindend; negative Backup-Installationen dürfen weichen.
- Sichtbare gegnerische Damage-, Tag-/Trace-Punish- und Damage-Payoff-Signale
  erhöhen Handpuffer und Liquiditätsreserve abgestuft. Allgemeine Trace-Karten,
  Access-Ambushes oder ein Tag allein begründen noch kein Damage-Deck;
  unbekannte Hand- und Deckkarten bleiben vollständig ausgeschlossen.
- Bezahlte Runner-Installationen werden vor Plan-Arbitration gegen ihren
  konkreten Post-Action-Creditfloor geprüft. Exakt finanzierte fortgesetzte
  Handentwicklung darf den Floor eng übersteuern, verzögerte Raten- oder
  Turn-Start-Ökonomie dagegen nicht.
- Run-Events werden über ihre konkrete RunTargetEvaluation bewertet.
  Zentraldruck und Zielplan-Fit gelten für projizierte HQ-/R&D-Runs nur, wenn
  ihr eigener sichtbarer Pfad `run_now` trägt; Archives-, Remote- und
  Bezahlbarkeitsausschlüsse bleiben wirksam.
- Eine aktionsspezifisch erreichbare RunTargetEvaluation bleibt für Bypass,
  Restpfad und ICE-Kosten führend; generische Serverprüfungen dürfen sie nicht
  ohne Action-Kontext erneut blockieren. Ein akuter gleichzieliger
  Remote-Contest darf abstrakte Coverage-Suche unterbrechen. Öffentlich
  sichtbare mögliche Zwei-Punkte-Terminal-Remotes können außerdem eine
  bezahlbare Run-Lock-Freigabe mit erreichbarem Folgepfad auslösen.
- Strukturierte Tag-Vermeidungs-Choices im Engine-Fenster
  `v120.event_modification.avoid` bevorzugen eine vorhandene legale
  Präventionsquelle gegenüber `pass`. Ohne konkrete Quelle entsteht keine
  künstliche Choice.
- Runner-Trace-Bids vergleichen einen sichtbaren Tag-Erfolg mit den Kosten und
  Click-Opportunitäten einer legal möglichen Bereinigung. Ein gewonnener Trace
  darf weiterhin bezahlt werden, wenn Restpfad, Reserve, sichtbarer Tag-Punish
  oder fehlende Bereinigungs-Clicks das verlangen; ohne diese Gründe wird kein
  strikt teurerer Gewinn-Bid erzwungen.
- Wiederholte R&D-Runs unterscheiden eine unveränderte bekannte Topkarte von
  einem durch sichtbaren Draw, Shuffle, Reorder oder Access-Abgang veränderten
  Top. Ein veränderter Top erhält vor Matchpoint nur eine begrenzte
  Wiederholungsstrafe und wird innerhalb von zwei Agenda-Punkten zum Sieg nicht
  durch die pauschale Zentralserver-Strafe unterdrückt.
- Residente Planinstanzen schreiben Fortschritt nur bei einer nachfolgend
  sichtbaren Zielannäherung fort. Erreichte Creditreserven beenden stale
  Creditbase-Pläne; Punish-Pläne ohne Tag, Payoff oder messbare
  Ressourcenannäherung verlieren ihre TTL. Ein letzter Klick darf eine
  Trace-Quelle ohne unmittelbaren Punish-Payoff nicht als Fortschrittsplan
  erzwingen.
- Universelle probabilistische Breaker-Coverage ist von stabiler typgebundener
  Coverage getrennt. Ihr Nutzen wird über Erfolgswahrscheinlichkeit und
  Handpuffer bewertet; die KI wartet nicht auf im eigenen Deck nicht
  vorhandene Standardbreaker und ignoriert kein letales Ausfallrisiko.
- `RemoteDoctrineProfile` leitet aus eigenem Deckstrategieprofil,
  DeckCapabilities und StrategicIntent ab, ob ein Deck keinen,
  opportunistischen, unterstützenden oder primären Remote-Bedarf besitzt.
  Fast-Advance-Decks erhalten dadurch keinen pauschalen Glacier-Auftrag.
- Der Live-Modulgraph ist frei von alten Planern, Baseline-Controllern,
  Shadow-/META-Runtime und Kill-Switches.
- Der Semantic-Coverage-Restpfad ist fail-closed. Nur ausdrücklich sichere,
  nebenwirkungsarme Engine-Fortsetzungen sind erlaubt.
- `AiDecisionDebug.decisionChain` legt den produktiven Auswahlweg von
  LegalActions und Ausschlüssen über Rohscore, Plan-Mapping, Arbitration und
  feste Sonderprioritäten bis zur finalen Action beziehungsweise Choice
  side-sicher offen. Die Observability verändert keine Bewertung oder Auswahl.
  Der bestehende SQLite-Trace speichert dieselbe Kette unter
  `ai_decision_traces.trace_json`: `summary` kompakt und `detailed` vollständig,
  ohne zweiten Speicherpfad.
- Ausführbare Benchmarkprofile sind `random_legal_bot` und
  `current_candidate`.
- Der produktive AI-Importgraph ist frei von Laufzeit- und Typzyklen. Das
  ausführbare Source-Structure-Gate schützt diese Nullbaseline und qualitative
  Modulgrenzen. Datei-, Zeilen-, Testgrößen- und Fanout-Ratchets sind entfernt.
- Volatile Entscheidungsfamilien besitzen fachliche Modulgruppen:
  Choice-Overrides unter `runtime/choice-ranking/`, Corp-Scoreline unter
  `runtime/corp-scoreline/`, sichtbare Run-Projektion unter `run-analysis/`
  und Runner-Handentwicklung unter `runner/hand-development/`. Die bisherigen
  Rootpfade bleiben nur dort als schmale Consumer-Fassaden bestehen, wo sie
  den Current-State-Importvertrag stabil halten.
- Gemeinsame Action-Semantik-Verträge liegen in
  `action-semantic-candidate-types.ts`; `action-semantic-candidate.ts`
  orchestriert ausschließlich die Projektionen aus `actions/` und re-exportiert
  den bestehenden Typvertrag.
- Aktuelle League-, Profil-Run- und Quality-Gate-Verträge unter
  `@netgrid/ai/simulation` sind versionsneutral benannt. Historische
  V1.4.3-Exploit-Evidence liegt ausschließlich unter
  `simulation/regression/v143/` und ist kein generischer Public-API-Vertrag.
- Technisches `ai_supported`, semantische Coverage, Szenario-Evidence,
  Play Strength und Default-/Random-Pool-Promotion sind getrennte Gates.

## Plan-first-Cutover-Stand

- Der Zug- und Kampagnenplaner ist für Corp und Runner produktiv. Vor der
  Ausführung konkurrieren validierte Planning Heads als deterministisch
  begrenzte Restzuglinien; nur der aktuelle Head der gewählten Linie wird
  über `TurnPlanCommitment`, Execution Lease und aktuelle `LegalActions`
  autoritativ rematerialisiert. Informations-, Reaktions-, Engine- und
  Zufallsgrenzen lösen typisierte Neuplanung aus.
- Agenda-, Defense-, Opening-Rush- und Runner-Kampagnen können über
  Zuggrenzen und öffentliche Gegneroutcomes resident bleiben. Ein
  Runtime-Neustart stellt das Portfolio wieder her, verwirft das alte
  Zugcommitment und plant aus dem aktuellen Zustand neu.
- Corp und Runner besitzen getrennte vollständige Owner-, Horizon- und
  Coverage-Verträge. Produktiv gilt `cutover`; `legacy_compare` ist nur ein
  ausdrücklich gesetzter Diagnosemodus und kein Fallback.
- Die privilegierte private Betreiber-Buganzeige zeigt absichtlich die
  vollständigen Karten und Hände beider Seiten sowie den vollständigen
  Zugplan mit Varianten, Commitment, Lease, Boundaries, Coverage und
  Kampagnenstatus. Für diese Ansicht gilt keine seitensichere Reduktion.
- PF15 ist mit Commit `4b0c459f6` als fail-closed Plan-first-Runtime-Cutover
  abgeschlossen. Die produktive Arbitration wählt zuerst eine residente
  `PlanInstance`, deren Step und aktuelle Route; eine Action besitzt außerhalb
  dieses Vertrags keine eigene Handlungsautorität.
- Tactical Goals sind im Zielvertrag ausschließlich kurzlebige, an die
  aktuelle `stateVersion` gebundene Goal-/Threat-Signale. Sie dürfen
  Discovery, Revalidierung und Priorisierung von Planproposals beeinflussen,
  werden aber weder persistent noch autoritativ. `TransientPlanSignal`
  typisiert diesen Vertrag; stale/future Signale, unbekannte Felder und
  Action-Autoritätsfelder scheitern fail-closed. Die Live-Runtime erzeugt
  exakte Signale für Runner-Remote-Contest, Survival, Terminal Wins und
  Corp-Scoreprojekte; der Scheduler bindet ausschließlich Planmodul,
  residenten `dedupeKey` und Ziel derselben Instanz.
- Strategic Intent ist ein stabiler Strategieanker, keine zweite
  Ausführungsautorität. P1- bis P3-Pläne dürfen ihn mit belastbarer Evidence
  übergehen; P4-/P5-Kampagnen benötigen Intent-Fit oder explizite taktische
  Evidence. Intent-Wechsel sind an Phasenwechsel, neue belastbare Information
  oder Planabschluss/-invalidierung gebunden, nicht an normale
  Action-Schwankungen. Override und Intent-Mutation sind im Runtime-Vertrag
  getrennt und fail-closed abgesichert. Produktiv angeschlossen ist derzeit
  der öffentliche Abschluss der Setup-/Mulliganphase als aktueller
  `phase_change`; weitere Revalidierungsgründe benötigen jeweils einen
  side-sicheren Live-Evidence-Produzenten.
- Für Corp-Verteidigung existiert keine Legacy-Zentralreserve und kein
  eigenständiger zentraler Reserveplan. Finanzierung entsteht ausschließlich
  als an den exakten Defense-Parent gebundener Economy-Bedarf; Wirkung und
  Reserve werden getrennt und nur mit Engine-zertifizierten Quotes bewertet.
  Unbekannte Kosten bleiben fail-closed.
- Besteuernde oder disruptive ICE-Dubletten ohne unmittelbaren Stop-Effekt
  können in einer laufenden Scoreline auf der letzten Aktion als zusätzliche
  HQ-/R&D-Schicht zugewiesen werden. Dafür verlangt der Defense-Plan einen
  sichtbaren Scoring-Remote, exakte Zentralzuweisung, vollständige
  Installations-/Rez-Quote und keine sichtbare passende Breaker-Antwort. Der
  Pfad bewahrt stärkere Stop-ICE-Ressourcen für Scoring-Remotes und darf
  weder P1/P2 noch eine sichere Scorelinie verdrängen.
- Bei `Loan from Chiba` gehören Erwerb und Entwicklung zum Economy-Modul.
  Halten, Verlassen und die dafür nötige Zahlung beziehungsweise das
  Verlustrisiko gehören nach der Installation in einen
  `runner.resource_lifecycle`-Child der exakten Karteninstanz. Unbekannte
  Engine-Zahlungsquotes bleiben blockiert und werden nicht geschätzt.
- Der öffentliche transitive Livegraph ist frei von alten TacticalGoal-,
  SemanticChoice-, PracticalMicro-, TacticalPlan-Memory- und
  TacticalPlan-Override-Abhängigkeiten. Live und Simulation verwenden
  denselben Plan-first-Einstieg; historische Altverträge bleiben nur als
  isolierte Test-/Evaluationsdiagnostik.
- Der verifizierte PF15-Code-Freeze umfasst 60 Spiele und 11.012
  Entscheidungen ohne Illegal Action, Replay-, Runtime-, Hidden-Info-,
  Fallback-, Timeout-, Action-Limit- oder Redaktionsfehler. Die qualitativen
  Restbefunde bleiben PF16-/Play-Strength-Evidence und sind keine kaschierten
  technischen Gate-Ausnahmen.

## Führende Artefakte

- `ai-plan-layer-target-state-wip.md`: führendes fortlaufendes
  Zielzustandskonzept für die modulare Plan-first-KI mit gemeinsamem
  Planrahmen, getrennten Runner-/Corp-Schedulern, aktuellen und angestrebten
  Planmodulen, Zugausführung, Commitments, Diagnostik und Abnahme. Der
  gemeinsame TurnPlanner- und Kampagnencutover ist für beide Seiten
  abgeschlossen; das Dokument bleibt für spätere Modulverfeinerungen WIP.
- `ai-turn-and-campaign-planner-concept-2026-07-29.md`,
  `ai-turn-and-campaign-planner-implementation-process-2026-07-29.md` und
  `docs/reviews/ai/ai-turn-and-campaign-planner-final-review-2026-07-30.md`:
  freigegebener Gesamtvertrag, sequenzielle Paketumsetzung und aktuelle
  Abschluss-/Gatematrix.
- `docs/reviews/ai/ai-plan-first-runtime-cutover-final-review-2026-07-25.md`:
  PF16-Endvertrag, Akzeptanz- und Gatematrix, Baseline-Provenienz sowie
  sichtbare Folgepunkte.
- `docs/reviews/ai/ai-behavior-baseline-v1-plan-first-pf15-code-freeze-verified-2026-07-25.md`:
  verifizierte PF15-Code-Freeze-Baseline mit Hard-Gates und qualitativer
  Restpunkt-Evidence.
- `ai-plan-layer-target-concept-process-2026-07-23.md`: Quellen-, Paket- und
  Reviewprozess für den initialen WIP-Stand des Zielkonzepts.
- `ai-controller-spec.md`: öffentlicher Controller- und LegalAction-Vertrag.
- `ai-decision-trace-contract-2026-05-22.md`: lokaler Trace-, Redaction- und
  Debugvertrag.
- `ai-simulation-test-matrix.md`: aktuelle Sicherheits- und
  Simulationsgrenzen.
- `ai-behavior-baseline-v1-process-2026-07-12.md`: aktives Runbook für den
  festen Standard-Benchmark, vergleichbare Kandidatenläufe, automatische
  Workerwahl und vollständige Raw-Evidence als JSON oder Gzip.
- `ai-core-runtime-performance-followup-process-2026-07-20.md` und
  `docs/reviews/ai/ai-core-runtime-performance-followup-final-review-2026-07-20.md`:
  aktuelles Post-Optimization-Profil, entscheidungslokale Runner-Ableitungen,
  allokationsarme Markerprüfung und Paritäts-/Laufzeitnachweis.
- `ai-hints-structure-decision-2026-05-15.md`: Struktur der aktiven AI-Hints.
- `taktiksignale-strategieanker-guide-2026-06-02-v3.md`: aktuelle Begriffe für
  Taktiksignale, Strategieanker, TargetProfiles, Conditions und Constraints.
- `ai-play-strength-development-placement-guide-2026-06-13.md`: zulässige
  Modulbereiche für neue AI-Fixes.
- `ai-access-intelligence-placement-guide-2026-06-21.md`: Modulgrenzen für
  Access-Projektion und Access-Memory.
- `action-semantic-signal-invariant-classes-2026-06-27.md`: Invarianten für
  aktuelle Action-Signale.
- `hq-hand-memory-contract-matrix-2026-06-07.md`: side-sicherer Vertrag für
  Runner-HQ-Wissen.
- `runner-hand-development-creditbase-contract-2026-06-07.md`: aktueller
  Handentwicklungs-/Creditbase-Vertrag.
- `coaching-boundary-spec-2026-05-17.md`: Grenze für späteres side-sicheres
  Coaching.
- `ai-current-state-cleanup-process-2026-07-09.md`: abgeschlossener
  Runtime-/Legacy-Cleanup.
- `ai-vs-ai-observer-process-2026-07-13.md` und
  `docs/reviews/ai/ai-vs-ai-observer-implementation-review-2026-07-13.md`:
  persistierter, side-sicher beobachtbarer KI-gegen-KI-Modus mit sichtbaren
  Einzelschritten, Tempo-Steuerung, Reconnect, regulärem Ende und Abbruch ohne
  künstlichen Sieger.
- `corp-score-conversion-capability-contract.md` und
  `corp-score-conversion-plan-process-2026-07-10.md`: Engine-/Hint-/Planvertrag
  für generische Fast-Advance- und Countertransfer-Scorepfade.
- `ai-planportfolio-remote-doctrine-contract.md` und
  `docs/reviews/ai/ai-planportfolio-remote-doctrine-final-review-2026-07-12.md`:
  aktueller Vertrag für kurze Plansequenzen, wiederkehrende Zyklen,
  Entwicklungsprojekte und strategieabhängigen Remote-Ausbau.
- `semantic-decision-chain-observability-contract-2026-07-14.md`: aktueller
  verhaltensneutraler Debug-, Arbitration- und Decision-Checkpoint-Vertrag für
  den produktiven Plan-first-Auswahlweg.
- `match-e2f2-corp-decision-windows-remediation-process-2026-07-22.md` und
  `docs/reviews/ai/match-e2f2-corp-decision-windows-remediation-final-review-2026-07-22.md`:
  spielgleiche Corp-Verträge für Rez-Ertrag, Draw-/Credit-Grenznutzen,
  persistenten R&D-Druck, HQ-Agendaexposition und garantierte
  Overtime-/Same-Turn-Scorepfade.
- `../legacy-simplification-process-2026-07-19.md`: aktueller Abschlussstand
  der Hint-Single-Source-, Source-Gate- und Legacy-Bereinigung.
- `ai-source-structure-optimization-process-2026-07-17.md` und
  `docs/reviews/ai/ai-source-structure-optimization-final-review-2026-07-17.md`:
  historischer Source-Placement-, Zyklen-, Größenratchet- und
  Public-/Simulation-Grenzstand.
- `ai-source-structure-gate-remediation-plan-2026-07-19.md` und
  `docs/reviews/ai/ai-source-structure-gate-remediation-final-review-2026-07-19.md`:
  historische Evidence der fachlichen Modul- und Testsuite-Schnitte; die dort
  verwendeten Größenratchets sind nicht mehr aktiv.
- `ai-seed03-seed05-loop-remediation-process-2026-07-14.md` und
  `docs/reviews/ai/ai-behavior-baseline-v1-seed03-seed05-remediation-final-2026-07-14.md`:
  spielgleiche Verträge und vollständige Seed-03/05-Evidence für marginale
  Economy, erfolgsbasierte Planfortschreibung, Trace-Konversion und
  probabilistische Coverage.
- `ai-match-dfe6-decision-remediation-process-2026-07-15.md` und
  `docs/reviews/ai/ai-match-dfe6-decision-remediation-final-2026-07-15.md`:
  spielgleiche Verträge für begründete Archives-Runs, schadenskompatible
  Survival-Planabbildung und vollständig viable Encounter-Breakpfade; der
  Checkpoint-Vertrag kann zusätzlich ausgewählte Score-Komponenten nach
  stabilen Schlüsseln verlangen oder verbieten, ohne Zahlenwerte festzuschreiben.
- `ai-four-match-card-hint-remediation-process-2026-07-15.md` und
  `docs/reviews/ai/ai-four-match-card-hint-remediation-final-2026-07-15.md`:
  textgenaue Hint-Verträge für acht Karten aus vier gespeicherten Spielen,
  Familienhomogenität für Handlimit- und eingeschränkte wiederkehrende
  Breaker-Credits sowie eine spielgleiche Inside-Job-Bypass-Pfadquote.
- `ai-match-424a-runner-endgame-remediation-process-2026-07-15.md` und
  `docs/reviews/ai/ai-match-424a-runner-endgame-remediation-final-2026-07-15.md`:
  spielgleiche Verträge für Tag-Vermeidung, Run-Event-Zielkontext,
  Matchpoint-Remote-Vorbereitung, Bank-/Plan-Arbitration und die Trennung von
  Breaker-Coverage und Gesamtbezahlbarkeit.
- `ai-match-9d15-runner-contest-remediation-process-2026-07-16.md` und
  `docs/reviews/ai/ai-match-9d15-runner-contest-final-review-2026-07-16.md`:
  spielgleiche Verträge für aktionsspezifisch führende Bypass-Pfade,
  dringende Remote-Plan-Arbitration und side-safe sichtbare
  Zwei-Punkte-Terminalcontests bei aktiver Run-Sperre.
- `ai-match-03575-trace-repeat-remediation-process-2026-07-16.md` und
  `docs/reviews/ai/ai-match-03575-trace-repeat-final-review-2026-07-16.md`:
  spielgleiche Verträge für ökonomische Runner-Trace-Bids, sichtbare
  R&D-Top-Frische bei Wiederholungsruns und die registrierungsgetreue
  Networking-Auflösung im Full-Derived-Facts-Consumerpfad.
- `match-36ba22d6-runner-remediation-process-2026-07-17.md` und
  `docs/reviews/ai/match-36ba22d6-runner-remediation-final-2026-07-17.md`:
  vollständiger 98/98-Matchaudit, Strict-Warmup-Grenze für spätere Findings
  und spielgleicher Opening-Hand-Vertrag für bezahlbaren Breaker-Zugriff über
  einen eigenen Programmsucher.
- `docs/reviews/ai/match-e653f50a-corp-remediation-final-review-2026-07-19.md`:
  vollständiger 128/128-Matchaudit und spielgleiche Verträge für korrekte
  Einzelziel-Advancement-Projektion, wertbasierte HQ-Retain-Zahlung,
  bedarfsabhängige ICE-Platzierung und R&D-Priorität vor leeren
  Hintergrund-Remotes bei erhaltener kritischer Scoreline-Sicherheit.
- `match-c6eedf46-runner-risk-economy-remediation-process-2026-07-16.md` und
  `docs/reviews/ai/match-c6eedf46-runner-risk-economy-remediation-final-2026-07-16.md`:
  aktionsbezogener Reservevertrag für verzögerte Ökonomie, side-safe
  Damage-/Punish-Vermutung, replay-stabile sichere Probe-Varianz,
  Scorebeschleunigungs-Hints und typkorrekte öffentliche Nicht-ICE-Rez-Events.
- `proteus-ai-release-reconciliation-plan-2026-07-09.md`,
  `proteus-ai-release-automation-process-2026-07-09.md` und
  `docs/reviews/ai/proteus-ai-release-reconciliation-final-review-2026-07-09.md`:
  abgeschlossener Proteus-Rollout mit 154/154 technisch unterstützten Karten,
  114 Pilotkarten, elf Szenarien und vier qualifizierten Deckpool-Snapshots.

## Aktive Gates

```text
corepack pnpm check:ai
corepack pnpm check:ai-source-structure
corepack pnpm check:proteus-ai-readiness
corepack pnpm check:ai-deck-doctrine-strategy
corepack pnpm --filter @netgrid/ai typecheck
corepack pnpm test:ai:shards
```

Das Realitätsgate aus
`docs/reviews/ai/ai-test-realism-audit-2026-07-12.md` und
`packages/ai/src/evaluation/real-engine-live-runtime.test.ts` verbindet
Engine-erzeugte Inputs mit dem produktiven Chooser. Unit-, synthetische Live-,
Live-Engine- und Full-Simulation-Evidence bleiben getrennt.

Die 618 Karten-Hints sind vollständig in der einzigen Quelle gepflegt. Der
Hint-Inspector baut seine Darstellung direkt daraus auf und besitzt keinen
eigenen Semantik- oder Runtime-Index.

## Historie und Retention

Nummerierte AI020-bis-AI212-Einzelprozesse, Shadow-/META-Zwischenstände,
Cutover-Dry-Runs und Roh-Scorecards sind kein aktueller Vertrag. Ihr
verbleibender Erkenntniswert ist verdichtet in:

- `docs/reviews/ai/ai-historical-process-rollup-2026-07-10.md`
- `docs/reviews/ai/ai-current-state-cleanup-final-review-2026-07-09.md`

Neue Reports werden nur versioniert, wenn sie ein aktuelles Gate, eine
reproduzierbare Regression, eine Architekturentscheidung oder eine konkrete
Removal Condition tragen. Umfangreiche Rohläufe gehören nach `data/local/`.

## Verbotene Rückfälle

- kein FullGameState oder gegnerische Hidden-Zone-Daten im AI-Input;
- keine Action-Erzeugung außerhalb der Engine;
- kein alphabetischer oder beliebiger Catch-all für ungedeckte Aktionen;
- keine historisch benannten Controllerprofile, die auf den aktuellen Chooser
  zeigen;
- keine Shadow-/Legacy-Runtime als stiller Fallback;
- keine Behauptung von Play-Strength-Readiness allein aus `ai_supported`.
