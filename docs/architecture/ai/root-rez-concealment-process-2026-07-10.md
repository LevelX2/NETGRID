# Root-Rez-Geheimhaltung während Runner-Runs

## Status

- Status: abgeschlossen
- Datum: 2026-07-10
- Agent: `card-enablement-ai-knowledge-agent`
- Branch: `codex/ai-root-rez-concealment`
- Worktree: `C:\Projekte\NETGRID_AI_ROOT_REZ_CONCEALMENT`
- Integration: lokales `main`

## Quelle und Freigabe

Im aktiven Match `match_0fcb17642297a8a2` rezzte die Corp-KI Vapor Ops im
ersten Rez-Fenster eines Runs auf Remote 1. Die Analyse und die generischen
Maßnahmen wurden dem Nutzer vorgelegt und mit „Ja“ freigegeben.

## Gesamtziel

Die Corp-KI unterscheidet bei Rez-Aktionen die sichtbare Kartenquelle. Ein
ICE-Verteidigungsziel darf nur echtes ICE fördern. Nicht runrelevante
Root-Karten bleiben während eines Runner-Runs verdeckt und werden erst in
einem Fenster gerezzt, in dem ihr sichtbarer Effekt unmittelbar nutzbar ist.

## Invarianten

- Die Rules Engine und ihre `LegalActions` bleiben unverändert autoritativ.
- Die Bewertung verwendet nur den side-safe sichtbaren `PlayerView`.
- Keine Karten-ID- oder Kartennamen-Sonderregel für Vapor Ops.
- Runrelevante Root-Karten dürfen weiterhin im letzten sinnvollen Fenster
  gerezzt werden.
- Echte ICE-Rez-Aktionen behalten ihre Verteidigungsbewertung.
- Fremde Änderungen im Hauptworkspace bleiben unangetastet.

## Nicht-Ziele

- keine Änderung der Engine-Rezfenster oder Aktionsnamen;
- keine allgemeine Neugewichtung der Corp-Ökonomie;
- keine Veränderung von Kartenregeln oder AI-Hints;
- kein Push oder Pull Request.

## Paketfolge

### P0 - Prozess und Match-Evidence

- Prozessartefakt und side-safe Evidence-Report erstellen.
- Checks: `git diff --check`.
- Commit: `docs(ai): record premature root rez evidence`.

### P1 - Quellenbewusste Rez-Bewertung

- Das taktische ICE-Rez-Ziel an eine tatsächliche sichtbare ICE-Quelle
  binden.
- Nicht runrelevante Root-Karten während eines Runner-Runs fail-closed
  vertagen.
- Realistische positive und negative Regressionen ergänzen.
- Checks: fokussierte AI-Tests, AI-Typecheck und `git diff --check`.
- Commit: `fix(ai): preserve hidden root cards during runs`.

### P1.1 - Installierte Quellen durchgängig binden

- Bekannte installierte ICE- und Root-Karten in die side-safe
  Source-Definition-Map aufnehmen.
- Produktivruntime, Strategic Context und Real-Engine-Corpus auf denselben
  Helper umstellen.
- Checks: Source-Binding-Test, Shadow-League-Test, AI-Typecheck und
  `git diff --check`.
- Commit: `fix(ai): bind installed card sources in decision frames`.

### P2 - Abschluss und Integration

- Angrenzende Rez-Timing-Regressionen und AI-Testlauf ausführen.
- Final Review und Wissenslog ergänzen.
- Arbeitsbranch gegen aktuelles `main` prüfen und lokal integrieren.
- Commit: `docs(ai): verify root rez concealment`.

## Verbindlicher Prozesskern

Arbeite P0 bis P2 sequenziell im festgelegten Worktree ab. Schließe jedes
Paket erst nach seinen Checks und einem eigenen Commit. Stoppe bei einer
Engine-, Hidden-Info-, Replay- oder Side-Safety-Regression. Integriere nach
erfolgreicher Verifikation lokal nach `main` und entferne den sauberen
Worktree.

## Abschlusskriterien

- Vapor Ops wird im rekonstruierten Drei-ICE-Remote während des Runs nicht
  vorzeitig gerezzt.
- Die Debug-Evidence benennt die Vertagung nicht runrelevanter Root-Karten.
- Ein echtes ICE erhält weiterhin das ICE-Verteidigungsziel.
- Runrelevanter Zugriffsschutz bleibt im letzten sinnvollen Fenster legal und
  positiv bewertbar.
- Relevante Tests, Typecheck und Diff-Check sind grün.
- Der Branch ist lokal nach `main` integriert.
