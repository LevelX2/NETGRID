# V1.9.22 Per-card Longtail Spec

Stand: 2026-05-13
Status: planned

## Vertrag

V1.9.22 nutzt `per_card_longtail_resolver_gate` als Release-Schirm, darf aber keine generische "alles ist spielbar"-Freigabe daraus ableiten. Jede Karte braucht einen expliziten Adapter auf eine bestehende Mechanikfamilie oder einen eng typisierten neuen Resolverpfad.

## Cluster

- Runner installierte Karten: Install, MU/Memory, statische Modifier und optionale Aktivierungen muessen ueber bestehende Runner-Rig- und Modifier-Projektionen laufen.
- Breaker-Programme: Pump-/Break-Faehigkeiten muessen Encounter-Timing, ICE-Subtype, Kosten und Strength revalidieren.
- Runner-Events: Play-Event-Pfade muessen Kosten, Heap-Bewegung, Ziele und side-sichere PublicEvents pruefen.
- Corp-Agendas: Score-/Steal- und Agenda-Faehigkeiten muessen Agenda-Zone, Timing und öffentliche/private Projektion trennen.
- Corp-ICE: Rez, Encounter/Subroutine und etwaige per-card Effekte muessen mit bestehenden ICE-/Run-Fenstern kompatibel bleiben.
- Corp-Operations: Play-Operation-Pfade muessen Zielauswahl, Kosten, Trash/Archives-Bewegung und Hidden-Info-Redaction pruefen.

## Completion Gate

Der Release ist erst fertig, wenn Manifest, Mechanics-Coverage, Release-Smoke, AI-Hints, AI-Smokes, AI-Approval-Manifest, Webclient-Version und Final Review alle 47 Karten abdecken oder Blocker sichtbar ausweisen.
