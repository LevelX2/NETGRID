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
checks: []
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

Noch offen.
