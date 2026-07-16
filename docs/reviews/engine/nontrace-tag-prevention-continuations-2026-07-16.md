# Nicht-Trace-Tag-Prevention-Continuations 2026-07-16

## Ergebnis

Alle produktiven, vermeidbaren Nicht-Trace-Tags laufen jetzt über das
LegalAction-gebundene Add-Tag-ImminentEvent-/Avoid-Tag-Modell. Öffnet die
Engine ein `Tag vermeiden`-Fenster, hält der auslösende Ablauf an und wird erst
nach Avoid oder Pass am nächsten fachlichen Schritt fortgesetzt.

Der neutrale `pendingAddTagContinuation`-Vertrag deckt Access-Effekte,
CardImplementation-On-Play-Effekte, City-Surveillance-Ziehsequenzen,
Corp- und Runner-Start, Successful-Run-Ersatz, Run-Ende, Zugende sowie
terminale Tagkosten ab. Er wird nicht in PlayerViews projiziert.

## Reihenfolge und Einmaligkeit

- Access-Ambushes führen frühere Schritte aus, pausieren am Tag und setzen
  Damage oder weitere Schritte genau einmal fort.
- Netwatch Credit Voucher gibt beziehungsweise vermeidet zuerst den Tag und
  vergibt den Credit erst nach Abschluss des Fensters.
- City Surveillance zieht die Karte und hält die Draw-Sequenz am gewählten Tag
  an; weitere Quellen und Draws folgen erst danach.
- Satellite Monitors würfelt nur einmal. Data-Raven-Counter werden beim
  Runner-Start nicht erneut ausgewertet.
- Edited Shipping Manifests zieht zuerst den Korp-Credit ab; die zehn
  Runner-Credits folgen erst nach der Tagentscheidung.
- Live News Feed fügt Bad Publicity und den übrigen Run-End-Abschluss erst nach
  der Tagentscheidung hinzu.
- Omniscience Foundation schließt temporäre Effekte, Turn-Flags und
  Discard-Übergang erst nach der Tagentscheidung ab.
- Remote Detonator und MS-todon wenden ihre vorhergehenden Kosten beziehungsweise
  Trash-Effekte einmal an und benötigen danach nur eine terminale Fortsetzung.

## Direkte Tag-Schreibstellen

Der generische `EffectCommand` `add_tag` wurde entfernt, weil er ohne
LegalAction kein regelkonformes Avoid-Fenster öffnen konnte. Produktiv bleiben
genau zwei direkte Erhöhungen von `runner.tags`, beide in `damage-core.ts`:

1. `resolveAddTagImminentEvent` als finale Anwendung eines entschiedenen
   Add-Tag-ImminentEvents.
2. Der finale Replacement-Resolver, wenn ein bereits entschiedenes
   Replacement-Event das Originalevent durch Tags ersetzt.

Das Boundary-Gate `direct-tag-write-boundary.test.ts` schlägt bei jeder neuen
unklassifizierten produktiven `runner.tags +=`-Stelle fehl.

## Avoid-Tag-Quellen

Ein parametrisierter Nicht-Trace-Access-Test führt alle sieben öffentlichen
Quellen durch denselben Continuation-Pfad und prüft Kosten sowie Source-Drift:

| Quelle | Kostenvertrag |
| --- | --- |
| Nasuko Cycle | 3 Credits |
| Fall Guy | Source trashen |
| Leland, Corporate Bodyguard | Source trashen |
| Nomad Allies | Source trashen |
| Wilson, Weeflerunner Apprentice | Source trashen |
| Expendable Family Member | 1 Credit und Source trashen |
| Vintage Camaro | 1 Credit und nächste Action aufgeben |

Wrong-side und stale Choices bleiben durch den gemeinsamen LegalAction-Vertrag
abgewiesen. Source und Kosten werden bei Choice-Auflösung erneut geprüft.

## Regressionen

Avoid- und Pass-Zweige sind für Access, CardEffect, Draw/Lifecycle,
Corp-/Runner-Start, Successful Run, Run-Ende, Zugende und terminale Effekte
Replay- und StateHash-stabil. Corp-PlayerViews erhalten keine Runner-Choice;
der interne Continuation-State erscheint in keiner PlayerView. Automatische
Tag-Vermeidung ohne Choice meldet in Payloads und `ResolvedEffects` die
tatsächlich hinzugefügte Menge statt der angeforderten Menge.
