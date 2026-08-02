# Final Review: Generische KI-Karten-ID-Bereinigung

Datum: 2026-08-02

Status: **fachlich freigegeben; vollständige Abschlussgates und Main-Integration ausstehend**

## Review-Ergebnis

Die untersuchten produktiven KI-Sonderfälle wurden auf vorhandene funktionale
Verträge zurückgeführt. Wiederverwendbare Fähigkeiten werden über konkrete
`LegalActions`, actiongebundene `functionalEffects`, strukturierte Hints und
Engine-Quotes entdeckt. Die bestehenden Planowner, Routen, Executorbindungen
und `PlanExecutionOrigin`-Verträge bleiben erhalten; es entstand kein zweiter
Chooser, Override, Resolver oder Fallback-Plan.

Das ausführbare AST-/Importgraph-Gate prüft 305 produktiv erreichbare
KI-Quelldateien. Von anfänglich 32 direkten Karten-ID-Vorkommen verbleiben drei
zentral begründete Bindungen in individuellen Planmodellen. Ungeklärte
`review_required`-Vorkommen verbleiben nicht.

## Verbleibende produktive Ausnahmen

| Planmodell | Vorkommen | Begründung |
| --- | ---: | --- |
| `runner.shell_traders_pipeline` | 2 | Signaltyp und sichtbare Source werden an das bewusst individuelle, mehrphasige Delayed-Install-Modell gebunden. Allgemeine TurnPlanner-Schichten reagieren nur auf den generischen Delayed-Install-Replanning-Vertrag. |
| Social-Engineering-Bypass | 1 | Die konkrete Source bindet eine individuelle Secret-Bid-/Bypass-Sequenz. Runziel, Pfad und Gebot werden innerhalb des zuständigen Plans aus sichtbarem Zustand und Engine-Verträgen bestimmt. |

Diese Ausnahmen beschreiben die Identität eines individuellen Planmodells. Sie
klassifizieren keine allgemein wiederverwendbare Fähigkeit und dürfen nicht als
Vorbild für Karten-ID-Branches in gemeinsamen Bewertungs- oder Planungspfaden
verwendet werden.

## Diagnosegrenze

Die neun historischen Future-Run-ICE-Klassen werden ausschließlich für
bestehende Simulationsmetriken benötigt. Registry und Assessment liegen deshalb
unter `packages/ai/src/simulation/`. Das produktive ICE-Platzierungsmodul kennt
nur generische, side-sichere ICE-Fakten sowie aktuelle Action- und
Engine-Kostenverträge.

## Paketverifikation

- AI-Typecheck grün.
- Fokussierte Plan-, Ownership-, Action-Binding-, Engine- und Simulationstests
  aller Migrationspakete grün.
- Karten-ID-Gate grün: 305 Dateien, 3 Vorkommen, 3 Allowances,
  `individual_plan_model:3`, 0 Verstöße.
- `git diff --check` grün.

Die vollständigen AI-Shards, Source-Structure-, Paketgrenzen- und kombinierten
AI-Gates werden vor der lokalen Main-Integration nochmals ausgeführt und danach
in diesem Review ergänzt.
