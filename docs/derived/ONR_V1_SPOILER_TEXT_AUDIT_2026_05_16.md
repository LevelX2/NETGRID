# ONR v1 Spoiler Text Audit

Stand: 2026-05-16

## Zweck

Abgleich der 374 gespeicherten lokalen ONR-v1-Kartentexte aus `data/local/card-import/onr-v1-limited/card-snapshot-onr-v1-limited.local.json` gegen die lokalen Spoilerquellen:

- `docs/source/Runnerspoiler 1.0.txt`
- `docs/source/Corpspoiler 1.0.txt`

Nicht gelistet werden Karten, deren Text exakt übereinstimmt. Gelistet werden:

- **Sachlich abweichend / klärungsbedürftig**: Zahlen, Kosten, fehlende Fähigkeiten, zusätzliche Sätze oder Symbolkosten unterscheiden sich so, dass die Spielbedeutung abweichen kann.
- **Nur Wording/Format**: Bedeutung wirkt gleich; Unterschiede sind Schreibweise, Klammern, Zeilenumbrüche, Symbol-/Markerformat, `bits`/`credits`, `brain`/`core` oder kleine Terminologie.

## Kurzbefund

- Geprüfte Snapshot-Karten: 374
- Exakt gleich und ausgelassen: 213
- Sachlich abweichend oder klärungsbedürftig: 0
- Nur Wording/Format: 161
- `Short-Term Contract`: Snapshot ist auf den Spoilertext korrigiert. Die Runtime in `packages/shared/src/index.ts` ist auf `Put 12 ... [A]: Take 2 ...` korrigiert.

## Sachlich Abweichend Oder Klärungsbedürftig

| Nr. | Karte | Hinweis | Snapshot | Spoiler |
| --- | --- | --- | --- | --- |

## Nur Wording Oder Format

| Nr. | Karte | Hinweis |
| --- | --- | --- |
| 002 | AI Boon | Nur Wording/Format: Apostroph, Stern-Platzhalter und geklammerte Kosten. |
| 003 | Baedeker’s Net Map | Nur Wording/Format nach Normalisierung. |
| 004 | Bakdoor™ | Nur Wording/Format nach Normalisierung. |
| 005 | Bartmoss Memorial Icebreaker | Nur Wording/Format: verkürzter Kartenname im letzten Satz und geklammerte Kosten. |
| 006 | Black Dahlia | Nur Wording/Format nach Normalisierung. |
| 007 | Blink | Nur Wording/Format nach Normalisierung. |
| 009 | Butcher Boy | Nur Wording/Format nach Normalisierung. |
| 011 | Cloak | Nur Wording/Format nach Normalisierung. |
| 013 | Cockroach | Nur Wording/Format nach Normalisierung. |
| 014 | Codecracker | Nur Wording/Format nach Normalisierung. |
| 016 | Cyfermaster™ | Nur Wording/Format nach Normalisierung. |
| 019 | Dropp™ | Nur Wording/Format: Marken-/Namensmarker; Bedeutung wirkt gleich. |
| 020 | Dupré | Nur Wording/Format nach Normalisierung. |
| 021 | Dwarf | Nur Wording/Format nach Normalisierung. |
| 022 | Emergency Self-Construct | Nur Wording/Format nach Normalisierung. |
| 023 | Evil Twin | Nur Wording/Format nach Normalisierung. |
| 029 | Gremlins | Nur Wording/Format nach Normalisierung. |
| 030 | Grubb | Nur Wording/Format nach Normalisierung. |
| 032 | I Spy | Nur Wording/Format nach Normalisierung. |
| 033 | Imp | Nur Wording/Format nach Normalisierung. |
| 035 | Invisibility | Nur Wording/Format nach Normalisierung. |
| 036 | Jackhammer | Nur Wording/Format nach Normalisierung. |
| 037 | Japanese Water Torture | Nur Wording/Format nach Normalisierung. |
| 038 | Joan of Arc | Nur Wording/Format nach Normalisierung. |
| 039 | Krash | Nur Wording/Format nach Normalisierung. |
| 040 | Loony Goon | Nur Wording/Format nach Normalisierung. |
| 043 | Mystery Box | Nur Wording/Format nach Normalisierung. |
| 044 | Netspace Inverter | Nur Wording/Format nach Normalisierung. |
| 047 | Pile Driver | Nur Wording/Format nach Normalisierung. |
| 049 | Pox | Nur Wording/Format nach Normalisierung. |
| 054 | Raptor | Nur Wording/Format nach Normalisierung. |
| 055 | Reflector | Nur Wording/Format nach Normalisierung. |
| 056 | Replicator | Nur Wording/Format nach Normalisierung. |
| 058 | SeeYa | Nur Wording/Format nach Normalisierung. |
| 059 | Self-Modifying Code | Nur Wording/Format nach Normalisierung. |
| 060 | Shaka | Nur Wording/Format nach Normalisierung. |
| 063 | Signpost | Nur Wording/Format nach Normalisierung. |
| 067 | Speed Trap | Nur Wording/Format nach Normalisierung. |
| 068 | Startup Immolator | Nur Wording/Format nach Normalisierung. |
| 070 | Tinweasel | Nur Wording/Format nach Normalisierung. |
| 071 | Vewy Vewy Quiet | Nur Wording/Format nach Normalisierung. |
| 072 | Wild Card | Nur Wording/Format nach Normalisierung. |
| 073 | Wizard’s Book | Nur Wording/Format nach Normalisierung. |
| 074 | Worm | Nur Wording/Format nach Normalisierung. |
| 075 | Zetatech Software Installer | Nur Wording: overlying/overwriting-Schreibweise; gleiche Recurring-Install-Credit-Bedeutung. |
| 078 | Arasaka Owns You | Nur Wording/Format nach Normalisierung. |
| 084 | Edited Shipping Manifests | Nur Wording/Format nach Normalisierung. |
| 102 | Open-Ended® Mileage Program | Nur Wording/Format: Registered-Mark und geklammerte Kosten. |
| 108 | Score! | Nur Wording/Format nach Normalisierung. |
| 119 | Arasaka Portable Prototype | Nur Wording/Format nach Normalisierung. |
| 120 | “Armadillo” Armored Road Home | Nur Wording/Format nach Normalisierung. |
| 131 | Microtech Backup Drive | Nur Wording/Format nach Normalisierung. |
| 133 | Militech MRAM Chip | Nur Wording/Format nach Normalisierung. |
| 134 | MRAM Chip | Nur Wording/Format nach Normalisierung. |
| 136 | Pandora’s Deck | Nur Wording/Format nach Normalisierung. |
| 141 | Raven Microcyb Owl | Nur Wording/Format nach Normalisierung. |
| 143 | Techtronica™ Utility Suit | Nur Wording/Format: Trademark-Marker und Zeilenumbruch. |
| 157 | Crash Everett, Inventive Fixer | Nur Wording/Format nach Normalisierung. |
| 164 | Hell's Run | Nur Wording/Format nach Normalisierung. |
| 172 | Quest for Cattekin | Nur Wording/Format nach Normalisierung. |
| 179 | Silicon Saloon Franchise | Nur Wording/Format: A-Marker und geklammerter Betrag. |
| 183 | Technician Lover | Nur Wording/Format: A-Marker-Schreibweise. |
| 185 | Trauma Team™ | Nur Wording/Format: Trademark-Marker, Zeilenumbruch und ausgeschriebene Zahl. |
| 188 | AI Chief Financial Officer | Nur Wording/Format: A-Marker-Schreibweise. |
| 192 | Corporate Boon | Nur Wording/Format nach Normalisierung. |
| 196 | Corporate War | Nur Wording/Format nach Normalisierung. |
| 199 | Employee Empowerment | Nur Wording/Format: Zeilenumbruch und A-Marker-Schreibweise. |
| 200 | Encryption Breakthrough | Nur Wording/Format nach Normalisierung. |
| 205 | Main-Office Relocation | Nur Wording/Format nach Normalisierung. |
| 208 | On-Call Solo Team | Nur Wording/Format: A-Marker-Schreibweise. |
| 211 | Polymer Breakthrough | Nur Wording/Format nach Normalisierung. |
| 217 | Strike Force Kali | Nur Wording/Format: A-Marker-Schreibweise. |
| 219 | Superior Net Barriers | Nur Wording/Format nach Normalisierung. |
| 223 | Banpei | Nur Wording/Format nach Normalisierung. |
| 224 | Bolter Cluster | Nur Wording/Format nach Normalisierung. |
| 225 | Canis Major | Nur Wording/Format nach Normalisierung. |
| 226 | Canis Minor | Nur Wording/Format nach Normalisierung. |
| 227 | Cerberus | Nur Wording/Format nach Normalisierung. |
| 228 | Cinderella | Nur Wording/Format nach Normalisierung. |
| 229 | Code Corpse | Nur Wording/Format nach Normalisierung. |
| 230 | Cortical Scanner | Nur Wording/Format nach Normalisierung. |
| 231 | Cortical Scrub | Nur Wording/Format nach Normalisierung. |
| 232 | Crystal Wall | Nur Wording/Format nach Normalisierung. |
| 233 | D'Arc Knight | Nur Wording/Format nach Normalisierung. |
| 234 | Data Darts | Nur Wording/Format nach Normalisierung. |
| 235 | Data Naga | Nur Wording/Format nach Normalisierung. |
| 236 | Data Raven | Nur Wording/Format nach Normalisierung. |
| 237 | Data Wall | Nur Wording/Format nach Normalisierung. |
| 238 | Data Wall 2.0 | Nur Wording/Format nach Normalisierung. |
| 239 | Endless Corridor | Nur Wording/Format nach Normalisierung. |
| 240 | Fang | Nur Wording/Format nach Normalisierung. |
| 241 | Fang 2.0 | Nur Wording/Format nach Normalisierung. |
| 242 | Fatal Attractor | Nur Wording/Format nach Normalisierung. |
| 243 | Fetch 4.0.1 | Nur Wording/Format nach Normalisierung. |
| 244 | Filter | Nur Wording/Format nach Normalisierung. |
| 245 | Fire Wall | Nur Wording/Format nach Normalisierung. |
| 246 | Fragmentation Storm | Nur Wording/Format nach Normalisierung. |
| 247 | Haunting Inquisition | Nur Wording/Format nach Normalisierung. |
| 248 | Homewrecker™ | Nur Wording/Format nach Normalisierung. |
| 249 | Hunter | Nur Wording/Format nach Normalisierung. |
| 250 | Ice Pick Willie | Nur Wording/Format nach Normalisierung. |
| 251 | Jack Attack | Nur Wording/Format nach Normalisierung. |
| 252 | Keeper | Nur Wording/Format nach Normalisierung. |
| 253 | Laser Wire | Nur Wording/Format nach Normalisierung. |
| 254 | Liche | Nur Wording/Format nach Normalisierung. |
| 256 | Mazer | Nur Wording/Format nach Normalisierung. |
| 257 | Nerve Labyrinth | Nur Wording/Format nach Normalisierung. |
| 258 | Neural Blade | Nur Wording/Format nach Normalisierung. |
| 259 | Pi in the 'Face | Nur Wording/Format nach Normalisierung. |
| 260 | Pocket Virtual Reality | Nur Wording/Format nach Normalisierung. |
| 261 | Quandary | Nur Wording/Format nach Normalisierung. |
| 262 | Razor Wire | Nur Wording/Format nach Normalisierung. |
| 263 | Reinforced Wall | Nur Wording/Format nach Normalisierung. |
| 264 | Rex | Nur Wording/Format nach Normalisierung. |
| 265 | Rock Is Strong | Nur Wording/Format nach Normalisierung. |
| 266 | Scramble | Nur Wording/Format nach Normalisierung. |
| 267 | Sentinels Prime | Nur Wording/Format nach Normalisierung. |
| 268 | Shock.r | Nur Wording/Format nach Normalisierung. |
| 269 | Shotgun Wire | Nur Wording/Format nach Normalisierung. |
| 270 | Sleeper | Nur Wording/Format nach Normalisierung. |
| 271 | TKO 2.0 | Nur Wording/Format: expliziter Subroutine-Marker fehlt im Spoiler. |
| 272 | Too Many Doors | Nur Wording/Format nach Normalisierung. |
| 273 | Triggerman | Nur Wording/Format nach Normalisierung. |
| 274 | Tutor | Nur Wording/Format nach Normalisierung. |
| 275 | Vacuum Link | Nur Wording/Format nach Normalisierung. |
| 276 | Viral 15 | Nur Wording/Format nach Normalisierung. |
| 277 | Virizz | Nur Wording/Format nach Normalisierung. |
| 278 | Wall of Ice | Nur Wording/Format nach Normalisierung. |
| 279 | Wall of Static | Nur Wording/Format nach Normalisierung. |
| 280 | Zombie | Nur Wording/Format nach Normalisierung. |
| 283 | Audit of Call Records | Nur Wording/Format nach Normalisierung. |
| 284 | Chance Observation | Nur Wording/Format nach Normalisierung. |
| 288 | Day Shift | Nur Wording/Format nach Normalisierung. |
| 290 | Efficiency Experts | Nur Wording/Format nach Normalisierung. |
| 308 | ACME Savings and Loan | Nur Wording/Format nach Normalisierung. |
| 313 | City Surveillance | Nur Wording/Format nach Normalisierung. |
| 314 | Corporate Negotiating Center | Nur Wording/Format nach Normalisierung. |
| 315 | Corprunner's Shattered Remains | Nur Wording: trash/destroy-Terminologie. |
| 316 | Cowboy Sysop | Nur Wording/Format nach Normalisierung. |
| 317 | Data Masons | Nur Wording/Format nach Normalisierung. |
| 323 | Experimental AI | Nur Wording: trash/destroy-Terminologie. |
| 324 | Fortress Architects | Nur Wording/Format nach Normalisierung. |
| 325 | Hacker Tracker Central | Nur Wording/Format nach Normalisierung. |
| 326 | Holovid Campaign | Nur Wording/Format nach Normalisierung. |
| 327 | I Got a Rock | Nur Wording/Format nach Normalisierung. |
| 329 | Investment Firm | Nur Wording/Format nach Normalisierung. |
| 331 | Nevinyrral | Nur Wording/Format nach Normalisierung. |
| 332 | Newsgroup Taunting | Nur Wording/Format nach Normalisierung. |
| 334 | Pacifica Regional AI | Nur Wording/Format nach Normalisierung. |
| 338 | Rustbelt HQ Branch | Nur Wording/Format nach Normalisierung. |
| 341 | Skälderviken SA Beta Test Site | Nur Wording/Format nach Normalisierung. |
| 346 | Vacant Soulkiller | Nur Wording/Format nach Normalisierung. |
| 347 | Vapor Ops | Nur Wording/Format: Zeilenumbrüche, Groß-/Kleinschreibung und geklammerter Betrag. |
| 351 | Bizarre Encryption Scheme | Nur Wording: Zeichensetzung/Klammern. |
| 355 | Crystal Palace Station Grid | Nur Wording/Format nach Normalisierung. |
| 362 | New Galveston City Grid | Nur Wording/Format: Satzstellung und geklammerter Betrag. |
| 366 | Red Herrings | Nur Wording/Format nach Normalisierung. |
| 367 | Rio de Janeiro City Grid | Nur Wording/Format nach Normalisierung. |
| 368 | Roving Submarine | Nur Wording/Format nach Normalisierung. |
| 369 | Singapore City Grid | Nur Wording/Format nach Normalisierung. |
| 374 | Washington, D.C., City Grid | Nur Wording/Format nach Normalisierung. |

## Hinweise Zur Interpretation

- Symbolfälle wie `A,T` gegenüber `A,[1]`, `[T]` oder `T:` sind in dieser Liste bewusst nicht automatisch geglättet, wenn sie wie Kosten wirken. Diese Fälle brauchen Scan- oder Quellenentscheidung.
- Die lokalen Spoilertexte enthalten selbst einzelne offensichtliche Tipp-/OCR-Spuren, z. B. `succesful`, `Card Title:Operation` oder Sonderzeichenvarianten. Diese wurden beim Zuordnen toleriert, aber nicht als Korrektur der Quelle behandelt.
- Dieser Audit bewertet die gespeicherten Anzeige-/Snapshot-Texte gegen Spoilertext. Er ersetzt nicht den separaten Runtime-Resolver- oder Testabgleich.
