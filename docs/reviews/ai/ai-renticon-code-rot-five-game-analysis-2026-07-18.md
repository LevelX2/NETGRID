# KI-Spielanalyse: Rent-I-Con gegen CODE ROT vom 18.07.2026

Status: Analyse abgeschlossen, Umsetzung nicht freigegeben

## Kurzurteil

Von fünf deterministischen Hard-vs-Hard-Läufen endeten drei regulär, alle
drei mit Runner-Sieg. Zwei weitere Läufe besitzen keinen verwertbaren Sieger,
weil die Engine bei einer verschachtelten Choice im Run mit demselben
`PendingChoice`-StateVersion-Invariant abbrach. Deshalb ist ein Verhältnis
von „3:2“ fachlich falsch; belastbar sind drei Runner-Siege und zwei
Engine-Abbrüche.

Die vollständige Prüfung von 1.629 Entscheidungsversuchen ergab drei
deduplizierte Corp-Spielfehler. Für die Runner-KI wurde in diesem Korpus kein
eindeutiger, durch eine bessere LegalAction belegter Fehler bestätigt.

## Decks, Konfiguration und reproduzierbare Seeds

- Runner: `Rent-I-Con: Das Shellspiel`, Snapshot
  `local_runner_rent_i_con_shellspiel_2026_07_17_snapshot_v0_6`, Hash
  `fnv1a:ed5cbfb6`;
- Corp: `CODE ROT: Bitte eintreten v2`, Snapshot
  `local_corp_code_rot_bitte_eintreten_2026_07_16_snapshot_v0_6`, Hash
  `fnv1a:65883820`;
- beide Seiten: Difficulty `hard`, aktueller Candidate-Controller;
- Agenda-Siegschwelle: 7, Aktionsgrenze: 600;
- Replay-Prüfung: 5/5 erfolgreich, keine StateHash-Abweichung.

Die fünf festgeschriebenen Seeds sind:

1. `ai-renticon-code-rot-20260718-001`
2. `ai-renticon-code-rot-20260718-002`
3. `ai-renticon-code-rot-20260718-003`
4. `ai-renticon-code-rot-20260718-004`
5. `ai-renticon-code-rot-20260718-005`

Das Seed-Manifest enthält außerdem den vollständigen Wiederholungsbefehl.

## Ergebnisse der fünf Spiele

| Spiel | Ergebnis | Züge | angewandte Entscheidungen | Endstand Runner–Corp | StateHash |
|---:|---|---:|---:|---:|---|
| 1 | Engine-Abbruch bei `stateVersion 246` | 35 | 246 | 0–2 | `fnv1a:02951d0f` |
| 2 | Runner-Sieg, Corp-Deck leer | 54 | 398 | 5–1 | `fnv1a:d144b78a` |
| 3 | Runner-Sieg, Corp-Deck leer | 64 | 474 | 5–0 | `fnv1a:f9b6771d` |
| 4 | Runner-Sieg über Agenda-Punkte | 39 | 316 | 7–0 | `fnv1a:ef2babd3` |
| 5 | Engine-Abbruch bei `stateVersion 193` | 25 | 193 | 4–1 | `fnv1a:e1acfd24` |

## Vollständigkeit und Evidence-Gates

- Nenner: 1.629 Entscheidungsversuche;
- 1.627 angewandte Entscheidungen besitzen vollständige Decision-Traces;
- zwei abgelehnte Versuche sind ausdrücklich als
  `non_ready_engine_rejection` erfasst;
- 584 Entscheidungen waren erzwungene oder reaktive LegalActions;
- 1.043 waren kompetitive Entscheidungen; 1.035 davon zeigen keine
  belastbare Gegen-Evidence, acht sind bestätigte Fehlentscheidungen als
  Anker der drei deduplizierten Fehlerbilder;
- alle 1.627 gewählten Alternativen besitzen `WhyChosen`;
- alle 9.178 nicht gewählten Alternativen besitzen `WhyNot`;
- keine Fallbacks und keine Timeouts;
- Parent-/Child-Fenster sind über Timingpunkt und Fenstertyp im Ledger
  erfasst, einschließlich Choice- und Run-Fenstern.

## Bestätigte Spielfehler und bessere LegalActions

### Punkt 1 – Positionsabhängiges ICE wird wirkungslos als erste Schicht gelegt

Belege: Spiel 2 bei `stateVersion 5` und Spiel 4 bei `stateVersion 17`.
Die eigenen Placement-Diagnosen melden jeweils `first_ice:true`,
`position_dependent:true`, `wants_outer:true` und `dead_as_first_ice:true`.
Im zweiten Fall meldet dieselbe Diagnose zusätzlich
`recommendation:prefer_economy`, weil nach der Installation die Rez-Reserve
nicht reicht. Trotzdem gewinnt die Punish-Plan-Bindung.

Bessere LegalAction: `gain_credit`; danach zuerst ein inneres ICE mit
unmittelbarer Stop-/Tax-Wirkung installieren und das positionsabhängige ICE
erst als äußere Schicht ergänzen. In Spiel 4 war `gain_credit` direkt die
zweitplatzierte legale Alternative.

### Punkt 2 – Das Scoring-Remote gerät in eine Funding-/Überbau-Schleife

Belege: besonders Spiel 3, in dem eine Agenda ab Zug 11 im Remote lag, die
Corp aber bis zum Deckende bei 0 Punkten blieb. Nach einem einzelnen Advance
wählte die KI bei `stateVersion 208` und `219` weitere Remote-ICE statt die
Scoreline zu konvertieren. Die benötigte volle Rez-Reserve stieg dadurch
erneut; `advance_card` wurde wieder massiv abgewertet. Spiel 4 bestätigt das
Muster bei `stateVersion 55`, `65` und `247`: `gain_credit` verdrängt jeweils
die legale, bereits zweitplatzierte Fortsetzung `advance_card`, und beide
Scoreversuche werden nicht rechtzeitig abgeschlossen.

Bessere LegalAction: Sobald das vorhandene Remote nach eigener
Reachability-Bewertung ausreichend geschützt ist, `advance_card` wählen und
in den Folgeaktionen die Advancement-/Score-Sequenz abschließen. Neue
Remote-ICE dürfen die für diese Sequenz reservierten Credits nicht erhöhen
oder den Scoring-Plan zurücksetzen.

### Punkt 3 – Am Matchpoint überschreibt der Remote-Plan den besseren Zentralschutz

Beleg: Spiel 4 bei `stateVersion 295`. Die Runner-Seite steht bei sechs
Agenda-Punkten. Die Corp-KI verstärkt mit ihrer letzten Aktion das bereits
stark geschützte Remote. Eine Installation desselben ICE vor HQ hat mit
3.019 den höheren semantischen Rohscore als die gewählte Remote-Aktion mit
2.669 und erhält zusätzlich den eigenen Matchpoint-HQ-Schutzbonus. Nur der
aktive `corp.create_score_window`-Plan dreht die Auswahl zugunsten des
Remotes. Kurz darauf gewinnt der Runner über einen Zentralzugriff.

Bessere LegalAction: ICE vor HQ installieren, wie es die eigene
Matchpoint-/Expositionseinschätzung verlangt; im Folgefenster den Zug
beenden und den Remote-Ausbau erst nach überstandener Zentralgefahr
fortsetzen.

## Nicht als Spielfehler gewertete Auffälligkeiten

- 48 Detector-Treffer `plan_step_action_mismatch` sind überwiegend veraltete
  Planlabels: Der Runner zieht, nimmt Credits oder installiert, während ein
  Run-Plan sichtbar bleibt, dessen konkrete Run-Aktionen wegen Kosten,
  Breaker-Abdeckung oder Zielwert legal, aber fachlich ausgeschlossen sind.
  Daraus folgt keine bessere LegalAction.
- Eine Runner-Diagnose behauptet vor dem spielentscheidenden R&D-Run eine
  übersprungene Economy-Stufe. Der Run ist laut derselben Evidence bezahlbar,
  gelingt und gewinnt das Spiel. Das ist ein Diagnose-Fehlalarm, kein
  Spielfehler.
- Beide vollständigen Deck-Hint-/Consumer-Audits enden mit `status=ok`:
  jeweils 26/26 eindeutige Karten und 45/45 Karten geprüft, null Blocker und
  null Warnungen. Die primären Runner-Strategien sind Search/Breaker,
  Run-Event-Tempo und R&D-Druck; die primären Corp-Strategien sind
  Damage-Kill, Remote-Scoring und Tag-/Trace-Punish.

## Nicht freigabefähige technische Befunde

### Engine-Invariant in verschachtelten Run-Choices

Die Seeds 001 und 005 brechen reproduzierbar bei einer Runner-Choice im
Timingpunkt `run.encounter_ice` ab. Nach einer vorausgehenden Choice stimmt
`PendingChoice.stateVersion` nicht mehr mit `GameState.stateVersion`
überein. Die bis dahin angewandten Aktionen sind replay-stabil; der jeweils
nächste Versuch wird von `applyAction` korrekt abgelehnt. Diese beiden Spiele
dürfen erst nach einem Engine-Fix als vollständige Partien gewertet werden.

### Redaction-Vertrag für detaillierte Alternativtraces

Die internen Action-Alternativen enthielten rohe, potenziell verdeckte
Karteninstanz-IDs. Dadurch meldete der allgemeine Detector pro Spiel einen
Hidden-Info-Treffer, obwohl das frühere Export-Gate nur die aggregierten
Findings kontrollierte. Der Audit-Writer persistiert deshalb jetzt keine
Detailalternativen mehr und prüft den gesamten Export. Für das produktive
Tracing bleibt als Remediation ein zentraler Sanitizer plus Regressionstest
für den vollständigen Payload nötig. Der ursprüngliche Rohkorpus wird nicht
versioniert.

## Geplante Anpassungsmaßnahmen nach Freigabe

1. ICE-Placement: `dead_as_first_ice` und unzureichende Rez-Reserve als
   hartes Ausschlusskriterium für positionsabhängige äußere ICE behandeln;
   rote Checkpoints für die beiden Seeds ergänzen.
2. Scoring: eine begonnene, ausreichend geschützte Scoreline mit reservierter
   Advancement-Finanzierung fortführen; Remote-Überbau und wechselnde
   Full-Path-Rez-Schwellen deckeln; Checkpoints aus Spiel 3 und 4 ergänzen.
3. Matchpoint-Triage: kritischen Zentralschutz gegenüber einem vorhandenen
   Remote-Plan bindend priorisieren; Rohscore-vs.-Plan-Override als
   Regression absichern.
4. Engine: StateVersion bei verschachtelten Corp-/Runner-Choices atomar auf
   die neu erzeugte PendingChoice übertragen; beide Abbruch-Seeds bis zum
   regulären Ende replay- und StateHash-stabil testen.
5. Trace-Sicherheit: Action-Alternativen zentral redigieren und den gesamten
   exportierten Corpus mit dem Hidden-Info-Detektor blockierend prüfen.

## Führende Artefakte

- Seed- und Ergebnismanifest:
  `docs/reviews/ai/ai-renticon-code-rot-five-game-seeds-2026-07-18.json`
- vollständiges Entscheidungsledger:
  `docs/reviews/ai/ai-renticon-code-rot-five-game-decision-ledger-2026-07-18.json`
- manuelle Befundanker:
  `docs/reviews/ai/ai-renticon-code-rot-five-game-annotations-2026-07-18.json`
- reproduzierbarer Runner:
  `scripts/run-ai-match-snapshot-selfplay-audit.ts`
