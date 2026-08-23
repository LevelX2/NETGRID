---
activityId: act-2026-08-21-subroutine-contribution-ordering-model
status: inbox
kind: architecture
area: engine
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
checks:
  - Ordering-Phasen, Verbraucher und Änderungshistorie geprüft
  - corepack pnpm check:engine-source-structure
---

# Explizites Beitragsmodell für ICE-Subroutine-Reihenfolgen prüfen

## Ziel

Prüfen, ob die wachsenden Quellen effektiver ICE-Subroutinen ein gemeinsames,
typisiertes Beitrags- und Platzierungsmodell benötigen oder ob die bestehende
phasenweise Assembly weiterhin die kleinere und sicherere Autorität bleibt.

## Kontext und Quellen

- Regel-Engine-Review Batch 2 vom 2026-08-21, insbesondere Tutor-Reihenfolge.
- `packages/engine/src/game/run/effective-ice-run-subroutines.ts`
- Der Tutor-Fehler ist bereits ursachenorientiert korrigiert und durch einen
  exakten Gatekeeper-Reihenfolgetest geschützt.
- Aktivierungsauslöser: eine zweite unabhängige `after_all_other`-Semantik,
  eine neue Platzierungsklasse oder ein erneuter Ordering-Fehler.

## Scope

- Alle aktuellen Quellen effektiver ICE-Subroutinen und ihre verbindliche
  Reihenfolge inventarisieren.
- Prüfen, ob ein internes Modell mit `origin`, `placement` und stabiler Ordnung
  tatsächlich weniger Autoritäten und Sonderpfade erzeugt.
- Auswirkungen auf Subroutine-IDs, Attribution, Kopien, Indizes,
  Stale-Action-Revalidierung, KI-Breakplanung und deterministisches Replay
  bewerten.
- Bei positivem Ergebnis kleine, sequenzielle Umsetzungs-Activities anlegen.

## Nicht im Scope

- Vorsorglicher Komplettumbau der heutigen Assembly ohne Aktivierungsauslöser.
- Änderung von Kartenregeln, LegalAction-Identitäten oder öffentlicher
  Subroutine-Semantik.
- Ein zweites Sortier- oder Resolver-System neben der Engine-Autorität.

## Akzeptanzkriterien

- [ ] Die aktuellen Ordering-Phasen und Invarianten sind vollständig erfasst.
- [ ] Es liegt eine begründete Entscheidung `bestehende Assembly beibehalten`
  oder `Beitragsmodell einführen` vor.
- [ ] Ein empfohlenes Modell erhält Subroutine-IDs, Attribution,
  Replaydeterminismus und LegalAction-Revalidierung nachweislich.
- [ ] Notwendige Umsetzung wird in kleine Folgepakete geschnitten; die breite
  Interaktionsmatrix steht bei diesen Paketen als Akzeptanzschutz.

## Umsetzungshinweise

- Die Analyse erst beim genannten Auslöser beanspruchen; bis dahin ist das
  Paket bewusst niedrig priorisiert.
- Bestehende Tutor-, Transmutation-, Lisa-Blight-, Trace- und
  Encoder-Kombinationen als Vertragsinventar verwenden, nicht pauschal neu
  implementieren.

## Ergebnisnotiz

Review vom 2026-08-23: **derzeit ohne ausreichenden Nutzen oder
Aktivierungsauslöser zurückgestellt**. `effectiveIceRunSubroutines` ist mit 150
Zeilen weiterhin die kleine, zentrale Reihenfolgeautorität. Die Phasen
printed/self copies, appended ETR, Encounter-Ergänzungen, appended Trace,
sonstige Ergänzungen und abschließende Run-Duration-Beiträge sind explizit;
run-scoped Kopien bleiben rekursiv am Ursprung und Zyklen scheitern sichtbar.
Seit `a91bf06c9` kam weder eine zweite `after_all_other`-Semantik noch eine neue
Platzierungsklasse oder ein erneuter Ordering-Fehler hinzu. Ein Beitragsmodell
würde derzeit eine zweite Sortierabstraktion ohne belegbaren Gewinn erzeugen.
Keine Folge-Activity angelegt; beim dokumentierten Trigger erneut prüfen.
