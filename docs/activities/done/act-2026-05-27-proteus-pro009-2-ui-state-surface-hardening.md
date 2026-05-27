---
status: done
priority: normal
primaryAgent: release-implementation-agent
proReferences:
  - PRO009-2
completedAt: 2026-05-27
branch: codex/proteus-card-implementation
---

# Proteus PRO009-2 UI State Surface Hardening

## Ziel / PRO-Referenz

- PRO-Referenz: PRO009-2
- Ziel: Persistente und spielrelevante Zustände bereits implementierter PRO009-Karten in PlayerView und Web-UI verständlich sichtbar machen.
- Nicht-Ziele: Keine neue CardImplementation, keine neue Proteus-Kartenpromotion, keine Änderung an `deck_legal`, `format_legal` oder `ai_supported`.

## Umgesetzter Scope

- `selectedSubtype` wird für bekannte/eigene sichtbare Karten als `selectedSubtype` und `selectedSubtypeLabel` in `VisibleCard` projiziert.
- Black Widows `selectedCardId` wird nicht roh ausgegeben; `selectedTargetLabel` enthält je Viewer nur sichtbare Titel oder redigierte öffentliche Positionsbeschreibungen.
- Hosting-Beziehungen erhalten mit `hostedOnLabel` eine nutzerlesbare Anzeige auf Basis der für den Viewer sichtbaren Hostkarte.
- `power` wird als `CounterDisplay` sichtbar, damit Personal Touch, The den permanenten Stärke-Counter nachvollziehbar macht.
- Die Web-UI rendert diese Zustände als Detailzeilen, z. B. `Gewählter Typ: Sentry`, `Ziel-ICE: ICE auf R&D Position 1` und `Gehostet auf: Eurocorpse (TM) Spin Chip`.

## Tests und Nachweise

- PlayerView-/Engine-Tests decken Fubar, Morphing Tool, Black Widow, Eurocorpse (TM) Spin Chip und Personal Touch, The ab.
- UI-nahe Helper-Tests decken die deutschsprachigen Detailzeilen ab.
- Hidden-Info-Nachweis: Black Widow zeigt dem Runner bei verdecktem Ziel-ICE nur eine Positionsbeschreibung und weder ICE-Titel noch rohe Instance-ID.
- Proteus-Harness-Zählstände bleiben unverändert bei 154 Gesamt, 97 implementiert und 57 fehlend.

## Abschlusskriterien

- Keine neue Proteus-CardImplementation-Datei.
- Keine Manifest-, Decklegalitäts-, Formatlegalitäts- oder AI-Support-Promotion.
- PlayerViews/PublicPayloads geben keine verdeckten Kartendaten über die neuen Anzeigeoberflächen frei.
