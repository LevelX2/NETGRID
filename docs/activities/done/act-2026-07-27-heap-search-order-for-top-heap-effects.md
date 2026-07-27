---
activityId: act-2026-07-27-heap-search-order-for-top-heap-effects
status: done
kind: fix
area: cards
priority: normal
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-07-27
startedAt: 2026-07-27
completedAt: 2026-07-27
branch: codex/heap-search-order
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/engine/src/game/hidden-zone/search-choice-activations.ts
  - packages/engine/src/game/hidden-zone/search-choice-handlers.ts
  - apps/web/features/actions/CardChoicePanel.tsx
  - apps/web/features/actions/card-choice-order-badge.ts
  - packages/engine/src/game/hidden-zone/search-choice-activations.test.ts
  - packages/engine/src/index-tests/mechanics/hidden-zone-identity.test.ts
  - apps/web/app/card-choice-panel.test.ts
checks:
  - corepack pnpm --filter @netgrid/engine test -- src/game/hidden-zone/search-choice-activations.test.ts src/index-tests/mechanics/hidden-zone-identity.test.ts
  - corepack pnpm --filter @netgrid/web test -- app/card-choice-panel.test.ts
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/web typecheck
  - git diff --check
---

# Heap-Reihenfolge bei Sucheffekten und Top-Heap-Karten klären und darstellen

## Ziel

Die Suche mit `Forgotten Backup Chip` muss dem Runner die für weitere
Top-Heap-Effekte relevante Reihenfolge verständlich zeigen. Die Auswahl darf
die tatsächlich wirksame Information nicht durch technische Sortierung
verschleiern.

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-07-27: Beim Spielen von `Forgotten Backup Chip`
  fehlt im Suchdialog die Heap-Reihenfolge. Der Runner kann daher nicht
  erkennen, welches Programm nach der gewählten Karte für `Junkyard BBS`
  oben liegen wird.
- `Forgotten Backup Chip` durchsucht den Trash nach einem Programm;
  `Junkyard BBS` nimmt die oberste Trash-Karte in den Grip
  (`data/cards/originalset-v1-cards.json`).
- NETGRID behandelt den Heap derzeit als geordneten Zustand:
  `topRunnerHeapCardId` liefert das letzte Element von `state.runner.heap`;
  `Junkyard BBS` revalidiert genau dieses Ziel
  (`packages/engine/src/game/abilities/runner-special-trigger-execution.ts`).
- Der Such-Choice-Builder sortiert die Heap-Karten dagegen nach interner
  Karten-ID (`packages/engine/src/game/hidden-zone/search-choice-activations.ts`).
  Die Darstellung verliert damit die Reihenfolge der wirksamen Heap-Liste.
- Die für das importierte Original-Netrunner-Set einschlägige Errata v1.70
  legt fest: Trash und Archives dürfen nicht umsortiert werden, außer eine
  Regel oder ein Karteneffekt erlaubt es ausdrücklich. Bei mehreren Karten,
  die getrasht werden, wird zudem die Trash-Reihenfolge festgelegt; bei
  Schaden ist dies die zufällige Auswahlreihenfolge
  (`docs/source/Netrunner Errata 1.70.md`, allgemeine Rulings „Trash“ und
  „Dealing & Taking Damage“).
- Es gibt in Errata v1.70 keinen kartenspezifischen Eintrag zu `Junkyard
BBS`; der gedruckte Text „Bring the top card from your trash into your
  hand“ verwendet die allgemeine Reihenfolgenregel direkt.
- Die moderne Null-Signal-Regelreferenz behandelt den Discard Pile anders,
  ist aber nicht die führende Regelquelle für diese Original-Netrunner-Karte.

## Scope

- `Forgotten Backup Chip` und andere Heap-Sucheffekte in der echten
  `runner.heap`-Reihenfolge ausgeben; die oberste Karte klar markieren und
  die Richtung der Darstellung erklären.
- Sicherstellen, dass die durch eine Auswahl verbleibende Reihenfolge bei
  `Junkyard BBS` und weiteren Top-Heap-Effekten nachvollziehbar bleibt.
- Regressionen für mehrere Programme, eine nicht auswählbare Karte und das
  Entfernen einer Nicht-Spitzenkarte ergänzen. Dabei `PlayerView`,
  `LegalActions`, `applyAction`, deterministisches Replay und `StateHash`
  unverändert absichern.

## Nicht im Scope

- Keine automatische oder frei steuerbare Heap-Neuanordnung, solange die
  Regelentscheidung das nicht ausdrücklich verlangt.
- Keine Änderung an versteckten Zonen oder eine Offenlegung gegnerischer
  Informationen.
- Keine Neugestaltung allgemeiner Karten-Suchdialoge außerhalb dieses
  Reihenfolge-Vertrags.

## Akzeptanzkriterien

- Der Suchdialog erscheint in derselben Reihenfolge wie `state.runner.heap`;
  die mit `Junkyard BBS` verfügbare Karte ist eindeutig sichtbar.
- Nimmt der Runner mit `Forgotten Backup Chip` eine Karte, die nicht oben
  liegt, bleibt die richtige Folgekarten-Spitze für `Junkyard BBS` sichtbar und
  im Resolver wirksam.
- Der Corp erhält weiterhin keine private Choice oder zusätzliche
  Informationen.
- Replays und `StateHash` bleiben für den Ablauf deterministisch.

## Umsetzungshinweise

- Die technische Ursache ist nicht das Karten-UI allein: Der Choice-Aufbau
  ruft aktuell `.sort()` auf der Heap-Kopie auf. Diese Sortierung muss
  entfernt werden; eine UI-Änderung ohne Vertragstest würde die Regelwirkung
  weiter verschleiern.
- Nach dokumentierter Entscheidung kann die reine Dialogdarstellung an
  `small-adjustments-agent` übergeben werden; Resolver- und Kartenvertrag
  bleiben beim primären Agenten.

## Ergebnisnotiz

Erledigt. Die gemeinsamen Heap-Choice-Erzeuger für `Forgotten Backup Chip`,
`Gideon's Pawnshop` und die Heap-Seite von `Sneak Preview` erhalten die
Reihenfolge von `state.runner.heap`; die technische Sortierung nach
Karteninstanz-ID wurde entfernt. Der Dialog nummeriert den Heap vom
Heap-Boden bis zur ausdrücklich markierten Heap-Spitze und erklärt, dass
`Junkyard BBS` die Spitze zurückholt.

Die Engine-Regressionen decken nicht auswählbare Karten, die Auswahl eines
Programms unterhalb der Spitze, die nachfolgende wirksame Spitze sowie den
Selbst-Trash des gespielten Events ab. Dadurch ist sichtbar, dass der
gespielte Event selbst die oberste Heap-Karte sein kann. Runner-Choice,
Corp-Redaktion, Replay und StateHash bleiben im bestehenden Vertragslauf
abgesichert.
