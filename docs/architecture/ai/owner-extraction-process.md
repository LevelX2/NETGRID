# Defense und Run-Window konsolidieren

Status: P1 und P2 abgenommen; Integration aktiv.

## Auftrag und Ziel

Die beiden verbleibenden fachlichen Owner in gewohnter Weise im eigenen
Worktree bündeln. Ziel ist eine wartbare vertikale Quellcodestruktur bei
unverändertem Verhalten, denselben 25 registrierten Modulen und denselben
Plan-, Parent-, Need-, Route-, Action- und Choice-Bindungen.

Der Auftrag ist ausreichend präzise. Keine neue Strategie, Priorität,
Kartenfähigkeit oder öffentliche API. Engine und side-sichere Eingaben bleiben
führend; keine zweite Auswahl- oder Regelautorität.

## Pakete und Abnahme

1. **P1 Defense:** Discovery, globale Allokation, Schutzrouten, Assessment,
   Dispositionen und gebundene Defense-Choices unter `corp/defense/` bündeln.
   Score, Remote und Ambush liefern weiterhin ihre bisherigen Bedarfe.
   Gate: fokussierte Defense-/Score-Support-/Choice-Tests, AI-Typecheck,
   Zyklus-/Erreichbarkeitsgate und Prüfung unveränderter Funktionskörper.
   Commit: `refactor(ai): consolidate server defense owner`.
2. **P2 Run-Window:** laufenden Run, Encounter, Access und zugehörige
   Continuations unter `runner/run-window/` bündeln. Run-Analyse bleibt ein
   geteilter Dienst, Root-/Parent-Identität bleibt erhalten.
   Gate: fokussierte Run-/Encounter-/Access-/Choice-Tests, AI-Typecheck,
   Strukturprüfung und Prüfung unveränderter Funktionskörper.
   Commit: `refactor(ai): consolidate run window owner`.
3. **Integration:** wegen der breiten Wirkung dieser beiden zentralen Pfade
   gemeinsamer AI-Shard-Checkpoint nach dem Projekt-Testvertrag; aktuelle
   Ownerkarte und Fachverträge aktualisieren. Lokaler Main-Abgleich, Merge
   und geprüftes Worktree-/Branch-Cleanup. Kein Push.

Genau ein Implementierungspaket ist aktiv. Ein rotes Gate wird im betroffenen
Pfad untersucht; unabhängige Baselinefehler werden getrennt ausgewiesen.
Nach jedem grünen Paket: Evidence aktualisieren, `git diff --check`, gezieltes
Staging und Paketcommit. Keine stillen Scope-Erweiterungen oder Fallbacks.
Unklare fachliche Bindungen sind vor Änderung zu klären.

## Arbeitsbereich und Abschluss

Worktree: `C:/Projekte/NETGRID_defense_run_window`, Branch:
`codex/defense-run-window`, Start: `2d9fc18c9`.
Main war sauber; fremde Worktrees bleiben unberührt. Keine Serverstarts.
Neue Main-Änderungen werden beim Integrationspunkt geprüft und erhalten.
Der Controller arbeitet P1 → P2 → Integration sequenziell ab und meldet
Abnahmen und materielle Hindernisse. Nach Abschluss wird dieses temporäre
Prozessartefakt entfernt; aktuelle Verträge behalten die fachliche Codekarte,
Git die Paket- und Prüfhistorie.

## P1-Abnahme

252 fokussierte Tests in zehn Dateien abgedeckt: 250 sofort grün; zwei
Strukturassertionen auf die neuen Quellpfade umgebunden, danach alle zwölf
Authority-Tests grün. AI-Typecheck, Importgraph (822 Quellen, keine Value- oder
Typzyklen), Erreichbarkeit und Card-ID-Gate grün. Die beiden vorhandenen
Dr.-Dreff-Lifecycle-Bindungen wurden mit unveränderter Gesamtzahl in ihre neuen
Dateien umgetragen. 514 ursprüngliche Funktionskörper sind tokenidentisch;
nur `buildCorpDomain` komponiert die drei ausgelagerten Discovery-Schritte.
Keine ursprüngliche Funktion fehlt. Breite Shards folgen am gemeinsamen
Integrationscheckpoint gemäß Projekt-Testvertrag.

## P2-Abnahme

456 fokussierte Tests in elf Dateien grün, einschließlich Owner-Materialisierung,
Run-/Access-Commitment, Informationsgrenzen, Restricted Runs, Remote-Fortsetzung,
Zahlungssupport, zusätzlichem Zugriff, Targeted Bypass, erzwungenem Vacuum Link
und Authority-Grenzen. AI-Typecheck nach den finalen Extraktionen grün.
Alle 838 produktiven Quellen sind erreichbar und Value-/Typzyklen fehlen.
Card-ID-Gate samt Selbsttest, Hint-Verträge, Paketgrenzen (2.196 Dateien),
Test-Discovery und Formatprüfung sind grün. 142 aktuelle Dokumentlinks geprüft.

Über beide Pakete: 584 ursprüngliche Funktionskörper tokenidentisch; nur
`buildCorpDomain`, `buildRunnerDomain` und `runnerActionDispositions` komponieren
exakt ausgelagerte Blöcke. Keine ursprüngliche Funktion fehlt. Die sechs
bestehenden Vacuum-Link-Lifecycle-Vorkommen sind auf zwei Ownerdateien verteilt,
die bestehende Social-Engineering-Klassifikation folgt ihrem Quellpfad.
Die Live-Runtime umfasst jetzt 5.442 statt 13.276 Zeilen.
Der gemeinsame AI-Shard-Lauf läuft; Abschluss und lokale Integration stehen aus.
