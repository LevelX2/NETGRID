---
activityId: act-2026-05-16-trace-open-bidding-alignment
status: done
kind: concept
area: cards
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-16
startedAt: 2026-05-17
completedAt: 2026-05-17
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - docs/architecture/card-rules/trace-open-bidding-alignment-plan-2026-05-16.md
  - docs/releases/v1/v1-9-originalset-completion/v1-9-14-trace-tag-resource/spec.md
  - docs/releases/mvp/mvp-0-1-local-core/deviation-registry.md
  - data/rules/mechanics-coverage-1.9.14.json
  - KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Index.md
  - KI-Wissen-NETGRID/03 Betrieb/Log 2026-05.md
checks:
  - node JSON.parse data/rules/mechanics-coverage-1.9.14.json
  - rg blind/simultan/verdeckt Trace documentation scan
---

# Trace Open Bidding Alignment

## Ziel

Die moderne, offene Trace-Sequenz soll als verbindliche NETGRID-Regel sauber dokumentiert und gegen alte oder missverständliche Trace-/Link-Formulierungen abgeglichen werden. Dieses Paket ist der erste Schnitt: Policy, Dokumentationsabgleich und Vorbereitung kleiner Folgepakete.

## Kontext und Quellen

- `docs/releases/mvp/mvp-0-96-trace-link-bidding/trace-link-bidding-spec.md`
- `docs/releases/mvp/mvp-0-96-trace-link-bidding/requirements.md`
- `docs/releases/mvp/mvp-0-96-trace-link-bidding/implementation-review.md`
- `data/rules/mechanics-coverage-0.96.json`
- `docs/releases/v1/v1-9-originalset-completion/v1-9-14-trace-tag-resource/spec.md`
- `docs/releases/v1/v1-9-originalset-completion/v1-9-14-trace-tag-resource/final-review.md`
- `data/rules/mechanics-coverage-1.9.14.json`
- `docs/source/Netrunner Errata 1.70.md`
- `docs/source/Runnerspoiler 1.0.txt`
- `docs/source/Corpspoiler 1.0.txt`
- Technische Anker: `packages/engine/src/index.ts`, `packages/ai/src/index.ts`, `packages/shared/src/index.ts`, `apps/web/app/chronicle.ts`, `apps/server/src/multiplayer.test.ts`, `apps/web/app/chronicle.test.ts`

Ausgangsbefund: Die Engine nutzt bereits eine offene sequenzielle Trace-Logik. Die Korp wählt zuerst ein sichtbares Trace-Gebot, danach wählt der Runner sein Link-Gebot mit Kenntnis von Basis-Trace, Korp-Gebot, aktueller Trace-Stärke und eigenem Link. Ein Trace ist erfolgreich, wenn `traceStrength > runnerStrength`; Gleichstand genügt dem Runner.

## Scope

- Moderne offene Trace-Regel als bewusste NETGRID-Regelentscheidung dokumentieren.
- Stale Dokumentationsstellen prüfen, die Trace noch als blind, verdeckt, gleichzeitig oder nicht implementiert beschreiben.
- Öffentliches Korp-Gebot als erlaubten sichtbaren Trace-Schritt einordnen, nicht als Hidden-Info-Leak.
- Reconnect-, Undo-, Replay-, KI- und PublicEvent-Grenzen für offene Trace-Daten gegen unerwünschte Zusatzinformationen prüfen oder als Folgepunkt markieren.
- Bestehenden Spotcheck-Folgejob `trace-link-post-bid-resolvers` auf moderne Begriffe zuschneiden oder ein kleineres Folgepaket für Signpost und The Springboard anlegen.
- Offene Entscheidungen zu Base-Link-Karten, wiederkehrenden Link-Bid-Credits und UI-Erklärung sichtbar festhalten.

## Nicht im Scope

- Keine Rückkehr zu blindem oder gleichzeitig verdecktem Trace-Bieten.
- Keine verdeckte Korp-Gebotsphase in der UI.
- Keine direkte Resolver-Implementierung für Signpost, The Springboard oder wiederkehrende Link-Credit-Quellen.
- Keine Änderung an Originalquellen unter `docs/source/`.
- Keine Freischaltung weiterer Karten ohne gültigen Release- und Gate-Bezug.
- Keine Abschwächung von Hidden-Information-, LegalActions-, StateHash- oder Replay-Prinzipien.

## Akzeptanzkriterien

- [ ] Eine aktuelle Regelstelle benennt die offene Trace-Sequenz als gewollte NETGRID-Regel.
- [ ] Keine aktuelle NETGRID-Dokumentationsstelle fordert für aktive Umsetzung blindes oder gleichzeitig verdecktes Trace-Bieten.
- [ ] Der Kernvertrag ist dokumentiert: `traceStrength = baseTraceStrength + corpBid`; `runnerStrength = runnerLink + runnerBid`; erfolgreich ist nur `traceStrength > runnerStrength`.
- [ ] Öffentlich sichtbare Korp-Gebote sind als erlaubter Trace-Schritt beschrieben; Runner-PendingChoices bleiben runner-privat.
- [ ] Signpost und The Springboard sind als modernes Folgepaket beschrieben oder im bestehenden Spotcheck-Folgejob passend umformuliert.
- [ ] Offene Entscheidungen zu The Springboard, Base-Link-Karten, Link-Bid-Credits und UI-Erklärung sind ausdrücklich benannt.

## Umsetzungshinweise

- Bevorzugter Start ist ein Dokumentations- und Kartenwissensschnitt, kein breiter Engine-Umbau.
- Signpost sollte im offenen Runner-Link-Bid-Fenster als Option modelliert werden: `1 Credit: +2 Link für diesen Trace`, einmal pro Trace.
- The Springboard braucht eine Entscheidung: statischer `baseLink: 1` als bewusste NETGRID-Vereinfachung behalten oder in eine bezahlte moderne Link-Booster-Fähigkeit umbauen.
- Rabbit, Hacker Tracker Central, Krumz, Hell's Run, PK-6089a und Access through Alpha sind gute Kandidaten für Folgepakete zu Trace-/Link-Budgetquellen.
- UI-Sprache sollte klar zwischen Basis-Trace-Stärke, Korp-Gebot, Trace-Stärke, Link und Runner-Gebot unterscheiden.

## Empfohlene Checks

- Dokumentationssuche nach `Trace`, `trace`, `blind`, `verdeckt`, `reveal`, `aufdecken`, `simultan`, `simultaneously`.
- Falls technische Tests berührt werden: fokussierte Engine-/Web-/Server-Tests für Trace-PendingChoices, PublicPayload, Chronik, Reconnect und Replay/StateHash.

## Ergebnisnotiz

Abgeschlossen am 2026-05-17.

- Die moderne offene NETGRID-Trace-Sequenz ist als Policy-Abgleich dokumentiert.
- Der Kernvertrag ist festgehalten: `traceStrength = baseTraceStrength + corpBid`, `runnerStrength = runnerLink + runnerBid + temporaryLinkBoosts`, Erfolg nur bei `traceStrength > runnerStrength`.
- Öffentlich sichtbare Korp-Gebote sind ausdrücklich erlaubte PublicEvents; private Runner-Choice-Daten bleiben runner-privat.
- Signpost und The Springboard sind nicht mehr offen, sondern durch `spotcheck-2026-05-16-trace-link-post-bid-resolvers` als moderne post-bid Link-Choices abgeschlossen.
- Offene Folgepunkte bleiben Base-Link-Zielmodell, wiederkehrende Link-Credit-Quellen und UI-Erklärung.

Checks:

- `node -e "JSON.parse(require('fs').readFileSync('data/rules/mechanics-coverage-1.9.14.json','utf8')); console.log('ok')"`: grün.
- `rg -n -i "blind.*trace|trace.*blind|simultan.*trace|trace.*simultan|simultaneous.*trace|trace.*simultaneous|verdeckt.*trace|trace.*verdeckt" docs KI-Wissen-NETGRID data`: keine aktive NETGRID-Umsetzungsstelle gefunden, die blindes oder simultan verdecktes Trace-Bieten fordert.
