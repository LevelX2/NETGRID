---
activityId: act-2026-05-18-ai-discard-keep-value-baseline
status: inbox
kind: fix
area: ai
priority: normal
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-18
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks:
  - corepack pnpm --filter @netgrid/ai test -- -t "discard"
  - corepack pnpm --filter @netgrid/ai typecheck
  - git diff --check
---

# KI-Discard: Keep-Value-Baseline statt stabiler Erstoption

## Ziel

Die KI soll normale Discard-Choices nicht mehr nur nach stabiler Label-/ID-Sortierung lösen, sondern eigene Handkarten nach einem deterministischen `keepValue` bewerten. Abgeworfen werden die Karten mit dem niedrigsten Behaltewert. Die Entscheidung bleibt vollständig `PlayerView`-/`LegalActions`-gebunden und verändert keine Engine-Regeln.

## Ausführungsabhängigkeit

Dieses Paket ist der erste Schritt der Discard-Verbesserung und hat keine vorgelagerten Activity-Abhängigkeiten. Die Folgepakete `act-2026-05-18-ai-discard-plan-doctrine-fit` und `act-2026-05-18-ai-discard-regression-benchmark` dürfen erst nach Abschluss dieses Pakets umgesetzt werden.

## Kontext und Quellen

- Nutzerfrage vom 2026-05-18: KI-Discard soll sinnvoller nach Kartennützlichkeit erfolgen.
- `docs/releases/v1/v1-1-1-discard-handlimit-core-damage/spec.md`: V1.1.1 erlaubt der KI aktuell eine deterministische Minimalheuristik aus sichtbaren eigenen Choice-Optionen.
- `packages/ai/src/index.ts`: `selectedChoicesForDecision` wählt bei `source === "discard_phase"` derzeit stabil sortierte erste Optionen.
- `packages/ai/src/runner-plans.ts`, `packages/ai/src/corp-plans.ts`, `packages/ai/src/deck-doctrine.ts`: vorhandene Rollen-/Hint-/Doctrine-Quellen, die später erweitert eingebunden werden können.

## Scope

- Discard-Auswahl aus `selectedChoicesForDecision` in einen kleinen, testbaren Helper oder ein neues Modul auslagern, z. B. `discard-selection.ts`.
- Für `pendingChoice.kind === "select_cards"` und `pendingChoice.source === "discard_phase"` Choice-Optionen side-sicher auf eigene sichtbare Handkarten in `playerView.own.gripOrHq` mappen.
- Einen deterministischen `keepValue` je Kandidat berechnen:
  - Rollen aus AI-Hints und Runtime-Kartendaten berücksichtigen.
  - spielbare Karten mit passender LegalAction höher halten.
  - Economy/Draw/Setup höher halten, wenn Credits, Handgröße oder Boardlage darauf hindeuten.
  - Duplikate, aktuell nicht nutzbare Karten, sehr teure Karten bei knapper Economy und Karten ohne AI-Rollen niedriger halten.
  - Korp-Agendas grundsätzlich vorsichtig behandeln und nicht pauschal wegwerfen.
- Karten mit niedrigstem `keepValue` bis zur exakten `maxSelections`-/`minSelections`-Anzahl auswählen.
- Bei Mapping-Unsicherheit oder fehlenden Kartendaten deterministisch auf die bisherige stabile Sortierung zurückfallen.
- Debug-/Evidence-Gründe nur als Rollen und abstrakte Gründe ausgeben, z. B. `discard_low:duplicate_role`, `discard_keep:economy_needed`, keine gegnerischen Hidden-Zone-Daten.

## Nicht im Scope

- Keine Einbindung der aktiven Planmodule oder Deck-Doctrine-Boni; das folgt im abhängigen Paket.
- Keine Änderung an Engine-Discard, Handlimit, Core Damage, Replay, StateHash oder LegalAction-Vertrag.
- Keine Nutzung gegnerischer verdeckter Karten, FullState, privater Server-Payloads oder nicht redigierter Logs.
- Keine neue Kartenfreischaltung und keine Änderung an AI-Hints-Daten außer kleinen testnotwendigen Fixtures.
- Keine perfekte langfristige Handmanagement-KI.

## Akzeptanzkriterien

- [ ] Discard-Choices werden über einen eigenen Keep-Value-Pfad entschieden, nicht mehr nur über Label-/ID-Erstoption.
- [ ] Runner-Test: Bei Überhand hält die KI den einzigen relevanten Breaker oder Economy-Anker und wirft eine klar redundante oder planlose Karte ab.
- [ ] Runner-Test: Bei Creditmangel hält die KI Economy höher als ein situatives Run-Event ohne realistische Run-Linie.
- [ ] Korp-Test: Bei Überhand hält die KI eine wichtige Agenda-/ICE-/Economy-Karte höher als eine redundante teure oder aktuell nicht nutzbare Karte.
- [ ] Fallback-Test: Wenn Choice-Optionen nicht auf eigene Handkarten gemappt werden können, bleibt die Auswahl stabil deterministisch.
- [ ] Side-Safety-Test: Gegnerische AI-Inputs enthalten keine Discard-Kandidaten, keine konkreten gegnerischen Handtitel und keine privaten Debugdaten.
- [ ] Bestehende AI-Discard-Tests werden angepasst statt gelöscht und bleiben deterministisch.

## Umsetzungshinweise

- Wahrscheinliche Startpunkte: `packages/ai/src/index.ts`, optional neues `packages/ai/src/discard-selection.ts`, Tests in `packages/ai/src/index.test.ts`.
- Vorhandene Helfer wie `createAiHintsByCard`, `CARD_ROLES_BY_CARD`, `RUNTIME_CARDS`, `rolesForCardId`-ähnliche Logik wiederverwenden oder klein teilen, statt neue parallele Kartentaxonomie aufzubauen.
- Die Engine liefert die Discard-Choice als normale `resolve_choice`; der neue Pfad darf nur `selectedChoices` besser befüllen.
- Tie-Break immer stabil halten: zuerst Score, dann Label, dann Option-ID.

## Ergebnisnotiz

Noch offen.
