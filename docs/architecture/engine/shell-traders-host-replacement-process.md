# Shell Traders: Austausch im vollen Host

Status: H01 aktiv. Auftrag: Nutzerfix vom 2026-09-11.

Ziel: Beim letzten Shell-Counter kann ein zulässiger voller Daemon als
Installationsziel gewählt werden. Eine gebundene Trashwahl schafft Platz in
diesem Host; normale Runner-MU, Kosten und Installations-Lifecycle bleiben korrekt.
Die Vorgabe ist ausreichend präzise; direkte Umsetzung ist beauftragt.

Annahmen: Nur installierte Programme im gewählten Host sind Austauschziele.
Die bestehende Hostregel bleibt Autorität für Kapazität und Karteneignung.
Keine Änderung der KI-Bewertung, regulärer Handinstallation oder Daemon-Verschachtelung.
Kein Serverstart, Push, Replay-Migration oder breiter Workspace-Test.

## Sequenz und Gates

1. H01 Regression: Bezahlte und Startzug-Installation in vollen Afreet mit
   Evil Twin reproduzieren. Betroffen: Originalset-Engine-Tests.
   Gate: neue Tests scheitern ausschließlich am fehlenden Installationsziel.
   Commit: `test(engine): reproduce Shell Traders replacement in full hosts`.
2. H02 Fix: Hostquote mit expliziten geplanten Entfernungen, gebundene
   Host-Speicherwahl und strikte Revalidierung. Tests für falsche/stale Auswahl,
   ungenügende Kapazität, MU, Lifecycle und Replay. Gate: fokussierte Tests,
   Engine-Typecheck und betroffenes Strukturgate grün.
   Commit: `fix(engine): replace hosted programs during delayed installation`.
3. H03 Integration: aktuellen Architekturvertrag aktualisieren, Prozessartefakt
   gemäß Retention entfernen, fokussierte Nachprüfung; defensiver Main-Abgleich,
   lokaler Merge, sauberen Worktree und gemergten Branch entfernen und prüfen.
   Commit: `docs(engine): document delayed install host replacement`.

## Controller

Genau ein Paket aktiv; Gate, diff-check und Paketcommit vor dem nächsten Paket.
Ursachen beheben, keine Fallbacks. Fehler eng untersuchen; Sicherheitsblocker
mit Removal Condition dokumentieren. Keine fremden Änderungen überschreiben.
Revalidierung, side-sichere Fehler und deterministischer Replay bleiben Pflicht.

Worktree: `C:/Projekte/NETGRID_shell_traders_daemon_replace`.
Branch: `codex/shell-traders-daemon-replace`; Integration ausschließlich lokal
nach `main` im primären Checkout. Goal erst nach Integration und geprüftem
Cleanup abschließen. Ergebnisse je Paket hier, dauerhafter Vertrag in
`ability-contract-structure.md`; Git hält die Prozesshistorie.

H01 bestanden: Beide neuen Regressionen scheitern gezielt an der fehlenden
Installationszielwahl (bezahlter Counter und Zugbeginn). H02 als Nächstes.
Keine breiten Gates ausgeführt.
