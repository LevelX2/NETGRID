---
activityId: act-2026-07-31-agenda-additional-steal-cost-decline
status: inbox
kind: fix
area: engine
priority: hotfix
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-07-31
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
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

- [ ] Bei bezahlbaren zusätzlichen Stehlkosten sind Stehlen und Ablehnen als
      getrennte LegalActions verfügbar.
- [ ] Das Ablehnen zieht keine Credits oder sonstigen Zahlungscounter ein,
      verschiebt die Agenda nicht und setzt den Breach korrekt fort.
- [ ] Bei unbezahlbaren zusätzlichen Kosten ist kein illegaler Steal
      verfügbar; bei null Zusatzkosten ist kein freiwilliges Ablehnen
      verfügbar.
- [ ] Mehrere gleichzeitige zusätzliche Kosten werden als eine aktuelle,
      atomare Kostenquote behandelt.
- [ ] Stale-, Wrong-Side-, falsche Agenda-, falsche Access-Origin- und
      veränderte Kostenfälle werden von `applyAction` abgelehnt.
- [ ] PlayerViews und PublicEvents offenbaren keine verdeckten
      Stehlkostenquellen vor deren regelgerechter Sichtbarkeit.
- [ ] Replay, StateHash, Multiaccess und Siegprüfung bleiben deterministisch
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

Noch offen.
