# KI-Remediation: Rent-I-Con gegen CODE ROT vom 18.07.2026

Status: abgeschlossen, integriertes Null-Fehler-Gate in Cycle 11 erreicht

## Ergebnis

Die Baseline-Probleme und alle in den anschließenden Fünferzyklen bestätigten
KI-Fehlentscheidungen wurden behoben. Cycle 11 wiederholte dieselben fünf
festgeschriebenen Seeds vollständig und endete mit fünf regulären Partien,
2.052 von 2.052 angewandten Entscheidungen, vollständiger Why-/WhyNot-
Abdeckung und null bestätigten Fehlern.

Die Remediation-Zyklen umfassen insgesamt 55 regulär abgeschlossene Partien.
Der ursprüngliche Baseline-Lauf mit zwei Engine-Abbrüchen bleibt als getrennte
Vorher-Evidence erhalten.

## Unveränderliche Eingaben

- Runner: `Rent-I-Con: Das Shellspiel`, Hash `fnv1a:ed5cbfb6`;
- Corp: `CODE ROT: Bitte eintreten v2`, Hash `fnv1a:65883820`;
- Difficulty: beidseitig `hard`, aktueller Candidate-Controller;
- Agenda-Siegschwelle: 7, Aktionsgrenze: 600;
- Seeds: `ai-renticon-code-rot-20260718-001` bis `-005`.

## Remediation-Zyklen

| Cycle | Entscheidungen | regulär | bestätigter Folgebefund |
|---:|---:|---:|---|
| 1 | 2.163 | 5/5 | Scoreline-, ICE- und Planprioritäten |
| 2 | 2.248 | 5/5 | Plan-Arbitration und aktive Agenda-Fortsetzung |
| 3 | 2.190 | 5/5 | unsichere Board-Triage-Fortsetzung |
| 4 | 2.227 | 5/5 | passive Scoreline-Unterstützung verdrängt Advance |
| 5 | 2.196 | 5/5 | überholte Runner-Kapazitätspläne |
| 6 | 2.072 | 5/5 | No-Need-Suche und nicht finanzierbarer Matchpoint-Schutz |
| 7 | 2.069 | 5/5 | keiner; Null-Fehler-Gate vor Main-Abgleich |
| 8 | 2.091 | 5/5 | negative Remote-Planbindung verdrängt finanzierbares HQ-ICE |
| 9 | 1.971 | 5/5 | keiner; integriertes Null-Fehler-Gate erreicht |
| 10 | 2.162 | 5/5 | letztes Credit-Advance lässt unrezztes Remote-ICE unfundiert |
| 11 | 2.052 | 5/5 | keiner; finales integriertes Null-Fehler-Gate erreicht |

## Cycle-11-Spielergebnisse

| Seed | Sieger / Grund | Aktionen | Züge | Runner–Corp | StateHash |
|---|---|---:|---:|---:|---|
| `-001` | Runner / Corp-Deck leer | 485 | 60 | 5–4 | `fnv1a:01bcfff4` |
| `-002` | Runner / Corp-Deck leer | 444 | 58 | 6–5 | `fnv1a:7571a7e5` |
| `-003` | Corp / Flatline | 298 | 34 | 2–2 | `fnv1a:a789d4cc` |
| `-004` | Corp / Agenda-Punkte | 350 | 48 | 2–8 | `fnv1a:bfb8ce55` |
| `-005` | Runner / Corp-Deck leer | 475 | 62 | 6–6 | `fnv1a:9365f38b` |

Die Ergebnisverteilung ist kein Balanceurteil; das Gate bewertet Regel-
korrektheit und nachvollziehbare Entscheidungen für genau diese Seeds.

## Cycle-11-Integrität

- 2.052 erwartete und 2.052 angewandte Decision-Traces;
- null illegale Aktionen, abgelehnte Versuche, Engine-Abbrüche oder
  Action-Limit-Enden;
- fünf erfolgreiche deterministische Replays, null StateHash-Abweichungen;
- 2.052/2.052 gewählte Alternativen mit `WhyChosen`;
- 12.219/12.219 nicht gewählte Alternativen mit `WhyNot`;
- null fehlende Top-Level- oder Runtime-WhyNot-Abschnitte;
- vollständiger Corpus und Findings redaktionssicher, keine verbotenen Marker.
- Runner- und Corp-Deck-Hint-Consumer jeweils `status=ok`: 26/26 eindeutige
  Karten und 45/45 Karten geprüft, null Blocker und null Warnungen.

## Vollständige Prüfung der heuristischen Hinweise

Cycle 11 erzeugte 58 Detector-Hinweise, aber keinen bestätigten Spielfehler:

- 57 `plan_step_action_mismatch`: In jedem Fall war die gewählte Aktion
  Rang 1, hatte den höchsten zulässigen semantischen Score und wurde über den
  regulären Semantic-Controller gewählt. Der Detector verglich lediglich den
  Aktionstyp mit einem noch sichtbaren Planlabel.
- Ein `repeated_no_progress_run`: Vor dem erneuten Archives-Run änderte sich
  der sichtbare Zustand von 9 auf 1 unbekannte Karte. Das Spiel endete durch
  Corp-Deckout.
- Alle 13 legalen `score_agenda`-Aktionen wurden gewählt. Von 69 nicht
  gewählten `advance_card`-Alternativen hatte nur eine einen höheren Rohscore;
  sie wurde wegen des explizit unsicheren Score-Fensters zugunsten von Funding
  blockiert.

Die 13 Entscheidungen mit negativem gewähltem Rohscore und positiver
Alternative wurden ebenfalls einzeln geprüft: zwei vorbereitende
Remote-Funding-Schritte, sechs sichere Scoreline-Advances, zwei sichere
Abkürzungen bei unvermeidlichem Corp-Deckout, ein Run-Abbruch gegen einen
nach Revalidation unerreichbaren Pfad, eine mehrstufige Handkartenaktion und
ein Funding-Schritt vor einem unsicheren Score-Fenster. Das sind beabsichtigte
Controller-Ausnahmen, keine Fehler.

## Umgesetzte Korrekturen

- verschachtelte PendingChoices halten die Engine-StateVersion synchron;
- vollständige Selfplay-Alternativen werden zentral redigiert und sicher
  persistiert;
- wirkungsloses erstes positionsabhängiges ICE wird hart abgewertet;
- aktive Agenda-, Scoreline-, Board-Triage- und Matchpoint-Prioritäten wurden
  gegen unfundierte oder off-path Installationen abgesichert;
- negative Remote-Scoreline-Bindungen geben an positive, sofort finanzierbare
  zentrale ICE-Platzierungen ab;
- ein unsicheres Advance darf nicht den letzten Credit ausgeben, solange
  unrezztes Remote-ICE danach vollständig unfundiert bleibt;
- Runner-Run-Kosten berücksichtigen eingeschränkte Run-Credits;
- überholte Search-, Draw-, Install-, Credit- und Kapazitätspläne geben an
  positive Alternativen ab;
- der Checkpoint-Capture übernimmt Match-ID, Entscheidungsscope, Hard-
  Difficulty und Deck-Snapshot-ID exakt aus dem Selfplay-Pfad.

Die bestätigten Entscheidungen sind als rote Checkpoints konserviert; alle
Remediation-Checkpoint-Suites laufen grün.

## Abschlussverifikation

- vollständige AI-Suite seriell: 392/392 Testdateien, 2.760/2.760 Tests grün;
- fokussierte ApplyAction-, PendingChoice- und Run-Engine-Suites: 6/6
  Testdateien, 42/42 Tests grün;
- `@netgrid/ai`- und `@netgrid/engine`-Typecheck grün;
- alle 32 Rent-I-Con-/CODE-ROT-Remediation-Checkpoints einschließlich der
  Cycle-10-Gegenproben grün;
- `git diff --check` ohne Befund.

## Führende Evidence

- Cycle-11-Seedmanifest:
  `docs/reviews/ai/ai-renticon-code-rot-five-game-cycle-11-seeds-2026-07-18.json`
- Cycle-11-Entscheidungsledger:
  `docs/reviews/ai/ai-renticon-code-rot-five-game-cycle-11-decision-ledger-2026-07-18.json`
- Cycle-11-Annotationen:
  `docs/reviews/ai/ai-renticon-code-rot-five-game-cycle-11-annotations-2026-07-18.json`
- Baseline-Analyse:
  `docs/reviews/ai/ai-renticon-code-rot-five-game-analysis-2026-07-18.md`
- reproduzierbarer Runner:
  `scripts/run-ai-match-snapshot-selfplay-audit.ts`
