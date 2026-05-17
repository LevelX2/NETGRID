---
activityId: act-2026-05-17-docs-inventory-lifecycle-index
status: inbox
kind: cleanup
area: docs
priority: low
primaryAgent: architecture-review-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# docs-Inventar mit Lebenszyklus-Kategorien anlegen

## Ziel

Für `docs/` soll ein belastbarer Inventar-Index entstehen, der Dateien nach Verzeichnis, Dokumenttyp, Release-/Themenbezug und Lebenszyklus einordnet. Das Inventar dient als Grundlage für spätere Verdichtung, Archivierung und Linkprüfung.

## Kontext und Quellen

- Strukturreview vom 2026-05-17: `docs/` enthält 819 getrackte Dateien, davon 712 unter `docs/derived/`.
- Wichtige Ausgangspunkte:
  - `docs/README.md`
  - `docs/derived/README.md`
  - `docs/activities/README.md`
  - `docs/codex/CODEX_STATUS.md`
  - `KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Index.md`
- Bewertungslabels aus dem Review: `keep-active`, `keep-source`, `keep-evidence`, `condense`, `archive`, `git-remove-after-condense`, `do-not-version`, `needs-decision`.

## Scope

- `git ls-files -- docs` und rekursive Dateiliste erneut ermitteln.
- Pro Pfad oder Pfadgruppe erfassen:
  - Verzeichnis,
  - Dateityp,
  - Release- oder Themenbezug,
  - vermuteter Dokumenttyp,
  - empfohlene Lebenszyklus-Kategorie,
  - führender Nachfolger oder Rollup-Kandidat, falls bekannt.
- Eine Markdown- oder JSON-nahe Inventarsicht als neues dauerhaftes docs-Artefakt vorschlagen oder anlegen.
- Unversionierte Inbox-Dateien als bewusstes Arbeitsboard-Verhalten dokumentieren, nicht als Problem behandeln.

## Nicht im Scope

- Keine Dateien verschieben, löschen oder aus Git entfernen.
- Keine neue Git-Policy für die ungetrackte Activity-Inbox erzwingen.
- Keine fachliche Neubewertung von Engine-, Hidden-Info-, LegalAction-, Replay- oder StateHash-Verträgen.
- Keine Massenumbenennung.

## Akzeptanzkriterien

- [ ] Es gibt einen nachvollziehbaren Inventar-Index für `docs/`.
- [ ] Jede größere Pfadgruppe hat eine Lebenszyklus-Kategorie.
- [ ] Doppelte Root-/Source-Dateien, `docs/derived/`, `docs/activities/`, `docs/source/`, `docs/codex/`, `docs/ui-designsets/` und das historische Dokumentenpaket sind sichtbar eingeordnet.
- [ ] Die ungetrackte Inbox-Vereinfachung ist als bewusstes Arbeitsmodell beschrieben.
- [ ] Folgepakete für Verdichtung oder Archivierung sind benannt, falls das Inventar neue Lücken zeigt.

## Umsetzungshinweise

- Erst inventarisieren, dann erst spätere Moves planen.
- Pfadgruppen reichen, wenn Einzelfiles gleichen Musters klar zusammengehören.
- Für konkrete Archiv-/Remove-Empfehlungen repräsentative Dateien öffnen.

## Ergebnisnotiz

Noch offen.
