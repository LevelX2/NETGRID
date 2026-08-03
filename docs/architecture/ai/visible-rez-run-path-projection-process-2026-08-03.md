# Sichtbar begründete Rez-Projektion im Runner-Pfad

Status: aktiv

## Ziel

Die bestehende `runner.pressure_central`-Planroute bewertet bekannte, derzeit
derezzte ICE mit einer sichtbar begründeten gegnerischen Rez-Möglichkeit als
projizierten Pfad. Dynamische Folgeeffekte werden über die bestehende
Pfadsimulation berechnet; es entsteht kein neuer Chooser und keine
Karten-Sonderregel.

## Nachweis und Nicht-Ziele

- Quelle: `match_46b217e1fa15466f`, Runner startet HQ bei 0 Credits gegen
  bekanntes Misleading Access Menus und gerezztes Minotaur.
- Nicht-Ziel: verdeckte Hand, unbekanntes ICE oder behauptete gegnerische
  Reaktionen ohne sichtbare, konkrete Rez-Grundlage.
- Owner bleibt `runner.pressure_central`; die Evaluation liefert nur die
  Pfad-Facts für dessen bestehende Route.

## Pakete

1. Spielgleichen Checkpoint für den fehlerhaften HQ-Start erfassen und rot
   bestätigen; eine Gegenprobe ohne begründete Rez-Projektion bleibt zulässig.
2. Die vorhandene sichtbare Pfadbewertung um projizierte, bekannte Rez-ICE
   erweitern und dynamische Folgeeffekte weiter über den bestehenden
   Evaluator berechnen.
3. Checkpoint, Gegenprobe, fokussierte Tests und AI-Typecheck ausführen;
   lokal nach `main` integrieren und Worktree entfernen.

## /Goal

Arbeite die Pakete 1 bis 3 sequenziell im Worktree
`C:\Projekte\NETGRID_AI_VISIBLE_REZ_PATH` auf
`codex/ai-visible-rez-path` ab, sichere Ownership und Side-Safety, merge
anschließend lokal nach `main` und entferne den sauberen Worktree.
