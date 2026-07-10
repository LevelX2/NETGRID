# Root-Rez-Geheimhaltung waehrend Runner-Runs

## Status

- Status: in Arbeit
- Datum: 2026-07-10
- Agent: `card-enablement-ai-knowledge-agent`
- Branch: `codex/ai-root-rez-concealment`
- Worktree: `C:\Projekte\NETGRID_AI_ROOT_REZ_CONCEALMENT`
- Integration: lokales `main`

## Quelle und Freigabe

Im aktiven Match `match_0fcb17642297a8a2` rezzte die Corp-KI Vapor Ops im
ersten Rez-Fenster eines Runs auf Remote 1. Die Analyse und die generischen
Massnahmen wurden dem Nutzer vorgelegt und mit "Ja" freigegeben.

## Gesamtziel

Die Corp-KI unterscheidet bei Rez-Aktionen die sichtbare Kartenquelle. Ein
ICE-Verteidigungsziel darf nur echtes ICE foerdern. Nicht runrelevante
Root-Karten bleiben waehrend eines Runner-Runs verdeckt und werden erst in
einem Fenster gerezzt, in dem ihr sichtbarer Effekt unmittelbar nutzbar ist.

## Invarianten

- Die Rules Engine und ihre `LegalActions` bleiben unveraendert autoritativ.
- Die Bewertung verwendet nur den side-safe sichtbaren `PlayerView`.
- Keine Karten-ID- oder Kartennamen-Sonderregel fuer Vapor Ops.
- Runrelevante Root-Karten duerfen weiterhin im letzten sinnvollen Fenster
  gerezzt werden.
- Echte ICE-Rez-Aktionen behalten ihre Verteidigungsbewertung.
- Fremde Aenderungen im Hauptworkspace bleiben unangetastet.

## Nicht-Ziele

- keine Aenderung der Engine-Rezfenster oder Aktionsnamen;
- keine allgemeine Neugewichtung der Corp-Oekonomie;
- keine Veraenderung von Kartenregeln oder AI-Hints;
- kein Push oder Pull Request.

## Paketfolge

### P0 - Prozess und Match-Evidence

- Prozessartefakt und side-safe Evidence-Report erstellen.
- Checks: `git diff --check`.
- Commit: `docs(ai): record premature root rez evidence`.

### P1 - Quellenbewusste Rez-Bewertung

- Das taktische ICE-Rez-Ziel an eine tatsaechliche sichtbare ICE-Quelle
  binden.
- Nicht runrelevante Root-Karten waehrend eines Runner-Runs fail-closed
  vertagen.
- Realistische positive und negative Regressionen ergaenzen.
- Checks: fokussierte AI-Tests, AI-Typecheck und `git diff --check`.
- Commit: `fix(ai): preserve hidden root cards during runs`.

### P2 - Abschluss und Integration

- Angrenzende Rez-Timing-Regressionen und AI-Testlauf ausfuehren.
- Final Review und Wissenslog ergaenzen.
- Arbeitsbranch gegen aktuelles `main` pruefen und lokal integrieren.
- Commit: `docs(ai): verify root rez concealment`.

## Verbindlicher Prozesskern

Arbeite P0 bis P2 sequenziell im festgelegten Worktree ab. Schliesse jedes
Paket erst nach seinen Checks und einem eigenen Commit. Stoppe bei einer
Engine-, Hidden-Info-, Replay- oder Side-Safety-Regression. Integriere nach
erfolgreicher Verifikation lokal nach `main` und entferne den sauberen
Worktree.

## Abschlusskriterien

- Vapor Ops wird im rekonstruierten Drei-ICE-Remote waehrend des Runs nicht
  vorzeitig gerezzt.
- Die Debug-Evidence benennt die Vertagung nicht runrelevanter Root-Karten.
- Ein echtes ICE erhaelt weiterhin das ICE-Verteidigungsziel.
- Runrelevanter Zugriffsschutz bleibt im letzten sinnvollen Fenster legal und
  positiv bewertbar.
- Relevante Tests, Typecheck und Diff-Check sind gruen.
- Der Branch ist lokal nach `main` integriert.
