# Nightly-Testverträge

Status: P1 abgeschlossen, P2 aktiv. Quelle: Nutzerauftrag vom 2026-09-09;
GitHub-Nightly 34319847225. E2E: Exit 0, 15 erwartungsgemäße Ergebnisse
(14 bestandene Szenarien, 1 bereits bekannter erwarteter Deckpool-Fehler),
Cleanup erfolgreich. Browser zentral auf Firefox und CI-Installation angepasst.
Format- und Diffprüfung grün. Kein voller Workspace-Lauf für diesen Schnitt.

## Ziel und Grenzen

Die belegten Nightly-Fehler ursachenorientiert beheben, stabile Verträge prüfen,
paketweise committen und lokal nach main integrieren. Kein Produktverhalten
abschächen, keine pauschale Baseline-Freigabe, keine fremden Änderungen entfernen.
Remote-Push ist kein automatischer Bestandteil dieses lokalen Prozesses.

## Sequenz

- P1 Browservertrag: Maintenance-Tests vom nebensächlichen Browser-Override
  lösen; Projektkonfiguration bleibt Browserautorität. Ganze E2E-Suite als
  betroffener Nightly-Prüfpfad, inklusive Cleanup, erfolgreich ausführen.
  Commit: `test(e2e): inherit the configured browser for maintenance scenarios`.
- P2 Abstraktionsguard: tatsächlichen Baseline-Diff prüfen, Diagnose und
  Vergleich auf relevante Architekturverletzungen ausrichten. Positive und
  negative Regressionen müssen erlaubte Änderungen und neue Leaks unterscheiden.
  Betroffenes Gate und Selftests grün; keine ungeprüften Leaks freigeben.
  Commit: `fix(checks): enforce semantic card abstraction violations`.
- P3 Integration: bisher durch den Guard verdeckte Nightly-Strukturgates prüfen,
  Erkenntnisse im aktuellen Testvertrag verankern, diff prüfen, lokal nach main
  integrieren; eigenen sauberen Worktree und gemergten Branch geprüft entfernen.

## Controller

/Goal Arbeite P1 bis P3 sequenziell ab. Genau ein Paket ist aktiv. Umsetzung nur
in C:/Projekte/NETGRID_NIGHTLY_TEST_CONTRACTS auf codex/nightly-test-contracts.
Lies Projektanweisungen und relevante Verträge. Fehler eng diagnostizieren,
Sicherheitsblocker sichtbar melden, keine Fallbacks. Hauptcheckout nur zur
abschließenden Integration ändern. Keine fremden Listener oder Datenbanken
verwenden; E2E nur mit isolierten Ports und SQLite-Pfaden. Nach Paketchecks
committen. Aktuelle Erkenntnisse in Architektur übernehmen; dieses temporäre
Prozessartefakt zum Abschluss entfernen. Abschluss erst nach verifiziertem
Main-Merge und eigenem Worktree-/Branch-Cleanup.
