# Glossar für lokalisierte Kartenregeltexte

Stand: 21.08.2026  
Status: verbindlich für bestätigte deutsche und französische Tooltip-Regeltexte

## Zweck

Dieses Glossar hält die Regelbegriffe der englischen `CardSpec.text.rulesText`-Quelle in deutschen und französischen Tooltip-Texten stabil. Es ist eine reine Anzeigekonvention und keine Regelautorität.

## Stil

| Vorgabe            | Deutsch                    | Französisch                               |
| ------------------ | -------------------------- | ----------------------------------------- |
| Spieleransprache   | `du`, Imperativ Singular   | `vous`, Imperativ Plural/Höflichkeitsform |
| Korp-Perspektive   | `du` bezeichnet die Korp   | `vous` bezeichnet die Corpo               |
| Runner-Perspektive | `du` bezeichnet den Runner | `vous` bezeichnet le Runner               |
| Kartennamen        | unverändert                | unverändert                               |
| Zahlen und Marker  | unverändert                | unverändert                               |

## Kanonische Begriffe

| Englisch             | Deutsch                     | Französisch                |
| -------------------- | --------------------------- | -------------------------- |
| Corp                 | Korp                        | Corpo                      |
| Runner               | Runner                      | Runner                     |
| agenda / agendas     | Agenda / Agendas            | Agenda / Agendas           |
| agenda point         | Agendapunkt                 | point d’Agenda             |
| score an agenda      | eine Agenda werten          | marquer un Agenda          |
| steal an agenda      | eine Agenda stehlen         | voler un Agenda            |
| run                  | Run                         | piratage                   |
| make a run           | einen Run durchführen       | effectuer un piratage      |
| successful run       | erfolgreicher Run           | piratage réussi            |
| end the run          | den Run beenden             | mettre fin au piratage     |
| ICE / piece of ice   | ICE                         | glace                      |
| icebreaker           | Icebreaker                  | brise-glace                |
| subroutine           | Subroutine                  | routine                    |
| break a subroutine   | eine Subroutine brechen     | neutraliser une routine    |
| rez / rezzed         | rezzen / gerezzt            | rezzer / rezzé             |
| derez / derezzed     | derezzen / derezzt          | dérezzer / dérezzé         |
| trash (verb)         | trashen                     | mettre à la casse          |
| discard from hand    | aus der Hand abwerfen       | défausser depuis la main   |
| remove from the game | aus dem Spiel entfernen     | retirer de la partie       |
| bit / bits           | Credit / Credits            | crédit / crédits           |
| trace                | Trace                       | Trace                      |
| tag / tagged         | Tag / getaggt               | tag / tagué                |
| Virus counter        | Virus-Counter               | pion Virus                 |
| counter              | Counter                     | pion                       |
| Net damage           | Netzwerkschaden             | dégâts réseau              |
| brain damage         | Hirnschaden                 | dégâts cérébraux           |
| meat damage          | Fleischschaden              | dégâts physiques           |
| prevent damage       | Schaden verhindern          | prévenir des dégâts        |
| avoid a tag/counter  | einen Tag/Counter vermeiden | éviter un tag/pion         |
| action               | Aktion                      | action                     |
| turn                 | Zug                         | tour                       |
| hand                 | Hand                        | main                       |
| stack                | Stack                       | pile                       |
| Archives             | Archive                     | Archives                   |
| HQ                   | HQ                          | HQ                         |
| R&D                  | R&D                         | R&D                        |
| data fort            | Datenfort                   | fort de données            |
| subsidiary data fort | Neben-Datenfort             | fort de données secondaire |
| strength             | Stärke                      | force                      |
| link                 | Link                        | Link                       |
| MU                   | MU                          | MU                         |

## Bedeutungsgrenzen

- `trash`, `discard` und `remove from the game` sind unterschiedliche Regelhandlungen und dürfen nicht vereinheitlicht werden.
- `prevent` und `avoid` bleiben unterscheidbar.
- `score` ist für die Korp nicht dasselbe wie `steal` für den Runner.
- `access`, `reveal`, `expose` und `show` werden nicht gegenseitig ersetzt.
- `may`, `must`, `cannot` und `only` behalten ihre Verbindlichkeit.
- Zeitpunkte wie `at the start`, `after`, `when`, `whenever`, `until end of turn` und `during` bleiben explizit erhalten.
- Singular, Plural, Zielseite und Besitzerbezug werden pro Karte gegen die englische Quelle geprüft.

## Format

- Jede mit `*` oder `[Subroutine]` markierte Subroutine bleibt eine eigene Zeile.
- Bezahlte Fähigkeiten behalten Kosten und `A:`-Marker am Anfang der Fähigkeit.
- Bracket-Tokens wie `[1]`, `[T]` oder `[X]` werden wörtlich erhalten.
- Kartennamen im Regeltext bleiben exakt in der Schreibweise der englischen Quelle.
- Flavor-Text wird nicht ergänzt.
