# AI Rush Scoring Window und Deck Final-Report 2026-06-29

## Anlass

Im Match `match_41020769c9f35150` verlor die Corp-KI mit `KI Rush Score - Static ICE Mix` 0:7. Die Replay-Analyse bestätigte wiederkehrende Rush-Probleme: verzögerte Agenda-Scorelines wurden zu leichtfertig exponiert, Single-ICE-Remotes wurden bei reichem Runner überschätzt, Archives wurde nach ausreichendem Schutz weiter überbaut und das Deck passte nicht gut genug zur aktuellen Runtime.

## Umgesetzte KI-Anpassungen

### Delayed Scoreline Exposure

Die Scoring-Window-Bewertung markiert nicht-immediate Agenda-Install-/Advance-Linien nun als `unsafe`, wenn ein Runner-Exposure-Window entsteht und die Sicherheit nur auf schwacher Temporary-Safe-Evidence beruht. Hohe sichtbare Runner-Credits, volle Zugriffslage, fehlende robuste ICE-Kette, fehlender Rez-Floor oder dynamic-ICE-Scheinsicherheit verschieben die Empfehlung dann zu Remote-Härtung statt Agenda-Exposition.

True-Immediate-Fenster bleiben ausdrücklich spielbar: Wenn die Corp die Agenda über legale Aktionen vor der nächsten Runner-Zugriffschance schließen kann, wird auch eine ungeschützte Remote nicht pauschal bestraft.

### Advancement-Burst-Fenster

Agenda-Install-Actions erkennen jetzt side-safe sichtbare eigene HQ-Operationen, die im selben Corp-Zug Advancement-Counter legen können. Diese Operationen fließen nur aus eigener sichtbarer Hand, LegalActions, eigenen Credits/Klicks und öffentlichen Kartendaten ein. Verdeckte Runner-Informationen oder gegnerseitige Annahmen werden nicht genutzt.

Damit kann die Corp Karten wie `Project Consultants` als in-turn Closeout-Hilfe nutzen, statt jede 3-Advance-Agenda als mehrzügige Exposition zu behandeln.

### Remote-ICE-Bonus begrenzt

Remote-ICE bleibt priorisiert, wenn es eine konkrete Scoring-Remote verbessert: ein zweites bezahlbares, relevantes ICE kann eine temporär sichere Remote zu einer durable Remote aufwerten. Generischer Remote-ICE-Spam bleibt gekappt, sobald bereits eine brauchbare Scoring-Remote existiert und keine konkrete Schwachstelle behoben wird.

### Archives-Abwägung

Archives-ICE bekommt nur noch starken Wert bei konkretem Archives-Risiko: sichtbare Agenda in Archives oder tatsächlicher Archives-Druck. Bei bereits mehrfach geschütztem Archives und gleichzeitigem HQ-/R&D- oder HQ-Agenda-Druck wird weiteres Archives-ICE abgewertet.

### Economy statt Draw bei unsicherer Scoreline

Eine Nachziehkorrektur verhindert, dass `gain_credit` als Reserve-Loop bestraft wird, wenn die einzige konkrete Entwicklungslinie gerade eine unsichere Remote-Scoreline ist. In diesen Fällen bleibt Geldnehmen als sichere Alternative gegenüber blindem Draw erhalten.

## Tests und Gates

Grün:

- `corepack pnpm --filter @netgrid/ai exec vitest run src/semantic-ai-runtime-cutover.test.ts src/runtime/semantic-runtime-corp-score.test.ts src/runtime/semantic-runtime-corp-scoring-window.test.ts src/runtime/semantic-runtime-corp-remote-score.test.ts src/runtime/semantic-runtime-corp-passive-scoreline.test.ts`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

Breiter Lauf:

- `corepack pnpm --filter @netgrid/ai test` bleibt rot mit 12 Failures in separaten Bereichen:
  - `src/index.test.ts`: Runner-BBS-/R&D-/HQ-/Archives-Belief- und Repeat-Run-Fälle.
  - `src/decision/module-boundaries.test.ts`: bekannte `decision`-zu-`runtime/role-match`-Importgrenzen.
  - `src/evaluation/semantic-shadow-league.test.ts`: Shadow-League-Metrikdrift.

Die im vorigen breiten Lauf neu sichtbaren zwei Corp-Cutover-Failures zu nackten Remote-Scorelines sind durch den Nachzieh-Fix behoben und im fokussierten Cutover-Test grün.

## Lokales Deck

Neues Benutzerdeck:

- Name: `KI Rush Score Window v2`
- Datei: `C:\Users\Lui\AppData\Roaming\NetGrid\Decks\local_corp_ki_rush_score_window_v2_2026_06_29.json`
- Status: `validationStatus: valid`

Deckidee:

- 7 schnelle 3-Advance-Agendas.
- 19 bezahlbare, statische ETR-ICE ohne dynamische Proteus-Abhängigkeit.
- 17 Economy-/Draw-/Install-/Advancement-Operationen.
- 2 `Red Herrings` als zusätzlicher Steal-Kostenhebel für die Scoring-Remote.

Das Deck ist bewusst kein Spezialcombo-Deck. Es soll der aktuellen Corp-KI einfache Rush-Fenster geben: frühe Remote mit bezahlbarer ETR-Sicherung, Kreditbasis halten, Scorelines nur bei immediate oder robust verteidigtem Window ausspielen.

## Restgrenzen

Diese Änderungen verbessern die wiederholt beobachteten Scoreline- und ICE-Priorisierungsfehler, lösen aber nicht alle Spielstärkeprobleme. Die KI bleibt weiterhin abhängig davon, wie gut LegalActions und CardSemanticProfiles die Kartenintention abbilden. Besonders Karten mit variabler Wirkung, dynamischer Stärke oder situationsabhängiger Rez-Relevanz sollten in weiteren Replays gezielt beobachtet werden.

Nicht bearbeitet wurden die Runner-Belief-/Repeat-Run-Failures, die Modulgrenzen-Failures und die Shadow-League-Benchmarkdrift aus dem breiten AI-Testlauf.
