---
activityId: act-2026-07-31-agenda-additional-steal-cost-decline
status: done
kind: fix
area: engine
priority: hotfix
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-07-31
startedAt: 2026-07-31
completedAt: 2026-07-31
branch: codex/activities-worktree-20260731-203648
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/engine/src/game/access/access-actions.ts
  - packages/engine/src/index-tests/proteus/agenda-suite.test.ts
  - packages/engine/src/index-tests/mechanics/assets-nodes-upgrades.test.ts
checks:
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index-tests/proteus/agenda-suite.test.ts src/index-tests/mechanics/assets-nodes-upgrades.test.ts src/game/access/access-actions.test.ts
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/engine test
  - corepack pnpm format:changed
---

# Zusätzliche Agenda-Stehlkosten ablehnen können

## Ziel

Beim Zugriff auf eine Agenda mit zusätzlichen Stehlkosten darf der Runner die
Kosten auch dann ablehnen und die Agenda liegen lassen, wenn er sie bezahlen
könnte. Eine Agenda ohne zusätzliche Stehlkosten bleibt dagegen verpflichtend
zu stehlen.

## Kontext und Quellen

- Nutzerfrage vom 31.07.2026: Nach einem Agenda-Zugriff gab es keine andere
  Aktion als Stehlen. Für die konkret kostenlos stehlbare Agenda ist dieses
  Verhalten regelgerecht.
- Die lokale Comprehensive-Rules-Referenz
  `docs/source/Null_Signal_Games_NETGRID_Comprehensive_Rules_v26.03.pdf`
  bestimmt in Regel 1.17.3d und 7.1.6: Eine accessete Agenda muss gestohlen
  werden, außer es bestehen zusätzliche Stehlkosten, die der Runner nicht
  zahlen kann oder nicht zahlen möchte.
- `packages/engine/src/game/access/access-actions.ts` bietet derzeit bei
  positiven Stehlkosten nur dann `nicht stehlen` an, wenn die Credits nicht
  ausreichen. Bei ausreichenden Credits wird ausschließlich
  `steal_agenda` erzeugt.
- Verwandter erledigter Basisschnitt:
  `docs/activities/done/act-2026-05-24-proteus-phase-6a-agenda-scoring-steal-baseline.md`.
  Der Regelrandfall wird als Follow-up behandelt.

## Scope

- Bei einer aktuell accesseten Agenda mit effektivem zusätzlichem Stehlpreis
  größer null sowohl `steal_agenda` als auch eine regelkonforme
  Ablehnen-Aktion erzeugen, wenn der Runner zahlen kann.
- Wenn der Runner die zusätzlichen Kosten nicht zahlen kann, nur den legalen
  Nicht-Stehlen-/Weiter-Pfad anbieten.
- Bei effektiv null zusätzlichen Stehlkosten weiterhin ausschließlich den
  verpflichtenden Agenda-Steal anbieten.
- `applyAction` muss Access-Karte, Access-Origin, aktuellen Kostenquote,
  Zahlungsfähigkeit, Side, `actionId`, `stateVersion` und Timing erneut
  validieren.
- Multiaccess nach abgelehnten Stehlkosten korrekt zum nächsten Kandidaten
  oder zum Breach-Ende fortsetzen.
- Mindestens je einen vorhandenen Kartenfall mit Self-Steal-Cost und mit
  servergebundener zusätzlicher Stehlkostenquelle als Regression verwenden.

## Nicht im Scope

- Keine allgemeine Option, kostenlos stehlbare Agendas freiwillig liegen zu
  lassen.
- Keine Änderung an Agenda-Punkten, Siegprüfung, Scoring oder Kostenhöhe
  einzelner Karten.
- Keine UI-Neugestaltung des gesamten Zugriffsfensters; die neue legale
  Auswahl muss dort lediglich korrekt und verständlich erscheinen.
- Keine automatische KI-Strategieänderung über die neue Action hinaus.

## Akzeptanzkriterien

- [x] Bei bezahlbaren zusätzlichen Stehlkosten sind Stehlen und Ablehnen als
      getrennte LegalActions verfügbar.
- [x] Das Ablehnen zieht keine Credits oder sonstigen Zahlungscounter ein,
      verschiebt die Agenda nicht und setzt den Breach korrekt fort.
- [x] Bei unbezahlbaren zusätzlichen Kosten ist kein illegaler Steal
      verfügbar; bei null Zusatzkosten ist kein freiwilliges Ablehnen
      verfügbar.
- [x] Mehrere gleichzeitige zusätzliche Kosten werden als eine aktuelle,
      atomare Kostenquote behandelt.
- [x] Stale-, Wrong-Side-, falsche Agenda-, falsche Access-Origin- und
      veränderte Kostenfälle werden von `applyAction` abgelehnt.
- [x] PlayerViews und PublicEvents offenbaren keine verdeckten
      Stehlkostenquellen vor deren regelgerechter Sichtbarkeit.
- [x] Replay, StateHash, Multiaccess und Siegprüfung bleiben deterministisch
      und durch fokussierte Regressionen abgesichert.

## Umsetzungshinweise

- Primärer Folgeagent: `card-enablement-ai-knowledge-agent`.
- Ausgangspunkte sind `packages/engine/src/game/access/access-actions.ts`,
  die Steal-Cost-Quote und der bestehende `decline_trash`-/Access-
  Fortsetzungspfad.
- Die UI darf keine Ablehnen-Aktion erfinden; sie rendert ausschließlich die
  neue Engine-LegalAction.
- Bei Karten mit nicht-creditbasierten zusätzlichen Kosten prüfen, ob der
  bestehende Kostenvertrag bereits vollständig typisiert ist oder ein enges
  separates Follow-up erforderlich wird.

## Ergebnisnotiz

Bei jeder positiven zusätzlichen Agenda-Stehlkostenquote erzeugt die Engine
nun eine eigene `decline_trash`-LegalAction mit derselben atomaren Kostenquote
wie die Stehlaktion. Ist die Quote bezahlbar, stehen Stehlen und Ablehnen zur
Wahl; ist sie unbezahlbar, bleibt ausschließlich der Ablehnen-Pfad. Kostenlose
Agendas bleiben verpflichtend zu stehlen. Fetal AI, Red Herrings und deren
kombinierte Quote sichern Selbstkosten, servergebundene Kosten, Stale-
Revalidierung, kostenfreies Ablehnen, Multiaccess-Fortsetzung sowie Replay und
StateHash ab.
