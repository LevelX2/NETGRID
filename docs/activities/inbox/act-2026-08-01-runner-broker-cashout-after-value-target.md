---
activityId: act-2026-08-01-runner-broker-cashout-after-value-target
status: inbox
kind: fix
area: ai
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-08-01
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Runner-KI: Broker nach erreichtem Wertziel in Liquidität umwandeln

## Ziel

Die Runner-KI soll einen bis zum vorgesehenen Wertziel aufgebauten `Broker`
nicht dauerhaft als unantastbare Reserve halten. Wenn konkrete Entwicklungs-,
Run- oder Liquiditätspläne wiederholt einzelne Grundcredits anfordern, soll
der zuständige Credit-Bank-Plan eine endliche, nachvollziehbare Auszahlung
gegen weiteres Halten vergleichen und bei ausreichendem Nutzen cashen.

## Kontext und Quellen

- Nutzer-Playtest vom 01.08.2026, Spiel 1 der aktuellen Hin-und-Rückspiel-Serie:
  `match_550e1860213fbef4` (`human_corp_vs_runner_ai`).
- Der Nutzer beobachtete bis Zug 28 einen mehrfach bei 12 gespeicherten
  Credits liegenden Broker, während die KI stattdessen einzelne Credits nahm.
- Der Trace belegt den vollständigen Aufbau derselben Broker-Instanz:
  Entscheidungen 8, 33, 44 und 49 legen jeweils drei Credits auf Broker; ab
  Entscheidung 49 / StateVersion 90 sind 12 gespeicherte Credits erreicht.
- Ab Entscheidung 53 bleibt die legale Auszahlung wiederholt ausgeschlossen
  mit `runner_credit_bank_hold_comfortable_value` und
  `no_credit_bank_hold_route`. Gleichzeitig wählt die KI unter anderem in den
  Entscheidungen 53, 59, 61, 63, 77, 79, 84, 86, 87, 89, 96 sowie 99 bis 101
  einzelne Grundcredits für Entwicklungs- oder Economy-Pläne.
- Erledigte Vorgänger- und Vertragsartefakte:
  - `docs/activities/done/act-2026-05-18-runner-ai-resource-economy-plan.md`
  - `docs/activities/done/act-2026-05-22-runner-ai-broker-pool-horizon.md`
  - `docs/reviews/ai/runner-plan-debug-payload-broker-final-2026-07-08.md`
  - `docs/reviews/ai/runner-economy-rig-focus-final-report-2026-07-07.md`
- Vollständige Serien-Evidence:
  `docs/reviews/ai/series-82b2-final-full-decision-audit-2026-08-01.md`, F2
  und die 14 markierten Fundingentscheidungen D53–D101.

## Scope

- Den Zustand unmittelbar nach dem vierten Load sowie mindestens einen
  späteren Basic-Credit-Zustand als aktuelle Checkpoints reproduzieren.
- `runner.credit_bank` als alleinigen Owner von Aufbau, Halten und Auszahlung
  derselben Broker-Instanz beibehalten.
- Einen endlichen Hold-/Cashout-Vertrag ergänzen, der mindestens gespeicherten
  Wert, aktuelle liquide Credits, konkreten FundingNeed, verbleibende Klicks,
  absehbare Run-/Installkosten und alternative Credit-Aktionen berücksichtigt.
- Den späteren D99-Zustand ausdrücklich sichern: Der Plan finanziert einen
  zweiten Broker mit Basic Credits, obwohl die erste Instanz 12 Credits hält
  und ihre Cashout-LegalAction verfügbar ist.
- Verhindern, dass `comfortable_value` gleichzeitig jede weitere Aufladung
  und jede Auszahlung blockiert, obwohl ein anderer Plan Liquidität durch
  wiederholte Basic-Credits aufbaut.
- Positive Regression für 12 gespeicherte Credits plus konkreten
  Liquiditätsbedarf und Gegenproben für sinnvolles weiteres Halten ergänzen.
- Debug-/Evidence-Codes so schärfen, dass Wertziel, Hold-Grund,
  Funding-Empfänger und Cashout-Auslöser sichtbar sind.

## Nicht im Scope

- Keine pauschale Regel „Broker bei 12 immer sofort auszahlen“.
- Keine Änderung an Broker-Kartentext, LegalActions, gespeicherten Credits,
  Engine-Zahlung, Replay oder StateHash.
- Keine breite Neuordnung aller Runner-Economy-Pläne.
- Keine Broker-Karten-ID-Entscheidung außerhalb des bestehenden generischen
  Credit-Bank-Plans.
- Keine Nutzung verdeckter Corp-Informationen und keine neue Resolver-,
  Override- oder Fallback-Autorität.

## Akzeptanzkriterien

- [ ] Der Checkpoint nach Entscheidung 49 zeigt reproduzierbar, warum der
      aktuelle Plan trotz erreichtem Wertziel nicht auszahlt.
- [ ] Bei 12 gespeicherten Credits und einem konkreten, ansonsten durch
      mehrere Basic-Credits finanzierten Bedarf darf Broker-Cashout die
      Grundcredit-Sequenz schlagen.
- [ ] Ohne aktuellen FundingNeed oder bei bewusst benötigter sicherer Reserve
      darf der Plan den Broker weiterhin halten.
- [ ] Nach einer Auszahlung bleibt dieselbe Broker-Instanz korrekt planbar;
      es entsteht weder eine sofortige sinnlose Reload-Schleife noch eine
      dauerhaft blockierte Bank.
- [ ] Planinstanz, Step/Route, Executor und `actionId` bleiben an
      `runner.credit_bank` gebunden; andere Pläne liefern höchstens einen
      FundingNeed und entscheiden die Auszahlung nicht selbst.
- [ ] Fokussierte Broker-, Economy-, Run-Funding- und Debug-Regressionen sowie
      AI-Typecheck sind grün; Hidden-Info-, Replay- und StateHash-Verträge
      bleiben unverändert.

## Umsetzungshinweise

- Vor dem ersten KI-Codepatch den verbindlichen KI-Architektur-Preflight aus
  `AGENTS.md` vollständig durchführen.
- Nicht nur einen Score erhöhen: Der aktuelle Blocker macht sowohl Load als
  auch Take explizit unzulässig. Zuerst die planinterne Hold-/Cashout-
  Zustandsmaschine und ihre Ownership prüfen.
- Den historischen Vertrag „bis 12 aufbauen, bei konkretem FundingNeed sofort
  auszahlen“ gegen die aktuelle Plan-first-Runtime und reale
  PlanExecutionOrigin-/Continuation-Bindung abgleichen.

## Ergebnisnotiz

Noch offen.
