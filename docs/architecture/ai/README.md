# AI-Architektur

## Current State

- `@netgrid/ai` ist die produktive Live-Fassade.
- Match-Simulation, Selfplay und Benchmarks werden ausschließlich über
  `@netgrid/ai/simulation` importiert.
- Die KI konsumiert nur side-sichere `PlayerView`, erlaubte `PublicEvents`,
  vorhandene `LegalActions` und ausdrücklich erlaubte Metadaten.
- Die Engine bleibt alleinige Regelautorität. Die KI erzeugt keine
  LegalActions und führt keine Ersatzaction außerhalb der gewählten Action-ID
  aus.
- `corp.create_score_window` kann vollständige Same-Turn-Scorepfade aus
  Installation, Aktionsgewinn, Advancement-Platzierung, Countertransfer und
  Basic Advances generisch kombinieren. Ungeschützte Agenda-Installationen
  sind nur bei garantiertem Closeout zulässig.
- `PlanPortfolioSnapshot` koordiniert einen Interrupt, einen Vordergrundplan
  und höchstens zwei fortsetzbare Hintergrundprojekte. Broker-/Bank-Zyklen und
  strategieabhängige Corp-Scoring-Remotes besitzen begrenzte Zugkadenz,
  redigierte Mehrplan-Beiträge und deterministische Zielbindung.
- Wiederholbare Economy- und Bankaktionen werden nach sichtbarer Reserve,
  konkretem Fundingbedarf, kombiniertem Credit-Zugriff und legalen
  Entwicklungsalternativen marginal bewertet. Ein Bankaufbau ohne konkreten
  Fundingbedarf bleibt eine überstimmbare Hintergrundoption; es gibt keine
  absolute kartenspezifische Nutzungsgrenze.
- Ein Bankplan ohne konkreten Fundingbedarf bleibt auch gegenüber seinem
  eigenen Rohscore überstimmbar, wenn ein sichtbarer Schadensdruck den
  Handpuffer priorisiert. Gerade finanzierte neue Entwicklung bleibt dagegen
  planbindend; negative Backup-Installationen dürfen weichen.
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
- TacticalPlans schreiben Fortschritt nur bei einer nachfolgend sichtbaren
  Zielannäherung fort. Erreichte Creditreserven beenden stale Creditbase-Pläne;
  Punish-Pläne ohne Tag, Payoff oder messbare Ressourcenannäherung verlieren
  ihre TTL. Ein letzter Klick darf eine Trace-Quelle ohne unmittelbaren
  Punish-Payoff nicht als Fortschrittsplan erzwingen.
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
- Technisches `ai_supported`, semantische Coverage, Szenario-Evidence,
  Play Strength und Default-/Random-Pool-Promotion sind getrennte Gates.

## Führende Artefakte

- `ai-controller-spec.md`: öffentlicher Controller- und LegalAction-Vertrag.
- `ai-decision-trace-contract-2026-05-22.md`: lokaler Trace-, Redaction- und
  Debugvertrag.
- `ai-simulation-test-matrix.md`: aktuelle Sicherheits- und
  Simulationsgrenzen.
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
  den produktiven Semantic-Runtime-Auswahlweg.
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
- `proteus-ai-release-reconciliation-plan-2026-07-09.md`,
  `proteus-ai-release-automation-process-2026-07-09.md` und
  `docs/reviews/ai/proteus-ai-release-reconciliation-final-review-2026-07-09.md`:
  abgeschlossener Proteus-Rollout mit 154/154 technisch unterstützten Karten,
  114 Pilotkarten, elf Szenarien und vier qualifizierten Deckpool-Snapshots.

## Aktive Gates

```text
corepack pnpm check:ai
corepack pnpm check:ai:full
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

Die aktuelle vollständige Derived-Facts-Prüfung umfasst 618 aktive Hints, 528
CardImplementations, 391 generierte Facts und 137 noch über kompilierte Hints
abgedeckte Karten. Warnungen sind Qualitätsschuld, keine versteckten
Runtime-Fallbacks.

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
