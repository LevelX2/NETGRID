---
activityId: act-2026-05-17-proteus-cybernetics-deck-hardware-contract
status: done
kind: concept
area: cards
priority: normal
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: false
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch: codex/activity-worker-2
releaseTarget: Proteus planning
blockedBy: []
resultArtifacts:
  - docs/derived/PROTEUS_CYBERNETICS_DECK_HARDWARE_CONTRACT.md
checks:
  - rg -n "cybernetics_deck_hardware|Cortical Cybermodem|Cortical Stimulators|Deck, The|Sunburst Cranial Interface" docs/derived/PROTEUS_CYBERNETICS_DECK_HARDWARE_CONTRACT.md data/rules/proteus-mechanics-coverage-2026-05-17.json docs/source/Proteusspoiler.txt
  - rg -n "Runtime-Implementierung|Decklegalität|AI-Unterstützung|planning-only|noRuntimeImplementation|noDeckLegality|noAiHints" docs/derived/PROTEUS_CYBERNETICS_DECK_HARDWARE_CONTRACT.md data/rules/proteus-mechanics-coverage-2026-05-17.json
  - git diff --check
  - git diff --cached --check
---

# Proteus Cybernetics-/Deck-Hardware-Vertrag vorbereiten

## Ziel

Proteus-Hardware mit Deck-/Cybernetics-Regeln soll vor einer Umsetzung als eigener Vertrags-Slice beschrieben werden.

## Kontext und Quellen

- Grundlage: `data/rules/proteus-mechanics-coverage-2026-05-17.json`.
- Relevanter Cluster: `cybernetics_deck_hardware`.
- Beispiele: `Cortical Cybermodem`, `Cortical Stimulators`, `Deck, The`, `Sunburst Cranial Interface`.

## Scope

- Ein-Deck-Regel, ältere Decks trashen, MU-/Handgrößenmodifier und zweckgebundene Bits trennen.
- Refresh-Timing und Nutzungsrestriktionen für Icebreaker-Bits beschreiben.
- UI-/AI-/Visibility-Auswirkungen für installierte Hardware und Ressourcenverbrauch notieren.

## Nicht im Scope

- Keine Runtime-Implementierung.
- Keine Decklegalität oder AI-Unterstützung.

## Akzeptanzkriterien

- [x] Cybernetics-/Deck-Hardware-Anforderungen sind als eigener Mechanikvertrag beschrieben.
- [x] Kleinster erster Umsetzungsslice ist benannt.
- [x] Tests für Memory, Handgröße, zweckgebundene Bits und Trash alter Decks sind skizziert.

## Ergebnisnotiz

Erledigt. `docs/derived/PROTEUS_CYBERNETICS_DECK_HARDWARE_CONTRACT.md` beschreibt den planning-only Vertrag für `cybernetics_deck_hardware`: Deck-Einzigkeit mit deterministischem Trash älterer Decks, MU-/Handgrößenmodifier, zweckgebundene Icebreaker-Bits mit Sunburst-Noisy-Ausschluss, Runner-Start-of-turn-Refresh, Visibility-/UI-/AI-Grenzen und einen kleinsten nicht promotenden Harness-Slice. Tests für Memory, Handgröße, zweckgebundene Bits, Refresh und Trash alter Decks sind skizziert. Keine Runtime-Implementierung, keine Decklegalität und keine AI-Unterstützung wurden eingeführt.
