---
activityId: act-2026-08-21-engine-presentation-contract-residual-audit
status: inbox
kind: cleanup
area: shared
priority: low
primaryAgent: architecture-review-agent
requiresImplementation: false
createdAt: 2026-08-21
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Verbleibende Präsentationstexte an Engine-Grenzen auditieren

## Ziel

Die nach abgeschlossener UI-Lokalisierung noch vorhandenen Action-Labels,
Fehlertexte und sonstigen Präsentationssätze an Engine-, Shared- und
Servergrenzen erfassen und nur dort Folgepakete bilden, wo noch eine zweite
Textautorität oder ein nicht lokalisierbarer Nutzervertrag besteht.

## Kontext und Quellen

- Regel-Engine-Review Batch 2 vom 2026-08-21, Sprach- und Benamungsanalyse.
- `docs/architecture/localization/translatable-ui.md`
- Die normale Spieler- und Maintenance-Oberfläche ist bereits auf Deutsch,
  Englisch und Französisch lokalisiert; Engine, Server, Replay und StateHash
  sollen locale-neutral bleiben.
- Aktivierungsauslöser: nächste Locale-Erweiterung, Änderung normaler
  Nutzerfehler oder ein konkreter verbliebener hardcodierter Präsentationspfad.

## Scope

- Verbleibende sichtbare Engine-/Server-Texte nach Machine-Code,
  Diagnoseprosa, technischem Label und echter Nutzerpräsentation klassifizieren.
- Bestehende I18N-Gates und Ausnahmelisten gegen diese Klassifikation prüfen.
- Kleine Migrationspakete nur für reale Präsentationsautoritäten anlegen.
- Bewerten, ob ein zusätzlicher Source-Gate einen klaren neuen Vertrag schützt,
  ohne technische Texte oder Tests pauschal zu verbieten.

## Nicht im Scope

- Großflächige reine Übersetzungs- oder Umbenennungsänderung.
- Übersetzung technischer IDs, privilegierter Diagnose-Rohdaten oder
  Kartendaten.
- Locale-Abhängigkeit in Engine, GameState, LegalActions, Replay oder StateHash.

## Akzeptanzkriterien

- [ ] Jeder Fund ist als Nutzertext, lokalisierter Deskriptor, Machine-Code,
  Diagnose oder zulässige technische Ausnahme klassifiziert.
- [ ] Es existiert keine pauschale Migration ohne konkreten Consumer und
  Präsentationsvertrag.
- [ ] Notwendige Änderungen sind pro Vertragsfamilie klein geschnitten.
- [ ] Hidden-Info-, Replay-, Action-Identitäts- und StateHash-Grenzen bleiben
  unverändert.

## Umsetzungshinweise

- Zuerst den aktuellen Stand von `check:i18n` und
  `i18n-exceptions.json` berücksichtigen; erledigte I18N-Arbeit nicht erneut
  planen.
- Stabile Fehlercodes mit side-sicheren Parametern sind das Ziel, nicht eine
  englische Engine-Prosa als neue Präsentationsautorität.

## Ergebnisnotiz

Noch offen.
