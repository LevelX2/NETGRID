---
activityId: act-2026-07-31-twenty-four-hour-surveillance-ai-rez-window
status: in_progress
kind: fix
area: ai
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-07-31
startedAt: 2026-07-31
completedAt:
branch: codex/act-2026-07-31-twenty-four-hour-surveillance
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Korp-KI nutzt das Rez-Fenster von Twenty-Four-Hour Surveillance

## Ziel

Die Korp-KI soll ein bezahlbares, im angegriffenen Server installiertes
`Twenty-Four-Hour Surveillance` im passenden Rez-Fenster aktivieren, wenn der
sichtbare Runner-Zustand relevante Stealth-Zahlungsquellen enthält und das
Rezzen deren Nutzung während des Runs regelwirksam verhindert.

## Kontext und Quellen

- Nutzer-Playtest vom 31.07.2026: Bei einem Run auf HQ lag
  `Twenty-Four-Hour Surveillance` ungerezzt im HQ-Root. Die Korp-KI rezzte das
  Upgrade trotz Rez-Kosten 1 nicht; der Runner konnte während des Runs mehrere
  Stealth-Quellen verwenden.
- Lokaler Kartentext in `data/cards/originalset-v1-cards.json`:
  `During runs on this fort, Runner cannot use bits from stealth sources.`
- Die Kartenimplementation
  `packages/engine/src/card-implementations/onr-v1/corp/upgrades/twenty-four-hour-surveillance.ts`
  bindet den Effekt als serverbezogenes
  `block_stealth_bits_during_runs_on_this_fort`-Fenster.
- Vor einer Verhaltensänderung in `packages/ai/` gilt der verbindliche
  KI-Architektur-Preflight aus `AGENTS.md`.

## Scope

- Den beobachteten Zustand mit HQ-Installation, ausreichenden Korp-Credits
  und mindestens einer tatsächlich relevanten sichtbaren Runner-Stealth-
  Zahlungsquelle als fokussierte Engine-/KI-Regression reproduzieren.
- Belegen, in welchem bestehenden Rez-Fenster die exakte `rez_card`-
  LegalAction verfügbar ist und ob der Fehler in LegalAction-Erzeugung,
  Window-Weiterleitung oder KI-Auswahl liegt.
- Den zuständigen bestehenden Korp-Plan beziehungsweise Controller als
  alleinigen Owner der Rez-Entscheidung verwenden und dessen Bewertung so
  schärfen, dass der konkrete Stealth-Sperrnutzen die Rez-Kosten angemessen
  berücksichtigt.
- Gegenbeispiele für fehlende Stealth-Quellen, falschen Server, fehlende
  Credits und bereits gerezzte Quelle ergänzen.
- Nach dem Rezzen sicherstellen, dass relevante Stealth-Credit-/Bit-Quellen
  im angegriffenen Server nicht mehr als zulässige Zahlungsquellen angeboten
  oder akzeptiert werden.

## Nicht im Scope

- Keine generelle Regel, jedes bezahlbare Upgrade bei jedem Run zu rezzen.
- Keine kartennamenspezifische Parallelentscheidung außerhalb des bestehenden
  Plans oder Controllers.
- Keine neue Choice-, Resolver-, Fallback- oder Override-Autorität.
- Keine Änderung des Kartentexts, der Rez-Kosten oder der Bedeutung von
  Stealth-Quellen.
- Keine Nutzung verdeckter Runner-Hand-, Stack- oder Deckinformationen.

## Akzeptanzkriterien

- [ ] Der reproduzierte positive Fall bietet der Korp die exakte legale
      Rez-Action und die KI wählt sie vor der ersten relevanten
      Stealth-Zahlung.
- [ ] Das gerezzte Upgrade sperrt ausschließlich Stealth-Quellen während Runs
      auf seinem Server; andere legale Zahlungsquellen bleiben nutzbar.
- [ ] Ohne sichtbare relevante Stealth-Quelle, auf einem anderen Server oder
      ohne Rez-Credits entsteht kein künstlicher Rez-Zwang.
- [ ] Zuständiger Plan, Planinstanz, Step/Route und Executor bleiben
      nachweisbar erhalten; ein Choice-Resolver ändert weder `actionId` noch
      die Strategieentscheidung.
- [ ] Die KI bewertet ausschließlich vorhandene LegalActions und side-sichere
      PlayerView-/PublicContext-Informationen.
- [ ] Engine-, KI-, Replay-, StateHash- und Hidden-Info-Regressionen für den
      positiven Fall und die Gegenbeispiele sind grün.

## Umsetzungshinweise

- Primärer Folgeagent: `card-enablement-ai-knowledge-agent`.
- Vor dem ersten KI-Codepatch vollständig lesen:
  `packages/ai/AGENTS.md`, `docs/architecture/ai/README.md` und die relevanten
  Owner-Abschnitte aus
  `docs/architecture/ai/ai-plan-layer-target-state-wip.md`.
- Zuerst die Engine-LegalAction und deren Timing nachweisen. Nur wenn sie
  korrekt existiert, die KI-Auswahl ändern.
- Für Zahlungsgegenproben echte als Stealth klassifizierte Quellen verwenden,
  keine Titelheuristik.

## Ergebnisnotiz

Noch offen.
