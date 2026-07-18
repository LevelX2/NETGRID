# KI-Remediation: Rent-I-Con gegen CODE ROT vom 18.07.2026

Status: abgeschlossen, integriertes Null-Fehler-Gate in Cycle 9 erreicht

## Ergebnis

Die Baseline-Probleme und alle in den anschließenden Fünferzyklen bestätigten
KI-Fehlentscheidungen wurden behoben. Cycle 9 wiederholte dieselben fünf
festgeschriebenen Seeds vollständig und endete mit fünf regulären Partien,
1.971 von 1.971 angewandten Entscheidungen, vollständiger Why-/WhyNot-
Abdeckung und null bestätigten Fehlern.

Die Remediation-Zyklen umfassen insgesamt 45 regulär abgeschlossene Partien.
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

## Cycle-9-Spielergebnisse

| Seed | Sieger / Grund | Aktionen | Züge | Runner–Corp | StateHash |
|---|---|---:|---:|---:|---|
| `-001` | Runner / Corp-Deck leer | 428 | 58 | 3–4 | `fnv1a:3d763290` |
| `-002` | Runner / Agenda-Punkte | 356 | 43 | 8–1 | `fnv1a:c58913f9` |
| `-003` | Runner / Corp-Deck leer | 477 | 64 | 5–0 | `fnv1a:831ec2a1` |
| `-004` | Runner / Corp-Deck leer | 405 | 60 | 2–6 | `fnv1a:66df3f1e` |
| `-005` | Runner / Agenda-Punkte | 305 | 41 | 7–0 | `fnv1a:84e9877a` |

Die Ergebnisverteilung ist kein Balanceurteil; das Gate bewertet Regel-
korrektheit und nachvollziehbare Entscheidungen für genau diese Seeds.

## Cycle-9-Integrität

- 1.971 erwartete und 1.971 angewandte Decision-Traces;
- null illegale Aktionen, abgelehnte Versuche, Engine-Abbrüche oder
  Action-Limit-Enden;
- fünf erfolgreiche deterministische Replays, null StateHash-Abweichungen;
- 1.971/1.971 gewählte Alternativen mit `WhyChosen`;
- 11.519/11.519 nicht gewählte Alternativen mit `WhyNot`;
- null fehlende Top-Level- oder Runtime-WhyNot-Abschnitte;
- vollständiger Corpus und Findings redaktionssicher, keine verbotenen Marker.
- Runner- und Corp-Deck-Hint-Consumer jeweils `status=ok`: 26/26 eindeutige
  Karten und 45/45 Karten geprüft, null Blocker und null Warnungen.

## Vollständige Prüfung der heuristischen Hinweise

Cycle 9 erzeugte 60 Detector-Hinweise, aber keinen bestätigten Spielfehler:

- 57 `plan_step_action_mismatch`: In jedem Fall war die gewählte Aktion
  Rang 1, hatte den höchsten zulässigen semantischen Score und wurde über den
  regulären Semantic-Controller gewählt. Der Detector verglich lediglich den
  Aktionstyp mit einem noch sichtbaren Planlabel.
- Zwei `repeated_no_progress_run`: Vor den erneuten Archives-Runs änderte sich
  der sichtbare Zustand von 8 auf 1 beziehungsweise 7 auf 1 unbekannte Karten.
  Beide Spiele endeten durch Corp-Deckout.
- Ein `corp_never_scores_long_game`: Im gesamten Spiel existierte keine
  legale `score_agenda`-Aktion. Keine der 28 nicht gewählten zulässigen
  `advance_card`-Alternativen übertraf den Score der gewählten Aktion.

Die sechs Entscheidungen mit negativem gewähltem Rohscore und positiver
Alternative wurden ebenfalls einzeln geprüft: drei sichere Abkürzungen bei
unvermeidlichem Corp-Deckout, zwei Survival-Defense-Warteaktionen unmittelbar
vor dem Deckout sowie eine kostenlose Schutzinstallation gegenüber einer
nicht finanzierbaren ICE-Alternative. Das sind beabsichtigte Controller-
Ausnahmen, keine Fehler.

## Umgesetzte Korrekturen

- verschachtelte PendingChoices halten die Engine-StateVersion synchron;
- vollständige Selfplay-Alternativen werden zentral redigiert und sicher
  persistiert;
- wirkungsloses erstes positionsabhängiges ICE wird hart abgewertet;
- aktive Agenda-, Scoreline-, Board-Triage- und Matchpoint-Prioritäten wurden
  gegen unfundierte oder off-path Installationen abgesichert;
- negative Remote-Scoreline-Bindungen geben an positive, sofort finanzierbare
  zentrale ICE-Platzierungen ab;
- Runner-Run-Kosten berücksichtigen eingeschränkte Run-Credits;
- überholte Search-, Draw-, Install-, Credit- und Kapazitätspläne geben an
  positive Alternativen ab;
- der Checkpoint-Capture übernimmt Match-ID, Entscheidungsscope, Hard-
  Difficulty und Deck-Snapshot-ID exakt aus dem Selfplay-Pfad.

Die bestätigten Entscheidungen sind als rote Checkpoints konserviert; alle
Remediation-Checkpoint-Suites laufen grün.

## Führende Evidence

- Cycle-9-Seedmanifest:
  `docs/reviews/ai/ai-renticon-code-rot-five-game-cycle-9-seeds-2026-07-18.json`
- Cycle-9-Entscheidungsledger:
  `docs/reviews/ai/ai-renticon-code-rot-five-game-cycle-9-decision-ledger-2026-07-18.json`
- Cycle-9-Annotationen:
  `docs/reviews/ai/ai-renticon-code-rot-five-game-cycle-9-annotations-2026-07-18.json`
- Baseline-Analyse:
  `docs/reviews/ai/ai-renticon-code-rot-five-game-analysis-2026-07-18.md`
- reproduzierbarer Runner:
  `scripts/run-ai-match-snapshot-selfplay-audit.ts`
