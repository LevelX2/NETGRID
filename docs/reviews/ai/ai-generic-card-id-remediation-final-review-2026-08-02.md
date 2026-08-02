# Final Review: Generische KI-Karten-ID-Bereinigung

Datum: 2026-08-02

Status: **fachlich und technisch freigegeben; lokal in `main` integriert**

## Review-Ergebnis

Die untersuchten produktiven KI-Sonderfälle wurden auf vorhandene funktionale
Verträge zurückgeführt. Wiederverwendbare Fähigkeiten werden über konkrete
`LegalActions`, actiongebundene `functionalEffects`, strukturierte Hints und
Engine-Quotes entdeckt. Die bestehenden Planowner, Routen, Executorbindungen
und `PlanExecutionOrigin`-Verträge bleiben erhalten; es entstand kein zweiter
Chooser, Override, Resolver oder Fallback-Plan.

Das ausführbare AST-/Importgraph-Gate prüft nach dem Abgleich mit aktuellem
`main` 306 produktiv erreichbare
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

- Shared-, Engine- und AI-Typecheck grün.
- Fokussierte Plan-, Ownership-, Action-Binding-, Engine- und Simulationstests
  aller Migrationspakete grün.
- `check:ai-source-structure` grün: 759 produktive Dateien, keine Laufzeit- oder
  Typzyklen.
- `check:package-boundaries` grün: 2.004 Dateien.
- Kombiniertes `check:ai` einschließlich Hint-Metadatenvertrag grün.
- Karten-ID-Gate grün: 306 Dateien, 3 Vorkommen, 3 Allowances,
  `individual_plan_model:3`, 0 Verstöße.
- Vollständige AI-Shards grün: 553 Testdateien, 4.551 Tests, drei Shards mit je
  einem Worker.
- `git diff --check` grün.

## Befunde des Main-Abgleichs

Der vollständige erste Shard-Lauf deckte vier Integrationsabweichungen auf und
brach korrekt rot ab. Geschlossen wurden zwei nicht registrierte
Faked-Hit-Hint-Ressourcen, ein unzulässiger Simulations-Reexport über den
Default-Paketfacade sowie die veraltete Erwartung eines Real-Game-Checkpoints,
der nun korrekt die Engine-gequotete Top-Trash-Recovery für den fehlenden
Breaker wählt. Der zuständige Owner bleibt `runner.rig_and_coverage`, die
Capability `search_answer_breaker_ap` und die exakte LegalAction-Bindung sind
im Checkpoint gesichert. Die vier fokussierten Regressionstests und danach alle
drei vollständigen Shards sind grün.

## Integration und Bereinigung

Der verifizierte Stand `860674dd6` wurde per Fast-Forward in den lokalen
`main` integriert. `corepack pnpm check:ai` und `git diff --check` liefen dort
anschließend erneut grün. Der saubere Paket-Worktree
`C:\Projekte\NETGRID_AI_GENERIC_CARD_ID_MIGRATION` und der vollständig gemergte
Branch `codex/ai-generic-card-id-migration` wurden entfernt. Es erfolgte kein
Push und keine Remote-Integration.
