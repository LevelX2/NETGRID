---
activityId: act-2026-05-22-duplicate-hand-install-actions-program-resource
status: done
kind: fix
area: cards
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-22
startedAt: 2026-05-22
completedAt: 2026-05-22
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - apps/web/app/action-board-ui.ts
  - apps/web/app/action-board-ui.test.ts
  - packages/engine/src/index.test.ts
checks:
  - "corepack pnpm --filter @netgrid/engine exec vitest run src/index.test.ts -t \"emits a single plain hand-install action for Skivviss and Cyfermaster\""
  - "corepack pnpm --filter @netgrid/web exec vitest run app/action-board-ui.test.ts -t \"names Corp install destinations in card context actions\""
  - "corepack pnpm --filter @netgrid/engine typecheck"
  - "corepack pnpm --filter @netgrid/web typecheck"
  - "git diff --check"
---

# Doppelte Installationsaktionen aus der Hand

## Ziel

Installierbare Runner-Karten sollen aus der Hand genau eine klare Installationsaktion anzeigen, wenn nur ein regeltechnisch identischer Installationspfad legal ist.

## Kontext und Quellen

- Nutzerfund vom 2026-05-22: Bei `Skivviss` erscheinen beim Installieren aus der Hand zwei auswählbare Installationsaktionen.
- Nutzerfund vom 2026-05-22: Bei `Cyfermaster` erscheint derselbe Doppelaktionsbefund.
- Der Befund wirkt systemisch: vermutlich erzeugen Kartendefinition, generischer Installpfad, Sonderfähigkeit oder UI-Aktionsgruppierung dieselbe Installoption doppelt.
- NETGRID-Prinzip: UI, Server, menschliche Spieler und KI dürfen nur `PlayerActions` einreichen, die aus `LegalActions` abgeleitet wurden; die Rules Engine bleibt Regelautorität.

## Scope

- Für `Skivviss` und `Cyfermaster` prüfen, welche `LegalActions` für Handinstallation entstehen.
- Klären, ob die Duplikate bereits engine-seitig entstehen oder erst in der Web-UI als doppelte Darstellung derselben LegalAction.
- Redundante identische Installationsoptionen entfernen oder deduplizieren.
- Schreibweise und interne Karten-IDs der betroffenen Karten prüfen.
- Einen begrenzten Spotcheck auf vergleichbare Runner-Programme/Resources ergänzen, um keine reine Einzelkartenkorrektur an einem generischen Fehler vorbeizubauen.

## Nicht im Scope

- Keine neue Installationsregel und keine Änderung von Installkosten, MU, Trash-Ersetzung oder Hosting.
- Keine UI-weite Neugestaltung des Actionboards.
- Keine Abschwächung von `applyAction`-Revalidierung, `actionId`, `stateVersion`, Timing- oder Kostengates.
- Keine Änderung an KI-Strategie außer falls sie direkt von der doppelten LegalAction betroffen ist.

## Akzeptanzkriterien

- [x] `Skivviss` zeigt aus der Hand nur eine Installationsaktion, sofern nur ein identischer Installationspfad legal ist.
- [x] `Cyfermaster` zeigt aus der Hand nur eine Installationsaktion, sofern nur ein identischer Installationspfad legal ist.
- [x] Falls zwei Installationspfade tatsächlich regeltechnisch verschieden sind, benennt die UI sie unterscheidbar und das Ergebnis ist dokumentiert.
- [x] Engine- oder Web-Tests schützen gegen doppelte identische Installaktionen.
- [x] LegalAction-Erzeugung und `applyAction`-Revalidierung bleiben deterministisch und replay-/StateHash-stabil.
- [x] Checks: passende Engine/Web-Tests, Typecheck, `git diff --check`.

## Umsetzungshinweise

- Zuerst Roh-`LegalActions` im betroffenen Zustand inspizieren; erst danach entscheiden, ob Engine-Dedupe oder UI-Gruppierung der richtige Schnitt ist.
- Wenn der Fix generisch ist, eng auf identische Install-Aktionen begrenzen und keine anderen Aktionsfamilien deduplizieren.

## Ergebnisnotiz

Die Roh-`LegalActions` erzeugen für `Skivviss` und `Cyfermaster` jeweils genau einen normalen Handinstall. Der zweite beobachtete Button stammt vom bestehenden, regeltechnisch anderen Pfad `runnerProgramTrashBeforeInstall`, der vor dem Installieren installierte Programme trashen kann. Dieser Pfad bleibt erhalten, wird im Kartenaktionsmenü aber nicht mehr identisch als `Installieren`, sondern als `Mit Programmtrash installieren` beschriftet. Damit bleiben LegalAction-Erzeugung, `applyAction`, Replay und StateHash unverändert; die UI unterscheidet die zwei legal verschiedenen Pfade.
