# MVP 0.4 Test Matrix

Status: frozen_for_implementation  
Stand: 2026-05-03

| ID | Bereich | Erwartung | Requirement |
|---|---|---|---|
| T-V04-DATA-001 | Daten | 0.4 JSON-Artefakte parsen und enthalten erwartete IDs. | V04-REQ-001, V04-REQ-002 |
| T-V04-DATA-002 | Manifest | Jede neue Karte hat Unit-, Szenario-, Visibility- und Replay-Zuordnung. | V04-REQ-003 |
| T-V04-DECK-001 | Deckvalidierung | Valide 0.4-Decks bestehen; falsche Side/Agenda Points fallen durch. | V04-REQ-004 |
| T-V04-CARD-001 | Safe Batch | Draw Event, Draw Operation, Taxing ICE und Priority Agenda wirken korrekt. | V04-REQ-005 |
| T-V04-CARD-002 | Hardware | Hardware installiert und erhöht Memory Limit. | V04-REQ-006 |
| T-V04-CARD-003 | Upgrade | Upgrade bleibt verdeckt, kann rezzen und beim Access getrasht werden. | V04-REQ-007 |
| T-V04-TAG-001 | Tag ICE | Ungebrochene Subroutine gibt Runner 1 Tag. | V04-REQ-008 |
| T-V04-TAG-002 | Remove Tag | Runner zahlt 1 Click/2 Credits und entfernt 1 Tag. | V04-REQ-009 |
| T-V04-TAG-003 | Tag Punishment | Operation ist ohne Tags illegal und mit Tags legal. | V04-REQ-010 |
| T-V04-AI-001 | AI Simulation | 0.4-Decks laufen in KI-vs-KI mit Replay-StateHash. | V04-REQ-011 |

## Szenarien

- `data/scenarios/v04-safe-card-batch-smoke.json`
- `data/scenarios/v04-tag-runner-and-remove-tag.json`
- `data/scenarios/v04-tag-punishment-blocked-when-untagged.json`
- `data/scenarios/v04-expanded-deck-ai-vs-ai-smoke.json`
