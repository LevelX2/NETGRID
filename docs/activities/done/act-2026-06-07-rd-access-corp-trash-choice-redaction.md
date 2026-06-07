---
activityId: act-2026-06-07-rd-access-corp-trash-choice-redaction
status: done
kind: fix
area: web
priority: hotfix
primaryAgent: architecture-review-agent
requiresImplementation: true
createdAt: 2026-06-07
startedAt: 2026-06-07
completedAt: 2026-06-07
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/engine/src/game/view/card-view.ts
  - packages/engine/src/index.test.ts
  - apps/server/src/multiplayer.test.ts
checks:
  - 'PASS: corepack pnpm --filter @netgrid/engine exec vitest run src/index.test.ts -t "redacts the private R&D trash choice"'
  - 'PASS: corepack pnpm --filter @netgrid/server exec vitest run src/multiplayer.test.ts -t "redacts active R&D trash choices"'
  - 'PASS: corepack pnpm --filter @netgrid/engine exec vitest run src/index.test.ts -t "lets the Runner steal the top R&D agenda|redacts the private R&D trash choice|rezzes and trashes a simple upgrade"'
  - 'PASS: corepack pnpm --filter @netgrid/server exec vitest run src/multiplayer.test.ts -t "redacts active R&D trash choices|keeps HQ access card identities visible"'
  - 'PASS: corepack pnpm --filter @netgrid/engine exec vitest run src/game/view/player-view-projection.test.ts'
  - 'PASS: corepack pnpm --filter @netgrid/server exec tsc --noEmit'
  - 'PASS: git diff --check'
  - 'KNOWN-UNRELATED-FAIL: corepack pnpm --filter @netgrid/engine exec tsc --noEmit -> packages/engine/src/game/card-implementation/trace-runtime-deps.test.ts Test-Fixture fehlt addHackerTrackerTraceCounters und resolveTraceTrashRunnerResourceSuccess'
---

# R&D-Access: Korp sieht private Trash-Choice nicht

## Ziel

Die Korp darf während eines privaten Runner-Zugriffs auf die oberste R&D-Karte weder die Kartenidentität noch aus dem Wartezustand ableitbare Detailinformationen sehen, solange die Karte nicht durch Steal, Trash, Reveal oder einen anderen legal öffentlichen Effekt sichtbar wird.

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-06-07: Der Runner lief auf R&D, griff auf ein Upgrade als oberste R&D-Karte zu und bekam offenbar die Entscheidung, ob die Karte getrasht werden soll. In der Korp-Ansicht wurde die konkrete Karte beziehungsweise ein Hinweis angezeigt, dass der Runner nun über Trash entscheidet. Der Runner trasht die Karte nicht.
- Erwartung aus Hidden-Info-Prinzip: Eine nicht getrashte, nicht gestohlene und nicht anderweitig aufgedeckte R&D-Topkarte bleibt für die Korp weiterhin verdeckt. Die Korp darf höchstens einen generischen Wartezustand für die private Access-Abwicklung sehen.
- Verwandte erledigte Pakete:
  - `docs/activities/done/act-2026-05-17-hq-access-reveal-lifetime.md`
  - `docs/activities/done/act-2026-05-22-rd-access-window-simplification.md`
  - `docs/activities/done/act-2026-05-22-remote-root-hidden-card-order-leak.md`

## Scope

- Den R&D-Access-/Trash-Choice-Pfad für Korp-PlayerView, PublicEvents, WebSocket-/Reconnect-Payloads und Webclient-Darstellung prüfen.
- Sicherstellen, dass während einer privaten R&D-Access-Entscheidung auf Korp-Seite keine `cardDefinitionId`, kein Titel, kein Kartentyp, keine Subtypen, kein Kartentext, kein konkreter Trash-Kostenwert und keine spezifische Meldung wie "Runner entscheidet, ob diese Karte getrasht wird" erscheint, solange die Karte nicht öffentlich geworden ist.
- Korp-Wartezustand für privaten R&D-Access auf eine generische Form bringen, z. B. "Runner handelt Zugriff ab", ohne Trashbarkeit oder Kartenart zu verraten.
- Positive Fälle erhalten: Wenn der Runner eine Agenda stiehlt, eine Karte trasht oder ein Effekt die Karte legal revealed, darf die danach öffentliche Information weiter korrekt angezeigt werden.
- Regression für mindestens einen R&D-Zugriff auf eine trashbare Nicht-Agenda ergänzen, bei dem der Runner nicht trasht.

## Nicht im Scope

- Keine Änderung der Access-Legalität, Trash-Kostenberechnung, Steal-Regeln oder Multiaccess-Reihenfolge.
- Keine neue Korp-Information über R&D-Topkarte, Trashbarkeit oder Runner-Choice-Optionen.
- Keine Änderung an HQ-, Archives- oder Remote-Access, außer ein gemeinsamer Redaction-Helfer muss defensiv angepasst werden.
- Keine Änderung an Replay-, StateHash-, RandomDrawRecord- oder `applyAction`-Verträgen außer notwendigen Redaction-/Regressionstests.

## Akzeptanzkriterien

- [x] Die Korp-Ansicht zeigt bei nicht öffentlichem R&D-Access keine konkrete accessed Karte und keine ableitbare Trash-/Kartentyp-Information.
- [x] Korp-PlayerView, PublicEvents, Reconnect-Payloads und WebSocket-Payloads enthalten während der privaten Trash-Choice keine verdeckte R&D-Kartenidentität.
- [x] Runner-Ansicht zeigt die accessed Karte und legale Trash-/Decline-Aktionen weiterhin korrekt.
- [x] Nach tatsächlichem Trash, Steal oder legalem Reveal wird die dann öffentliche Information korrekt sichtbar.
- [x] Fokussierte Engine-/Server-/Web-Regression deckt den gemeldeten Fall ab: R&D-Topkarte ist ein trashbares Upgrade, Runner declined Trash, Korp erfährt die Karte nicht.
- [x] Hidden-Info-, Replay- und StateHash-Gates bleiben grün oder eine begründete, eng begrenzte Testauslassung ist dokumentiert.

## Umsetzungshinweise

- Primär zuerst die Schichtgrenze prüfen: Entsteht der Leak in der Engine-PlayerView/PublicEvent-Projektion, im Server-Reconnect/WebSocket-Payload oder erst im Webclient durch falsches Zusammenführen von Runner- und Korp-Access-UI-State?
- Das ältere Paket `act-2026-05-17-hq-access-reveal-lifetime` erwähnt explizit eine bestehende R&D-Redaction für Korp-Payloads. Diese Regression kann als Startpunkt dienen, aber der neue Befund deutet auf einen offenen Trash-Choice-/Waiting-State-Pfad hin.
- Falls der Leak nur aus einer UI-Statuszeile kommt, klein über `small-adjustments-agent` nachschneiden; sobald Payload- oder PlayerView-Daten betroffen sind, bleibt `architecture-review-agent` primär.

## Ergebnisnotiz

Abgeschlossen. Die PlayerView-Projektion behandelt Korp-eigene Karten nicht mehr pauschal als bekannt, sondern nur in Korp-Hand, Korp-Archiv, Korp-Score-Area und installierten Server-Zonen. Für den aktiven privaten Runner-Access auf R&D wird das interne `faceup` der accessed Karte nicht als Korp-öffentliche Sichtbarkeit gewertet.

Die neue Engine-Regression prüft `simple_upgrade` als R&D-Topkarte, Runner-Access mit Trash-/Decline-Aktionen, Korp-redacted `run.accessedCard`, redacted PublicEvent, Decline ohne Kartenleck sowie Replay/StateHash. Die neue Server-Regression prüft denselben Ablauf über `submitAction`-Live-Payload, Bootstrap und Reconnect; die Korp erhält keine konkrete Karte und keine Trash-/Decline-Aktionsinformation. Bestehende positive Access-Fälle für R&D-Steal, Remote-Trash und HQ-Sichtbarkeit wurden fokussiert mitgeprüft.

Der Engine-Typecheck bleibt durch den bereits bekannten, nicht paketbezogenen Fixture-Fehler in `packages/engine/src/game/card-implementation/trace-runtime-deps.test.ts` rot; der Server-Typecheck ist grün.
