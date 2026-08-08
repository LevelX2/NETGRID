# Match `b763978b57e73191`: Runner-Playtest-Remediation

## /Goal

Die per Maintenance-Analyse-API bestätigten Runner-Entscheidungsfehler dieses
abgeschlossenen Matches werden an ihren bestehenden Ownern behoben: die
optionale, engine-erzeugte Restricted-Run-Fortsetzung und die
side-sichere, zustandsgebundene bekannte-Positions-Erinnerung. Die Rules
Engine bleibt LegalAction-Autorität; `runner.convert_run_window` beziehungsweise
`runner.contest_remote` bleiben Entscheidungsowner.

## Evidence und Zuschnitt

Quelle ist ausschließlich `GET /api/storage/maintenance/analysis/matches/:id`
und dessen Decision-Endpunkt für `match_b763978b57e73191`.

| Paket | Bestätigte Evidence | Owner | Akzeptanz |
| --- | --- | --- | --- |
| Optionaler Bonus-Run | D35 / State 64: All-Nighter-Restricted-Runs, aber keine Decline-LegalAction; Archives erhielt nur `run_if_free` | Engine-Fortsetzungsfenster + `runner.convert_run_window` | generische Decline-Action, nur wertvolle optionale Ziele werden gewählt |
| Bekannter Remote | D44 / State 81 und spätere D79/D86/D107: Ein nicht servergebundener, verdeckter Corp-Discard invalidierte fälschlich die bekannte Position `remote_2/root:0` trotz vorherigem Zugriff auf Shock Treatment | side-sichere bekannte-Positions-Erinnerung + bestehender Remote-Contest | nur HQ-Positionen verlieren bei einem serverlosen Discard ihre Gültigkeit; der bestehende Known-Remote-Payoff sperrt den Run bei nicht finanzierbarem Trash |
| Baskerville / illegale Aktion | D58–D63 respektive State 66 | keine Änderung ohne Gegenbeleg | bestehende Mechanik und Diagnose belegen oder klar abgrenzen |

## Explizite Nicht-Ziele

- keine All-Nighter- oder Shock-Treatment-Sonderheuristik;
- keine neue Auswahl- oder Fallback-Schicht;
- keine zukünftigen Action-IDs, keine Hidden Information und keine
  Legacy-Kompatibilität;
- keine Kartenregeländerung für Baskerville ohne bestätigten Fehler.

## Prüfgates

1. fokussierte Engine-, AI- und API-abgeleitete Checkpointtests;
2. Paket-Typechecks und die einschlägigen Struktur-/Invariant-Checks;
3. `git diff --check` und Kontrolle der produktiven Plan-Ownership;
4. erst dann lokale Integration nach `main`.
