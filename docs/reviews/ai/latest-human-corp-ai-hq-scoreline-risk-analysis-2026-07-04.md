# Human-vs-KI Analyse: HQ Scoreline Risk 2026-07-04

## Match

- Match-ID: `match_cc21ade0f73dd743`
- SQLite: `data/runtime/multiplayer/netgrid.sqlite`
- Modus: `human_runner_vs_corp_ai`
- Status: `finished`
- StateVersion: 148
- Events/Snapshots: 149 Events, 149 Snapshots, 0 separate `ai_decision_traces`
- Trace-Quelle: redigierte `aiDecisionDebug`-Blöcke in Event-Payloads
- Ergebnis: Runner gewinnt 7:2 durch HQ-Zugriffe

## Schlusssequenz

Vor dem letzten Runner-Zug:

- Corp: 12 Credits, 0 Klicks, 2 Agenda-Punkte
- Runner: 5 Credits, 2 Agenda-Punkte, sichtbare Programme `Early Worm`, `Psychic Friend`, `MS-todon` und Resource `Executive File Clerk`
- HQ vor dem Runner-Zug enthielt sicht-/corp-seitig bekannte Agendas: `Tycho Extension`, `Project Babylon`, später auch `Executive Extraction`
- HQ-ICE: `Filter`, rezzed; Runner konnte Code-Gate-Subroutine mit `Psychic Friend` brechen.

Runner-Sequenz:

- `sv129`: `Executive File Clerk: HQ ansehen`
- `sv131-135`: HQ-Run, Zugriff auf `Chester Mix`
- `sv137-142`: HQ-Run, `Project Babylon` stehlen
- `sv143-148`: HQ-Run, `Tycho Extension` stehlen und Spiel gewinnen

## Kritische Korp-Entscheidungen

### 1. HQ-Gefahr bei Agenda-Dichte wird zu schwach

Beispiele:

- `sv109`: HQ enthält `Tycho Extension`, `Project Babylon`, `Falsified-Transactions Expert`, `Chester Mix`; Remote 1 hat zwei ICE. Legal waren Agenda-Installationen nach `Remote 1`, gewählt wurde `gain_credit`.
- `sv123`: HQ enthält `Tycho Extension`, `Project Babylon`, `Falsified-Transactions Expert`, `Chester Mix`, `Night Shift`; gewählt wurde `Night Shift`.
- `sv124-126`: Nach `Night Shift` enthält HQ zusätzlich `Executive Extraction`; gewählt wurden zweimal `gain_credit`.

Bewertung:

Die Runtime behandelt diese Lage nicht als kritische HQ-Agenda-Gefahr, obwohl Runner-Coverage und ein sichtbarer HQ-Viewer vorhanden sind. Passive Aktionen lösen die Gefahr nicht.

### 2. Contestable-Remote-Penalty blockiert relative Agenda-Evakuierung

Legale Alternativen aus Engine-`getLegalActions`:

- `sv109`: `Tycho Extension` oder `Project Babylon` in `Remote 1` installieren.
- `sv110`: gleiche Agenda-Installationen in `Remote 1` bleiben legal.
- `sv123-125`: `Tycho Extension`, `Project Babylon` und später `Executive Extraction` in `Remote 1` installieren.

AI-Score-Evidence:

- Agenda-Installationen wurden mit `corp_contestable_remote_score_penalty:-3000` und `corp_install_remote_context:-2200` stark abgewertet.
- `gain_credit` blieb bei ca. `736`, `draw_card` bei ca. `718`.

Bewertung:

Das Remote ist nicht perfekt sicher, aber die Alternative ist ein agenda-dichtes, erreichbar werdendes HQ. Die Bewertung braucht eine relative Risikoreduktion: Agenda aus HQ in ein vorhandenes Remote kann richtig sein, auch wenn das Remote contestable bleibt.

### 3. Draw-/Burst-Economy verschärft HQ-Risiko

Beispiele:

- `sv123`: `Night Shift` gewinnt gegen Agenda-Installation. Dadurch wird `Executive Extraction` nach HQ gezogen und HQ-Agenda-Dichte steigt.
- `sv108`: `Annual Reviews` zieht `Tycho Extension` und weitere Scoreline-Karten nach HQ; die danach legalen Agenda-Installationen verlieren gegen Credits.

Bewertung:

Draw/Burst-Economy darf in HQ-Notlagen nur gewinnen, wenn dadurch konkrete Schutz-, Score- oder Funding-Aktionen freigeschaltet werden.

### 4. Non-Agenda-Root vor Agenda kostet Score-Tempo

Beispiel:

- `sv60-62`: `Chicago Branch` wird in `Remote 1` installiert, danach `Hostile Takeover`. `Hostile Takeover` war bereits vorher legal in `Remote 1`.

Bewertung:

Non-Agenda-Root in einem vorhandenen Scoring-Remote braucht einen unmittelbaren Payload-Plan. Andernfalls soll die installierbare Agenda Vorrang haben.

## Nicht freigabereif aus diesem Match

- Kein belegtes `end_turn`-Problem mit freien Klicks; die Korp beendete jeweils bei 0 Klicks.
- Der `Corporate Downsizing`-Steal bei `sv58` ist nicht eindeutig als damalige Fehlentscheidung belegbar, da der entscheidende `Rent-I-Con` vorher nicht installiert war.
- Dynamische ICE-Probleme sind hier nicht belegt; relevante ICE waren `Filter`, `Sleeper` und `Data Wall`.

## Akzeptanzkriterien

- Bei agenda-dichtem HQ plus sichtbarer HQ-/Central-Reach verlieren passive Economy/Draw-Aktionen gegen konkrete Agenda-Evakuierung oder Schutz.
- `contestable_remote` bleibt negativ, blockiert aber nicht blind eine relativ bessere Agenda-Evakuierung aus gefährlichem HQ.
- Draw-/Burst-Economy wird bei HQ-Agenda-Gefahr nur bevorzugt, wenn ein Folgeschritt konkret Score, Schutz oder Funding verbessert.
- Non-Agenda-Root in einem Scoring-Remote verliert gegen installierbare Agenda, wenn kein unmittelbarer Schutz-/Advance-/Funding-Payoff vorliegt.
