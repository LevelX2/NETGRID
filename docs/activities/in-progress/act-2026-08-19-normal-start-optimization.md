# Normalstart-Optimierung

Status: in Arbeit  
Branch: `codex/normal-start-optimization`  
Worktree: `C:\Projekte\NETGRID_NORMAL_START_OPTIMIZATION`

## Gesamtziel

Den normalen lokalen NETGRID-Start beschleunigen, ohne den Startvertrag, die
SQLite-Isolation oder die Guide-Staleness-Erkennung abzuschwächen.

`/Goal Arbeite die Normalstart-Optimierung vollständig und sequenziell in
diesem Worktree ab: blockierende Launcher-Prechecks beseitigen, die
Standarddeck-Guide-Validierung von der Laufzeit-Profilberechnung entkoppeln,
jedes Paket prüfen und committen, anschließend lokal nach main integrieren und
Worktree sowie Branch verifiziert entfernen.`

## Annahmen und Grenzen

- Der Startscript-Startpfad bleibt für den normalen Betrieb verbindlich.
- Der Server- und Webstart bleiben funktional gleich; nur vermeidbare
  Wartezeit vor ihrem Start wird entfernt.
- Guides müssen bei geänderter Deckquelle oder Strategieprofil-Revision weiter
  sichtbar als veraltet gelten.
- Die vollständige Profilberechnung bleibt als explizites Gate erhalten,
  nicht als Startzeit-Arbeit.
- Kein KI-Plan-, Choice- oder Entscheidungsverhalten wird verändert.

## Paketfolge

### START03 – Launcher ohne blockierende Abwesenheits-Prechecks

Ziel: Server und Webclient bei nicht laufenden Standardports ohne die bisherigen
mehrsekündigen HTTP-Timeouts starten.

Done-Gate:

- Startlogik prüft einen bereits laufenden Dienst weiter sicher.
- Ein nicht laufender Dienst verzögert den anschließenden Start nicht durch
  einen bis zu viersekündigen HTTP-Request.
- Fokussierter Script-/Vertragstest oder gleichwertige Prüfung besteht.
- Commit: `perf(start): avoid blocking absent-service prechecks`

### START04 – Standarddeck-Guides per Input-/Revisionshash validieren

Ziel: Die Startzeit-Validierung benötigt keine 47 `buildDeckStrategyProfile`-
Berechnungen; das Gate erkennt fachliche Profiländerungen weiterhin.

Done-Gate:

- Manifest enthält eine deterministische Strategieprofil-Revision oder einen
  gleichwertig sicheren Eingabefingerabdruck.
- Runtime vergleicht Deckquelle und Revision ohne Profilberechnung.
- Ein fokussiertes Gate berechnet die Profile und schlägt bei veraltetem
  Manifest fehl.
- Tests decken aktuelle und veraltete Deck-/Profilstände ab.
- Commit: `perf(server): validate standard deck guides without profiles`

## Fortschritt

- START03 abgeschlossen: Listener-Preflight mit zwei fokussierten Pester-Tests
  und PowerShell-Syntaxprüfung verifiziert.
- START04 abgeschlossen: Runtime prüft Deckquell- und Profil-Eingabehash ohne
  Profilberechnung; das Guide-Gate prüft die vollständige Profilausgabe.
- Bekannte, unabhängige Baselines: `check:ai-deck-doctrine-strategy` scheitert
  auch auf `main` an `Legacy planRole created Runner R&D pressure anchor`;
  `check:standard-deck-guides` meldet 42 bereits auf `main` veraltete Guides.

## Abschluss

Nach beiden Paketen: relevante Checks erneut ausführen, `main` defensiv
einbinden, nach `main` mergen, Main prüfen, diesen Worktree und den Branch
verifiziert entfernen. Das Activity-Artefakt wird nach Übernahme der
dauerhaften Vertragsinformation entfernt.
