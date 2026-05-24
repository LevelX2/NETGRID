---
activityId: act-2026-05-24-proteus-phase-7-cybernetics-deck-hardware
status: inbox
kind: concept
area: cards
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-24
startedAt:
completedAt:
branch:
releaseTarget: Proteus Phase 7
blockedBy:
  - act-2026-05-24-proteus-phase-6-agenda-ambush-access-corp-resolvers
resultArtifacts: []
checks: []
---

# Proteus Phase 7: Cybernetics und Deck-Hardware

## Ziel

Die vier Cybernetics-/Deck-Hardware-Karten mit vorhandenen Hardware-, Modifier-, Prevention- und Restricted-Credit-Familien umsetzen und fehlende Deck-Einzigkeit/MU-Überzug-Gates generisch absichern.

## Kontext und Quellen

- `docs/releases/proteus/release-slicing-plan.md`, Abschnitte `Phase 7`, `Slice 7` und `Ability-Bedarf nach Phase`.
- `docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md`, Abschnitt `Phase 7: Cybernetics/Deck Hardware`; dieses Paket ist vor Codearbeit in die dort beschriebenen Slices 7a bis 7d zu zerlegen.
- `docs/releases/proteus/cybernetics-deck-hardware-contract.md`.
- `docs/releases/proteus/mechanics-coverage-analysis.md`.
- `docs/activities/done/act-2026-05-17-proteus-cybernetics-deck-hardware-contract.md`.
- CardImplementation-Familien `hardwareDeck`, `modifiers`, `restrictedHostedCreditSource`, `damagePreventionSources`, `unique`.

## Zielkarten

- `onr_proteus_134_cortical-cybermodem` Cortical Cybermodem
- `onr_proteus_135_cortical-stimulators` Cortical Stimulators
- `onr_proteus_138_deck-the` Deck, The
- `onr_proteus_151_sunburst-cranial-interface` Sunburst Cranial Interface

## Scope

- Pro Zielkarte eigene CardImplementation-Datei.
- Deck-Einzigkeit mit deterministischem Trash älterer Runner-Decks.
- MU-/Handgrößenmodifier, source-bound Bits, Start-of-turn-Refresh und Sunburst-Noisy-Ausschluss.
- Damage-/Prevention-Verhalten für Cortical Stimulators nur über generische Prevention-Familien.
- MU-Überzug nach Trash alter Decks als expliziten Engine-Gate-Fall lösen oder blockierend dokumentieren.

## Nicht im Scope

- Keine Proteus-AI-Hints.
- Keine allgemeine Neugestaltung der Hardware-UI.
- Keine Änderung an Nicht-Deck-Cybernetics außerhalb der Zielkarten.
- Keine Hidden-Info- oder Regelentscheidung in UI/Catalog.

## Akzeptanzkriterien

- [ ] Alle Zielkarten haben eigene CardImplementation-Dateien und Manifest-/Coverage-Nachweis.
- [ ] Install eines neuen Decks trasht ältere Decks deterministisch und entfernt deren Counter/Modifier.
- [ ] Zweckgebundene Bits werden LegalAction- und `applyAction`-seitig source-bound revalidiert.
- [ ] MU-, Handgrößen-, Bit-Spend-, Refresh- und Visibility-Fälle sind getestet.
- [ ] Keine stillen illegalen Zustände wie dauerhaftes `memoryUsed > memoryLimit` nach Deck-Trash.

## Umsetzungshinweise

- `Deck, The` hängt zusätzlich an Base-Link-Auswahl; vor Umsetzung prüfen, ob vorhandene Trace-/Link-Familien reichen.
- Nicht-Deck-Cybernetics dürfen durch Deck-Einzigkeit nicht versehentlich getrasht werden.

## Ergebnisnotiz

Noch offen.
