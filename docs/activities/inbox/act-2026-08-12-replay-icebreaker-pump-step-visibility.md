---
activityId: act-2026-08-12-replay-icebreaker-pump-step-visibility
status: inbox
kind: fix
area: web
priority: normal
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-08-12
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Eisbrecher-Pumpen im Replay-Einzelschritt sichtbar machen

## Ziel

Beim schrittweisen Abspielen eines Replays ist jede ausgeführte
`pump_breaker`-Aktion verständlich erkennbar. Mehrfaches Pumpen darf nicht wie
mehrfaches Drücken ohne sichtbare Wirkung erscheinen, bevor der Run erst beim
Brechen einer Subroutine oder beim Fortsetzen weitergeht.

## Kontext und Quellen

- Nutzerfund vom 2026-08-12: Vier Pump-Aktionen eines Eisbrechers waren im
  Schritt-für-Schritt-Replay nicht wahrnehmbar; erst ein späterer
  Run-Fortschritt machte wieder eine Änderung sichtbar.
- `apps/web/app/chronicle.ts` formatiert `pump_breaker` bereits mit Kosten,
  Stärkebonus und, sofern geliefert, Stärke danach.
- `apps/web/app/replays/page.tsx` begrenzt die für den aktuellen Frame
  sichtbaren `publicEvents` nach `stateVersionAfter`.
- `apps/web/features/replay/ReplayBoard.tsx` reicht diese Events an die
  Spielchronik weiter. Die vorhandene Formatierung allein belegt daher noch
  nicht, dass der Event- und Zustandsdelta-Pfad im Einzel-Schritt sichtbar ist.

## Scope

- Mit einem Replay eines Run-Fensters mit mindestens mehreren Pump-Aktionen
  prüfen, ob jeder Pump-Schritt im Replay-Frame, den sichtbaren Public Events,
  der Spielchronik und der dargestellten Eisbrecher-Stärke ankommt.
- Die ursächliche Lücke im Event-, Projektions- oder Replay-UI-Pfad beheben.
- Eine kompakte, beim Einzel-Schritt gut wahrnehmbare Rückmeldung für die
  Pump-Aktion bereitstellen. Die konkrete Form (sichtbare Stärkeänderung,
  hervorgehobener Chronikeintrag oder äquivalente, nicht verdeckende
  Run-Fenster-Anzeige) wird aus dem nachgewiesenen fehlenden Daten- oder
  Darstellungsweg gewählt.
- Einen fokussierten Regressionstest mit wiederholtem `pump_breaker` vor
  `break_subroutine` oder `continue_run` ergänzen.

## Nicht im Scope

- Allgemeines Redesign des Replay-Players oder aller Run-Animationen.
- Änderungen an Regeln, Kosten, Dauer oder Legalität von Eisbrecher-Pumpen.
- Permanentes Anzeigen temporärer Encounter-Stärke außerhalb ihres fachlichen
  Gültigkeitsbereichs.
- Lockerung von Replay-Redaktion, Hidden-Info-Schutz, Determinismus oder
  StateHash.

## Akzeptanzkriterien

- [ ] Jeder Pump-Schritt eines wiederholten `pump_breaker` ist im Replay
  unmittelbar als eigene Aktion erkennbar, einschließlich Eisbrecher,
  Stärkebonus und gegebenenfalls Kosten.
- [ ] Die Darstellung zeigt keine Stärke oder Karteninformation, die für die
  gewählte Replay-Perspektive nicht sichtbar sein darf.
- [ ] Die temporäre Stärke wird nur für die fachlich korrekte
  Encounter-Dauer dargestellt und nach dessen Ende nicht als persistenter
  Kartenwert ausgegeben.
- [ ] Ein direkt anschließendes Brechen einer Subroutine oder Fortsetzen des
  Runs bleibt verständlich mit den vorherigen Pump-Schritten verknüpft.
- [ ] Ein fokussierter Regressionstest prüft den realen Einzel-Schritt-Pfad
  einschließlich mehrerer Pump-Events.

## Umsetzungshinweise

- Primärer Folgeagent: `small-adjustments-agent`.
- Zuerst die Eventaufnahme und Frame-Projektion prüfen; eine rein dekorative
  Anzeige ist keine abschließende Lösung, falls der Pump-Event oder die
  strukturierte Stärkeinformation im Replay fehlt.
- Die bestehende Chronikformatierung für `pump_breaker` und die Run-Gruppierung
  als Ausgangspunkt verwenden; der Fix soll nicht mehrere konkurrierende
  Ereignisprotokolle schaffen.

## Ergebnisnotiz

Noch offen.
