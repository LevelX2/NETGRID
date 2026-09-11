---
activityId: act-2026-09-11-ai-des01-expose-information-owner
status: done
completedAt: 2026-09-11
resultArtifacts:
  - packages/ai/src/runner/expose-information/
  - docs/architecture/ai/runner-plan-contracts.md
checks:
  - 392 fokussierte Tests bestanden
  - 1077 thematische Tests in 51 Dateien bestanden
  - 90 Tests am zentralen Choice-Einstieg bestanden
  - Sieben abschließende Owner-Grenztests bestanden
  - AI-Typecheck und check:ai bestanden
  - Sechs verschobene und 503 übrige zentrale Funktionskörper verglichen
  - 109 Dokumentationsziele, 17 Owneranker, Prettier und git diff --check geprüft
priority: high
primaryAgent: release-implementation-agent
createdAt: 2026-09-11
startedAt: 2026-09-11
owner: 01a08be8-5094-7bd2-986b-f072d5073e01
branch: codex/ai-des01-score-information-owners
---

# DES-01: Runner-Informationsentscheidungen als vertikaler Owner

Drittes und letztes Paket. Signalbildung, proaktive Informationsbewertung,
exakte Approach-ICE-/Parent-/Versionsbindung, Ownerzustand, Planmodul und
Dispositionen von `runner.expose_information` zusammenführen. Erinnerungs-
und Ergebnispfade verfolgen; gemeinsam konsumierte Fakten als solche erhalten.
Keine neue Informationsquelle, Runentscheidung, Bewertungsstrategie oder
Hidden-Info-Ausnahme. Aktuelle Signale und Fehler bleiben unverändert.

Abnahme: vorhandene Informations-/Smarteye-/Planregressionen, Ownergrenzen,
AI-Typecheck und Strukturgates, unveränderte verschobene Logik, aktueller
Fachvertrag und Codekarte. Thematischer Integrationslauf über Pläne und alle
vertikalen Runner-Owner. Paketcommit, lokale Main-Integration der drei Pakete,
Retention und geprüfter Cleanup. Kein Push und keine weiteren Pakete.

## Ergebnis

Informationssignale, Parent-/Fensterbindung, Bewertung, Materialisierung,
Dispositionen, Erinnerungsschreiber und bestehende installierte Karten-Choices
liegen im Owner. Typen und Erinnerungsdatensatz ebenfalls; Persistenz und
Schemavalidierung bleiben beim Portfolio. Keine neuen Runtime-Dienste oder
Bewertungsregeln. Die beiden Choice-Dateien wurden inhaltlich unverändert
verschoben, abgesehen vom relativen Testimport.

Die drei Pakete entfernen netto 1032 Zeilen aus Live-Runtime und den beiden
Runner-Registries. Aktueller Vertrag und Codekarte führen die dauerhafte
Einordnung. Zielbild und Änderungskompass bleiben gültig. Vollständige
AI-Shards und Workspace-Gates wurden für die begrenzten verhaltensgleichen
Extraktionen nicht wiederholt; thematische Integrationsprüfungen und die
paketweiten Typ-/Strukturgates sind bestanden.
