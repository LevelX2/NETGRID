---
activityId: act-2026-05-18-ai-discard-regression-benchmark
status: inbox
kind: fix
area: ai
priority: normal
primaryAgent: test-quality-agent
requiresImplementation: true
createdAt: 2026-05-18
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy:
  - act-2026-05-18-ai-discard-keep-value-baseline
  - act-2026-05-18-ai-discard-plan-doctrine-fit
resultArtifacts: []
checks:
  - corepack pnpm --filter @netgrid/ai test -- --run
  - corepack pnpm --filter @netgrid/ai typecheck
  - corepack pnpm exec vitest run tests/specs/visibility-contract.test.ts
  - git diff --check
---

# KI-Discard: Regression, Hidden-Info und Selfplay-Benchmark härten

## Ziel

Nach Keep-Value-Baseline und Plan-/Doctrine-Einbindung soll die Discard-KI durch Regressionen, Redaction-Gates und kleine Benchmark-Szenarien abgesichert werden. Ziel ist nachweisbar bessere Discard-Qualität ohne Hidden-Info-Leak, ohne nondeterministische Entscheidungen und ohne Rückschritt bei bestehenden KI-Plänen.

## Ausführungsabhängigkeit

Dieses Paket ist abhängig von `act-2026-05-18-ai-discard-keep-value-baseline` und `act-2026-05-18-ai-discard-plan-doctrine-fit`. Es darf erst beginnen, wenn beide Vorgänger abgeschlossen sind, weil es deren Endverhalten testet und stabilisiert.

## Kontext und Quellen

- Vorgängerpakete definieren die neue Discard-Auswahl und deren Plan-/Doctrine-Boni.
- `packages/ai/src/index.test.ts`: vorhandene AI-Regressionen inklusive V1.1.1-Discard.
- `tests/specs/visibility-contract.test.ts`: projektweiter Hidden-Info-Gate.
- `docs/derived/AI_CAPABILITY_DEEP_ANALYSIS_2026_05_17.md`: KI-Qualität soll messbar und side-sicher verbessert werden.
- Bestehende abgeschlossene Activities als Referenz: `act-2026-05-17-ai-match-progression-benchmark`, `act-2026-05-17-ai-input-positive-dto`, `act-2026-05-17-decisiondebug-schema-redaction-snapshots`.

## Scope

- Regressionen für beide Seiten bündeln und erweitern:
  - Runner behält einzigen relevanten Breaker.
  - Runner hält Economy bei Creditmangel.
  - Runner hält plan-/doctrine-passende Setupkarte.
  - Korp hält Agenda nur dann niedrig, wenn ein anderes klares Sicherheits-/Planargument stärker ist.
  - Korp hält ICE/Economy/Remote-Schutz in passenden Planlagen.
- Determinismus prüfen:
  - gleicher Input ergibt gleiche `selectedOptionIds`,
  - Tie-Break bleibt stabil,
  - Fallback bleibt stabil bei unvollständigen Kartendaten.
- Hidden-Info- und DTO-Grenzen prüfen:
  - gegnerische AI-Inputs enthalten keine fremden Discard-Kandidaten,
  - DecisionDebug/Evidence enthält nur abstrakte Rollen und Gründe,
  - PublicEvents/Replays bleiben unverändert redigiert.
- Kleinen Benchmark oder Szenariovergleich definieren:
  - vor/nach Verhalten in wenigen übervollen Handlagen dokumentieren,
  - keine lange Selfplay-Liga erzwingen, aber mindestens repräsentative Discard-Situationen für Runner und Korp abdecken.
- Abschlussnotiz oder Ergebnisartefakt erstellen, wenn die Änderung breiter als Unit-Tests ist, z. B. kurze Review-Notiz unter `docs/derived/`.

## Nicht im Scope

- Keine neuen KI-Strategien außerhalb Discard.
- Keine pauschale Anpassung der Schwierigkeitsprofile.
- Keine Änderung der Engine-Discard- oder Damage-Randomness.
- Keine UI-Arbeit außer ein Test zeigt eine echte Anzeige-/Debug-Leak-Lücke.
- Keine große Selfplay-Exploit-Liga, außer die Discard-Änderung zeigt unerwartete strategische Nebenwirkungen.

## Akzeptanzkriterien

- [ ] Alle Vorgänger-Regressionen bleiben grün und werden durch plan-/doctrine-bezogene Tests ergänzt.
- [ ] Determinismus ist für Auswahl, Tie-Break und Fallback nachgewiesen.
- [ ] Mindestens ein Hidden-Info-/Redaction-Test deckt Discard-Debug- oder Evidence-Ausgaben ab.
- [ ] Mindestens ein Runner- und ein Korp-Szenario zeigen qualitativ bessere Discard-Auswahl als die alte stabile Erstoption.
- [ ] Bestehende Plan-KI-Tests für Runner und Korp bleiben grün.
- [ ] Falls eine kurze Review-Notiz entsteht, dokumentiert sie Grenzen: keine Vollplanung, keine gegnerische Hidden Info, keine Engine-Regeländerung.

## Umsetzungshinweise

- Dieses Paket gehört bevorzugt nach Abschluss der Umsetzung an `test-quality-agent`, weil es Qualitätssicherung und Regression bündelt.
- Falls während der Tests Rollen-/Hint-Lücken für konkrete Karten auffallen, nicht still in diesem Paket ausweiten; kleine Folge-Activities anlegen.
- Benchmark-Evidence darf keine privaten Handlisten oder gegnerischen verdeckten Kartentitel enthalten.
- Der finale Nachweis sollte klar zwischen `normaler Discard-Choice` und `Damage-/Random-Discard` unterscheiden; dieses Paket sichert nur die normale KI-Choice.

## Ergebnisnotiz

Noch offen.
