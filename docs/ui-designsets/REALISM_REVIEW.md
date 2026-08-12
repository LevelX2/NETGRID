# Realismusprüfung der UI-Designsets

Stand: 2026-08-12
Scope: privater NETGRID-Client

## Ergebnis

Die aktive UI-Richtung besteht aus zwei komplementären Referenzen:

| Set | Rolle | Einschätzung |
| --- | --- | --- |
| Design C – Clean High Contrast | Hauptstruktur | beste Basis für normale Board-, Match- und Verwaltungszustände |
| Design D – Run Focus | Ergänzungsmodus | starke Referenz für Run-, Encounter-, Rez- und Access-Fokus |

Frühere Design-A-/Design-B-Explorationen und ersetzte Drafts haben keinen aktuellen Implementierungsstatus mehr. Sie werden nicht im Arbeitsbaum konserviert; ihre Entwicklung bleibt in Git nachvollziehbar.

## Bewertungsmaßstab

Für eine reale Umsetzung zählen vor allem:

- Side-View-Trennung zwischen Runner und Corp;
- Hidden-Info-Sicherheit;
- Aktionen ausschließlich aus `LegalActions`;
- serverautoritatives State-/Reconnect-/Undo-Verhalten;
- klare Choice-, Run-, Encounter- und Access-Zustände;
- stabile Kartenkomponenten mit Text- und Bilddarstellung;
- Responsive-Verhalten und lesbare Informationsdichte.

## Design C – aktive Hauptreferenz

Dateien:

- [Einstieg](active/design-c/entry.png)
- [Runner](active/design-c/runner-corrected.png)
- [Corp](active/design-c/corp.png)
- [Einstieg mit Kartenbildern](active/design-c/entry-card-images.png)
- [Runner mit Kartenbildern](active/design-c/runner-card-images-corrected.png)
- [Corp mit Kartenbildern](active/design-c/corp-card-images-corrected.png)

### Stärken

- hohe Lesbarkeit und geringe strukturelle Implementierungshürde;
- klare Trennung von Hand, Rig/Servern, Aktionen und Eventinformationen;
- gute Basis für wiederholtes normales Spielen;
- kartenbildfreundliche Varianten zeigen einen plausiblen CardView mit Bild/Text-Fallback und Preview;
- Hidden Cards können als generische verdeckte Zustände behandelt werden.

### Noch notwendige Konkretisierung

- verbindliche Bindung sichtbarer Felder an `PlayerView`, `LegalActions`, Choice- und Receipt-Daten;
- klare Rez-/Unrezzed-, Advancement- und Pending-Choice-Zustände;
- responsive Regeln für kleinere Browserfenster;
- Accessibility-Grundlagen;
- Card Preview und stabile Detaildarstellung statt zu viel Text auf kleinen Boardkarten.

Design C bleibt die primäre Struktur für Entry, normale Action Phases und das allgemeine Board.

## Design D – Run-/Encounter-Fokus

Dateien:

- [Einstieg](active/design-d-run-focus/entry.png)
- [Runner](active/design-d-run-focus/runner-corrected.png)
- [Corp](active/design-d-run-focus/corp-corrected.png)

### Stärken

- sehr gute Fokussierung auf aktuellen Run und Encounter;
- Subroutines, Breaker, Rez-Fenster und aktuelle Entscheidungen sind visuell prominent;
- geeignet als fokussierter Modus innerhalb der normalen Boardoberfläche.

### Begrenzung

Design D ist keine alleinige Gesamtoberfläche. Normale Zustände außerhalb eines Runs, Matchstart, Waiting-, Undo-, Reconnect- und allgemeine Action-Phase-Zustände bleiben in der Design-C-Struktur besser aufgehoben.

## Zielbild

Die sinnvolle Kombination lautet:

```text
Design C
→ normale Anwendung und Boardstruktur
→ bei aktivem Run fokussierter Center-Bereich nach Design D
→ Choice/Encounter/Access prominent
→ danach Rückkehr zur normalen Boardstruktur
```

## Gemeinsame fehlende Bausteine

Für eine vollständig implementierbare UI-Spezifikation sind insbesondere noch verbindlich zu definieren:

- `AppShell`, `EntryScreen`, `RunnerBoard`, `CorpBoard` und `ServerGrid`;
- ein einheitlicher `CardView` für bekannte, unbekannte, gerezzte, unrezzte, scored und accessed Karten;
- `LegalActionsPanel` und `ChoiceRequestPanel`;
- Connection-, Reconnect- und Undo-Zustände;
- side-sicherer EventLog und Diagnostik-Drawer;
- Action-Submission-Zustände für pending, accepted, rejected, stale und duplicate;
- Responsive- und Accessibility-Regeln.

## Asset-Grenze

Die UI-Referenzen begründen keine Freigabe offizieller Artworks, Card Frames, Logos oder Card Backs. Kartenbilder benötigen weiterhin ein eigenes Asset-/Rechts-Gate; Hidden Cards dürfen durch Bildmodus oder Assetzustände keine Identität verraten.
