# Matchserie MRGSG: Decision-Checkpoint-Remediation

## Status

P0 bis P5 abgeschlossen; der Arbeitsbranch ist lokal nach `main` integriert
und der isolierte Worktree entfernt. Von den historischen und neu abgeleiteten
Auffälligkeiten blieb genau der zentrale Runner-Zielkonflikt bei Decision 32
als spielgleiche `behavior_regression` reproduzierbar. Die rote Ziel-Evidence
und die grüne R&D-Gegenprobe wurden vor jeder Verhaltenskorrektur versioniert
und sind nach der generischen Korrektur unverändert grün.

## Quelle

- Serie: `match-mrgsg0px-vvhjh5`
- Spiel 1: `match_a199d04c94d5a906`, menschlicher Runner gegen Hard-Corp-KI
- Spiel 2: `match_3bb2232dccc0a1da`, menschliche Corp gegen Hard-Runner-KI
- SQLite: `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`,
  ausschließlich read-only
- Arbeitsbranch: `codex/ai-series-mrgsg-checkpoints`
- Worktree: `C:\Projekte\NETGRID_AI_SERIES_MRGSG_CHECKPOINTS`

## Gesamtziel

Alle fachlich begründeten Fehlerkandidaten der Serie gegen den aktuellen
Produktions-Chooser prüfen. Jeden weiterhin reproduzierbaren Fehler zuerst
als roten, versionierten Engine-/Runtime-Checkpoint samt grüner Gegenprobe
committen, erst danach generisch beheben und dauerhaft als Regressionstest
behalten.

## Invarianten

- Nur damalige side-sichere Informationen verwenden.
- PlayerView und LegalActions über die Engine erzeugen.
- TacticalPlan, PlanPortfolio, StrategicIntent und RunnerRunPlan soweit
  kompatibel wiederherstellen.
- Keine spätere Kartenreihenfolge oder Hidden-Info zur Bewertung nutzen.
- Bereits grüne historische Kandidaten dokumentieren, aber nicht fixen.
- Rote Erwartungen nach dem Fix nicht automatisch ändern.
- Keine Kartenname-Sonderregel, wenn eine semantische Ursache genügt.

## Paketfolge

### P0 – Prozess und Serienabgrenzung

- Serie, Worktree, Branch und Red-first-Vertrag dokumentieren.
- Gate: `git diff --check`, eigener Commit.

### P1 – Capture-Kompatibilität für ältere Serien

- Warmup standardmäßig weiterhin strikt halten.
- Für ältere Serien einen expliziten Rebase-Modus bereitstellen, der bei
  aktueller Verhaltensabweichung den Runtime-Speicher verwirft und nur einen
  wieder kompatiblen historischen Entscheidungssuffix persistiert.
- Driftanzahl und kompatible Suffixlänge sichtbar ausgeben.
- Gate: Capture-Unit-/Integritätstests, AI-Typecheck, eigener Commit.

### P2 – Zugweiser Audit und aktuelle Reproduzierbarkeit

- Beide Spiele aus Events, Snapshots und AI-Traces prüfen.
- Begründete Kandidaten als Checkpoints capturen.
- Bereits grüne Fälle und nicht freigabereife Beobachtungen separat
  dokumentieren.
- Gate: Fixture-, Restore-, Redaction- und Legality-Fehler ausgeschlossen.

### P3 – Rote Checkpoints und Gegenproben

- Nur weiterhin falsche Entscheidungen als Zieltests aufnehmen.
- Je Fehler mindestens eine fachliche Gegenprobe ergänzen.
- Zieltests müssen rot, Gegenproben grün sein.
- Red-Evidence vor jedem Verhaltensfix separat committen.

### P4 – Generische Korrekturen

- Ursachen in Planer, Semantic Runtime, Hint/Ontologie oder Engine beheben.
- Dieselben unveränderten Checkpoints und Gegenproben grün machen.
- Angrenzende Regressionen ausführen und separat committen.

### P5 – Abschluss

- Vollständige AI-Suite, Typecheck, relevante AI-Gates, Format und
  Diff-Hygiene ausführen.
- Final Review und Monatslog aktualisieren.
- Branch lokal nach aktuellem `main` integrieren, Main erneut prüfen und
  Worktree sowie gemergten Branch verifiziert entfernen.

## Sicherheitsblocker

Stoppen, wenn ein erwarteter Fix zukünftige Hidden-Info benötigt, keine
korrekte LegalAction existiert, ein Fixture nur durch Abschwächung grün wird
oder `main` nicht ohne Verlust fremder Änderungen integrierbar ist.
