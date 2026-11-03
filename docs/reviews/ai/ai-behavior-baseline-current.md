# AI Behavior Baseline – aktueller Messstand

Stand: 2026-11-03
Status: **diagnostisch rot; keine akzeptierte aktuelle Vergleichsreferenz**

Die Metaserie ergänzt ihre zufälligen 40er-Paarungen um das unveränderte feste
Vergleichspanel vor und nach der Serie. Zufallsserien dienen der Fehlersuche;
ein Qualitätsdelta benötigt denselben Messvertrag und vergleichbare
Abschlusshorizonte. Ein roter Lauf wird nicht durch seine bloße Speicherung zur
Referenz. Frühere historische grüne Stände sind nach den breiten Änderungen an
Engine, Karten und KI keine aktuelle Vergleichsbasis.

## Reproduzierbarer Prüfvertrag

- sechs Standard-Slots des nativen Baseline-Runners;
- zehn feste Seeds je Slot: `ai-behavior-baseline-v1-01` bis `-10`;
- höchstens 480 Aktionen je Partie; beide Seiten `current_candidate`;
- Ausgangsstand: sauberer Commit `f5374e043668878e00876d526a78149c83266c9e`;
- zwei Worker; vollständiger Git-Tree-/Clean-Fingerprint separat gesichert.

Die aktuelle Ausgangsmessung liegt lokal unter
`data/local/meta-ten-20261103/benchmark/before.json`,
`before.md` und `before-raw.json.gz`. Ihr Quellfingerprint steht in
`before-source-fingerprint.json`, die Diagnose in `before-diagnosis.json`.
Diese Laufartefakte werden nicht versioniert.

## Aktuelles Gate

60 Spiele, 14.273 Entscheidungen. Zwei Spiele brechen mit
`window_origin_missing` ab, drei erreichen das Aktionslimit. Die zwei
Illegal-Action-Marker und zwei Runtimefehler bezeichnen dieselben beiden
Abbrüche und dürfen nicht als vier verschiedene defekte Spiele gezählt werden.
Replayfehler, Fallbacks, Timeouts und Hidden-Info-Findings sind null; die
redigierten Traces bestehen die Redaction-Prüfung.

Beide Abbrüche betreffen `strategy_panel_net_damage_black_ice`, Seeds
`ai-behavior-baseline-v1-05` und `-07`, bei StateVersion 97 und 60.
Fragmentation Storm beendet nach erfolgreicher Trace regelgemäß zuerst den Run.
Die noch aktuelle öffentliche Trace-Fortsetzung fordert danach die Programmauswahl.
Der Defense-Consumer verlangt dafür fälschlich weiter einen aktiven Run. Der
ursprüngliche Test zur Trace-Fortsetzung injiziert einen noch aktiven Run und
belegt diesen echten Enginezustand daher nicht. Die native Diagnose reproduziert
beide Abbrüche. Der Ursachenpatch SP-737 unterscheidet nun die Encounter-Run-ID
von der Trace-ID und bindet die fortbestehende Pflichtwahl an den Defense-Owner.
Die zwei unveränderten nativen Zustände, deterministische Engine-Folgen und
Fehlbindungsgegenproben sind fokussiert geprüft (34 Tests). Vollständige
Originalseedkontrollen und der spätere gesamte Panelnachlauf bleiben erforderlich.
Die KI-Strukturgates bestehen. Der Pakettypcheck mit 12 GiB Heap meldet noch
14 Fehler in den unveränderten Testdateien zu Paarung 582/583; der Standardlauf
mit 8 GiB erschöpft zuvor den Heap. Ein grünes Gesamt-Typgate wird nicht behauptet.

Aktionslimits: `strategy_panel_fast_advance_chrome_rush` mit Seeds `-02`
und `-05`, sowie `strategy_panel_net_damage_black_ice` mit Seed `-03`.
Der Fast-Advance-Fall `-05` bleibt unvollständig klassifiziert. Ein Limit
beweist allein keine falsche Einzelwahl; Verlauf, verbleibende Mittel und
legale Alternativen sind dafür gesondert zu prüfen.

## Interpretation und nächste Abnahme

Die Ausgangsmessung ist Fehlernachweis und aktueller Nenner. Wegen Runtime- und
Limitpartien sind ihre Verhaltensraten am Beobachtungshorizont begrenzt. Ein
späterer reparierter Lauf mit mehr vollständigen Entscheidungen begründet
allein kein Qualitäts- oder Stärkedelta. Slots, Deckfingerprints, Seedreihenfolge,
Aktionslimit und Controller müssen vor jedem Vergleich identisch sein. Erst ein
grüner aktueller Stand darf eine akzeptierte Referenz werden. Die automatisch
erzeugte Markdown-Schlusszeile über eine eingefrorene Referenz überstimmt
diesen Gatevertrag bei einem roten Ergebnis nicht.

Die diagnostischen Deck-Unterprofile behalten ihre explizite Consumergrenze:
`corpProfile.iceProfile` dient ausschließlich der Anzeige. Seine
Programmtrash-Zählung muss kanonische `corp_ice.program_trash`-Signale je
ICE-Kopie zählen; alte Rollenwörter sind kein Ersatz dafür. Die Korrektur
SP-736 ist mit dem echten Syd-Standarddeck und einem reinen Schadens-ICE als
Gegenfall geprüft. Der thematische Profiltest besteht mit 34/34 Tests. Sie
ändert keine Planauswahl und begründet keinen behaupteten Stärkezuwachs.
