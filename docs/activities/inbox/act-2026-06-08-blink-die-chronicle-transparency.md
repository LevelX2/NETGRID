---
activityId: act-2026-06-08-blink-die-chronicle-transparency
status: inbox
kind: fix
area: cards
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-06-08
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Blink-Würfelwurf in der Spielchronik transparent machen

## Ziel

Die Spielchronik zeigt bei jeder Nutzung von `Blink` nachvollziehbar, welcher Würfelwert gefallen ist und welches Ergebnis daraus folgt: bei 4, 5 oder 6 wird die Ziel-Subroutine gebrochen; bei 1, 2 oder 3 erleidet der Runner entsprechend viel Net Damage und die Subroutine gilt nicht als gebrochen.

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-06-08: In einem Human-vs-KI-Spiel nutzte die Runner-KI den Icebreaker `Blink`. Die Chronik zeigte Einträge wie `Die Runner-KI hat mit Blink Subroutine 1 auf Crystal Wall gebrochen`, aber nicht den Würfelwurf und dessen Bedeutung. Dadurch wirkt es so, als hätte die KI immer nur erfolgreiche 4/5/6-Würfe gehabt oder als sei der Fehlschlagszweig unsichtbar.
- Der Nutzer nannte die Karte mündlich `Plink`; Screenshot und Datensatz zeigen `Blink`.
- Kartentext in `data/cards/originalset-v1-cards.json`: `0 credits: Roll a die. On a 4, 5, or 6, break ice subroutine; otherwise, suffer that much Net damage.`
- Engine-Implementierung: `packages/engine/src/card-implementations/onr-v1/runner/programs/blink.ts` und `packages/engine/src/game/engine-runtime-internal/encounter-movement-runtime-hosts.ts`.
- Aktueller Resolver setzt bereits `blinkDieRoll`, `blinkBreakSuccess` und `blinkDamageAmount` auf das `LegalAction`-Payload. Zu prüfen ist, ob diese Felder im `PublicGameEvent` ankommen und von der Web-Chronik ausgewertet werden.
- Der generische Web-Chronikzweig für `break_subroutine` in `apps/web/app/chronicle.ts` beschreibt aktuell Breaks, Kosten, Ziel-ICE und Subroutine, aber keinen Blink-Wurf.

## Scope

- Prüfen, ob `PublicGameEvent.publicPayload` bei einer Blink-Nutzung side-sicher `blinkDieRoll`, `blinkBreakSuccess`, `blinkDamageAmount`, Ziel-ICE und Ziel-Subroutine enthält.
- Falls diese Felder nicht öffentlich ankommen, den Engine-/Event-Payload eng für Blink ergänzen.
- `apps/web/app/chronicle.ts` so anpassen, dass der `break_subroutine`-Chronikeintrag für `Blink` den Würfelwurf und das Ergebnis explizit ausgibt.
- Erfolgsfall formulieren: Wurf 4/5/6 plus Ziel-Subroutine wurde gebrochen.
- Fehlschlagsfall formulieren: Wurf 1/2/3 plus entsprechender Net Damage; die Ziel-Subroutine wurde nicht gebrochen.
- Fokus auf KI- und Human-Nutzung: Der Text muss für `Die Runner-KI`, `Der Runner` und `Du` korrekt bleiben.
- Fokussierte Regressionen für Engine/PublicEvent und Web-Chronik ergänzen.

## Nicht im Scope

- Keine Änderung an den Blink-Regeln, der Würfelwahrscheinlichkeit, `RandomDrawRecords`, StateHash, Replay-Determinismus oder `applyAction`-Validierung.
- Keine Änderung an KI-Prioritäten, Run-Zielwahl oder Encounter-Strategie.
- Keine Änderung an Damage-Prevention- oder Flatline-Regeln.
- Keine Offenlegung der durch Net Damage getrashten privaten Kartenidentitäten in öffentlichen Events, Reconnect-Payloads oder Chronik.
- Keine generelle Überarbeitung aller Würfelkarten; falls beim Fix vergleichbare Chroniklücken auffallen, separate Folge-Activities anlegen.

## Akzeptanzkriterien

- [ ] Bei einem öffentlichen Blink-Erfolgswurf 4, 5 oder 6 enthält die Chronik den Würfelwert und erklärt, dass die Ziel-Subroutine gebrochen wurde.
- [ ] Bei einem öffentlichen Blink-Fehlschlagswurf 1, 2 oder 3 enthält die Chronik den Würfelwert und erklärt den entsprechenden Net Damage, ohne fälschlich zu behaupten, die Subroutine sei gebrochen.
- [ ] Die Chronik zeigt Ziel-ICE und Ziel-Subroutine weiter verständlich an, sofern diese Angaben im PublicPayload vorhanden sind.
- [ ] Die öffentliche Darstellung enthält keine verdeckten Grip-/Heap-Kartenidentitäten aus dem Damage-Zweig.
- [ ] Eine fokussierte Engine-Regression weist nach, dass Blink-PublicEvents die nötigen side-sicheren Ergebnisfelder für Erfolgs- und Fehlschlagszweig tragen oder dass der vorhandene Payload bewusst ausreichend ist.
- [ ] Eine fokussierte Web-Chronik-Regression deckt Erfolgs- und Fehlschlagszweig ab.
- [ ] Passende Typechecks oder fokussierte Tests sind ausgeführt; ausgelassene Checks sind begründet.

## Umsetzungshinweise

- Primärfolgeagent: `card-enablement-ai-knowledge-agent`, weil die Korrektur an der Karten-/Resolver-Payload-Grenze beginnen kann und danach die Chronik sichtbar angepasst wird.
- Im Resolver `resolveBlinkBreakSubroutineAction` auf vorhandene Payload-Felder `blinkDieRoll`, `blinkBreakSuccess` und `blinkDamageAmount` aufsetzen, statt den Wurf aus `RandomDrawRecords` im Web nachzurechnen.
- In `apps/web/app/chronicle.ts` den `break_subroutine`-Zweig vor der generischen Break-Formulierung auf Blink-spezifische Payload-Felder prüfen. Der Fehlschlagszweig darf nicht den generischen `gebrochen`-Titel verwenden.
- Webtest kann direkte `formatChronicleEvent`-Fixtures mit `cardDefinitionId`/`cardTitle: Blink`, `blinkDieRoll`, `blinkBreakSuccess`, `blinkDamageAmount`, `targetIceTitle` und Subroutine-Payload nutzen.
- Engine-Test kann mit deterministischen Seeds beide Zweige erzwingen oder die bestehende Blink-Smoke-Schleife um PublicPayload-Erwartungen erweitern.

## Ergebnisnotiz

Noch offen.
