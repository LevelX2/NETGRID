---
activityId: act-2026-05-22-chronicle-ice-subroutine-resolution-lines
status: done
kind: fix
area: ui
priority: normal
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-05-22
startedAt: 2026-05-22
completedAt: 2026-05-22
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - apps/web/app/chronicle.ts
  - apps/web/app/chronicle.test.ts
  - apps/web/app/page.tsx
checks:
  - corepack pnpm --filter @netgrid/web exec vitest run app/chronicle.test.ts
  - corepack pnpm --filter @netgrid/web typecheck
---

# Spielchronik: ICE-Subroutinen systematisch und ohne Doppelmeldung anzeigen

## Ziel

Die Spielchronik soll bei ungelösten ICE-Subroutinen eine klare, vergleichbare Ereignisfolge anzeigen: pro ausgeführter Subroutine eine verständliche Zeile mit ICE-Name, Subroutinennummer und Effekt, ohne zusätzliche Sammelmeldung, die dieselben Effekte nochmals wiederholt.

## Kontext und Quellen

- Nutzerfund vom 2026-05-22 mit Screenshot aus einem Run auf `Remote 2`.
- Beobachteter Ablauf: Runner-KI startet Run, Korp rezzt verdecktes `Banpei`, Runner löst ungelöste Subroutinen aus.
- Aktuelle Chronik zeigt zusätzlich zu den konkreten Zeilen eine redundante Sammelmeldung:
  - `Die Runner-KI hat ungebrochene Subroutinen ausgelöst, Self-Modifying Code getrasht und der Run endete.`
  - Danach folgen nochmals konkrete Zeilen zu `Banpei: Subroutine 1 ...` und `Banpei: Subroutine 2 ...`.
- Erwartung: Start, Rezzen, Subroutine 1 und Subroutine 2 reichen. Die konkrete Subroutine-Zeile soll die relevante Aktion selbst tragen.

## Scope

- Chronikformatierung für ungelöste ICE-Subroutinen prüfen und redundante Sammelmeldung entfernen oder zusammenführen.
- Für ICE-Subroutinen ein einheitliches Textmuster verwenden, zum Beispiel:
  - `Banpei: Subroutine 1 trasht Self-Modifying Code.`
  - `Banpei: Subroutine 2 beendet den Run.`
- ICE-Name und betroffene Karte als Kartenchips beziehungsweise vorhandene Chronicle-Kartenlinks rendern, soweit die Karte für den Viewer sichtbar beziehungsweise bekannt ist.
- Subroutinennummer und Quelle konsistent anzeigen, damit vergleichbare ICE-Effekte leichter lesbar sind.
- Regression für den `Banpei`-Fall ergänzen oder eine bestehende Chronicle-Formatter-Regression passend erweitern.

## Nicht im Scope

- Keine Änderung an Banpei-Regel, Subroutinereihenfolge oder Engine-Auflösung.
- Keine Änderung an LegalActions, `applyAction`, Replay, StateHash oder Random-Verträgen.
- Keine Offenlegung verdeckter Kartendaten: Kartenchips dürfen nur für Karten entstehen, die der jeweilige Viewer laut Payload kennen darf.
- Kein Redesign der gesamten Spielchronik.
- Keine generelle Umbenennung aller Chronikereignisse außerhalb der ICE-Subroutine-Auflösung.

## Akzeptanzkriterien

- [ ] Ein Banpei-Encounter mit ungelöster Subroutine 1 und 2 erzeugt keine zusätzliche Sammelmeldung, die beide Effekte nochmals zusammenfasst.
- [ ] Die Chronik enthält pro tatsächlich ausgeführter Subroutine eine konkrete, geordnete Zeile mit ICE-Name und Subroutinennummer.
- [ ] `Banpei` und `Self-Modifying Code` werden als vorhandene Kartenchips/Chronicle-Kartenlinks dargestellt, sofern sie für den Viewer sichtbar beziehungsweise bekannt sind.
- [ ] Die Formulierung unterscheidet den Program-Trash aus Subroutine 1 vom Run-Ende aus Subroutine 2.
- [ ] Hidden-Info-, Reconnect- und PublicEvent-Redaction-Grenzen werden nicht aufgeweicht.
- [ ] Fokussierte Web-/Formatter-Tests oder ein begründeter Ersatzcheck decken den Fall ab.

## Umsetzungshinweise

- Wahrscheinlicher Einstiegspunkt ist die Web-Chronikformatierung, insbesondere dort, wo `resolvedEffects` und Run-/Subroutine-Events zu Textzeilen werden.
- Prüfen, ob die redundante Sammelmeldung aus einem generischen "unbroken subroutines fired"-Event stammt und die konkreten Subroutine-Zeilen aus nachgelagerten `resolvedEffects` kommen.
- Wenn für Subroutinennummer oder Kartenchip-Daten Payload-Felder fehlen, keine ad-hoc Hidden-Info-Abkürzung einbauen; stattdessen das kleinste notwendige Payload-/Formatter-Folgepaket schneiden.
- Als Muster nicht nur `Banpei`, sondern mindestens eine zweite ICE-Subroutine-Familie kurz gegenprüfen, damit die neue Systematik nicht banpei-spezifisch bleibt.

## Ergebnisnotiz

Erledigt am 2026-05-22.

- Chronik blendet den generischen `continue_run`-Sammeleintrag aus, wenn konkrete `resolve_subroutine`-Effektzeilen vorhanden sind.
- Subroutine-Zeilen bleiben geordnet und nennen ICE-Name, Subroutinennummer und Effekt; Program-Trash formuliert jetzt direkt `trasht <Karte>`.
- Banpei/Self-Modifying-Code-Regression prueft, dass keine doppelte Sammelmeldung mehr angezeigt wird und die Kartenchips erhalten bleiben.
