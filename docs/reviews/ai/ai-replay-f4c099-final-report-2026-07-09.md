# AI-Replay F4C099 Final-Report 2026-07-09

## Ergebnis

Die drei freigegebenen Fehlergruppen aus Match `match_f4c099f8b5edb26d` sind generisch behoben und breit verifiziert. Der vorhandene Fix `16febfa69` wurde geprüft und unverändert gelassen: Er behandelt bereits passierte ICE in einem aktiven Run, nicht den hier gefundenen Pile-Driver-/Cloak-Nebeneffekt über mehrere noch kommende ICE.

## Umgesetzte Anpassungen

1. **Remote-Deadline:** Ein erreichbarer akuter Remote-Score-Threat darf mit nur noch einem Klick nicht mehr durch `gain_credits_first` aus dem letzten Run-Fenster gedrängt werden. Bei mindestens zwei Klicks bleibt vorbereitende Finanzierung möglich.
2. **Mehrfach-ICE-Pfadquote:** Sichtbare zweckgebundene Stealth-Credits werden als Teilmenge der non-noisy Breaker-Credits fortgeschrieben. `postBreakStealthLoss` wird nach jeder Break-Ability-Nutzung auf den restlichen Pfad angewandt. Der konkrete Pfad ist mit 4 bis 6 Cash nicht erreichbar und mit 7 Cash erreichbar.
3. **No-Access-Wiederholung:** `start_run` veröffentlicht den bereits sichtbaren kanonischen `serverId`. Dadurch kann die bestehende Wiederholungslogik identische Runs strukturiert erkennen, ohne auf UI-Labels zurückzufallen.
4. **Side-korrekte Belief-Facts:** Ereignisbasierte Karten-Facts werden gegen die bekannte Kartenseite geprüft. Eigene bekannte Karten werden nicht als `revealed_opponent_card` gespeichert; bekannte gegnerische Karten bleiben erhalten.

Alle Änderungen sind funktionsbezogen. Es gibt keine Karten-ID-Sonderregel für Pile Driver, Cloak, Codecracker, Fire Wall oder Keeper.

## Sicherheits- und Scope-Grenzen

- Keine neue LegalAction und keine Änderung an `applyAction` oder Engine-Regeln.
- Keine verdeckte Karteninformation in AI-Input, PlayerView, PublicEvent, Replay oder Debug.
- Der neue `start_run.serverId` ist die strukturierte Form des bereits öffentlichen Run-Ziels; Golden-Payload- und Redaction-Tests decken den Vertrag ab.
- Keine Änderung an Replay, StateHash, Seed, RandomCounter oder RandomDrawRecords.
- Kein Push und kein Pull Request.

## Verifikation im Arbeitsbranch

- Fokussierte AI-Regressionen für Remote-Deadline und Pfadquote: 28/28 grün.
- Fokussierte Belief-State-Regressionen: 22/22 grün.
- Fokussierter PublicContext-Test: 3/3 grün.
- PublicContext-Golden- und angrenzende Engine-Regressionen: 58/58 grün.
- `corepack pnpm --filter @netgrid/ai typecheck`: grün.
- `corepack pnpm --filter @netgrid/engine typecheck`: grün.
- Vollständiges `@netgrid/ai`-Paket: 299 Testdateien, 2.540 Tests grün.
- Vollständiges `@netgrid/engine`-Paket: 178 Testdateien, 1.595 Tests grün.
- `git diff --check`: grün.

## Integration

Branch `codex/ai-replay-f4c099` ist für den lokalen Fast-forward-Merge nach `main` vorbereitet. Der endgültige Merge- und Main-Verifikationsstatus wird nach Integration in diesem Report nachgetragen.
