---
activityId: act-2026-07-11-weather-to-finance-pipe-outcome-presentation
status: done
kind: fix
area: web
priority: high
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-07-11
startedAt: 2026-07-17
completedAt: 2026-07-17
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/engine/src/game/run/run-access-transition.ts
  - packages/engine/src/game/run/run-access-transition.test.ts
  - packages/engine/src/public-context.ts
  - packages/engine/src/index-tests/releases/mechanic-package-smokes-v16-v199.test.ts
  - apps/web/app/chronicle.ts
  - apps/web/app/chronicle.test.ts
  - apps/web/app/successful-run-outcome-presentation.ts
  - apps/web/app/successful-run-outcome-presentation.test.ts
  - apps/web/features/actions/SuccessfulRunOutcomeModal.tsx
  - apps/web/features/actions/SuccessfulRunOutcomeModal.test.ts
  - apps/web/app/access-presentation.ts
  - apps/web/app/access-presentation.test.ts
  - apps/web/app/page.tsx
checks:
  - "corepack pnpm --filter @netgrid/engine test (188 Dateien, 1709 Tests bestanden)"
  - "corepack pnpm --filter @netgrid/web test (45 Dateien, 598 Tests bestanden)"
  - "corepack pnpm --filter @netgrid/engine typecheck (bestanden)"
  - "corepack pnpm --filter @netgrid/web typecheck (bestanden)"
  - "git diff --check (bestanden)"
---

# Weather-to-Finance Pipe mit Chronicle und Ergebnisfenster abschließen

## Ziel

Ein erfolgreicher, durch `Weather-to-Finance Pipe` gestarteter HQ-Run soll sein öffentliches Ersatzergebnis sichtbar abschließen: Die Chronicle nennt den erfolgreichen Run, den Creditverlust der Korp und den ausgefallenen HQ-Kartenzugriff. Zusätzlich erscheint ein bestätigungspflichtiges Fenster mit der gespielten Karte und genau diesem Ergebnis, bevor das Spiel normal weiterläuft.

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-07-11: Nach dem Spielen von `Weather-to-Finance Pipe` lief der erfolgreiche HQ-Run unmittelbar weiter, ohne verständliche Ergebnismeldung, ohne Chronicle-Zusammenfassung und ohne sichtbares Bestätigungsfenster.
- Verbindlicher Kartentext in `packages/shared/src/card-definitions.ts` und `data/cards/originalset-v1-cards.json`: `Make a run on HQ. If run is successful, do not access cards from HQ; instead, the Corp loses 4 credits.`
- Die Kartenimplementation `packages/engine/src/card-implementations/onr-v1/runner/preps/weather-to-finance-pipe.ts` nutzt bereits den öffentlichen Vertrag `successfulRunAccessReplacement: "corp_lose_credits"` mit `successfulRunCreditLoss: 4`.
- `packages/engine/src/game/run/run-access-transition.ts` zieht die Credits ab, beendet den erfolgreichen Run ohne Access und setzt auf der auflösenden Aktion unter anderem `accessReplacement`, `creditLoss`, `corpCreditsAfter`, `hiddenZoneBarrier`, `sourceDefinitionId` und `sourceTitle`.
- Der bestehende Chronicle-Zweig in `apps/web/app/chronicle.ts` beschreibt generische Access-Replacements derzeit nur unter der Bedingung `actionType === "play_event"`. Bei einem echten Run mit ICE wird der erfolgreiche Run typischerweise später über `continue_run` aufgelöst; dieser Pfad fällt dadurch aus der vorhandenen Zusammenfassung.
- Der bestehende Engine-Smoke in `packages/engine/src/index-tests/releases/mechanic-package-smokes-v16-v199.test.ts` deckt den unmittelbaren Auflösungspfad ab, prüft für Weather-to-Finance Pipe aber noch nicht den vollständigen öffentlichen Replacement-Payload und keinen späteren `continue_run`-Abschluss.
- Es existiert keine offene Activity für diese Karte oder diese Präsentationslücke.

## Scope

- Den Playtest-Fall mit mindestens einem ICE vor HQ reproduzieren, sodass `Weather-to-Finance Pipe` nicht vollständig im ursprünglichen `play_event`, sondern erst über den späteren erfolgreichen Run-Abschluss aufgelöst wird.
- Den unmittelbaren No-ICE-Pfad als Gegenfall mitprüfen; beide Pfade müssen denselben öffentlichen fachlichen Ergebnisvertrag liefern.
- Die Chronicle für `corp_lose_credits`-Access-Replacements unabhängig vom technischen Action-Typ der finalen Auflösung formatieren.
- Für Weather-to-Finance Pipe mindestens sichtbar nennen:
  - der HQ-Run war erfolgreich,
  - die Korp verliert tatsächlich bis zu 4 Credits,
  - der normale Zugriff auf HQ-Karten entfällt.
- Doppelte oder irreführende Chronicle-Zeilen vermeiden: Das anfängliche Ausspielen/Starten des Runs und das spätere erfolgreiche Ersatzergebnis dürfen getrennt erscheinen, aber der Effekt darf nicht schon vor dem erfolgreichen Run als erledigt gemeldet werden.
- Nach der erfolgreichen Ersetzung ein öffentliches, bestätigungspflichtiges Ergebnisfenster anzeigen mit:
  - `Weather-to-Finance Pipe` als Quellkarte beziehungsweise Kartenabbildung,
  - Ergebnistext sinngemäß `Erfolgreicher HQ-Run`, `Korp verliert 4 Credits` und `Kein Karten-Access auf HQ`,
  - einer eindeutigen Bestätigung wie `OK` oder `Weiter`.
- Das Fenster für beide Seiten aus demselben öffentlichen Event ableiten; es darf keine HQ-Kartenidentität oder Access-Queue erzeugen oder offenlegen.
- Bis zur lokalen Bestätigung weitere reine Präsentationsfortschritte, automatische Zugbeendigung und KI-Pacing soweit nötig zurückhalten, ohne eine neue Engine-Choice oder LegalAction einzuführen.
- Vergleichbare erfolgreiche Run-Access-Replacements wie `Edited Shipping Manifests` kurz auf denselben Action-Typ-Blindfleck prüfen. Wenn die gemeinsame Darstellung ohne Mehrscope möglich ist, den Helper generisch halten; eigenständige Kartenfenster-Nacharbeiten als kleine Folge-Activities ablegen.

## Nicht im Scope

- Keine Änderung am Kartentext, Run-Ziel, Creditverlust, Erfolgsbegriff oder No-Access-Regel von Weather-to-Finance Pipe.
- Keine Änderung an ICE-, Encounter-, Run- oder HQ-Access-Legalität.
- Kein allgemeines Redesign sämtlicher Run-, Access-, Chronicle- oder Kartenfenster.
- Keine neue Engine-Bestätigungsaktion für ein bereits aufgelöstes öffentliches Ergebnis; die Bestätigung bleibt lokale Präsentationssteuerung.
- Keine Anzeige verdeckter HQ-Karten, Access-Queue oder anderer Hidden-Info-Daten.
- Keine Änderung an Replay-, StateHash-, Randomness- oder LegalAction-Verträgen.

## Akzeptanzkriterien

- [x] Ein erfolgreicher Weather-to-Finance-Pipe-Run mit mindestens einem ICE vor HQ zieht der Korp tatsächlich bis zu 4 Credits ab, erzeugt keinen HQ-Kartenzugriff und liefert auf der finalen Auflösungsaktion den vollständigen öffentlichen Replacement-Payload.
- [x] Derselbe fachliche Ergebnisvertrag ist auch beim unmittelbaren No-ICE-Pfad vorhanden.
- [x] Die Chronicle nennt nach erfolgreicher Auflösung `Weather-to-Finance Pipe`, den erfolgreichen HQ-Run, den tatsächlichen Creditverlust der Korp und ausdrücklich den entfallenen HQ-Karten-Access.
- [x] Die Chronicle meldet den Effekt nicht bereits beim Ausspielen als erfolgreich, wenn der Run noch scheitern kann.
- [x] Nach der erfolgreichen Auflösung erscheint ein Fenster mit der Quellkarte und dem Ergebnis `Korp verliert 4 Credits; kein HQ-Karten-Access`.
- [x] Erst die ausdrückliche lokale Bestätigung schließt dieses Ergebnisfenster und gibt den normalen Präsentationsablauf wieder frei.
- [x] Scheitert der Run, gibt es weder Creditverlust noch ein falsches Erfolgsfenster; die Chronicle beschreibt keinen ausgeführten Replacement-Effekt.
- [x] Hat die Korp weniger als 4 Credits, zeigen State, Chronicle und Fenster konsistent den tatsächlich verlorenen Betrag; die Korp fällt nicht unter 0 Credits.
- [x] Runner- und Korp-Ansicht enthalten keine Identität, Position oder Anzahl verdeckter HQ-Karten und keine ableitbare Access-Queue.
- [x] Fokussierte Engine- und Webtests decken No-ICE-, ICE-/`continue_run`-, Failed-Run- und Corp-mit-weniger-als-4-Credits-Fälle ab; Web-Typecheck und `git diff --check` sind grün.

## Umsetzungshinweise

- Zuerst den vollständigen Event-Payload des verzögerten `continue_run`-Pfads testen. Der bestehende Resolver stellt voraussichtlich bereits alle erforderlichen öffentlichen Felder bereit; eine Engine-Änderung ist nur bei belegter Payload-Lücke nötig.
- Die Chronicle-Erkennung an `accessReplacement` plus Quellmetadaten binden, nicht pauschal an `play_event`. Der Action-Typ beschreibt den technischen Auflösungsschritt, nicht die fachliche Herkunft des Effekts.
- Für das Fenster bevorzugt einen kleinen retained PublicEvent-/Presentation-Helper und vorhandene Karten-/Access-Overlay-Bausteine verwenden. Ein reiner Auto-Dismiss-Action-Cue erfüllt die gewünschte Bestätigung nicht.
- Wahrscheinliche Einstiegspunkte:
  - `packages/engine/src/index-tests/releases/mechanic-package-smokes-v16-v199.test.ts`
  - `apps/web/app/chronicle.ts` und `apps/web/app/chronicle.test.ts`
  - `apps/web/app/action-board-ui.ts` und `apps/web/app/action-board-ui.test.ts`
  - `apps/web/app/page.tsx`
  - `apps/web/features/actions/AccessReviewModals.tsx` oder ein eng benannter wiederverwendbarer Ergebnisdialog
- Falls gleichzeitig `act-2026-07-11-winning-agenda-access-before-result-modal` umgesetzt wird, die gemeinsamen Präsentationshelper koordinieren, ohne beide fachlich getrennten Pakete zusammenzuziehen.

## Ergebnisnotiz

Der erfolgreiche Run-Abschluss liefert nun unabhängig von `play_event` oder `continue_run` denselben öffentlichen Replacement-Vertrag mit tatsächlichem Creditverlust und explizitem No-Access-Signal. Chronicle und ein lokal bestätigungspflichtiges Ergebnisfenster zeigen Quellkarte, erfolgreichen HQ-Run, Creditverlust und entfallenen Zugriff; bis zur Bestätigung bleiben KI-Pacing, Action-Cues und automatische Zugbeendigung blockiert. Engine-Tests sichern No-ICE, ICE, Fehlschlag, niedrige Korp-Credits und Hidden-Info-Schutz für beide Seiten ab.
