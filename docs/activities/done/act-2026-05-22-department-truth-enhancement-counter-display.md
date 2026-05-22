---
activityId: act-2026-05-22-department-truth-enhancement-counter-display
status: done
kind: fix
area: web
priority: high
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-05-22
startedAt: 2026-05-22
completedAt: 2026-05-22
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/engine/src/index.ts
  - packages/engine/src/index.test.ts
  - apps/web/app/action-board-ui.test.ts
checks:
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index.test.ts -t 'Department of Truth Enhancement|manual hosted-credit abilities'
  - corepack pnpm --filter @netgrid/web exec vitest run app/action-board-ui.test.ts -t 'stored credits'
  - corepack pnpm --filter @netgrid/web exec vitest run app/chronicle.test.ts -t 'Department of Truth Enhancement|hosted'
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/web typecheck
  - git diff --check -- packages/engine/src/index.ts packages/engine/src/index.test.ts apps/web/app/action-board-ui.test.ts docs/activities/in-progress/act-2026-05-22-department-truth-enhancement-counter-display.md
---

# Department of Truth Enhancement Counter sichtbar machen

## Ziel

Credits/Bits auf `Department of Truth Enhancement` müssen sichtbar auf der installierten Karte angezeigt und nach beiden Aktionen korrekt aktualisiert werden.

## Kontext und Quellen

- Nutzerprüfliste vom 2026-05-22: Auf der Karte liegende Credits/Bits bzw. Counter werden offenbar nicht sichtbar angezeigt.
- Solltext laut Nutzer: `A: Put [3] from the bank on Department of Truth Enhancement. A: Take all the bits from Department of Truth Enhancement.`
- Lokaler Befund: `packages/engine/src/card-implementations/onr-v1/corp/assets/department-of-truth-enhancement.ts` nutzt `add_hosted_credits` und `take_hosted_credits`.
- Frühere relevante Activities:
  - `docs/activities/done/act-2026-05-21-counter-display-stored-credits-and-agenda-pools.md`
  - `docs/activities/done/act-2026-05-21-web-render-counter-displays.md`

## Scope

- Prüfen, ob `Department of Truth Enhancement` hosted credits intern korrekt speichert und in `VisibleCard.counterDisplays` projiziert.
- Web-Rendering für Stored-Credit-Counter auf gerezzten Corp-Nodes/Assets gegen diese Karte absichern.
- Aktualisierung nach `Put [3]` und `Take all` im PlayerView/Webclient prüfen.
- Chronikmeldungen für beide Aktionen mit konkreten Beträgen sicherstellen.
- Vergleichbare Karten stichprobenartig prüfen: `BBS Whispering Campaign`, `Braindance Campaign`, `Holovid Campaign`, `Rockerboy Promotion`, `Political Coup`.

## Nicht im Scope

- Keine generische Counter-Engine-Neuarchitektur.
- Keine Änderung an nicht sichtbaren/verdeckten Corp-Karten; verdeckte Karten dürfen keine Counterdetails leaken.
- Keine Änderung an den Regelbeträgen 3 und all.
- Keine KI-Strategieänderung.

## Akzeptanzkriterien

- [x] Nach `A: Put [3]` zeigt die Karte sichtbar 3 zusätzliche Credits/Bits.
- [x] Nach `A: Take all` fällt die sichtbare Anzeige auf 0 oder verschwindet fachlich korrekt.
- [x] Engine-Projection und Web-Rendering verwenden denselben CounterDisplay-Vertrag.
- [x] Verdeckte/unrezzed Karten leaken keine hosted-credit-Details.
- [x] Chronik nennt konkrete Beträge für Put und Take.
- [x] Regression deckt `Department of Truth Enhancement` und mindestens eine vergleichbare hosted-credit-Karte ab.

## Umsetzungshinweise

- Wenn die Engine-Projection schon korrekt ist, liegt der Fokus auf Web-Renderer/Mapping; wenn `counterDisplays` fehlen, Folge der bestehenden CounterDisplay-Verträge statt neuer Karten-ID-Hardcodings.
- Dieses Paket ist ein Follow-up zu den erledigten CounterDisplay-Paketen, weil der Nutzer einen weiterhin sichtbaren Einzelfall meldet.

## Ergebnisnotiz

Erledigt. `Department of Truth Enhancement` ist jetzt in der Engine-Projektion der gespeicherten Credits enthalten und nutzt denselben `stored_credits`-CounterDisplay-Vertrag wie vergleichbare hosted-credit-Karten. Die Regression spielt `Put [3]` und `Take all`, prüft die sichtbare Anzeige nach beiden Aktionen, Runner-Redaction bei verdeckter Karte, konkrete Chronikbeträge und den bestehenden Web-Rendererpfad.
