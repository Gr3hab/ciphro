/* ================================================================
   FAKTEN-FAHRPLAN
   ================================================================
   So funktioniert es:
   • Jeder Tag nimmt die nächsten vier Fakten: Nr. 1 die ersten vier, Nr. 2 die nächsten vier usw.
   • Der kürzeste Satz eines Tages wird Impossible, der längste Easy.
   • NEUE FAKTEN IMMER GANZ UNTEN ANHÄNGEN. Nichts umsortieren oder löschen,
     sonst ändern sich Rätsel, die schon gespielt wurden.
   • Ist die Liste aufgebraucht, kommen alte Fakten gemischt wieder.

   Regeln für einen Fakt:
   • t = der Satz zum Entschlüsseln. Nur Buchstaben und Leerzeichen, am Ende ein Punkt.
     Keine Ziffern, Kommas oder Bindestriche. Ä, Ö, Ü und ß sind erlaubt.
   • Kurze Wörter: Ab etwa 10 Buchstaben kann ein Wort am Handy auf zwei Zeilen rutschen.
   • m = die Erklärung, die nach dem Lösen erscheint. Hier ist alles erlaubt.
   • Nach dem Bearbeiten pruefen.html öffnen: Dort steht, ob alles passt und bis wann die Fakten reichen.

   Bearbeiten direkt auf GitHub: Datei öffnen → Stift-Symbol → unten anhängen → „Commit changes“.
   ================================================================ */
window.FAKTEN = [
  // Nr. 1 · Mittwoch, 21.10.2026
  { t: 'Faultiere können bis zu vierzig Minuten die Luft anhalten.', m: 'Unter Wasser verlangsamen sie ihren Herzschlag stark. Schwimmen können sie übrigens erstaunlich gut.' },
  { t: 'Manche Bambusarten wachsen fast einen Meter am Tag.', m: 'Der Rekord liegt bei rund 91 Zentimetern in 24 Stunden. Damit gehört Bambus zu den am schnellsten wachsenden Pflanzen.' },
  { t: 'Regentropfen sind nicht tropfenförmig.', m: 'Kleine Tropfen sind kugelrund. Große werden beim Fallen unten platt gedrückt und sehen eher aus wie ein Brötchen.' },
  { t: 'Die Donau fließt durch zehn Länder.', m: 'Kein anderer Fluss der Welt durchquert so viele Staaten. Nach rund 2.850 Kilometern mündet sie ins Schwarze Meer.' },

  // Nr. 2 · Donnerstag, 22.10.2026
  { t: 'Giraffen haben gleich viele Halswirbel wie Menschen.', m: 'Es sind sieben. Bei der Giraffe ist jeder einzelne aber bis zu 25 Zentimeter lang.' },
  { t: 'Eulen können ihren Kopf weit nach hinten drehen.', m: 'Bis zu 270 Grad sind möglich. Besondere Blutgefäße sorgen dafür, dass das Gehirn dabei weiter versorgt wird.' },
  { t: 'Die Erde ist keine perfekte Kugel.', m: 'Durch ihre Drehung ist sie am Äquator rund 43 Kilometer dicker als von Pol zu Pol.' },
  { t: 'Gold ist essbar.', m: 'Als Lebensmittelzusatz E 175 verziert es Torten und Pralinen. Schmecken tut man nichts, es wandert unverändert durch den Körper.' },

  // Nr. 3 · Freitag, 23.10.2026
  { t: 'Ein Blitz ist heißer als die Oberfläche der Sonne.', m: 'Im Blitzkanal herrschen kurzzeitig rund 30.000 Grad Celsius, an der Sonnenoberfläche sind es etwa 5.500.' },
  { t: 'Spinnenseide ist reißfester als Stahl.', m: 'Zumindest bei gleichem Gewicht: Ein Spinnenfaden hält mehr Zug aus als ein gleich schwerer Stahldraht und ist dabei sehr dehnbar.' },
  { t: 'Wasser kann gleichzeitig kochen und gefrieren.', m: 'Am Tripelpunkt, bei 0,01 Grad und sehr niedrigem Druck, existiert Wasser zugleich als Eis, Flüssigkeit und Dampf.' },
  { t: 'Weinbergschnecken haben tausende winzige Zähne.', m: 'Sie sitzen in Reihen auf der Radula, einer Raspelzunge, mit der die Schnecke Pflanzen abschabt. Abgenutzte Zähne wachsen ständig nach.' },

  // Nr. 4 · Samstag, 24.10.2026
  { t: 'Ein Herz kann außerhalb des Körpers weiterschlagen.', m: 'Es erzeugt seine elektrischen Impulse selbst. Solange es Sauerstoff bekommt, schlägt es weiter. Das nutzt man bei Transplantationen.' },
  { t: 'Ein Zuckerwürfel Neutronenstern wiegt eine Milliarde Tonnen.', m: 'In Neutronensternen ist Materie so dicht gepackt wie in einem Atomkern. Ein ganzer Stern ist dort nur so groß wie eine Stadt.' },
  { t: 'Seeotter halten sich beim Schlafen an den Pfoten.', m: 'So treiben sie nicht auseinander. Manche wickeln sich zusätzlich in Seetang ein.' },
  { t: 'Erdnüsse sind gar keine Nüsse.', m: 'Botanisch gehören sie zu den Hülsenfrüchten und sind mit Erbsen und Bohnen verwandt. Ihre Früchte reifen unter der Erde.' },

  // Nr. 5 · Sonntag, 25.10.2026
  { t: 'Schnee ist eigentlich durchsichtig.', m: 'Einzelne Eiskristalle sind farblos. Weiß wirkt Schnee, weil die vielen Kristalle das Licht in alle Richtungen streuen.' },
  { t: 'Ein Tag auf der Venus dauert länger als ein Jahr.', m: 'Für eine Drehung um sich selbst braucht die Venus 243 Erdtage, für eine Runde um die Sonne nur rund 225.' },
  { t: 'Pinguine haben Knie.', m: 'Sie stecken gut versteckt unter dem Federkleid. Der watschelnde Gang täuscht.' },
  { t: 'Elefanten können nicht springen.', m: 'Beim Gehen und Laufen bleibt immer mindestens ein Fuß am Boden. Für einen Sprung sind ihre Beine zu massiv gebaut.' },

  // Nr. 6 · Montag, 26.10.2026
  { t: 'Die Chinesische Mauer ist vom Mond aus nicht zu sehen.', m: 'Sie ist zwar tausende Kilometer lang, aber nur wenige Meter breit. Aus dieser Entfernung ist das viel zu schmal.' },
  { t: 'Pottwale schlafen senkrecht im Wasser.', m: 'Sie treiben dabei knapp unter der Oberfläche wie riesige Baumstämme und schlafen jeweils nur wenige Minuten am Stück.' },
  { t: 'Honigbienen zeigen sich den Weg durch Tanzen.', m: 'Mit dem Schwänzeltanz teilen sie Richtung und Entfernung einer Futterquelle mit.' },
  { t: 'Katzen können nichts Süßes schmecken.', m: 'Ihnen fehlt ein funktionierendes Gen für den Süßrezeptor. Als reine Fleischfresser brauchen sie ihn nicht.' },

  // Nr. 7 · Dienstag, 27.10.2026
  { t: 'Die Sonne enthält fast die gesamte Masse unseres Sonnensystems.', m: 'Es sind rund 99,8 Prozent. Planeten, Monde, Asteroiden und Kometen teilen sich den kleinen Rest.' },
  { t: 'Der Mount Everest wächst jedes Jahr ein Stück.', m: 'Weil die Indische Platte weiter gegen Asien drückt, hebt sich das Gebirge um einige Millimeter pro Jahr.' },
  { t: 'Hirsche verlieren jedes Jahr ihr Geweih.', m: 'Im Spätwinter fällt es ab und wächst danach in wenigen Monaten komplett neu. Kaum ein Gewebe im Tierreich wächst schneller.' },
  { t: 'Bananen sind botanisch gesehen Beeren.', m: 'Erdbeeren dagegen sind gar keine echten Beeren, sondern Sammelnussfrüchte. Die eigentlichen Früchte sind die kleinen Nüsschen außen.' },

  // Nr. 8 · Mittwoch, 28.10.2026
  { t: 'Fußspuren auf dem Mond bleiben sehr lange erhalten.', m: 'Ohne Wind und Wasser verwischt sie kaum etwas. Sie könnten Millionen Jahre überdauern.' },
  { t: 'Das Blut von Kraken ist blau.', m: 'Den Sauerstoff transportiert bei ihnen Hämocyanin, ein Blutfarbstoff mit Kupfer statt Eisen.' },
  { t: 'Kängurus können nicht rückwärts hüpfen.', m: 'Der lange, kräftige Schwanz und die großen Hinterfüße lassen das praktisch nicht zu.' },
  { t: 'Koalas haben Fingerabdrücke wie Menschen.', m: 'Sie ähneln unseren so stark, dass man sie selbst unter dem Mikroskop kaum unterscheiden kann.' },

  // Nr. 9 · Donnerstag, 29.10.2026
  { t: 'Hummeln können elektrische Felder wahrnehmen.', m: 'Mit feinen Härchen spüren sie die schwache Ladung von Blüten und merken so, ob dort gerade schon eine andere Hummel Nektar geholt hat.' },
  { t: 'Kolibris können rückwärts fliegen.', m: 'Ihre Schultergelenke sind so beweglich, dass die Flügel eine liegende Acht beschreiben. Damit stehen sie auch still in der Luft.' },
  { t: 'Pferde können nicht durch den Mund atmen.', m: 'Ihr Gaumensegel trennt Mundhöhle und Luftröhre. Die Luft kommt nur durch die Nüstern.' },
  { t: 'Der Mensch besteht zu etwa sechzig Prozent aus Wasser.', m: 'Bei Neugeborenen liegt der Anteil sogar bei rund siebzig Prozent.' },

  // Nr. 10 · Freitag, 30.10.2026
  { t: 'Rentiere bekommen im Winter blaue Augen.', m: 'Eine reflektierende Schicht im Auge wechselt von Gold zu Blau. So sehen die Tiere im dunklen Polarwinter besser.' },
  { t: 'Saturn hat eine geringere Dichte als Wasser.', m: 'Im Schnitt wiegt ein Kubikzentimeter Saturn nur etwa 0,7 Gramm. In einer riesigen Badewanne würde er schwimmen.' },
  { t: 'Der Großglockner ist der höchste Berg Österreichs.', m: 'Er ist 3.798 Meter hoch und liegt an der Grenze zwischen Kärnten und Osttirol.' },
  { t: 'Der Eiffelturm wird im Sommer höher.', m: 'Bei Hitze dehnt sich das Eisen aus und der Turm wächst um einige Zentimeter. Im Winter schrumpft er wieder.' },

  // Nr. 11 · Samstag, 31.10.2026
  { t: 'Das Universum dehnt sich stetig aus.', m: 'Messungen an weit entfernten Sternexplosionen zeigen sogar, dass die Ausdehnung immer schneller wird.' },
  { t: 'Flamingos werden durch ihr Futter rosa.', m: 'Farbstoffe aus Algen und kleinen Krebsen färben ihr Gefieder. Frisch geschlüpfte Küken sind noch grau.' },
  { t: 'Kraken haben drei Herzen.', m: 'Zwei pumpen Blut durch die Kiemen, das dritte versorgt den restlichen Körper. Beim Schwimmen setzt dieses dritte Herz sogar aus.' },
  { t: 'Delfine schlafen mit einem offenen Auge.', m: 'Dabei ruht immer nur eine Gehirnhälfte. Die andere bleibt wach, achtet auf Gefahren und sorgt dafür, dass der Delfin zum Atmen auftaucht.' },

  // Nr. 12 · Sonntag, 1.11.2026
  { t: 'Ein Straußenauge ist größer als sein Gehirn.', m: 'Jedes Auge misst etwa fünf Zentimeter. Damit haben Strauße die größten Augen aller Landtiere.' },
  { t: 'Fledermäuse sind die einzigen fliegenden Säugetiere.', m: 'Flughörnchen gleiten nur. Fledermäuse schlagen aktiv mit ihren Flughäuten und fliegen richtig.' },
  { t: 'Honig verdirbt praktisch nie.', m: 'Er enthält kaum freies Wasser und ist leicht sauer. Bakterien und Schimmelpilze finden darin keine guten Bedingungen.' },
  { t: 'Im Weltall herrscht völlige Stille.', m: 'Schall braucht Luft oder ein anderes Medium, um sich auszubreiten. Im Vakuum gibt es nichts, das schwingen könnte.' },

  // Nr. 13 · Montag, 2.11.2026
  { t: 'Diamanten bestehen aus Kohlenstoff.', m: 'Genau wie der Graphit in Bleistiften. Der Unterschied liegt nur darin, wie die Atome angeordnet sind.' },
  { t: 'Eisbären haben schwarze Haut.', m: 'Ihre Haare sind nicht weiß, sondern farblos. Sie streuen das Licht und wirken deshalb weiß.' },
  { t: 'Krokodile können ihre Zunge nicht herausstrecken.', m: 'Ihre Zunge ist mit einer Membran am Unterkiefer verwachsen.' },
  { t: 'Schmetterlinge schmecken mit den Füßen.', m: 'An ihren Beinen sitzen Sinneszellen. Damit prüfen Weibchen, ob eine Pflanze als Futter für ihre Raupen taugt.' },

  // Nr. 14 · Dienstag, 3.11.2026
  { t: 'Eine einzige Wolke kann hunderte Tonnen wiegen.', m: 'Eine mittelgroße Haufenwolke enthält rund 500 Tonnen Wasser, verteilt auf winzige Tröpfchen, die in aufsteigender Luft schweben.' },
  { t: 'Sterne funkeln wegen der Luft.', m: 'Wärmere und kältere Luftschichten lenken ihr Licht ständig ein wenig ab. Im Weltall leuchten Sterne ganz ruhig.' },
  { t: 'Der Blauwal ist das schwerste bekannte Tier aller Zeiten.', m: 'Mit weit über hundert Tonnen übertrifft er auch die größten Dinosaurier, die man bisher kennt.' },
  { t: 'Libellen erwischen fast jede Beute.', m: 'In Studien lag ihre Trefferquote bei über neunzig Prozent. Sie berechnen die Flugbahn ihrer Beute im Voraus.' },

  // Nr. 15 · Mittwoch, 4.11.2026
  { t: 'Wombats hinterlassen würfelförmigen Kot.', m: 'Die Kanten entstehen im Darm, weil die Darmwand an manchen Stellen steifer ist als an anderen. Die Würfel markieren ihr Revier.' },
  { t: 'Das Wiener Riesenrad dreht sich seit über hundert Jahren.', m: 'Es wurde 1897 im Prater eröffnet und gehört zu den ältesten Riesenrädern der Welt, die noch in Betrieb sind.' },
  { t: 'Kraken schmecken mit ihren Armen.', m: 'In den Saugnäpfen sitzen Sinneszellen, die Stoffe schon bei der Berührung erkennen.' },
  { t: 'Goldfische erinnern sich monatelang.', m: 'Das Drei-Sekunden-Gedächtnis ist ein Mythos. In Versuchen lernen Goldfische Fütterungszeiten und unterscheiden Töne.' },

  // Nr. 16 · Donnerstag, 5.11.2026
  { t: 'Schall ist im Wasser viermal so schnell wie in der Luft.', m: 'In Wasser legt er rund 1.480 Meter pro Sekunde zurück, in Luft nur etwa 343. Darum hören sich Wale über große Entfernungen.' },
  { t: 'Haie gab es schon vor den Bäumen.', m: 'Die ersten Haie lebten vor über 400 Millionen Jahren. Die ersten Bäume entstanden erst Jahrmillionen später.' },
  { t: 'Sonnenlicht braucht acht Minuten bis zur Erde.', m: 'Die Sonne, die du siehst, ist also immer die Sonne von vor gut acht Minuten.' },
  { t: 'Zebras haben eine dunkle Haut.', m: 'Unter dem gestreiften Fell ist die Haut fast schwarz. Die weißen Streifen sind Stellen, an denen das Fell keinen Farbstoff bildet.' },

  // ↓ Neue Fakten hier anhängen

];
