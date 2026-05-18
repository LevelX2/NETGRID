# V1 Release-Dokumentation

Dieser Bereich bündelt migrierte V1-Releasefamilien. Die Migration erfolgt schrittweise und familienweise; nicht migrierte V1-Artefakte bleiben vorerst unter `docs/derived/`.

## Migrierte Familien

- `v1-0-deck-match-stabilization/`: frühe Deck-/Match-Stabilisierung und serverseitige Matchstart-Revalidierung.
- `v1-0-1-join-deck-handshake/`: historischer Join-Deck-Handshake-Brückenschnitt.
- `v1-0-2-opponent-action-presentation/`: Gegner-Aktionsdarstellung, Ablauftransparenz, KI-Pacing, Board-Highlights und opt-in Aktionsaudio.
- `v1-0-3-matchstart-ux/`: Matchstart-UX, Lobby-Nachschärfung und Abschlussnachweis.
- `v1-0-4-private-match-lifecycle/`: privater Match-Lifecycle mit Cancel, Leave, Forfeit, Recreate, Session Recovery und Gegnernamen.
- `v1-0-5-action-board-ux/`: Action Board UX, RunTimeline, Runner-Rig, zentrale Server, deutsche UI-Begriffe, Kontextaktionen, Cues und Browser-Smoke.
- `v1-0-6-ui-resource-clarity/`: Aktionen, Credits, Kostenchips und kompakte Card-Display-Steuerung.
- `v1-0-7-browser-e2e-visual-qa/`: reproduzierbarer Browser-E2E-/Visual-QA-Gate mit Viewport- und Leak-Scans.
- `v1-0-8-storage-backup-hardening/`: SQLite-Storage, Legacy-Import, Backup, Restore, Recovery und E2E-Isolation.
- `v1-0-9-private-internet-hardening/`: privater Internetbetrieb mit Transport-, Origin-, Rate-Limit-, Secret-, Health- und Ops-Härtung.
- `card-releases/`: kleine lokale Karten-Nachrelease-Stränge V1.0.5K, V1.0.6K und V1.1.2K.
- `v1-1-0-setup-game-end-m2/`: Setup, Mulligan, Game-End M2, Identity-Views und Archives-facedown-Grundlage.
- `v1-1-1-discard-handlimit-core-damage/`: Discard, Handlimit und Core Damage.
- `v1-1-2-full-archives-matchstart-entry-ux/`: Full Archives Access und Matchstart Entry UX.
- `v1-1-3-mechanics-ai-card-baseline/`: Mechanics-AI-Card-Baseline und Handoff Richtung V1.2.x.
- `v1-2-0-event-modification/`: Event-Modification-Foundation mit side-privaten Eventfenstern und Damage-Prevention-Pilot.
- `v1-2-1-replacement-effects/`: getrennte Replacement-Pipeline mit deterministischer Kandidatenordnung und Konfliktblockern.
- `v1-2-2-special-zones-ownership-control/`: Set Aside, Removed from Game, Owner/Controller und Handoff zu V1.3.0.
- `v1-2-3-mechanic-unlock-card-release-1/`: erster kontrollierter Mechanic-Unlock-Kartenrelease.
- `v1-3-0-format-deckbuilding-foundation/`: lokale Formatprofile, Deckvalidierung, Snapshots und Matchstart-Revalidierung.
- `v1-3-1-card-data-pipeline-v2/`: Source Registry v2, Snapshots, Import-Diff, Rollback, Statusreports und AI-Hints v2.
- `v1-4-0-plan-based-corp-ai/`: planbasierte Corp-KI mit side-sicherem DecisionDebug und Benchmark-Smokes.
- `v1-4-1-plan-based-runner-ai/`: planbasierte Runner-KI mit Hidden-State-Invariance und planbasierter Corp-Regression.
- `v1-4-2-belief-state-opponent-model/`: Belief State, Gegner-Modell, Planning Review und Handoff zu V1.6.0.
- `v1-4-3-simulation-selfplay-exploit-regression/`: Simulation, Selfplay, Holdout-Seeds und Exploit-Regression.
- `v1-5-0-private-replay-analysis-learning/`: private Replays, Analyseperspektiven, redigierter Export und Smoke-Artefakte.
- `v1-6-0-tutorial-rule-help/`: Tutorialmodus, Regelhilfe, Glossar und Smoke-Artefakte.
- `v1-6-1-mechanikpaket-a/`: Mechanikpaket A und konsolidierter Plan bis V1.7.0.
- `v1-6-2-mechanikpaket-b/`: Mechanikpaket B.
- `v1-6-3-mechanikpaket-c/`: Mechanikpaket C.
- `v1-7-0-mechanikpaket-d/`: Mechanikpaket D.
- `v1-7-1-mechanikpaket-e/`: Mechanikpaket E und konsolidierter Plan bis V1.8.1.
- `v1-7-2-mechanikpaket-f/`: Mechanikpaket F.
- `v1-8-0-mechanikpaket-g/`: Mechanikpaket G.
- `v1-8-1-mechanikpaket-h/`: Mechanikpaket H.
- `v1-9-originalset-completion/`: V1.9.0 bis V1.9.22 Originalset-Completion inklusive Mechanikpaketen, Completion-Planning, Automation und Per-Card-Longtail.
