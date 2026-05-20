---
activityId: act-2026-05-20-action-chronicle-extra-action-numbering
status: done
kind: fix
area: web
priority: high
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-05-20
startedAt: 2026-05-20
completedAt: 2026-05-20
branch:
releaseTarget: Action chronicle clarity
blockedBy: []
relatedActivities:
  - act-2026-05-20-corp-ai-overtime-incentives-net-loss
  - act-2026-05-19-mulligan-chronicle-texts
  - act-2026-05-19-self-modifying-code-choice-chronicle
resultArtifacts:
  - apps/web/app/chronicle.ts
  - apps/web/app/chronicle.test.ts
  - apps/web/app/page.tsx
checks:
  - corepack pnpm --filter @netgrid/web exec vitest run app/chronicle.test.ts -t "extra actions|action ordinal"
  - corepack pnpm --filter @netgrid/web typecheck
  - git diff --check -- apps/web/app/chronicle.ts apps/web/app/chronicle.test.ts apps/web/app/page.tsx docs/activities/in-progress/act-2026-05-20-action-chronicle-extra-action-numbering.md
---

# Chronik: Zusatzaktionen mit korrekten Aktionsnummern anzeigen

## Ziel

Die Chronik soll nach Effekten mit zusätzlichen Aktionen dieselbe Aktionszählung anzeigen wie die Aktionsdarstellung im Spiel. Wenn die Korp durch `Overtime Incentives` zwei zusätzliche Aktionen erhält und danach weitere Aktionen ausführt, müssen diese als Aktion 4 und Aktion 5 erscheinen, nicht erneut oder fälschlich als Aktion 2 und 3.

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-05-20 aus einem Playtest-Screenshot: Nach `Overtime Incentives` werden die Folgeaktionen in der Aktionsdarstellung offenbar korrekt als zusätzliche Aktionen dargestellt, im Protokoll/der Chronik aber mit falschen Aktionsnummern gezeigt.
- Beobachteter Ablauf:
  - Korp spielt als Aktion 3 `Overtime Incentives`.
  - Die Karte gewährt zwei zusätzliche Aktionen.
  - Die zwei folgenden Credit-Aktionen müssten daher als Aktionen 4 und 5 dargestellt werden.
  - Im Protokoll erscheinen sie stattdessen als Aktionen 2 und 3.
- Verwandtes KI-Paket: `act-2026-05-20-corp-ai-overtime-incentives-net-loss` behandelt die unsinnige Entscheidung, `Overtime Incentives` für Basic-Credit-Follow-ups zu spielen. Dieses Paket behandelt nur die Darstellung/Nummerierung.

## Scope

- Chronik-/Protokollformatierung für Aktionsnummern prüfen:
  - Woher nimmt die Chronik `actionNumber`, `actionIndex`, verbleibende Aktionen oder ähnliche Werte?
  - Nutzt sie eine feste Standard-Zugaktionenzahl statt den tatsächlichen Action-State nach zusätzlichen Aktionen?
  - Weicht sie von der Action-Board-/Aktionsdarstellung ab?
- Reproduktionsfall mit `Overtime Incentives` oder einer kleineren Fixture abdecken:
  - normale Korp-Aktionen 1 bis 3,
  - `Overtime Incentives` als dritte Aktion,
  - zwei weitere Aktionen,
  - Chronik zeigt 4 und 5 für die Zusatzaktionen.
- Wenn die Engine/PublicEvents bereits die korrekten Daten liefern, nur Web-Chronik-/UI-Formatierung korrigieren.
- Wenn PublicEvents nur Restaktionen oder Standardaktionsslots liefern, eine minimale side-sichere Payload-Ergänzung prüfen, damit die Chronik die tatsächlich verbrauchte Aktionsnummer rekonstruieren kann.
- Web-/Chroniktest ergänzen, der explizit zusätzliche Aktionen und die Nummernfolge prüft.

## Nicht im Scope

- Keine KI-Entscheidungsänderung; die Auswahl von `Overtime Incentives` wird separat behandelt.
- Kein Redesign der Chronik.
- Keine Änderung am Regelvertrag für zusätzliche Aktionen, sofern Engine und Action-Board schon korrekt zählen.
- Keine Änderung an Replay oder StateHash außer einer minimalen, side-sicheren PublicPayload-Ergänzung, falls die Anzeige ohne sie nicht korrekt und deterministisch möglich ist.
- Keine Hidden-Info-Ausweitung in PublicEvents, WebSocket-Payloads, Reconnect-Payloads, Logs oder Chronik.

## Akzeptanzkriterien

- [ ] Ein Test oder eine reproduzierbare Fixture deckt den `Overtime Incentives`-Fall mit zwei zusätzlichen Folgeaktionen ab.
- [ ] Die Chronik zeigt die Folgeaktionen nach Aktion 3 als Aktion 4 und Aktion 5.
- [ ] Die Action-Board-/Aktionsdarstellung und die Chronik nutzen konsistente Nummern oder denselben side-sicheren Action-State.
- [ ] Normale Züge ohne Zusatzaktionen behalten ihre bisherige Nummerierung.
- [ ] Runner- und Korp-Seite bleiben korrekt; keine Anzeige nutzt verdeckte Karteninformationen oder FullState-Daten.
- [ ] Falls PublicEvent-Payloads ergänzt werden, sind Reconnect, Replay und StateHash-Grenzen geprüft und bestehende Chroniktests bleiben grün.

## Umsetzungshinweise

- Wahrscheinliche Startpunkte:
  - `apps/web/app/chronicle.ts`
  - `apps/web/app/chronicle.test.ts`
  - `apps/web/app/page.tsx` oder Action-Board-Helfer nur zum Abgleich, nicht für einen UI-Redesignschnitt.
  - bei fehlenden Daten optional `packages/engine/src/index.ts` und relevante PublicEvent-Typen.
- Vorrangig die Chronik an die bereits korrekte Action-Board-Darstellung angleichen.
- Bei Eventdaten darauf achten, dass Aktionsnummern öffentliche Metadaten sind, aber keine verdeckten Kartendetails oder privaten Choice-Daten mittransportiert werden.

## Ergebnisnotiz

Erledigt: Die Chronik leitet Aktionsnummern nun turnweise aus der öffentlichen Event-Sequenz ab und verwendet dabei die gleiche Schutzlogik wie die Action-Cues: Wenn Event-Payloads nach Zusatzaktionen wieder zu niedrige Ordinals melden, wird aus `bisher verbraucht + 1` die korrekte Folgeaktion bestimmt.

Der neue Chroniktest deckt den `Overtime Incentives`-Fall ab: Aktion 3 gewährt Zusatzaktionen, die zwei folgenden Credit-Aktionen werden als Aktion 4 und Aktion 5 formatiert. Normale Events mit vorhandenen Aktionskosten behalten ihre bisherige Anzeige.
