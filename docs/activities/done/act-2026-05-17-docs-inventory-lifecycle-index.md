---
activityId: act-2026-05-17-docs-inventory-lifecycle-index
status: done
kind: cleanup
area: docs
priority: low
primaryAgent: architecture-review-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch: codex/activity-worker-5
parallelWorker: worker-5
releaseTarget:
blockedBy: []
resultArtifacts:
  - docs/reviews/docs-cleanup/docs-inventory-lifecycle-index-2026-05-17.md
checks:
  - git ls-files -- docs
  - git ls-files -- docs/derived
  - git ls-files --others --exclude-standard -- docs
  - Folgepaket-Referenzcheck per Get-ChildItem docs/activities
  - git diff --check
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

- [x] Es gibt einen nachvollziehbaren Inventar-Index für `docs/`.
- [x] Jede größere Pfadgruppe hat eine Lebenszyklus-Kategorie.
- [x] Doppelte Root-/Source-Dateien, `docs/derived/`, `docs/activities/`, `docs/source/`, `docs/codex/`, `docs/ui-designsets/` und das historische Dokumentenpaket sind sichtbar eingeordnet.
- [x] Die ungetrackte Inbox-Vereinfachung ist als bewusstes Arbeitsmodell beschrieben.
- [x] Folgepakete für Verdichtung oder Archivierung sind benannt, falls das Inventar neue Lücken zeigt.

## Umsetzungshinweise

- Erst inventarisieren, dann erst spätere Moves planen.
- Pfadgruppen reichen, wenn Einzelfiles gleichen Musters klar zusammengehören.
- Für konkrete Archiv-/Remove-Empfehlungen repräsentative Dateien öffnen.

## Ergebnisnotiz

Abgeschlossen. `docs/reviews/docs-cleanup/docs-inventory-lifecycle-index-2026-05-17.md` ordnet den aktuellen getrackten `docs/`-Bestand zum Stichtag 2026-05-17 nach Pfadgruppen, Dateitypen, Release-/Themenbezug, vermutetem Dokumenttyp, Lebenszyklus-Kategorie und Rollup-/Nachfolgerkandidaten ein.

Der neue Stichtagsbefund lautet: 948 getrackte Dateien unter `docs/`, davon 749 unter `docs/derived/`; ungetrackte `docs/`-Dateien wurden im Worker-Worktree nicht festgestellt. Root-/Source-Duplikate, `docs/derived/`, `docs/activities/`, `docs/source/`, `docs/codex/`, `docs/ui-designsets/` und das historische Dokumentenpaket sind sichtbar eingeordnet. Die bewusst mögliche ungetrackte `activities/inbox/` ist als Arbeitsboard-Modell dokumentiert, nicht als Problem.

Checks: `git ls-files -- docs`, `git ls-files -- docs/derived`, `git ls-files --others --exclude-standard -- docs`, Folgepaket-Referenzcheck per `Get-ChildItem docs/activities`, `git diff --check`. Offene Folgepunkte sind im Inventar als bestehende und empfohlene Folgepakete benannt; außer dem Activity-Abschlussmove wurden keine Dateien verschoben, gelöscht oder entversioniert.
