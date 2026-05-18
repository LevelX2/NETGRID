---
activityId: act-2026-05-17-proteus-mechanics-coverage-analysis
status: done
kind: concept
area: cards
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: false
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch:
releaseTarget: Proteus planning
blockedBy:
  - act-2026-05-17-proteus-spoiler-ingestion
resultArtifacts:
  - data/rules/proteus-mechanics-coverage-2026-05-17.json
  - docs/releases/proteus/mechanics-coverage-analysis.md
  - docs/activities/inbox/act-2026-05-17-proteus-variable-ice-contracts.md
  - docs/activities/inbox/act-2026-05-17-proteus-hidden-resources-contract.md
  - docs/activities/inbox/act-2026-05-17-proteus-bad-publicity-loss-gate.md
  - docs/activities/inbox/act-2026-05-17-proteus-virus-antibody-contracts.md
  - docs/activities/inbox/act-2026-05-17-proteus-cybernetics-deck-hardware-contract.md
  - docs/codex/CODEX_STATUS.md
  - KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Aktueller Projektstatus.md
checks:
  - "node -p: Proteus-Coverage-Matrix validiert: 154 Karten, Status 80 deepen / 56 resolver / 17 covered / 1 blocked, 31 Cluster"
  - "git diff --check"
---

# Proteus-Mechanikabdeckung analysieren

## Ziel

Für alle Proteus-Karten soll geprüft werden, welche Karten bereits durch vorhandene Mechaniken grundsätzlich abdeckbar wären und welche neuen oder vertieften Funktionalitäten vor einer Umsetzung benötigt werden.

## Kontext und Quellen

- Ausgangsquelle: `docs/source/Proteusspoiler.txt`.
- Nach aktuellem Projektstand sind viele Kernfamilien vorhanden: Damage, Tags/Trace, Run/Breach/Multiaccess, Hidden-Zone-Tools, Hosting, Counter, Recurring, Bad Publicity, Replacement, Special Zones, Random Effects und große Originalset-Longtail-Pfade.
- Proteus enthält sichtbar neue oder wiederkehrende Risikofamilien wie Agenda-Ambush, Bad-Publicity-Verlustbedingung, zusätzliche Aktionen, Würfel-/Random-Effekte, variable Rez-/Stärke-/Subroutine-Erzeugung, Virus-/Antibody-Effekte, Hidden Resources, Sabotage/Prep, Regions/Sysops und Cybernetics/Deck-Hardware.

## Scope

- Jede Proteus-Karte einem oder mehreren Mechanikclustern zuordnen.
- Status je Karte vergeben: `wahrscheinlich abgedeckt`, `kleiner Resolver nötig`, `Mechanikvertiefung nötig`, `blockiert/Regelklärung nötig`.
- Bereits vorhandene Engine-/Mechanikfamilien mit konkreten Proteus-Anforderungen abgleichen.
- Neue Funktionalitäten als eigene Cluster dokumentieren, z. B. variable Rez-Zusatzkosten, zusätzliche Aktionsarten, Bad-Publicity-Loss, versteckte Runner-Ressourcen, Cybernetics/Deck-Hardware, Proteus-spezifische Virus-/Antibody-Familien.
- Kleine Folgeactivities für klar abgrenzbare Cluster anlegen, falls die Analyse konkrete Umsetzungspakete ergibt.

## Nicht im Scope

- Keine Karten implementieren.
- Keine Kartenstatus-Promotion.
- Keine AI-Hints oder Decklegalität.
- Keine endgültige Regelentscheidung bei unklaren Kartentexten ohne Quellenprüfung.

## Akzeptanzkriterien

- [x] Für 154/154 Proteus-Karten gibt es eine Coverage-Einschätzung.
- [x] Mechanikcluster sind so geschnitten, dass spätere kleine oder mittlere Umsetzungspakete daraus entstehen können.
- [x] Blockierende Regelfragen und neue Funktionalitätsfamilien sind explizit benannt.
- [x] Karten mit bestehender Mechanikbasis sind von Karten mit neuem Enginebedarf getrennt.
- [x] Mindestens drei konkrete Folgeactivities für erste umsetzbare Proteus-Slices sind angelegt oder begründet zurückgestellt.

## Umsetzungshinweise

- Primärer Folgeagent: `card-enablement-ai-knowledge-agent`.
- Gute Ergebnisform: `docs/releases/proteus/mechanics-coverage-analysis.md` plus ggf. maschinenlesbare Matrix.
- Keine Textparser-Autorität: Kartentext bleibt Quelle für Planung, Runtime braucht eigene Resolververträge.

## Ergebnisnotiz

Erledigt: Die Proteus-Mechanikabdeckung liegt als maschinenlesbare Matrix und abgeleiteter Bericht vor. Alle 154 Proteus-Karten haben eine erste Coverage-Einschätzung; die Statusverteilung ist 17 wahrscheinlich abgedeckt, 56 kleiner Resolver nötig, 80 Mechanikvertiefung nötig und 1 blockiert/Regelklärung nötig. Blockierende Reviewpunkte sind `Ice and Data Special Report` mit Kostenangabe `3 (0)`, die Quellenkopf-Abweichung bei Prep/Hardware-Zählungen sowie variable Werte bei `Digiconda` und `Homing Missile`.

Angelegt wurden fünf Folgeactivities: variable Proteus-ICE-Verträge, Hidden-Runner-Resources-Vertrag, Bad-Publicity-Loss-Gate, Virus-/Antibody-Verträge und Cybernetics/Deck-Hardware-Vertrag. Die Matrix wurde per Node-Prüfung auf 154 Karten, Statussummen und 31 Cluster validiert; `git diff --check` wurde als Abschlussprüfung vorgesehen.
