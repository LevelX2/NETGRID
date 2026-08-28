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
checks:
  - shared/engine/ai package typechecks
  - focused Engine and AI projection/admission tests
  - package-boundary and changed-format checks
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

- [x] Engine-zertifizierten, zustandsgebundenen Vertrag für tatsächliche
      R&D-Entnahme, HQ-Nettoänderung und Rückführung nach R&D definieren.
- [x] Corporate Shuffle einschließlich Strategic Planning Group korrekt
      projizieren.
- [x] AI-Draw-Admission und Deckhorizont aus der exakten Nettowirkung speisen.
- [x] fokussierte Shared-/Engine-/AI-Vertragstests ergänzen.

### P2 – Zielzonenspezifische HQ-Disposition

- [x] vorhandene strategische Kartenhaltebewertung um explizite Zielzonen
      (`archives`, `rd_bottom`, `rd_shuffle`) erweitern.
- [x] Agenda-Flut, HQ-Exposition, aktuelle Score-Linie und R&D-Druck
      gegeneinander abwägen.
- [x] Corporate Shuffles vorhandene `hq_shuffle_window`-Fortsetzung an die
      plan-eigene Bewertung binden und Ownership/Action-Identität testen.
- [x] Strategic Planning Groups Bottom-Choice über dieselbe generische
      Zielzonenbewertung führen.

### P3 – Verwandte zusammengesetzte Karten

- [x] Corporate Downsizing auf eine plan-gebundene, bewertete Agenda-Teilmenge
      statt pauschal aller angebotenen Agendas umstellen.
- [x] AI Chief Financial Officer und Rescheduler gegen denselben exakten
      Zonenprojektionsvertrag prüfen und nur bestehende Ownerpfade anschließen.
- [x] Indiscriminate Response Team und MIT West Tier als andere Ownerfamilien
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

P3 abgeschlossen: Die KI-Eingabe-Positivliste lässt die vollständige, rein
skalare Corp-Zonenprojektion nun ausdrücklich passieren. Corporate Shuffle
wird im echten Engine-Pfad mit zwei Klicks und exakter Nettowirkung vom
bestehenden Handplan gewählt. Corporate Downsizing bindet vor dem Score eine
bewertete Agenda-Teilmenge; der Resolver validiert nur diese exakte Bindung.
AI Chief Financial Officer und Rescheduler verwenden denselben generischen
Zonenvertrag. Indiscriminate Response Team bleibt eine
Install-/Startzug-Triggerfamilie, MIT West Tier eine Runner-Handresetfamilie;
beide teilen weder Zielzone noch Plan-Owner und wurden daher bewusst nicht
geändert.

Die exakten Replays der ursprünglichen Seeds
`meta-330-continuation-b-016` und `meta-330-continuation-b-017` sind terminal
und ohne Diagnoseflags. Corporate Shuffle wurde in beiden Partien durch
`corp.hand_and_agenda_management` ausgewählt; die unmittelbar folgende
`hq_shuffle_window`-Choice blieb an denselben Plan-Owner gebunden. Andere
Angebote wurden mit der exakten Handkapazitätsprojektion begründet abgelehnt.

Der erste Kontrollserienversuch wurde nach vier ausgeschlossenen Spielen durch
einen technischen `ai_decision_failed` bei Seed `meta-332-final-005` gestoppt.
Die Ursache lag generisch in der Runner-Domainprojektion: Jede aktuell legale
Aktion einer Handkarte mit Rolle `defense_support` wurde fälschlich als
Installation behandelt. Dadurch gelangte das Tag-Entfernungs-Event
Open-Ended Mileage Program in einen `install_defense_support`-Schritt. Der Fix
nimmt ausschließlich Kandidaten mit `install_card` und `install.card` in die
Installationsmenge auf; das Event bleibt beim vorhandenen
`runner.defense_and_recovery`-Step `clear_tags`. Ein fokussierter
Ownership-Test sowie die angrenzende echte Trace-Defense-Installationsroute
sind grün. Die vier Teilspiele sind keine strategische Evidence und werden
nicht in die finale 40er-Population aufgenommen.

Ein weiterer ausgeschlossener Kontrollblock erreichte 21 terminale,
flagfreie Spiele und stoppte in Spiel 22 (`meta-332-postfix-022`) an einer
anderen technischen Grenze. Eine bereits als Runner-Programm installierte
Theorem Proof lag korrekt im Rig und wurde von der Engine als legale
MU-Freimachungsoption angeboten, behielt aber ihren kanonischen Typ `agenda`.
Der AI-Choice-Validator verlangte fälschlich zusätzlich den ursprünglichen
Kartentyp `program` und verwarf dadurch die exakt gebundene Engine-Choice mit
`window_origin_missing`. Der generische Fix validiert die Optionswerte nun
gegen die aktuelle Rig-Mitgliedschaft und die unveränderte
`resolve_choice`-Bindung; er erfindet keine eigene Zonen- oder Typregel. Der
vollständige Choice-Resolver und die angrenzende Classic-Agenda-Engine-Suite
(94 Tests) sowie der AI-Typecheck sind grün. Auch dieser Zwischenblock zählt
nicht zur finalen 40er-Population.

Der nächste frische Kontrollblock stoppte in Spiel 2
(`meta-332-finalfix-002`) bei 90,91 Prozent TurnPlanner-Coverage. Der
erste fokussierte Befund zeigte eine generische Owner-Lücke für Basic Draws bei
freier Handkapazität: `generic:draw-options` war korrekt materialisiert, die
getrennte Owner-Klassifikation ignorierte aber die vorhandene
Development-Bindung. Der generische Fix ordnet einen Draw mit exakt gebundener
Development-Action-ID `runner.develop_board_and_hand` zu. Coverage- und
Handpufferpfade behalten durch ihre früheren Checks Vorrang; ungebundene Draws
bleiben ownerlos und fail-closed.

Das exakte Replay belegte anschließend die tatsächlich durch drei Core Damage
auf zwei Karten verkleinerte Maximalhand und eine zweite, hiervon getrennte
Ownership-Lücke. Ein Breaker-Draw für das schwächere R&D-Run-Event war an
dieselbe `runner.pressure_central`-Instanz gebunden wie der aktuell stärkere
Basic Run. Der Parent bestätigte im aktuellen Zustand deshalb nicht den
Supportbedarf des Event-Runs; der Coverage-Provider war als Parent-Support
nicht ausführbar, während der Draw trotzdem als planbegründet galt. Die
generische Reconciliation erhält eine Parent-Bindung jetzt nur noch, wenn die
aktuelle Parent-Instanz exakt denselben `supportNeedId` ausweist. Andere
Coverage-Lücken derselben Serverinstanz werden wie bereits bei verschwundenen
Parents als eigenständige Coverage-Pläne behandelt. Ein fokussierter Test
sichert die erhaltene exakte Bindung und die Ablösung des abweichenden
Alternativbedarfs. Die angrenzenden Full-Hand-/Draw-Coverage-Tests, die
taktische Owner-Suite und der AI-Typecheck sind grün. Auch dieser Teilblock
bleibt technische Vorfix-Evidence und ist vom finalen Nenner ausgeschlossen.

Fokussierte Engine-Tests (25), AI-Zonen-/Real-Engine-Tests (35), die beiden
Corporate-Downsizing-Planfälle, die beiden Resolver-Bindungsfälle sowie Engine-
und AI-Typecheck sind grün. Vier außerhalb dieses Pakets liegende Tests in
`plan-first-live-runtime.test.ts` schlagen unverändert auch im aktuellen
`main` fehl (eine veraltete Economy-Fail-closed-Erwartung und drei
Runner-Owner-/Reason-Code-Erwartungen); sie werden nicht in diesen Scope
gezogen.
