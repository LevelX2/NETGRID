# AB86 Corp-Replay-Evidence

Match: `match_ab86e817041818b3`

Quelle: `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`

Stand:

- Modus: `human_runner_vs_corp_ai`
- Winner: Runner
- End-StateVersion: 87
- Aktualisiert: 2026-06-29T20:21:36.212Z
- Seed: `match-mqzlorxe-1p1vhba`
- Corp-Deck: `Siren Fortress`
- Runner-Deck: `Stealth Interface Starter`
- Events: 88
- Snapshots: 88
- AI-Decision-Traces: 0

## Operativer Befund

Das Replay zeigt alte oder nicht neu geladene Runtime-Evidence. Beispiel: Bei `sv3` trägt die gewählte HQ-ICE-Installation bereits `corp_board_triage_mismatch:-84` mit `triage_target:new_remote`. Das spricht dafür, dass vorherige AI-Änderungen beim lokalen Spielstand nicht vollständig aktiv waren oder der Server nicht neu gestartet wurde. Für valide Playtests nach diesem Paket muss die lokale Runtime neu gestartet werden.

## Fehlergruppe 1: Spielbares Scorefenster wird zu hart blockiert

Beispiele: `sv35` bis `sv37`

Sichtbarer Zustand:

- HQ enthält `Black Ice Quality Assurance`.
- `Remote 1` hat rezzed `Data Wall`.
- Runner hat keine sichtbar installierte passende ICEbreaker-Coverage, nur sichtbare Ressourcen/Runnerkarten wie `Broker` und `Green Knight`.
- Corp kann den Remote-Pfad bezahlen.

Beobachtung:

- Agenda-Installation in `Remote 1` erhält `corp_install_remote_context:-2200` und `corp_board_triage_mismatch:-4200`.
- Evidence enthält `window_kind:unsafe`, `missing_visible_installed_coverage:true`, `remote_access:no_access_reason:missing_breaker_coverage`, `corp_can_rez_full_path_with_dynamic_reserve:true`.
- Statt Agenda zu installieren, installiert die Corp Support-Roots, zieht oder nimmt Credits.

Erwartung:

- Fehlende sichtbare installierte Coverage darf nicht als Wissen über Runner-Hand/Stack gelesen werden.
- Unter HQ-Agenda-Druck und bezahlbarer relevanter ICE darf dieses Fenster aber als side-safe spielbare Scoreline gelten, solange der Runner sichtbar nicht realistisch vor dem Score accessen kann.

## Fehlergruppe 2: Support-Roots verdrängen Agenda-Evakuierung

Beispiele: `sv35` bis `sv37`

Sichtbarer Zustand:

- Legal ist die Agenda-Installation in eine vorhandene Remote.
- Legal sind auch Root-/Support-Installationen wie `Olivia Salazar` oder `Rio de Janeiro City Grid`.

Beobachtung:

- Die Corp füllt oder stützt den Remote, statt die Agenda aus HQ in das vorhandene Scoring-Fenster zu bringen.

Erwartung:

- Unter konkretem HQ-Agenda-Druck sind non-scoreline Roots im Score-Remote nur passend, wenn sie die konkrete Scoreline schützen, finanzieren oder unmittelbar schließen.

## Fehlergruppe 3: HQ-Agenda-Druck wird durch langsame Aktionen verdrängt

Beispiele: `sv47` bis `sv48`, `sv59` bis `sv62`, `sv70` bis `sv72`

Sichtbarer Zustand:

- HQ enthält wiederholt zwei `Black Ice Quality Assurance`.
- Runner steht bereits bei 3 Agenda-Punkten.
- Runner hatte vorher erfolgreiche HQ-Zugriffe.
- Corp hat 6 bis 16 Credits und legale Agenda-/Remote-/HQ-Schutzoptionen.

Beobachtung:

- Die Corp nimmt wiederholt Basic-Credits und verzögert die Agenda-Evakuierung.
- Am Ende gewinnt der Runner über HQ-Zugriffe.

Erwartung:

- Bei erfülltem Rez-/Credit-Floor dürfen passive Credits/Draws nicht gegen konkrete scoreline- oder HQ-Schutz-Aktionen gewinnen.

## Fehlergruppe 4: Zentral-ICE wird zu wenig nach Zugriffsstopp bewertet

Beispiel: `sv3`

Sichtbarer Zustand:

- HQ ist leer geschützt und enthält Agendas.
- Legal sind mehrere HQ-ICE-Installationen.
- `Ball and Chain` ist tax-/modifier-artig, aber kein echter ETR.
- `Data Wall`/`Quandary` haben direkten Zugriffsstopp.

Beobachtung:

- Die KI bewertet `Ball and Chain` gleichwertig mit echter ETR-ICE.
- Spätere Decline-Rez-Entscheidungen sind plausibel, weil das installierte ICE solo keinen verlässlichen Zugriffsstopp bietet.

Erwartung:

- Für HQ/R&D-Schutz mit Agenda-Druck muss Access-Stop-Qualität vor reiner Tax-/Damage-/Modifier-Wirkung stehen.

## Umsetzungsscope

Freigegeben sind nur generische Runtime-/Testanpassungen in der Corp-KI:

- Board-Triage und Action-Alignment.
- Scoring-Window-Konsum.
- Install-ICE-Schutzwirkungsbewertung.
- Fokussierte Regressionstests.

Nicht freigegeben sind Engine-Regeländerungen, neue LegalActions, Hidden-Info-Annahmen oder Kartensonderlisten.
