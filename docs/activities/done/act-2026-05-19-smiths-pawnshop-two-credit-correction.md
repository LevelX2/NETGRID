---
activityId: act-2026-05-19-smiths-pawnshop-two-credit-correction
status: done
kind: fix
area: cards
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-19
startedAt: 2026-05-19
completedAt: 2026-05-19
branch:
releaseTarget:
blockedBy: []
relatedActivities:
  - act-2026-05-18-runner-ai-resource-economy-plan
resultArtifacts:
  - packages/shared/src/index.ts
  - data/cards/originalset-v1-cards.json
  - packages/engine/src/index.ts
  - packages/engine/src/index.test.ts
  - apps/web/app/chronicle.ts
  - apps/web/app/chronicle.test.ts
checks:
  - corepack pnpm --filter @netgrid/engine test -- index.test.ts -t "Smith's Pawnshop"
  - corepack pnpm --filter @netgrid/web test -- chronicle.test.ts -t "Smith's Pawnshop"
  - corepack pnpm --filter @netgrid/shared typecheck
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/web typecheck
---

# Smith's Pawnshop: Trash-Economy auf 2 Credits korrigieren

## Ziel

`Smith's Pawnshop` soll beim optionalen Start-of-turn-Trash einer anderen installierten Runner-Karte 2 Credits geben, nicht 1 Credit. Kartentext, Choice-Text, Resolver-Payload und Tests sollen denselben bestätigten Wert verwenden.

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-05-19: Der aktuelle Text sagt, dass Smith's Pawnshop nur 1 Credit für das Opfern/Trashen der Karte gibt. Korrekt sind 2 Credits.
- Lokale bestätigte Textquelle:
  - `data/local/card-import/onr-v1-limited/text-review-galleries/gallery-11-13-confirmed-texts.local.md` führt für `180 - Smith's Pawnshop`: `At the start of each of your turns, you may trash one of your other installed cards to gain [2].`
- Aktuelle abweichende Stellen:
  - `packages/shared/src/index.ts` beschreibt `gain 1 credit`.
  - `packages/engine/src/index.ts` zeigt in der PendingChoice `... 1 Credit nehmen?`.
  - `packages/engine/src/index.ts` löst mit `credits(state, "runner", 1)` und `creditsGained: 1` auf.
- `data/cards/originalset-v1-cards.json` enthält ebenfalls noch den abweichenden 1-Credit-Text; prüfen, ob diese Quelle korrigiert oder als historischer Import-Snapshot unverändert bleiben soll.

## Scope

- `Smith's Pawnshop`-Kartentext im spielrelevanten Shared-Katalog auf 2 Credits korrigieren.
- Engine-Start-of-turn-Choice-Text auf 2 Credits korrigieren.
- Engine-Resolver auf tatsächlichen Gewinn von 2 Credits korrigieren.
- Public-/Chronicle-/AI-Payload-Felder prüfen, damit sie den korrekten Wert 2 transportieren und keine Stelle weiter 1 Credit ausgibt.
- Bestehende Engine-Tests für Smith's Pawnshop aktualisieren oder fokussierte Regression ergänzen:
  - Runner wählt eine andere installierte Karte,
  - Zielkarte wird getrasht,
  - Runner-Credits steigen um genau 2,
  - Payload/Chronikwert ist 2.
- Prüfen, ob Runner-KI-Economy-Bewertung für Smith's Pawnshop dadurch angepasst oder zumindest nicht durch alte Annahmen auf 1 Credit festgehalten wird.

## Nicht im Scope

- Keine Änderung an Timing, Optionalität oder Zielauswahl von Smith's Pawnshop.
- Smith's Pawnshop darf sich weiterhin nicht selbst trashen.
- Keine Änderung an Unique-Regeln.
- Keine Änderung an anderen Pawnshop-Karten wie `Gideon's Pawnshop`.
- Keine Hidden-Info-Ausweitung: Auswahl bleibt Runner-Choice; öffentliche Events dürfen nur rechtmäßig getrashte/aufgelöste Informationen enthalten.
- Keine Replay-/StateHash-Sonderbehandlung außer der erwarteten deterministischen Änderung durch den korrigierten Creditgewinn.

## Akzeptanzkriterien

- [ ] Der sichtbare Kartentext von `Smith's Pawnshop` nennt 2 Credits für das Trashen einer anderen installierten Karte.
- [ ] Der Start-of-turn-Choice-Text nennt 2 Credits.
- [ ] Bei Annahme der Choice erhält der Runner genau 2 Credits.
- [ ] Resolver-Payload, Chronik und relevante UI-Anzeige geben 2 Credits aus.
- [ ] Ein Engine-Test deckt den 2-Credit-Gewinn ab.
- [ ] Bestehende Smith's-Pawnshop-Härtungstests für Pass, Wrong-Side, Stale und entfernte Ziele bleiben grün.
- [ ] AI-/Economy-Bewertung nutzt keinen fest verdrahteten alten 1-Credit-Wert.

## Umsetzungshinweise

- Wahrscheinliche Startpunkte:
  - `packages/shared/src/index.ts`
  - `packages/engine/src/index.ts`
  - `packages/engine/src/index.test.ts`
  - bei Anzeige-/Chronikableitung ggf. `apps/web/app/chronicle.ts` und Webtests
  - bei KI-Economy-Gewichtung ggf. `packages/ai/src/index.ts`, `packages/ai/src/runner-plans.ts` oder zugehörige Tests
- Für die Textkorrektur die bestätigte lokale Textreview-Quelle mit `[2]` als führend behandeln.
- Falls `data/cards/originalset-v1-cards.json` bewusst Import-Snapshot bleibt, nicht blind ändern; dann im Ergebnis dokumentieren, warum nur der spielrelevante Katalog korrigiert wurde.

## Ergebnisnotiz

Erledigt: Smith's Pawnshop verwendet im spielrelevanten Shared-Katalog, im aktiven Originalset-Datenartefakt, im Start-of-turn-Choice-Text, im Resolver und in der öffentlichen Payload jetzt den bestätigten 2-Credit-Wert. Die Chronik zeigt den getrashten Zielkartennamen und `+2 Credits`; die AI-Hints wurden geprüft und enthalten keine alte 1-Credit-Hartcodierung.

Checks: fokussierte Engine- und Web-Chroniktests sowie Shared-, Engine- und Web-Typechecks bestanden. `git diff --check` wird vor dem Paketcommit ausgeführt.
