---
activityId: act-2026-05-21-corp-ai-multiple-bbs-economy-priority
status: done
kind: fix
area: ai
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-21
startedAt: 2026-05-21
completedAt: 2026-05-21
branch:
releaseTarget:
blockedBy: []
relatedActivities:
  - act-2026-05-19-corp-ai-installed-asset-economy-bbs
  - act-2026-05-17-bbs-whispering-campaign-credit-badge
  - act-2026-05-21-counter-display-stored-credits-and-agenda-pools
resultArtifacts:
  - packages/ai/src/corp-plans.ts
  - packages/ai/src/index.test.ts
checks:
  - corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts -t "installed Corp economy|multiple installed Corp BBS|too few stored credits"
  - corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts -t "V1.4.0 plan-based Corp AI"
  - corepack pnpm --filter @netgrid/ai typecheck
  - git diff --check
  - "Nicht grün, nicht paketbezogen: corepack pnpm --filter @netgrid/ai test zeigte drei bestehende breitere Failures in Corp-R&D-Reorder-Choice und Runner-Economy-Tests."
---

# Corp-KI: Mehrere BBS-Economy-Aktionen vor Basiscredit priorisieren

## Ziel

Die Corp-KI soll bei mehreren installierten und gerezzten `BBS Whispering Campaign`-Karten mit gespeicherten Credits/Bits die legalen Kartenaktionen zuverlässig nutzen, statt wiederholt die normale 1-Credit-Aktion zu wählen.

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-05-21: Die Corporation-KI hatte zweimal `BBS Whispering Campaign` in Remote-Forts draußen, jeweils mit 16 Credits/Bits darauf. Obwohl eine Aktion 2 Credits von einer BBS nehmen kann, wählte die Corp wiederholt die normale Aktion für 1 Credit.
- Der Befund wirkt wie ein Follow-up zu `act-2026-05-19-corp-ai-installed-asset-economy-bbs`: Dort wurde der einfache Fall "eine rezzed BBS gegen normale Credit-Aktion" bereits als erledigt markiert. Der neue Fall muss daher als Regression oder fehlender Mehrquellen-/Planschnitt behandelt werden, nicht als Änderung der erledigten Activity.
- Verwandte UI-/Projection-Kontexte:
  - `act-2026-05-17-bbs-whispering-campaign-credit-badge`
  - `act-2026-05-21-counter-display-stored-credits-and-agenda-pools`

## Scope

- Eine Reproduktionsfixture für die Corp-KI anlegen:
  - Corp ist am Zug und hat mindestens zwei installierte, rezzed `BBS Whispering Campaign` in Remote-Forts.
  - Beide BBS-Karten haben mindestens 2 sichtbare gespeicherte Credits/Bits, idealerweise je 16.
  - Die normale `[A]: Gain 1 credit`-Aktion und beide BBS-`[A]: Take 2`-Aktionen sind legal.
- Prüfen, ob im AI-Input tatsächlich beide BBS-Kartenaktionen als getrennte `LegalActions` mit side-sicheren Source-/Payload-Daten angeboten werden.
- Falls die LegalActions fehlen oder zusammenfallen: die Engine-/DTO-Projektion für mehrere gleichnamige installierte Economy-Quellen korrigieren oder ein enges vorgeschaltetes Paket schneiden, falls der Schnitt größer wird.
- Falls die LegalActions vorhanden sind: die Corp-Planbewertung so korrigieren, dass sichtbare installierte Economy-Aktionen nach Netto-Creditwert pro Aktion bewertet werden und `[A]: gain 2` nicht gegen `[A]: gain 1` verliert.
- Sicherstellen, dass die Bewertung mit mehreren Quellen stabil bleibt:
  - keine Deduplizierung nur nach Kartentitel,
  - keine Auswahl eines bereits erschöpften oder nicht mehr legalen Source-Targets,
  - keine Bevorzugung der Basiscredit-Aktion nur wegen mehrerer gleichartiger Action-Kandidaten.
- Optional Debug-/Evidence-Felder ergänzen, die side-sicher zeigen, warum die BBS-Aktion gewählt oder verworfen wurde.

## Nicht im Scope

- Keine Änderung an BBS-Regeltext, Kartendaten oder Credit-/Bit-Counter-Regeln, sofern die Engine-Aktion korrekt ist.
- Keine UI-Änderung an Counter-Badges oder Remote-Fort-Darstellung.
- Keine vollständige Corp-KI-Neuschreibung und keine globale Economy-Strategieplanung über mehrere Züge.
- Keine Hidden-Info-Erweiterung: Die KI darf nur `PlayerView`, `LegalActions`, sichtbare installierte Karten, side-sichere PublicEvents und eigene zulässige Informationen nutzen.
- Keine Replay-/StateHash-Änderung außer dort, wo eine fehlende LegalAction-/Payload-Projektion tatsächlich nachgewiesen und minimal korrigiert wird.

## Akzeptanzkriterien

- [x] Ein fokussierter AI-Test reproduziert den Nutzerbefund mit zwei rezzed `BBS Whispering Campaign` in Remote-Forts und normaler Credit-Aktion im selben Entscheidungsfenster.
- [x] Der Test weist nach, ob beide BBS-Aktionen im AI-Input als getrennte legale Aktionen mit Source-Referenz sichtbar sind.
- [x] In einer klaren Economy-Lage wählt die Corp-KI eine verfügbare BBS-Aktion mit 2 Credits statt der normalen 1-Credit-Aktion.
- [x] Die Bewertung bleibt korrekt, wenn zwei gleichnamige BBS-Quellen vorhanden sind; die KI darf legale Quellen nicht nach Kartentitel wegdeduplizieren.
- [x] Die KI wählt keine BBS-Aktion, wenn die konkrete Source nicht legal, nicht rezzed, nicht installiert oder mit weniger als 2 gespeicherten Credits/Bits versehen ist.
- [x] Bestehende Corp-KI-Regressionen für BBS, allgemeine Economy-Recovery, Remote-Scoring, Rez-Entscheidungen und side-sichere Debugdaten bleiben grün.

## Umsetzungshinweise

- Wahrscheinliche Startpunkte:
  - `packages/ai/src/corp-plans.ts`
  - `packages/ai/src/index.ts`
  - `packages/ai/src/input-dto.ts`
  - `packages/ai/src/index.test.ts`
  - bei fehlender Projektion zusätzlich `packages/engine/src/index.ts` oder die BBS-Card-Implementation.
- Besonders auf Deduplizierung, Aktionsranking und Plan-Fallbacks achten: Der einfache BBS-Fix kann grün bleiben, während der Mehrquellenfall trotzdem wieder in den Basiscredit-Fallback fällt.
- Die Regression sollte die vorhandene erledigte Activity `act-2026-05-19-corp-ai-installed-asset-economy-bbs` ergänzen, nicht ersetzen.

## Ergebnisnotiz

Umgesetzt. Die Corp-Plan-KI erkennt installierte Economy-Payouts jetzt auch dann, wenn die Engine sie als generische `activated_card_ability` aus einer CardImplementation liefert. Für `BBS Whispering Campaign` wird der sichtbare Credit-Gain aus der side-sicheren Ability-Label-/Counter-Lage bewertet; Quellen mit weniger als 2 gespeicherten Bits werden nicht als besserer Economy-Payout über Basiscredit eingestuft. Die neue Regression baut zwei getrennte rezzed BBS-Quellen in unterschiedlichen Remotes, weist getrennte Source-Referenzen und ActionIds nach und erwartet eine BBS-Aktion statt `[A]: 1 Credit`. Fokussierte BBS-Tests, die V1.4.0-Corp-Plan-Gruppe, AI-Typecheck und `git diff --check` sind grün. Der vollständige `@netgrid/ai`-Testlauf ist nicht grün wegen drei nicht paketbezogenen bestehenden Failures in Corp-R&D-Reorder-Choice und Runner-Economy-Tests.
