---
activityId: act-2026-08-30-universal-corp-agenda-point-range
status: inbox
kind: fix
area: shared
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-08-30
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks:
  - Allgemeiner Deckvalidator und Standarddeck-Spezialtest abgeglichen
---

# Offizielle Corp-Agenda-Punktspanne allgemein validieren

## Ziel

Den allgemeinen Formatprofil-Validator so erweitern, dass Corp-Decks nicht
nur eine statische Mindestpunktzahl oder Dichte erfüllen, sondern die für ihre
Deckgröße gültige offizielle Agenda-Punktspanne, sofern das gewählte
Formatprofil diesen Regelvertrag aktiviert.

## Kontext und Quellen

- Der aktive Standarddeck-Katalog sichert die korrekte Spanne derzeit in
  `packages/decks/src/index.test.ts` zusätzlich pro Deck ab.
- `packages/decks/src/index.ts` prüft allgemein nur statische Mindestpunkte und
  optionale Dichtewerte.
- Der historische Agenda-Legalitätsaudit wird im Rahmen des
  Current-State-Cleanups entfernt; diese Activity übernimmt seine einzige
  noch offene Removal Condition.

## Scope

- Einen expliziten Formatprofilvertrag für die offizielle, deckgrößenabhängige
  Corp-Agenda-Punktspanne festlegen.
- Den allgemeinen Deckvalidator und fokussierte Deckpakettests ergänzen.
- Betroffene aktuelle Profile und bewusst interne Fixtures auf den neuen
  Vertrag abstimmen.

## Nicht im Scope

- Änderung aktiver Standarddecklisten, sofern sie die bereits getestete
  offizielle Spanne erfüllen.
- Rückwärtskompatibilitätsadapter für historische Profile oder Testdaten.
- Änderung von Engine-Scoring-, Sieg- oder Agenda-Kartenregeln.

## Akzeptanzkriterien

- [ ] Ein aktivierter Formatprofilvertrag berechnet für jede Corp-Deckgröße
      dieselbe zulässige Spanne wie der aktuelle Standarddeck-Katalogtest.
- [ ] Zu wenige und zu viele Agenda-Punkte liefern unterschiedliche,
      strukturierte Validierungsfehler.
- [ ] Runner-Decks und Formate ohne aktivierten Vertrag bleiben unverändert.
- [ ] Alle aktiven Standarddecks bestehen den allgemeinen Validator ohne
      zusätzlichen katalogspezifischen Ersatzvertrag.
- [ ] Betroffene Legacy- oder interne Fixtures werden auf den aktuellen
      Vertrag gebracht oder bewusst außerhalb des Profils gehalten; es
      entsteht kein Kompatibilitätsfallback.

## Umsetzungshinweise

Die deckgrößenabhängige Regel gehört in den Formatprofil-/Deckvalidator und
nicht als zweite Sonderprüfung in Server, Webclient oder Matchaufbau. Der
bestehende Katalogtest kann nach erfolgreicher Verallgemeinerung als
Regression gegen den gemeinsamen Vertrag erhalten oder verschlankt werden.

## Ergebnisnotiz

Noch nicht bearbeitet.
