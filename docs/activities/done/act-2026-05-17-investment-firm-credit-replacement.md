---
activityId: act-2026-05-17-investment-firm-credit-replacement
status: done
kind: fix
area: cards
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/engine/src/index.ts
  - packages/engine/src/index.test.ts
  - packages/engine/src/mechanics/payment-costs.ts
  - packages/shared/src/index.ts
checks:
  - corepack pnpm --filter @netgrid/engine test -- -t "Investment Firm|V1.9.17 economy asset|V1.9.17 recurring"
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/shared typecheck
  - corepack pnpm --filter @netgrid/web test -- action-board-ui.test.ts
  - corepack pnpm --filter @netgrid/web typecheck
  - git diff --check
---

# Investment Firm: Credit-Nehmen durch 2 Credits auf Node ersetzen

## Ziel

`Investment Firm` soll als rezzed/installierter Node korrekt funktionieren: Wenn die Korp einen Credit nimmt, muss sie wählen können, ob sie den Credit normal erhält oder stattdessen 2 Credits auf `Investment Firm` legt.

## Kontext und Quellen

- Nutzerbefund vom 2026-05-17: `Investment Firm` wurde installiert und rezzed. Danach nahm die Korp einen Credit. Es erschien keine Choice/Abfrage, ob der Credit wirklich genommen werden soll oder ob stattdessen 2 Credits auf `Investment Firm` gelegt werden sollen.
- Erwartetes Verhalten laut Nutzerverständnis: Beim Credit-Nehmen muss eine optionale Ersatz-/Wahlmöglichkeit ausgelöst werden.
- Befund deutet darauf hin, dass die Karte trotz früherer Kartenprüfungen keinen oder keinen vollständigen Runtime-Resolver hat.

## Scope

- `Investment Firm` gegen lokale Quellen prüfen und den exakten Kartentext/Regelvertrag festhalten.
- Engine-Resolver ergänzen oder korrigieren:
  - Trigger/Replacement beim Korp-Grundaction `Credit nehmen`.
  - Optionaler Choice-Flow: normal 1 Credit erhalten oder 2 Credits auf `Investment Firm` legen.
  - Credits auf dem Node als öffentliche Counter/Credits modellieren, sofern rezzed sichtbar.
- UI-Choice bzw. LegalAction-Darstellung prüfen, damit die Entscheidung klar erkennbar ist.
- PublicEvents/PlayerViews so gestalten, dass nur side-sichere Informationen veröffentlicht werden.
- Tests ergänzen, die den fehlenden Choice-Pfad reproduzieren und absichern.

## Nicht im Scope

- Keine Änderung an der allgemeinen Credit-Grundaktion außerhalb des `Investment Firm`-Sonderpfads.
- Keine Freischaltung weiterer Node-/Credit-Karten ohne eigenes Gate.
- Keine KI-Optimierung für Investment-Firm-Nutzung, außer wenn bestehende KI-Smokes Mindestanpassungen brauchen.
- Keine Änderung an Replay/StateHash außer den notwendigen deterministischen Events und Choices dieser Karte.

## Akzeptanzkriterien

- [x] Rezzed `Investment Firm` erzeugt beim Korp-`Credit nehmen` eine klare Entscheidung: 1 Credit nehmen oder 2 Credits auf `Investment Firm` legen.
- [x] Ohne rezzed/installierte `Investment Firm` bleibt `Credit nehmen` unverändert.
- [x] Die Entscheidung ist optional und führt bei Ablehnung zum normalen Credit-Gewinn.
- [x] Bei Annahme erhält die Korp nicht zusätzlich den normalen Credit, sondern legt 2 Credits auf `Investment Firm`.
- [x] Mehrere `Investment Firm`-Instanzen oder vergleichbare Edge Cases sind geprüft und korrekt begrenzt oder dokumentiert.
- [x] `applyAction`/Choice-Resolve revalidiert Side, StateVersion, Quelle, Rez-/Installzustand und Timing.
- [x] Credits auf `Investment Firm` werden sichtbar und verständlich angezeigt.
- [x] Replay und StateHash bleiben deterministisch.
- [x] Fokussierte Engine-Tests decken normalen Credit, Replacement-Choice und Stale/Wrong-Side ab.
- [x] Fokussierte Web-/Choice-Regression deckt die sichtbare Abfrage ab, oder eine Testauslassung ist begründet dokumentiert.

## Umsetzungshinweise

- Wahrscheinliche Startpunkte sind Credit-Grundaktion/Replacement-Choice in `packages/engine/src/index.ts` oder ausgelagerte Economy-/Node-Mechanics-Module sowie UI-Choice-Darstellung in `apps/web/app/page.tsx`.
- Prüfen, ob bereits generische Replacement-/Event-Modification-Infrastruktur genutzt werden kann.
- Die Karte ist ein guter Regressionstest dafür, dass frühere Kartenprüfungen nicht nur Katalogstatus, sondern echte Runtime-Choice-Pfade abdecken.

## Ergebnisnotiz

Abgeschlossen. `Investment Firm` hängt nicht mehr an der generischen rezzed Economy-Asset-Aktion, die direkt 2 Credits an die Korp gegeben hat. Stattdessen öffnet die normale Korp-Grundaktion `1 Credit nehmen` bei rezzed installierter `Investment Firm` eine `resolve_choice`: entweder den normalen Credit nehmen oder exakt 2 sichtbare `recurring_credit`-Counter auf eine konkrete Investment Firm legen.

Der Resolver revalidiert Side, StateVersion über den PendingChoice-Vertrag sowie den aktuell rezzed installierten Source-Zustand. Mehrere Investment-Firm-Instanzen werden als getrennte Zieloptionen angeboten. PlayerViews zeigen die Counter auf der rezzed Karte; PublicPayloads enthalten nur öffentliche Kartendefinition, Countertyp und Beträge. Replay und StateHash sind im fokussierten Engine-Test abgedeckt. Die Web-Choice-Darstellung nutzt den bestehenden generischen `select_option`-Choice-Pfad; `action-board-ui.test.ts` und Web-Typecheck sind grün.
