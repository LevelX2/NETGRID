---
activityId: act-2026-05-22-superior-net-barriers-complete-rule
status: inbox
kind: fix
area: cards
priority: hotfix
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-22
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Superior Net Barriers vollständig umsetzen

## Ziel

`Superior Net Barriers` muss als gescorte Agenda dauerhaft alle Walls um +1 Stärke erhöhen und beim Scoren beliebig viele Walls revealen lassen, danach 1 Credit/Bit für jede revealed oder rezzed Wall geben.

## Kontext und Quellen

- Nutzerprüfliste vom 2026-05-22: Regel ist offenbar unvollständig hinterlegt oder umgesetzt.
- Solltext laut Nutzer: `All walls have +1 strength. When you score Superior Net Barriers, reveal as many walls as you wish. Then, gain [1] for each revealed or rezzed wall.`
- Lokaler Befund: `packages/engine/src/card-implementations/onr-v1/corp/agendas/superior-net-barriers.ts` enthält einen scored modifier für Wall-Stärke und einen scoredAgenda-Resolver `reveal_installed_ice_subtype_for_credits`.
- Nutzererwartung: Stärkeänderung muss visuell am ICE erkennbar sein.

## Scope

- Prüfen, ob alle Regelteile umgesetzt sind: permanenter Wall-Modifier, optionale Mehrfach-Reveal-Auswahl, Credit-Gewinn für revealed und bereits rezzed Walls.
- Choice-UI und Engine so absichern, dass die Korp beliebig viele passende Walls wählen und auch null wählen kann.
- Creditzählung nach Abschluss der Reveal-Auswahl berechnen und bereits rezzed Walls mitzählen.
- Visuelle Stärkeanzeige bzw. Modifier-Hinweis für Walls prüfen und bei Bedarf ergänzen.
- Chronikmeldungen für Reveal, Credit-Gewinn und aktiven Stärkeeffekt verständlich halten.

## Nicht im Scope

- Keine generische Neugestaltung aller ICE-Modifier-Badges.
- Keine Änderung an Nicht-Wall-ICE.
- Keine Runner-Information über unrevealed/unrezzed Nicht-Wall-Karten.
- Keine KI-Strategieänderung jenseits der Fähigkeit, legale Choice-Optionen zu bewerten.

## Akzeptanzkriterien

- [ ] Gescortes `Superior Net Barriers` erhöht die effektive Stärke aller Corp-Walls um 1.
- [ ] Die Stärkeänderung ist in der ICE-Anzeige nachvollziehbar.
- [ ] Beim Scoren kann die Korp null, eine oder mehrere unrezzed Walls revealen.
- [ ] Credit-Gewinn zählt alle durch den Trigger revealed Walls plus alle bereits rezzed Walls.
- [ ] PublicEvents/PlayerViews leaken keine verdeckten Nicht-Ziele oder nicht gewählten verdeckten Karten.
- [ ] Tests decken Modifier, null/mehrere Reveals, bereits rezzed Walls, Creditbetrag, Chronik und StateHash ab.

## Umsetzungshinweise

- Prüfen, ob `revealed` in diesem Codepfad ein dauerhafter öffentlicher Kartenzustand, ein temporäres Reveal-Event oder eine bestehende `faceup`/`rezzed`-Nähe meint. Falls unklar, zuerst eng dokumentieren und den kleinsten regelkonformen Pfad wählen.
- Nicht anhand sichtbarer UI-Gruppierung auf Kartentypen schließen; Choice-Optionen müssen side-sicher bleiben.

## Ergebnisnotiz

Noch offen.
