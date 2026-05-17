---
activityId: act-2026-05-17-runner-ai-breaker-acquisition-strategy
status: done
kind: concept
area: ai
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
  - packages/ai/src/runner-plans.ts
  - packages/ai/src/index.test.ts
checks:
  - corepack pnpm --filter @netgrid/ai test -- -t "visible matching breaker|visible blocker lacks"
  - corepack pnpm --filter @netgrid/ai typecheck
  - git diff --check
---

# Runner-KI: Icebreaker finden, installieren und Zielserver erreichbar machen

## Ziel

Die Runner-KI soll gezielt erkennen, wenn ein wichtiger Server durch bekanntes ICE blockiert ist, und dann eine Strategie verfolgen, um passende Programme/Icebreaker zu finden, zu installieren und die nötigen Credits aufzubauen. Das Ziel ist nicht nur einzelne Runs zu bewerten, sondern einen Plan zu entwickeln: Zielserver erreichen, passende Brecher beschaffen, bezahlen und einsetzen.

## Kontext und Quellen

- Nutzerbefund vom 2026-05-17: Die Runner-KI scheint kaum oder nie auf die Idee zu kommen, Icebreaker zu installieren.
- Eindruck aus Partien: Die KI läuft oder klickt weiter, statt strategisch Programme zu suchen/installieren, die bekanntes ICE brechen können.
- Erwartung: Wenn ein wichtiger Remote-/Fort-Zielserver relevant ist, muss die Runner-KI mit hoher Priorität daran arbeiten, ihn erreichbar zu machen. Dazu gehören Icebreaker, Such-/Draw-Plan, Installation und Creditaufbau.

## Scope

- Prüfen, ob die aktuelle Runner-KI bekannte ICE-Typen, ICE-Stärke, Subroutinen und vorhandene/fehlende Breaker in der Planbewertung berücksichtigt.
- Prüfen, ob die Runner-KI Programme/Icebreaker in Grip/Heap/Stack/known cards erkennt und als strategische Installationsziele priorisiert.
- Prüfen, ob die KI Draw-/Search-/Tutor-Aktionen nutzt oder priorisiert, wenn ein benötigter Breaker fehlt.
- Zielplanung ergänzen oder verfeinern:
  - wichtiger Zielserver identifizieren, z. B. Agenda-Remote oder zentraler Server mit hohem Wert.
  - bekannte ICE-Barriere analysieren.
  - fehlenden Breaker oder fehlende Credits ableiten.
  - Zwischenziele setzen: Geld nehmen, Karten ziehen/suchen, Breaker installieren, dann Run starten.
- Bestehende Runner-KI-Smokes erweitern oder neue AI-Smokes anlegen, die einen bekannten ICE-Blocker und einen passenden Breaker in erreichbarer Zone enthalten.

## Nicht im Scope

- Keine Änderung an Engine-Regeln, Icebreaker-Regeln, Break-Kosten, Run-Timing, Replay oder StateHash.
- Keine Freischaltung neuer Karten ohne gültigen Karten-/Mechanik-Gate.
- Keine perfekte langfristige KI oder vollständige Deckstrategie.
- Keine Nutzung verdeckter Corp-Informationen. Die KI darf nur side-sichere PlayerView-/Known-Information-Daten verwenden.
- Keine LLM-Live-Entscheidungen.

## Akzeptanzkriterien

- [ ] Der aktuelle Stand ist geprüft: Kann die Runner-KI Icebreaker überhaupt als strategische Installationsziele erkennen und priorisieren?
- [ ] Bei bekanntem blockierendem ICE und passendem Breaker in der Grip priorisiert die KI sinnvoll Breaker-Installation gegenüber nutzlosen Runs.
- [ ] Wenn der Breaker installierbar ist, aber Credits fehlen, priorisiert die KI Creditaufbau als Zwischenziel.
- [ ] Wenn kein passender Breaker sichtbar ist, priorisiert die KI Kartenziehen oder verfügbare Such-/Tutor-Aktionen angemessen.
- [ ] Die KI nutzt keine verdeckten Corp-Informationen zur Breaker-Auswahl.
- [ ] Mindestens ein AI-Test oder Smoke deckt `bekanntes ICE blockiert Zielserver -> Breaker installieren -> später Run` ab.
- [ ] Mindestens ein AI-Test oder Smoke deckt `Breaker fehlt/zu teuer -> Draw oder Credits als Zwischenziel` ab.
- [ ] Die Strategie verschlechtert einfache offene Runs nicht: Wenn ein Server bereits erreichbar und wertvoll ist, darf die KI weiterhin laufen.

## Umsetzungshinweise

- Wahrscheinliche Startpunkte sind `packages/ai/src/index.ts`, `packages/ai/src/runner-plans.ts` und zugehörige Tests in `packages/ai/src/index.test.ts`.
- Die Logik sollte mit bekannten ICE-Informationen aus `PlayerView` und AI-Known-Position-Memory arbeiten, nicht mit privatem GameState.
- Nicht nur `run_server`-Score anpassen; wenn nötig eine kleine Planstruktur einführen, die Zwischenziele und Blocker begründet.
- Priorität des Zielservers sauber begrenzen: Agenda-Remote/Score-Gefahr hoch, irrelevanter Server niedrig.
- Breaker-Kompatibilität sollte an vorhandenen Kartendaten/Mechanikfamilien hängen, nicht an hartkodierten Einzelkarten, soweit möglich.

## Ergebnisnotiz

Erledigt. Die Runner-Planbewertung erkennt jetzt sichtbare blockierende rezzed ICE auf strategischen Zielen und leitet daraus Zwischenziele ab: passenden sichtbaren Brecher installieren, bei fehlenden Credits Geld nehmen oder ohne sichtbare Antwort Karten ziehen. Start-Runs auf den blockierten Zielserver werden zusätzlich abgewertet, bis das Zwischenziel erledigt ist. Archives-Probes werden auch ohne vorherigen Access negativ bewertet, wenn Archives leer oder vollständig als niedrigwertig sichtbar ist. Neue AI-Regressionen decken Brecherinstallation vor nutzlosem Archives-/Remote-Run sowie Credit- und Draw-Zwischenziele ab.
