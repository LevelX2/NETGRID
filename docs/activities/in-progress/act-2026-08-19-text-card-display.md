---
activityId: act-2026-08-19-text-card-display
status: in-progress
kind: implementation
area: web-ui
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-08-19
startedAt: 2026-08-19
completedAt:
branch: codex/text-card-display-improvements
releaseTarget: local-main
blockedBy: []
resultArtifacts: []
checks: []
---

# Textkarten- und Bild-Fallback-Prozess

Status: in Arbeit

## Quelle/Vorgabe

Nutzerfeedback zur Kartenanzeige vom 2026-08-19: Fehlende Bilder dürfen
gemischte Kartensets nicht unspielbar machen. Textkarten sollen das sichtbare
Kartenformat halten, vollständigen Regeltext lesbar zeigen und Kartentypen
dezent unterscheiden. Der Kurzmodus muss ohne Tooltip bereits Regelhinweise
enthalten.

## Zielprüfung

Der Endzustand, die betroffenen Web-Komponenten, das lokale Integrationsziel
und die Sicherheitsgrenzen sind bestimmt. Die konkrete Abstufung sehr langer
Texte wird konservativ über eine messbare Schriftanpassung umgesetzt; die
Vollansicht bleibt jederzeit per Tooltip/Fokus erreichbar.

## Gesamtziel

Bekannte Karten werden im Bildmodus einzeln und automatisch als Textkarte
dargestellt, wenn ihr lokales Bild tatsächlich nicht verfügbar ist. Die
Textkarte hat ein stabiles Kartenformat, zeigt ihren vollständigen Regeltext
ohne Abschneiden und nutzt nur dezente, typgebundene Farbnuancen. Die
Kurzkarte zeigt Titel, Metadaten und mindestens einen sichtbaren Regelhinweis;
Tooltip und Fokus liefern weiterhin die vollständige, side-sichere
Schnellansicht.

## Annahmen

- Der bestehende gespeicherte Moduswert `placeholder` bleibt aus Kompatibilität
  bestehen, wird in der UI aber als Bildmodus mit Text-Automatik erklärt.
- Die Textkarte darf Schrift und Zwischenräume bis zu einer noch lesbaren
  Untergrenze verdichten; es gibt keinen zeilenweisen Beschnitt.
- Die Kartenfarben werden nur als dunkle Kopf-/Flächen- und Randakzente
  eingesetzt, nicht als vollflächige, grelle Typfarben.

## Nicht-Ziele

- Keine Änderung der Engine, der Kartenregeln, der Bildimport-Pipeline oder
  des Asset-/Rechts-Gates.
- Kein Bild-Fallback für verdeckte Karten und keine zusätzliche Offenlegung in
  PlayerViews, Tooltips oder Logs.
- Kein allgemeines Redesign des Spielbretts.

## Controller-Invarianten

- Die Rules Engine bleibt alleinige Regelautorität.
- Ein Assetfehler ändert nur die lokale Darstellung einer bereits bekannten
  Karte; weder Kartenidentität noch Match-State werden verändert.
- Verdeckte Karten bleiben unabhängig vom Assetbestand verdeckt.
- Tooltip- und Fokusinhalte stammen weiterhin aus der bereits side-sicher
  projizierten sichtbaren Karte.

## Automatische Fehlerbehandlung

Scheitert die primäre und optionale lokalisierte Bildvariante, wird keine
leere Kunstfläche oder ein Alt-Text als Ersatz gezeigt. Die bekannte Karte
wechselt lokal in die Textkarte. Die Bildverwaltung selbst bleibt für den
Fehlerzustand verantwortlich und wird nicht durch einen künstlichen Bildwert
umgangen.

## State Machine

`Bildmodus + bekannte Karte` → `Bild laden` →
`verfügbar: Bildkarte` | `alle Varianten fehlgeschlagen: Textkarten-Fallback`.

`Textmodus` → `Textkarte`; `Kurzmodus` → `Kurzkarte`.

`verdeckte Karte` → `verdeckte Rückseite`, unabhängig von allen Bildzuständen.

## Paketfolge

### TCD-01: Bildverfügbarkeit und individueller Text-Fallback

Ziel: Den tatsächlichen Bildfehler aus der CardView erfassen, die bekannte
Karte lokal auf die Textkarten-Darstellung zurückführen und den defekten
Bild-Alt-Text im Bildtooltip vermeiden.

Kernartefakte: `CardImage`, `CardView`, zugehörige Unit-Tests.

Done-Gate: Primärbild, lokalisierte Bildvariante und kompletter Assetfehler
sind testbar; ein kompletter Fehler erzeugt Textinhalt statt leerem Bildplatz.

Commit: `feat(web): fall back missing card images to text cards`

### TCD-02: Stabile, lesbare Textkarte mit dezenten Typakzenten

Ziel: Die Textkarte erhält das Kartenverhältnis, vollständigen Regeltext mit
messbarer Anpassung für lange Inhalte sowie zurückhaltende typbezogene
Farbhierarchie.

Kernartefakte: `CardView`, `globals.css`, zugehörige Tests.

Done-Gate: Keine Regelzeilenbegrenzung im Textmodus; Titel, Metadaten und
Regeln bleiben im Kartenrahmen, und die Farben unterscheiden Typen ohne die
Textkontraste zu schwächen.

Commit: `feat(web): improve readable text card layout`

### TCD-03: Informationshaltige Kurzkarte und verständliche Modi

Ziel: Der Kurzmodus zeigt einen sichtbaren Regelhinweis und die Optionen
erklären die drei Modi präzise. Die vollständige Text-Schnellansicht bleibt
bei Hover, Fokus und Pin verfügbar.

Kernartefakte: `CardView`, `OptionsPanel`, Tests und diese Activity.

Done-Gate: Kurzkarte enthält Regelinhalt, Optionen benennen den Bild-Fallback,
alle fokussierten Webtests und `git diff --check` sind grün.

Commit: `feat(web): make compact cards informative`

### TCD-04: Integrationsgate und Abschluss

Ziel: Paketänderungen konsolidieren, den Branch gegen aktuelles `main`
validieren und lokal integrieren.

Done-Gate: Arbeitsworktree sauber, relevante Webtests und Typecheck grün,
`main` geprüft, Worktree und gemergter Branch entfernt.

## Verifikationsregeln

- Während der Umsetzung nur die unmittelbar betroffenen Webtests und den
  Web-Typecheck ausführen.
- Vor jedem Paketcommit: `git diff --check`.
- Vor Integration: fokussierte Tests erneut und der relevante Typecheck.

## Paketprotokoll

### TCD-01 — abgeschlossen am 2026-08-19

- `CardImage` meldet einen Ausfall erst, wenn auch die optionale lokalisierte
  Variante fehlgeschlagen ist.
- `CardView` wechselt dann nur bekannte Bildmodus-Karten lokal auf die
  Textkarten-Geometrie; verdeckte Karten bleiben davon ausgenommen.
- Der Bildtooltip verwendet keinen sichtbaren Ersatz-Alt-Text mehr und fällt
  auf seine Text-Schnellansicht zurück.
- Check: `corepack pnpm exec vitest run app/card-image-service.test.ts` —
  7/7 grün.
- Bekannter unabhängiger Baseline-Blocker: Web-Typecheck scheitert in
  `app/ai-turn-plan-comparison-ui.test.ts` und
  `packages/ai/src/runtime/selected-choices-for-decision.ts`; keine dieser
  Dateien gehört zu diesem Paket.

## Worktree-, Git- und Integrationsregeln

Arbeitsworktree: `C:\Projekte\NETGRID_TEXT_CARD_DISPLAY`

Arbeitsbranch: `codex/text-card-display-improvements`

Der Hauptworkspace wird ausschließlich für den finalen Merge nach `main`
verwendet. Seine bereits vorhandenen, fremden Änderungen werden niemals
gestagt, verändert oder verworfen. Push und Pull Request sind nicht Teil
dieses Prozesses.

## Controller-Prompt-Kern

`/Goal Arbeite den Textkarten- und Bild-Fallback-Prozess vollständig und
sequenziell von TCD-01 bis TCD-04 ab und merge den abgeschlossenen
Arbeitsbranch lokal nach main. Lies zuerst AGENTS.md, die Wissensbasis, diese
Activity und paketlokale Anweisungen. Arbeite ausschließlich im Worktree
C:\Projekte\NETGRID_TEXT_CARD_DISPLAY auf
codex/text-card-display-improvements. Nutze den Hauptworkspace nur für den
finalen Merge. Arbeite immer nur am aktuellen Paket, führe Paketchecks aus
und committe es. Bei einem Sicherheitsblocker stoppe mit Blocker-Report und
Removal Condition. Nach Abschluss final verifizieren, lokal nach main mergen,
main prüfen, den sauberen Arbeitsworktree entfernen, die Entfernung in Git
und Dateisystem verifizieren, den gemergten Branch löschen und Goal erst dann
als complete markieren.`

## Abschlusskriterien

- Alle TCD-Paket-Done-Gates und die Integrationschecks sind erfüllt.
- Der aktive Prozess ist entweder in eine dauerhafte, erforderliche Quelle
  überführt oder als erledigtes Zwischenartefakt entfernt.
- `main` enthält ausschließlich die Paketcommits dieses Prozesses zusätzlich
  zu bereits vorhandenen lokalen Änderungen.
