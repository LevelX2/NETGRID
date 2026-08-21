---
activityId: act-2026-08-12-replay-icebreaker-pump-step-visibility
status: done
kind: fix
area: web
priority: normal
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-08-12
startedAt: 2026-08-12
completedAt: 2026-08-12
branch: codex/activities-worktree-20260812
releaseTarget:
blockedBy: []
resultArtifacts:
  - apps/web/app/chronicle.ts
  - apps/web/features/replay/replay-player-model.ts
  - apps/web/features/replay/replay-player-model.test.ts
checks:
  - corepack pnpm exec vitest run features/replay/replay-player-model.test.ts app/chronicle.test.ts -t "repeated pump event|breaker pump and break actions"
  - corepack pnpm --filter @netgrid/web typecheck
  - git diff --check
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

- [x] Jeder Pump-Schritt eines wiederholten `pump_breaker` ist im Replay
  unmittelbar als eigene Aktion erkennbar, einschließlich Eisbrecher,
  Stärkebonus und gegebenenfalls Kosten.
- [x] Die Darstellung zeigt keine Stärke oder Karteninformation, die für die
  gewählte Replay-Perspektive nicht sichtbar sein darf.
- [x] Die temporäre Stärke wird nur für die fachlich korrekte
  Encounter-Dauer dargestellt und nach dessen Ende nicht als persistenter
  Kartenwert ausgegeben.
- [x] Ein direkt anschließendes Brechen einer Subroutine oder Fortsetzen des
  Runs bleibt verständlich mit den vorherigen Pump-Schritten verknüpft.
- [x] Ein fokussierter Regressionstest prüft den realen Einzel-Schritt-Pfad
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

Der Engine-Payload enthielt Bonus, Kosten und kumulierte Breaker-Stärke bereits
vollständig; die Replay-Frame-Grenze führt nun als getestete Modellfunktion
jeden Pump-Event exakt mit seiner State-Version ein. Die eigentliche
Darstellungslücke lag im einfachen Chronikmodus, der Beschreibung und Chips
ausblendet. Deshalb nennt die immer sichtbare Hauptzeile jetzt Breaker,
Stärkebonus, Stärke danach und Kosten. Historische Eventwerte bleiben als
Aktionsstand gekennzeichnet; die aktuelle Kartenstärke stammt weiterhin allein
aus dem jeweiligen Replay-PlayerView und damit aus der korrekten
Encounter-Dauer. Fokussierte Tests und Web-Typecheck sind grün.
