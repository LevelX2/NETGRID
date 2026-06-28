---
activityId: act-2026-06-28-social-engineering-guess-reveal-feedback
status: done
kind: fix
area: cards
priority: normal
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-06-28
startedAt:
completedAt: 2026-06-28
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - apps/web/app/chronicle.ts
  - apps/web/app/chronicle.test.ts
checks:
  - corepack pnpm --filter @netgrid/web exec vitest run app/chronicle.test.ts
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index-tests/releases/card-release-smokes.test.ts -t "Social Engineering"
---

# Social Engineering Guess-Auflösung sichtbar machen

## Ziel

Nach dem Korp-Guess bei `Social Engineering` soll die Oberfläche den aufgedeckten versteckten Runner-Betrag, den Korp-Guess und die konkrete Folge klar anzeigen: richtiger Guess führt zum Creditverlust, falscher Guess führt zur Server-/ICE-Zielwahl und zum Auto-Pass-Run.

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-06-28: Bei `Social Engineering` setzt der Runner verdeckt mindestens 2 Credits/Bits. Nach dem verdeckten Korp-Guess soll sichtbar werden, welche Anzahl geraten wurde und welche Konsequenz daraus folgt.
- Kartenvertrag im Code: [social-engineering.ts](C:/Projekte/NETGRID/packages/engine/src/card-implementations/onr-v1/runner/preps/social-engineering.ts).
- Bestehende Engine-Smokes prüfen bereits Hidden-Choice, Correct-Guess-Creditverlust und Wrong-Guess-Auto-Pass: [card-release-smokes.test.ts](C:/Projekte/NETGRID/packages/engine/src/index-tests/releases/card-release-smokes.test.ts).
- Die Chronik enthält bereits Social-Engineering-Formatlogik für versteckten Betrag, Guess und Folge; der Umsetzungsschnitt soll prüfen, ob diese Information im tatsächlichen Spiel-UI zuverlässig sichtbar ist: [chronicle.ts](C:/Projekte/NETGRID/apps/web/app/chronicle.ts).

## Scope

- Prüfen, ob die nach dem Korp-Guess vorhandenen öffentlichen Eventdaten in der Spieloberfläche sichtbar genug erscheinen.
- Nach dem Korp-Guess anzeigen:
  - versteckter Runner-Betrag,
  - Korp-Guess,
  - ob die Korp richtig oder falsch geraten hat.
- Bei richtigem Guess klar anzeigen, dass der Runner den versteckten Betrag verliert.
- Bei falschem Guess klar anzeigen, dass der Runner danach einen Datafort und ein ICE wählen darf; nach der Zielwahl soll der beginnende Run mit automatisch passiertem ICE sichtbar bleiben.
- Den No-ICE-Fall weiterhin verständlich darstellen, falls kein gültiges ICE-Ziel verfügbar ist.
- Focused Regression für die UI-/Chronikdarstellung und für die Hidden-Info-Grenze ergänzen oder aktualisieren.

## Nicht im Scope

- Keine Änderung der `Social Engineering`-Regel, Mindestbeträge, Timingfenster, Kostenlogik oder Ziellegalität.
- Keine generische Hidden-Choice-, Trace- oder Bidding-Refaktorierung.
- Keine Änderung an `applyAction`-, Replay-, StateHash-, Randomness- oder LegalAction-Verträgen, außer ein konkreter bestehender Bug in diesem engen Kartenpfad macht eine minimale Korrektur nötig.
- Kein Vorab-Reveal des versteckten Runner-Betrags in PlayerViews, WebSocket-Payloads, Reconnect-Payloads, Logs, KI-Inputs oder Client-Fehlern vor dem Korp-Guess.

## Akzeptanzkriterien

- [x] Vor dem Korp-Guess bleibt der vom Runner verdeckt gesetzte Betrag für die Korp verborgen.
- [x] Nach dem Korp-Guess ist im Spiel-UI sichtbar, welchen Betrag der Runner versteckt hat und welchen Betrag die Korp geraten hat.
- [x] Correct-Guess-Fall: UI/Chronik nennt, dass die Korp richtig geraten hat und der Runner den versteckten Betrag verliert.
- [x] Wrong-Guess-Fall: UI/Chronik nennt, dass die Korp falsch geraten hat und der Runner Server plus ICE für den Auto-Pass-Run wählen darf.
- [x] Nach der Zielwahl bleibt sichtbar, welcher Datafort und welches ICE gewählt wurden und dass dieses ICE automatisch passiert wurde.
- [x] Mindestens ein fokussierter Test deckt die sichtbare Darstellung und die Hidden-Info-Grenze ab; wenn bestehende Tests bereits genügen, wird das im Ergebnis notiert.

## Umsetzungshinweise

- Bevorzugt vorhandene PublicPayload-Daten verwenden: `secretHiddenAmountRevealed`, `secretGuessAmount`, `socialEngineeringGuessCorrect` beziehungsweise die aktuell im Eventpayload genutzten Target-Felder.
- `apps/web/app/chronicle.ts` und `apps/web/app/chronicle.test.ts` sind naheliegende Einstiegspunkte; falls die Chronik korrekt ist, liegt der Bug vermutlich in der aktiven Anzeige/Feed-Einbindung statt in der Engine.
- Bestehende Engine-Tests nicht aufweichen: die Hidden-Info-Barriere bis zum Guess ist Teil des Fixvertrags.
- Sichtbare UI-Texte auf Deutsch formulieren; technische IDs und Kartenname bleiben unverändert.

## Ergebnisnotiz

Umgesetzt. `apps/web/app/chronicle.ts` liest neben den alten Social-Engineering-Aliasnamen jetzt die echten Engine-/PublicPayload-Felder `secretSpendGuessRunGuessCorrect` und `secretSpendGuessRunNoIceTarget`. `apps/web/app/chronicle.test.ts` deckt die realistischen Payloads für Wrong Guess, Correct Guess, No-ICE und Zielwahl ab. Die bestehende Engine-Smoke-Abdeckung für Hidden-Choice, Correct-Guess-Creditverlust und Wrong-Guess-Auto-Pass blieb grün.
