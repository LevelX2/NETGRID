---
activityId: act-2026-06-07-ai-hq-hidden-install-candidates
status: inbox
kind: fix
area: ai
priority: high
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-06-07
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy:
  - act-2026-06-07-ai-hq-memory-ledger-foundation
resultArtifacts: []
checks: []
---

# Verdeckte HQ-Install-Abgänge als Kandidaten statt Total-Reset behandeln

## Ziel

Wenn die Korp eine Karte verdeckt aus HQ installiert, soll die Runner-KI nicht pauschal ihr gesamtes HQ-Wissen verlieren. Sie soll sichere Restkarten behalten und nur die tatsächlich plausiblen Install-Kandidaten als mehrdeutig markieren.

## Kontext und Quellen

- Nutzerbefund vom 2026-06-07: Die KI kennt nach verdeckten Installationen scheinbar nur noch eine von mehreren zuvor bekannten HQ-Karten.
- Aktueller Codepfad: `packages/ai/src/belief-state.ts`, `hqHandMemoryAdjustment` erzeugt bei `install_card` ohne `cardDefinitionId` `unknown_departure`; `deriveKnownHqHandMemory` leert dann `knownCards`.
- `deriveHiddenRemoteCandidateMemory` erzeugt bereits grobe Remote-Kandidaten, filtert aber noch nicht sauber nach Installationsart und löscht danach ebenfalls die HQ-Hand-Erinnerung.

## Scope

- Side-sichere Installationsart in der Eventprojektion nutzen oder ergänzen:
  - ICE-Install,
  - Root-Install,
  - zentrale Root-Installationen, soweit relevant.
- Bei verdecktem ICE-Install:
  - bekannte Nicht-ICE bleiben sicher in HQ,
  - bekannte ICE werden zu einer Kandidatengruppe,
  - Duplikate werden count-basiert behandelt.
- Bei verdecktem Root-Install:
  - bekannte nicht-root-installierbare Karten bleiben sicher in HQ,
  - legale Root-Kandidaten werden als Kandidatengruppe geführt.
- `hiddenRemoteCandidateMemory` und `hqHandMemory` auf denselben Kandidatenstand abstimmen.
- Regressionen für mindestens diese Fälle ergänzen:
  - voll bekannte HQ-Hand mit zwei ICE und zwei Nicht-ICE, danach verdeckter ICE-Install;
  - voll bekannte HQ-Hand ohne passenden Kandidaten für die sichtbare Installationsart;
  - teilweise bekannte HQ-Hand plus verdeckter Install;
  - Draw danach erhält die sicheren Karten und erhöht nur den unbekannten Rest.

## Nicht im Scope

- Keine spätere Rez-/Reveal-Auflösung; dafür gibt es ein Folgepaket.
- Keine probabilistische Bewertung oder echte Hidden-State-Simulation.
- Keine Nutzung von FullState, `cardInstances`, `privatePayload`, Storage-Interna oder gegnerischen Decklisten.
- Keine Änderung daran, welche Install-LegalActions existieren oder wie `applyAction` validiert.
- Keine Replay- oder StateHash-Änderung außer unvermeidlicher, side-sicherer PublicPayload-Erweiterung nach Vertrag.

## Akzeptanzkriterien

- [ ] Verdeckter ICE-Install löscht nicht mehr bekannte Nicht-ICE aus der HQ-Hand-Erinnerung.
- [ ] Verdeckter Root-Install löscht nicht mehr bekannte eindeutig unpassende HQ-Karten.
- [ ] Mehrdeutige Kandidatengruppen werden count-sicher geführt und nicht als sicher bekannte Restkarten missverstanden.
- [ ] Remote-Kandidaten und HQ-Restwissen widersprechen sich nach verdecktem Install nicht.
- [ ] Hidden-Info-Regressionen prüfen, dass keine verdeckte Kartenidentität in RunnerView, PublicEvents, AIInput, DecisionDebug oder Replay gelangt.
- [ ] `@netgrid/ai` und betroffene Engine/Web-Checks laufen fokussiert grün oder dokumentieren einen konkreten Blocker.

## Umsetzungshinweise

- Falls ein side-sicheres Placement-Feld in `public-context.ts` fehlt, es so eng wie möglich ergänzen. Es darf nur Typ-/Platzierungsinformation enthalten, die der Runner ohnehin aus der öffentlichen Install-Art ableiten darf.
- Bei Unsicherheit lieber eine Karte in einer Kandidatengruppe belassen als sie sicher in HQ zu behaupten.
- Bei technischen Duplikaten nicht über `definitionId` allein verlieren: bekannte Counts müssen erhalten bleiben.

## Ergebnisnotiz

Noch offen.
