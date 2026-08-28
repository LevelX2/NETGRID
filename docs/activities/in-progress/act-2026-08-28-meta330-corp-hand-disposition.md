---
activityId: act-2026-08-28-meta330-corp-hand-disposition
status: in_progress
kind: implementation
area: ai
priority: high
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-08-28
startedAt: 2026-08-28
completedAt:
branch: codex/meta330-corp-hand-disposition
releaseTarget: main
blockedBy: []
resultArtifacts:
  - packages/shared/src/legal-actions.ts
  - packages/engine/src
  - packages/ai/src
checks: []
---

# Metaserie 330: generische Corp-Handdisposition

## /Goal

Zusammengesetzte Corp-Draw- und HQ-Umordnungseffekte erhalten eine exakte,
zustandsgebundene Engine-Projektion. Der bestehende Plan
`corp.hand_and_agenda_management` bewertet Corporate Shuffle und angrenzende
Karten anhand der tatsächlichen Hand-, R&D- und Zielzonenwirkung. Eine Agenda
darf bei Agenda-Flut bewusst nach R&D zurückgelegt werden, ohne eine zweite
Entscheidungsautorität im Choice-Resolver zu erzeugen.

## Kontext und Quellen

- Metaserie 330: `R&D Express – Switchyard` gegen
  `Classic Corp - Remote Lab Deflection`, 39:1.
- Corporate Shuffle: 339 legale Zustände, 350 Angebote, 0 Auswahlen; durchgehend
  `corp_card_action_has_no_exact_parent_need`.
- Registry-Fälle `SP-197` und `SP-201`, Cluster
  `corp-draw-recovery-plan-conversion`.
- Verbindliche Architektur:
  `docs/architecture/ai/change-compass.md`,
  `docs/architecture/ai/planning-architecture.md` und
  `docs/architecture/ai/turn-campaign-planner.md`.

## Eigentum und Invarianten

- Die Engine ist alleinige Autorität für Legalität, Kosten, exakte
  Zonenbewegungen und Zufall.
- `corp.hand_and_agenda_management` bleibt Owner für Corporate Shuffle und die
  planinterne HQ-Disposition.
- `corp.score_agenda` bleibt Owner einer bereits gebundenen
  Corporate-Downsizing-Scorefortsetzung.
- Choice-Resolver vervollständigen nur die Payload einer exakt gebundenen
  `LegalAction`; sie wählen weder Karte, Route noch Strategie neu.
- Private Draw-Ergebnisse werden erst nach der Engine-Auflösung aus der dann
  sichtbaren Corp-HQ bewertet. Öffentliche Ansichten erhalten keine verdeckten
  Kartendaten.
- Keine Karten-ID-Sonderregel, kein stiller Fallback und kein paralleler
  Handbewertungs-Owner.

## Pakete

### P0 – Evidenz, Verträge und Prozess

- [x] Registry-Evidence für Paarung 330 sowie `SP-197`/`SP-201` verdichtet.
- [x] isolierten persistenten Worktree und Job registriert.
- [x] betroffene Engine-, Shared- und Planpfade vollständig kartiert:
  LegalAction-Bau in `corp-operation-resolution.ts`/`corp-main-actions.ts`,
  Draw-Ersetzungen in `draw-random.ts`, `hq_shuffle_window` und SPG-Choice im
  bestehenden Handplan, Draw-Admission in `corp-draw-admission.ts` und
  `action-economy-projection.ts`, Handinventar in
  `corp-hand-inventory-facts.ts` sowie die Score-Choice-Fortsetzung in
  `selected-choices-for-decision.ts`.

### P1 – Exakte zusammengesetzte Zonenprojektion

- [ ] Engine-zertifizierten, zustandsgebundenen Vertrag für tatsächliche
  R&D-Entnahme, HQ-Nettoänderung und Rückführung nach R&D definieren.
- [ ] Corporate Shuffle einschließlich Strategic Planning Group korrekt
  projizieren.
- [ ] AI-Draw-Admission und Deckhorizont aus der exakten Nettowirkung speisen.
- [ ] fokussierte Shared-/Engine-/AI-Vertragstests ergänzen.

### P2 – Zielzonenspezifische HQ-Disposition

- [ ] vorhandene strategische Kartenhaltebewertung um explizite Zielzonen
  (`archives`, `rd_bottom`, `rd_shuffle`) erweitern.
- [ ] Agenda-Flut, HQ-Exposition, aktuelle Score-Linie und R&D-Druck
  gegeneinander abwägen.
- [ ] Corporate Shuffles vorhandene `hq_shuffle_window`-Fortsetzung an die
  plan-eigene Bewertung binden und Ownership/Action-Identität testen.
- [ ] Strategic Planning Groups Bottom-Choice über dieselbe generische
  Zielzonenbewertung führen.

### P3 – Verwandte zusammengesetzte Karten

- [ ] Corporate Downsizing auf eine plan-gebundene, bewertete Agenda-Teilmenge
  statt pauschal aller angebotenen Agendas umstellen.
- [ ] AI Chief Financial Officer und Rescheduler gegen denselben exakten
  Zonenprojektionsvertrag prüfen und nur bestehende Ownerpfade anschließen.
- [ ] Indiscriminate Response Team und MIT West Tier als andere Ownerfamilien
  dokumentiert aus dem Implementierungsscope ausschließen.

### P4 – Regression, Replay und Integration

- [ ] positive Niedrighand-, Agenda-Flut- und wertvolle Metaserie-Zustände
  sowie negative Deckreserve-, Handüberlauf- und Scoreplan-Zustände testen.
- [ ] Side-Safety, PlanExecutionOrigin, Action-ID und Executor unverändert
  nachweisen.
- [ ] einen exakten Seed aus Paarung 330 reproduzieren und anschließend eine
  frische, getrennte 40-Seed-Nachserie auf dem finalen Commit ausführen.
- [ ] Registry-Evidence aktualisieren und lokale Integration nach `main`
  verifizieren; der seriengebundene Worktree bleibt erhalten.

## Nicht im Scope

- Decklistenänderungen oder Kartentausch.
- Reclamation Project und die eigene Archives-ICE-Recovery-Planroute.
- Runner-Handreset-Strategien, gegnerische Handdisruption oder allgemeine
  Deckbauoptimierung.
- Legacy-Kompatibilitätsadapter oder Reparatur historischer Replays.

## Abschlusskriterien

- [ ] Corporate Shuffle wird in klar wertvollen Zuständen vom vorhandenen
  Owner gewählt und in schlechten Zuständen weiterhin abgelehnt.
- [ ] Eine Agenda kann bei Flut korrekt nach R&D zurückkehren, bleibt aber bei
  unmittelbarer Score-Relevanz in HQ.
- [ ] Verwandte Karten verwenden denselben generischen Vertrag, sofern ihre
  bestehende Ownerroute dies fachlich trägt.
- [ ] Jede Paketgrenze ist fokussiert getestet, mit `git diff --check`
  geprüft und separat committed.
- [ ] Der finale Stand ist lokal nach `main` integriert und der persistente
  Serien-Worktree wieder auf den integrierten `main`-Stand synchronisiert.

## Ergebnisnotiz

In Arbeit.
