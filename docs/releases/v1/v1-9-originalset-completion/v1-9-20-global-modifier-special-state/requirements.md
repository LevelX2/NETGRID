# V1.9.20 Requirements

Status: planned
Stand: 2026-05-13

- V1920-MUST-001: Genau 26 V1.9.20-Zielkarten werden geplant; keine V1.9.21+-Karte wird promotet.
- V1920-MUST-002: Sichtbare Texte sind finale display-only Texte aus lokal bestätigten Regelkern-Aussagen.
- V1920-MUST-003: Handlimit-, MU-, Click-/Action- und Economy-Modifier werden engine-seitig berechnet und in LegalActions/applyAction revalidiert.
- V1920-MUST-004: Persistente Sonderzustände haben Quelle, Dauer/Ablaufbedingung und side-sichere PublicEvent-Projektion.
- V1920-MUST-005: Globale statische Modifier haben deterministische Layering-/Quellenlogik und dürfen keine verdeckten Karten leaken.
- V1920-MUST-006: Damage-/Prevention-/Recurring-/Trace-/Counter-/Agenda-Randpfade werden nur über bereits etablierte Resolverfamilien erweitert.
- V1920-MUST-007: Replay und StateHash bleiben für jeden neuen Modifier- und Persistent-State-Pfad stabil.
- V1920-MUST-008: AI-Hints und AI-Smokes dürfen erst auf `ai_supported` wechseln, wenn Engine-, Visibility-, Replay-, Catalog- und Pflichtchecks grün sind.

## Akzeptanz

- Runtime-WIP-Guard: 26/26 Zielkarten mit finalem Text, keine V1.9.21+-Karte.
- Engine-Smokes für mindestens Handlimit/MU, Action Economy, globale ICE-/Kosten-/Stärke-Modifier und persistente Sonderzustände.
- Releaseabschluss nur mit Manifest, Mechanics-Coverage, AI-Hints, AI-Smokes, AI-Approval, Final Review und Webclient-Version `V1.9.20`.
