# Corp Remote Scoreline Triage Evidence 2026-06-30

## Match

- Match: `match_95e375a5711a40ae`
- Speicher: `data/runtime/multiplayer/netgrid.sqlite`
- Status/Modus: `finished`, `human_runner_vs_corp_ai`
- Seed: `match-mqznco83-19ps4hr`
- Ende: `state_version` 324, Runner gewinnt durch `agenda_points`
- Datenumfang: 325 Events, 325 State-Snapshots, 0 Zeilen in `ai_decision_traces`
- Ersatz-Evidence: 124 Corp-`aiDecisionDebug`-Payloads direkt in den Events

## Befund 1: Scoreline wird exponiert und nicht geschlossen

Bei `sv112` installiert die Corp `Project Zurich` in Remote 1 bei 0 Credits. Danach nutzt sie bei `sv113` `Marine Arcology` und gibt bei `sv114` den Zug ab. Der Runner installiert im Folgeturn `Black Dahlia`, nimmt Credits und stiehlt die Agenda bei `sv127/128`.

Der Debug bewertet die Remote-Aktion als `window_kind:durable`, `score_horizon:next_turn`, `runner_can_contest_before_score:false`, `missing_visible_installed_coverage:true`. Die Entscheidung stützt sich damit zu stark auf fehlende sichtbare Coverage, obwohl der Score nicht sofort geschlossen wird und ein volles Runner-Exposure-Fenster entsteht.

## Befund 2: Remote 1 wird nach frühem Erfolg nicht weiter als Scoring-Basis erhalten

Bis `sv104` scored die Corp drei Agendas über Remote 1. Danach bleibt Remote 1 mit zwei rezzed ICE leer. Ab `sv130` dominieren `Marine Arcology`, HQ-ICE und R&D-ICE.

Beispiele:
- `sv130/sv131`: `Marine Arcology` und R&D-ICE gewinnen; Remote-1-ICE liegt nur auf Rängen 16 bis 20 mit `corp_install_remote_context:-1750`.
- `sv188/sv189` bis `sv235/sv236`: wiederholtes HQ-ICE trotz leerer Remote-1-Scorebasis.
- `sv243` bis `sv298`: Agendas und Advancement-Operations liegen in HQ, aber Scoreline-Installationen sind stark negativ bewertet.

## Befund 3: Triage erkennt Remote-Kritik, setzt sie aber zu schwach durch

Späte Entscheidungen enthalten `triage_primary:protect_score_remote`, teils mit `severity:critical` und `target:remote_1`. Trotzdem gewinnen Economy- oder Central-Aktionen.

Beispiele:
- `sv278/sv279`: `Marine Arcology` gewinnt bei `protect_score_remote critical`.
- `sv279/sv280`: R&D-ICE gewinnt trotz `protect_score_remote critical`.
- `sv296/sv297`: `Marine Arcology` gewinnt, Remote-1-Aktionen bleiben neutral oder stark negativ.

Die normalisierte Triage-Penalty `-84` ist gegen lokale Werte wie `corp_activated_burst_economy:1890` oder Central-/Install-Boni zu schwach. Zusätzlich bleiben viele nicht zielgerichtete Aktionen nur `neutral`.

## Befund 4: Central-Schutz war plausibel, aber eindimensional

Der Runner gewinnt am Ende über R&D mit sichtbarer Breaker-Coverage und `R&D Interface`. Central-Schutz war deshalb nicht grundsätzlich falsch. Die Fehlsteuerung liegt darin, dass die Corp ausschließlich weiter Central-ICE stapelt, statt Agendas aus HQ/R&D über eine gepflegte Remote-Scoreline aus der Schusslinie zu nehmen.

## Umsetzungsableitung

- `next_turn`-Scorelines, deren Sicherheit an fehlender sichtbarer Coverage hängt, werden nicht mehr als durable behandelt.
- Remote-ICE auf einer bestehenden Primary-Scoring-Remote bekommt einen begrenzten Erhaltungsbonus, wenn Agenda- oder Scoreline-Druck besteht und keine aktive Scoreline geschützt wird.
- `protect_score_remote` bei high/critical Severity stuft Economy, Draw, Central-ICE und Setup off-target härter als Mismatch ein, sofern sie nicht konkret Funding oder Remote-Schutz bedienen.
- Regressionen decken die drei beobachteten Klassen ab: exponierte Next-Turn-Agenda, Remote-Erhalt nach frühem Score, kritische Remote-Triage gegen Economy/Central.
