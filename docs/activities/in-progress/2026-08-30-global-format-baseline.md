# Globale Format-Baseline bereinigen

Status: in Arbeit  
Priorität: normal  
Arbeitsbranch: `codex/global-format-baseline-20260830-01`  
Worktree: `C:\Projekte\NETGRID-worktrees\global-format-baseline-20260830-01`

## Quelle und Vorgabe

Der globale Befehl `corepack pnpm format:check` meldete nach dem vollständigen
Test-Reparaturprozess eine historische Format-Baseline. Der Nutzer hat die
sorgfältige direkte Bereinigung im Prozess `paketprozess-worktree-goal`
beauftragt.

## Zielprüfung

Die Vorgabe ist für eine automatische Abarbeitung ausreichend präzise:

- Endzustand: Der globale Prettier-Check ist grün.
- Scope: ausschließlich versionierte Dateien, die Prettier mit der aktuellen
  Repository-Konfiguration als abweichend meldet.
- Reihenfolge: Baseline und Vertrag, Quell-/Konfigurationsdateien,
  Inhalts-/Datendateien, globale Verifikation, Main-Integration und Cleanup.
- Sicherheitsgrenzen: keine fachlichen Änderungen, keine Remote-Integration,
  kein Verwerfen fremder Änderungen.

## Gesamtziel

Die bestehende globale Prettier-Baseline wird vollständig und nachvollziehbar
bereinigt. Alle Änderungen bleiben rein mechanisch und bewahren Programm-,
Regel-, Daten-, Dokumentations- und KI-Architektursemantik. Nach grüner
Verifikation wird der Arbeitsbranch lokal nach `main` integriert und danach
vollständig entfernt.

## Ausgangsstand

- Basis: lokales `main` auf `18fe3da753117e894b8578301cdd620123470394`.
- `corepack pnpm install --frozen-lockfile`: erfolgreich.
- `corepack pnpm format:check`: reproduzierbar rot mit 771 Dateien.
- Alle 771 gemeldeten Dateien sind versioniert.
- Verteilung nach Dateityp:
  - 496 TypeScript-Dateien;
  - 92 TSX-Dateien;
  - 91 Markdown-Dateien;
  - 75 JSON-Dateien;
  - 6 HTML-Dateien;
  - 4 MJS-Dateien;
  - 4 MTS-Dateien;
  - 3 CSS-Dateien.
- 302 Dateien liegen unter `packages/ai`; der verbindliche KI-Preflight wurde
  deshalb vollständig beziehungsweise in den einschlägigen Abschnitten
  gelesen.

## Annahmen

- Prettier 3.8.3 und die eingecheckte Repository-Konfiguration bilden den
  gültigen Formatvertrag.
- Ein von Prettier erfolgreich geparster und geschriebener Code- oder
  Datenbestand ist syntaktisch weiterhin gültig; Typoberflächen werden
  zusätzlich durch den Workspace-Typecheck geprüft.
- Reine Umbrüche in Markdown ändern keine fachliche Aussage. Inhaltliche
  Wort-, Link-, Überschriften- oder Tabellenänderungen sind nicht zulässig.
- Für `packages/ai` existiert keine fachliche Änderungsintention: kein Plan,
  Step, keine Route, Action, Choice, Continuation oder Ownership wird geändert.

## Nicht-Ziele

- Keine Regel-, Engine-, KI-, Server-, UI- oder Kartenfunktionsänderung.
- Keine Refactorings, Umbenennungen oder Importbereinigungen.
- Keine Änderung von Prettier-Regeln, Ignore-Dateien oder Gate-Scope, um den
  Check künstlich zu umgehen.
- Keine Formatierung ignorierter Laufzeitdaten, Caches, Builds, Datenbanken,
  Secrets oder privater Assets.
- Kein Push und keine Remote-Integration.

## Controller-Invarianten

1. Genau ein Paket ist aktiv; kein Paket wird übersprungen.
2. Formatiert werden nur die vom aktuellen Prettier-Vertrag erfassten,
   versionierten Dateien des jeweiligen Pakets.
3. Änderungen bleiben mechanisch; inhaltliche Abweichungen werden
   zurückgestellt und ursächlich analysiert.
4. Engine und KI behalten exakt ihre bestehenden Autoritäts-, Ownership-,
   Hidden-Info-, Determinismus- und LegalAction-Verträge.
5. JSON bleibt parsebar; TypeScript-/TSX-/MJS-/MTS-Dateien bleiben durch
   Prettier parsebar und durch die direkt betroffenen Typchecks abgesichert.
6. Jeder Paketabschluss enthält Checks, `git diff --check` und einen eigenen
   Commit.
7. Der Hauptcheckout wird erst für die finale lokale Integration verwendet.

## Automatische Fehlerbehandlung

- Prettier-Parsefehler: Paket bleibt aktiv; betroffene Datei und Parser werden
  isoliert untersucht. Kein Ignore-Eintrag als Ersatzlösung.
- Typ- oder Strukturfehler: Diff der betroffenen Datei gegen die Basis prüfen,
  unbeabsichtigte semantische Änderung ausschließen und nur die Ursache
  korrigieren.
- Neuere Main-Änderung: `main` defensiv in den Arbeitsbranch integrieren,
  beide Intentionen erhalten und nur direkt berührte Checks wiederholen.
- Formatabweichung nach einem Paket: Paket nicht abschließen, bis dessen Scope
  vollständig grün ist.

## Sicherheitsblocker

Der Prozess stoppt ohne Cleanup, wenn:

- Prettier eine Datei nur durch semantische Änderung formatierbar machen würde;
- fremde offene Änderungen im Zielscope auftauchen;
- ein Konflikt zwei unvereinbare aktuelle Verträge offenlegt;
- der exakte Worktree- oder Branch-Zielpfad nicht mehr eindeutig ist.

Removal Condition ist jeweils eine dokumentierte, geprüfte Auflösung der
Ursache ohne Datenverlust und ohne Abschwächung des Formatvertrags.

## State Machine

`P1_BASELINE -> P2_CODE -> P3_CONTENT -> P4_VERIFY -> P5_INTEGRATE -> COMPLETE`

Bei einem roten Done-Gate verbleibt der Controller im aktuellen Zustand.

## Paketfolge

### P1 – Baseline und Prozessvertrag

- Ziel: Ausgangsstand reproduzieren, Scope klassifizieren und Controllervertrag
  festhalten.
- Eingang: sauberer Hauptcheckout, freier Worktree-Pfad und freier Branch.
- Kernartefakt: diese Activity.
- Checks: Frozen-Lockfile-Installation, read-only Prettier-Baseline,
  `git diff --check`.
- Done-Gate: 771 Dateien reproduzierbar klassifiziert; Prozessartefakt
  formatiert und committed.
- Commit: `docs: define global format baseline process`.

### P2 – Quellcode und Konfiguration

- Ziel: 599 gemeldete `.ts`, `.tsx`, `.mjs`, `.mts` und `.css`-Dateien rein
  mechanisch formatieren.
- Eingang: P1 committed; KI- und Paket-Preflights gelesen.
- Kernartefakte: `apps/`, `packages/`, `scripts/`, `tests/` und betroffene
  Root-Konfiguration.
- Checks: Prettier-Check auf diesen Dateitypen, Workspace-Typecheck,
  relevante Strukturchecks nur bei tatsächlich verändertem Vertrag,
  `git diff --check`.
- Done-Gate: kein Prettier-Fund in diesem Scope; Typecheck grün; kein
  inhaltlicher Diff.
- Commit: `style: format source and configuration baseline`.

### P3 – Dokumentation und strukturierte Daten

- Ziel: 172 gemeldete `.md`, `.json` und `.html`-Dateien rein mechanisch
  formatieren.
- Eingang: P2 committed.
- Kernartefakte: `docs/`, `KI-Wissen-NETGRID/`, `data/`, Readmes und betroffene
  HTML-Evidence.
- Checks: Prettier-Check auf diesen Dateitypen, JSON-Parseprüfung aller
  geänderten JSON-Dateien, Link-/Strukturchecks nur soweit bestehende Befehle
  den geänderten Scope direkt abdecken, `git diff --check`.
- Done-Gate: kein Prettier-Fund in diesem Scope; alle JSON-Dateien parsebar;
  keine inhaltliche Dokumentänderung.
- Commit: `style: format documentation and data baseline`.

### P4 – Globaler Formatvertrag

- Ziel: vollständigen Repository-Formatvertrag und direkt betroffene
  Typoberflächen abschließend prüfen.
- Eingang: P2 und P3 committed.
- Checks: `corepack pnpm format:check`, `corepack pnpm format:changed --
origin/main`, Workspace-Typecheck, `git diff --check` und sauberer Status.
- Done-Gate: alle ausgeführten Gates grün; Ergebnis in dieser Activity
  dokumentiert und committed.
- Commit: `docs: record global format baseline result`.

### P5 – Integration und Cleanup

- Ziel: aktuelles `main` defensiv abgleichen, lokal integrieren und den
  Prozessworktree vollständig entfernen.
- Eingang: P4 committed und Arbeitsworktree sauber.
- Checks: nach Main-Abgleich nur durch neue Main-Änderungen direkt berührte
  Checks; auf finalem `main` `git status --short`, `git diff --check` und
  globaler Formatcheck, falls der Abgleich formatrelevante Dateien berührt.
- Done-Gate: Merge auf lokalem `main` erfolgreich; Worktree-Pfad weder in Git
  noch im Dateisystem vorhanden; Arbeitsbranch gelöscht.
- Commit: nur falls für Konfliktauflösung oder Abschlussdokumentation nötig.

## Verifikationsregeln

- Keine rein erfolgreiche Kommandoausgabe ersetzt die Diffprüfung.
- Paketchecks werden nicht durch einen späteren breiten Check aufgeschoben.
- Ein roter Check wird nach Ursache und nicht durch Ignore-/Fallback-Erweiterung
  behoben.
- Der globale Formatcheck ist das abschließende fachliche Gate dieses
  Prozesses.

## Worktree-, Git- und Integrationsregeln

- Alle Pakete laufen ausschließlich im oben genannten Worktree.
- Nur paketzugehörige Änderungen werden gestaged.
- Jeder abgeschlossene Schritt erhält einen lokalen Commit.
- Aktuelles `main` wird vor dem finalen Merge in den Arbeitsbranch integriert,
  wenn es weitergelaufen ist.
- Der Arbeitsbranch wird bevorzugt per Fast-Forward lokal nach `main`
  integriert.
- Cleanup erfolgt erst nach erfolgreicher Main-Prüfung und wird in Git und im
  Dateisystem doppelt verifiziert.

## Controller-Prompt-Kern

Arbeite P1 bis P5 vollständig und sequenziell ab. Lies zuerst die globalen und
paketlokalen Projektanweisungen sowie dieses Prozessartefakt. Arbeite nur im
festgelegten Worktree und nutze den Hauptworkspace ausschließlich für die
finale lokale Integration. Stelle keine Zwischenfragen, solange konservative
Fortsetzung möglich ist. Prüfe und committe jedes Paket einzeln. Bei einem
Sicherheitsblocker dokumentiere Ursache und Removal Condition. Markiere das
Goal erst nach grüner Main-Prüfung und vollständig verifiziertem Worktree- und
Branch-Cleanup als abgeschlossen.

## Abschlusskriterien

- `corepack pnpm format:check` ist auf dem integrierten Stand grün.
- Alle 771 Ausgangsabweichungen sind durch tatsächliche Formatierung und nicht
  durch Scope-Abschwächung beseitigt.
- Direkt betroffene Typ- und Datenverträge sind grün geprüft.
- Alle Paketcommits liegen auf lokalem `main`.
- Worktree und Arbeitsbranch sind vollständig entfernt und verifiziert.
- Es wurde nichts gepusht.
