/* ================================================================
   NUMIGMA · FAKTEN-FAHRPLAN (DEUTSCH)
   ================================================================
   So funktioniert es:
   • Jeder Tag nimmt die nächsten vier Fakten: #1 die ersten vier, #2 die nächsten vier usw.
   • Der kürzeste Satz eines Tages wird Impossible, der längste Easy.
   • NEUE FAKTEN IMMER GANZ UNTEN ANHÄNGEN. Nichts umsortieren oder löschen,
     sonst ändern sich Rätsel, die schon gespielt wurden.
   • Die englische Liste (facts-en.js) muss dieselbe Reihenfolge haben:
     Fakt Nummer 70 hier = Fakt Nummer 70 dort. So gibt es in beiden Sprachen am selben Tag denselben Fakt.
   • Ist die Liste aufgebraucht, kommen alte Fakten gemischt wieder.

   Regeln für einen Fakt:
   • t = der Satz zum Entschlüsseln. Nur Buchstaben und Leerzeichen, am Ende ein Punkt.
     Keine Ziffern, Kommas, Bindestriche oder Apostrophe. Ä, Ö, Ü und ß sind erlaubt.
   • Kurze Wörter: Ab etwa 12 Buchstaben kann ein Wort am Handy auf zwei Zeilen rutschen.
   • m = die Erklärung, die nach dem Lösen erscheint. Hier ist alles erlaubt.
   • Nach dem Bearbeiten pruefen.html öffnen: Dort steht, ob alles passt und bis wann die Fakten reichen.

   Bearbeiten direkt auf GitHub: Datei öffnen → Stift-Symbol → unten anhängen → „Commit changes“.
   ================================================================ */
window.FAKTEN = [
  // #1 · Mittwoch, 21.10.2026
  { t: 'Faultiere können bis zu vierzig Minuten die Luft anhalten.', m: 'Unter Wasser verlangsamen sie ihren Herzschlag stark. Schwimmen können sie übrigens erstaunlich gut.' },
  { t: 'Manche Bambusarten wachsen fast einen Meter am Tag.', m: 'Der Rekord liegt bei rund 91 Zentimetern in 24 Stunden. Damit gehört Bambus zu den am schnellsten wachsenden Pflanzen.' },
  { t: 'Regentropfen sind nicht tropfenförmig.', m: 'Kleine Tropfen sind kugelrund. Große werden beim Fallen unten platt gedrückt und sehen eher aus wie ein Brötchen.' },
  { t: 'Die Donau fließt durch zehn Länder.', m: 'Kein anderer Fluss der Welt durchquert so viele Staaten. Nach rund 2.850 Kilometern mündet sie ins Schwarze Meer.' },

  // #2 · Donnerstag, 22.10.2026
  { t: 'Giraffen haben gleich viele Halswirbel wie Menschen.', m: 'Es sind sieben. Bei der Giraffe ist jeder einzelne aber bis zu 25 Zentimeter lang.' },
  { t: 'Eulen können ihren Kopf weit nach hinten drehen.', m: 'Bis zu 270 Grad sind möglich. Besondere Blutgefäße sorgen dafür, dass das Gehirn dabei weiter versorgt wird.' },
  { t: 'Die Erde ist keine perfekte Kugel.', m: 'Durch ihre Drehung ist sie am Äquator rund 43 Kilometer dicker als von Pol zu Pol.' },
  { t: 'Gold ist essbar.', m: 'Als Lebensmittelzusatz E 175 verziert es Torten und Pralinen. Schmecken tut man nichts, es wandert unverändert durch den Körper.' },

  // #3 · Freitag, 23.10.2026
  { t: 'Ein Blitz ist heißer als die Oberfläche der Sonne.', m: 'Im Blitzkanal herrschen kurzzeitig rund 30.000 Grad Celsius, an der Sonnenoberfläche sind es etwa 5.500.' },
  { t: 'Spinnenseide ist reißfester als Stahl.', m: 'Zumindest bei gleichem Gewicht: Ein Spinnenfaden hält mehr Zug aus als ein gleich schwerer Stahldraht und ist dabei sehr dehnbar.' },
  { t: 'Wasser kann gleichzeitig kochen und gefrieren.', m: 'Am Tripelpunkt, bei 0,01 Grad und sehr niedrigem Druck, existiert Wasser zugleich als Eis, Flüssigkeit und Dampf.' },
  { t: 'Weinbergschnecken haben tausende winzige Zähne.', m: 'Sie sitzen in Reihen auf der Radula, einer Raspelzunge, mit der die Schnecke Pflanzen abschabt. Abgenutzte Zähne wachsen ständig nach.' },

  // #4 · Samstag, 24.10.2026
  { t: 'Ein Herz kann außerhalb des Körpers weiterschlagen.', m: 'Es erzeugt seine elektrischen Impulse selbst. Solange es Sauerstoff bekommt, schlägt es weiter. Das nutzt man bei Transplantationen.' },
  { t: 'Ein Zuckerwürfel Neutronenstern wiegt eine Milliarde Tonnen.', m: 'Gemeint ist ein Stück Neutronenstern, so groß wie ein Zuckerwürfel. In Neutronensternen ist Materie so dicht gepackt wie in einem Atomkern. Ein ganzer Stern ist nur so groß wie eine Stadt.' },
  { t: 'Seeotter halten sich beim Schlafen an den Pfoten.', m: 'So treiben sie nicht auseinander. Manche wickeln sich zusätzlich in Seetang ein.' },
  { t: 'Erdnüsse sind gar keine Nüsse.', m: 'Botanisch gehören sie zu den Hülsenfrüchten und sind mit Erbsen und Bohnen verwandt. Ihre Früchte reifen unter der Erde.' },

  // #5 · Sonntag, 25.10.2026
  { t: 'Schnee ist eigentlich durchsichtig.', m: 'Einzelne Eiskristalle sind farblos. Weiß wirkt Schnee, weil die vielen Kristalle das Licht in alle Richtungen streuen.' },
  { t: 'Ein Tag auf der Venus dauert länger als ein Jahr.', m: 'Für eine Drehung um sich selbst braucht die Venus 243 Erdtage, für eine Runde um die Sonne nur rund 225.' },
  { t: 'Pinguine haben Knie.', m: 'Sie stecken gut versteckt unter dem Federkleid. Der watschelnde Gang täuscht.' },
  { t: 'Elefanten können nicht springen.', m: 'Beim Gehen und Laufen bleibt immer mindestens ein Fuß am Boden. Für einen Sprung sind ihre Beine zu massiv gebaut.' },

  // #6 · Montag, 26.10.2026
  { t: 'Die Chinesische Mauer ist vom Mond aus nicht zu sehen.', m: 'Sie ist zwar tausende Kilometer lang, aber nur wenige Meter breit. Aus dieser Entfernung ist das viel zu schmal.' },
  { t: 'Pottwale schlafen senkrecht im Wasser.', m: 'Sie treiben dabei knapp unter der Oberfläche wie riesige Baumstämme und schlafen jeweils nur wenige Minuten am Stück.' },
  { t: 'Honigbienen zeigen sich den Weg durch Tanzen.', m: 'Mit dem Schwänzeltanz teilen sie Richtung und Entfernung einer Futterquelle mit.' },
  { t: 'Katzen können nichts Süßes schmecken.', m: 'Ihnen fehlt ein funktionierendes Gen für den Süßrezeptor. Als reine Fleischfresser brauchen sie ihn nicht.' },

  // #7 · Dienstag, 27.10.2026
  { t: 'Die Sonne enthält fast die gesamte Masse unseres Sonnensystems.', m: 'Es sind rund 99,8 Prozent. Planeten, Monde, Asteroiden und Kometen teilen sich den kleinen Rest.' },
  { t: 'Der Mount Everest wächst jedes Jahr ein Stück.', m: 'Weil die Indische Platte weiter gegen Asien drückt, hebt sich das Gebirge um einige Millimeter pro Jahr.' },
  { t: 'Hirsche verlieren jedes Jahr ihr Geweih.', m: 'Im Spätwinter fällt es ab und wächst danach in wenigen Monaten komplett neu. Kaum ein Gewebe im Tierreich wächst schneller.' },
  { t: 'Bananen sind botanisch gesehen Beeren.', m: 'Erdbeeren dagegen sind gar keine echten Beeren, sondern Sammelnussfrüchte. Die eigentlichen Früchte sind die kleinen Nüsschen außen.' },

  // #8 · Mittwoch, 28.10.2026
  { t: 'Fußspuren auf dem Mond bleiben sehr lange erhalten.', m: 'Ohne Wind und Wasser verwischt sie kaum etwas. Sie könnten Millionen Jahre überdauern.' },
  { t: 'Das Blut von Kraken ist blau.', m: 'Den Sauerstoff transportiert bei ihnen Hämocyanin, ein Blutfarbstoff mit Kupfer statt Eisen.' },
  { t: 'Kängurus können nicht rückwärts hüpfen.', m: 'Der lange, kräftige Schwanz und die großen Hinterfüße lassen das praktisch nicht zu.' },
  { t: 'Koalas haben Fingerabdrücke wie Menschen.', m: 'Sie ähneln unseren so stark, dass man sie selbst unter dem Mikroskop kaum unterscheiden kann.' },

  // #9 · Donnerstag, 29.10.2026
  { t: 'Hummeln können elektrische Felder wahrnehmen.', m: 'Mit feinen Härchen spüren sie die schwache Ladung von Blüten und merken so, ob dort gerade schon eine andere Hummel Nektar geholt hat.' },
  { t: 'Kolibris können rückwärts fliegen.', m: 'Ihre Schultergelenke sind so beweglich, dass die Flügel eine liegende Acht beschreiben. Damit stehen sie auch still in der Luft.' },
  { t: 'Pferde können nicht durch den Mund atmen.', m: 'Ihr Gaumensegel trennt Mundhöhle und Luftröhre. Die Luft kommt nur durch die Nüstern.' },
  { t: 'Der Mensch besteht zu etwa sechzig Prozent aus Wasser.', m: 'Bei Neugeborenen liegt der Anteil sogar bei rund siebzig Prozent.' },

  // #10 · Freitag, 30.10.2026
  { t: 'Rentiere bekommen im Winter blaue Augen.', m: 'Eine reflektierende Schicht im Auge wechselt von Gold zu Blau. So sehen die Tiere im dunklen Polarwinter besser.' },
  { t: 'Saturn hat eine geringere Dichte als Wasser.', m: 'Im Schnitt wiegt ein Kubikzentimeter Saturn nur etwa 0,7 Gramm. In einer riesigen Badewanne würde er schwimmen.' },
  { t: 'Der Großglockner ist der höchste Berg Österreichs.', m: 'Er ist 3.798 Meter hoch und liegt an der Grenze zwischen Kärnten und Osttirol.' },
  { t: 'Der Eiffelturm wird im Sommer höher.', m: 'Bei Hitze dehnt sich das Eisen aus und der Turm wächst um einige Zentimeter. Im Winter schrumpft er wieder.' },

  // #11 · Samstag, 31.10.2026
  { t: 'Das Universum dehnt sich stetig aus.', m: 'Messungen an weit entfernten Sternexplosionen zeigen sogar, dass die Ausdehnung immer schneller wird.' },
  { t: 'Flamingos werden durch ihr Futter rosa.', m: 'Farbstoffe aus Algen und kleinen Krebsen färben ihr Gefieder. Frisch geschlüpfte Küken sind noch grau.' },
  { t: 'Kraken haben drei Herzen.', m: 'Zwei pumpen Blut durch die Kiemen, das dritte versorgt den restlichen Körper. Beim Schwimmen setzt dieses dritte Herz sogar aus.' },
  { t: 'Delfine schlafen mit einem offenen Auge.', m: 'Dabei ruht immer nur eine Gehirnhälfte. Die andere bleibt wach, achtet auf Gefahren und sorgt dafür, dass der Delfin zum Atmen auftaucht.' },

  // #12 · Sonntag, 1.11.2026
  { t: 'Ein Straußenauge ist größer als sein Gehirn.', m: 'Jedes Auge misst etwa fünf Zentimeter. Damit haben Strauße die größten Augen aller Landtiere.' },
  { t: 'Fledermäuse sind die einzigen fliegenden Säugetiere.', m: 'Flughörnchen gleiten nur. Fledermäuse schlagen aktiv mit ihren Flughäuten und fliegen richtig.' },
  { t: 'Honig verdirbt praktisch nie.', m: 'Er enthält kaum freies Wasser und ist leicht sauer. Bakterien und Schimmelpilze finden darin keine guten Bedingungen.' },
  { t: 'Im Weltall herrscht völlige Stille.', m: 'Schall braucht Luft oder ein anderes Medium, um sich auszubreiten. Im Vakuum gibt es nichts, das schwingen könnte.' },

  // #13 · Montag, 2.11.2026
  { t: 'Diamanten bestehen aus Kohlenstoff.', m: 'Genau wie der Graphit in Bleistiften. Der Unterschied liegt nur darin, wie die Atome angeordnet sind.' },
  { t: 'Eisbären haben schwarze Haut.', m: 'Ihre Haare sind nicht weiß, sondern farblos. Sie streuen das Licht und wirken deshalb weiß.' },
  { t: 'Krokodile können ihre Zunge nicht herausstrecken.', m: 'Ihre Zunge ist mit einer Membran am Unterkiefer verwachsen.' },
  { t: 'Schmetterlinge schmecken mit den Füßen.', m: 'An ihren Beinen sitzen Sinneszellen. Damit prüfen Weibchen, ob eine Pflanze als Futter für ihre Raupen taugt.' },

  // #14 · Dienstag, 3.11.2026
  { t: 'Eine einzige Wolke kann hunderte Tonnen wiegen.', m: 'Eine mittelgroße Haufenwolke enthält rund 500 Tonnen Wasser, verteilt auf winzige Tröpfchen, die in aufsteigender Luft schweben.' },
  { t: 'Sterne funkeln wegen der Luft.', m: 'Wärmere und kältere Luftschichten lenken ihr Licht ständig ein wenig ab. Im Weltall leuchten Sterne ganz ruhig.' },
  { t: 'Der Blauwal ist das schwerste bekannte Tier aller Zeiten.', m: 'Mit weit über hundert Tonnen übertrifft er auch die größten Dinosaurier, die man bisher kennt.' },
  { t: 'Libellen erwischen fast jede Beute.', m: 'In Studien lag ihre Trefferquote bei über neunzig Prozent. Sie berechnen die Flugbahn ihrer Beute im Voraus.' },

  // #15 · Mittwoch, 4.11.2026
  { t: 'Wombats hinterlassen würfelförmigen Kot.', m: 'Die Kanten entstehen im Darm, weil die Darmwand an manchen Stellen steifer ist als an anderen. Die Würfel markieren ihr Revier.' },
  { t: 'Das Wiener Riesenrad dreht sich seit über hundert Jahren.', m: 'Es wurde 1897 im Prater eröffnet und gehört zu den ältesten Riesenrädern der Welt, die noch in Betrieb sind.' },
  { t: 'Kraken schmecken mit ihren Armen.', m: 'In den Saugnäpfen sitzen Sinneszellen, die Stoffe schon bei der Berührung erkennen.' },
  { t: 'Goldfische erinnern sich monatelang.', m: 'Das Drei-Sekunden-Gedächtnis ist ein Mythos. In Versuchen lernen Goldfische Fütterungszeiten und unterscheiden Töne.' },

  // #16 · Donnerstag, 5.11.2026
  { t: 'Schall ist im Wasser viermal so schnell wie in der Luft.', m: 'In Wasser legt er rund 1.480 Meter pro Sekunde zurück, in Luft nur etwa 343. Darum hören sich Wale über große Entfernungen.' },
  { t: 'Haie gab es schon vor den Bäumen.', m: 'Die ersten Haie lebten vor über 400 Millionen Jahren. Die ersten Bäume entstanden erst Jahrmillionen später.' },
  { t: 'Sonnenlicht braucht acht Minuten bis zur Erde.', m: 'Die Sonne, die du siehst, ist also immer die Sonne von vor gut acht Minuten.' },
  { t: 'Zebras haben eine dunkle Haut.', m: 'Unter dem gestreiften Fell ist die Haut fast schwarz. Die weißen Streifen sind Stellen, an denen das Fell keinen Farbstoff bildet.' },

  // #17 · Freitag, 6.11.2026
  { t: 'Ein Zauberwürfel hat über dreiundvierzig Trillionen Stellungen.', m: 'Trotzdem lässt sich jede davon in höchstens zwanzig Zügen lösen.' },
  { t: 'Fingernägel wachsen schneller als Fußnägel.', m: 'Fingernägel wachsen rund drei Millimeter im Monat, Fußnägel nur etwa halb so schnell.' },
  { t: 'In Wien wächst Wein mitten in der Stadt.', m: 'Wien hat rund 600 Hektar Weingärten innerhalb der Stadtgrenzen. Kaum eine andere Großstadt hat so viel Weinbau.' },
  { t: 'Schafe können sich Gesichter merken.', m: 'In Versuchen erkannten Schafe die Gesichter von rund fünfzig Artgenossen und sogar von bekannten Menschen wieder.' },

  // #18 · Samstag, 7.11.2026
  { t: 'Nacktmulle bekommen fast nie Krebs.', m: 'Die kleinen Nager werden über dreißig Jahre alt und erkranken extrem selten an Krebs. Ihre Zellen haben besondere Schutzmechanismen.' },
  { t: 'Pilze sind näher mit Tieren verwandt als mit Pflanzen.', m: 'Genetisch stehen Pilze den Tieren näher. Sie bilden ein eigenes Reich neben Pflanzen und Tieren.' },
  { t: 'Auf dem Mars sind Sonnenuntergänge blau.', m: 'Feiner Staub in der dünnen Marsatmosphäre streut blaues Licht in der Nähe der Sonne besonders stark.' },
  { t: 'Geparden sind die schnellsten Landtiere.', m: 'Auf kurzen Strecken schaffen sie über 100 Kilometer pro Stunde. Lange halten sie das Tempo aber nicht durch.' },

  // #19 · Sonntag, 8.11.2026
  { t: 'Raupen haben mehr Muskeln als Menschen.', m: 'Eine Raupe hat rund 4.000 Muskeln, ein Mensch etwa 650. Die meisten sitzen in ihren vielen Körperringen.' },
  { t: 'Fregattvögel schlafen im Flug.', m: 'Messungen zeigten, dass sie auf wochenlangen Flügen über dem Meer kurz schlafen, oft mit nur einer Gehirnhälfte.' },
  { t: 'In einem frühen Computerfehler steckte eine echte Motte.', m: '1947 fanden Techniker an der Universität Harvard eine Motte in einem Rechner und klebten sie als ersten echten Bug ins Logbuch.' },
  { t: 'Der älteste Zoo der Welt steht in Wien.', m: 'Der Tiergarten Schönbrunn wurde 1752 gegründet und ist der älteste noch bestehende Zoo der Welt.' },

  // #20 · Montag, 9.11.2026
  { t: 'Menschen leuchten ganz schwach im Dunkeln.', m: 'Unser Körper gibt winzige Mengen Licht ab, tausendfach zu schwach für unsere Augen. Japanische Forschende haben es mit Spezialkameras gemessen.' },
  { t: 'Die Universität Oxford ist älter als das Aztekenreich.', m: 'In Oxford wurde schon um 1096 gelehrt. Die Aztekenhauptstadt Tenochtitlan wurde erst 1325 gegründet.' },
  { t: 'Große Pandas fressen fast nur Bambus.', m: 'Bis zu vierzehn Stunden am Tag sind sie mit Fressen beschäftigt. Dabei ist ihr Verdauungssystem eigentlich das eines Fleischfressers.' },
  { t: 'Kanada hat mehr Seen als der Rest der Welt zusammen.', m: 'Rund sechzig Prozent aller Seen der Erde liegen in Kanada.' },

  // #21 · Dienstag, 10.11.2026
  { t: 'Das Gehirn verbraucht etwa ein Fünftel unserer Energie.', m: 'Dabei macht es nur rund zwei Prozent unseres Körpergewichts aus.' },
  { t: 'Krähen erkennen menschliche Gesichter wieder.', m: 'In Versuchen merkten sich Krähen jahrelang Menschen, die sie geärgert hatten, und warnten sogar andere Krähen vor ihnen.' },
  { t: 'Australien ist breiter als der Mond.', m: 'Von Ost nach West misst Australien rund 4.000 Kilometer. Der Mond hat nur etwa 3.475 Kilometer Durchmesser.' },
  { t: 'Vanille ist die Frucht einer Orchidee.', m: 'Die Blüten müssen meist von Hand bestäubt werden. Darum ist echte Vanille so teuer.' },

  // #22 · Mittwoch, 11.11.2026
  { t: 'Die Venus dreht sich andersherum als die Erde.', m: 'Auf der Venus geht die Sonne deshalb im Westen auf und im Osten unter.' },
  { t: 'Elefanten erkennen sich im Spiegel.', m: 'In Versuchen untersuchten sie Markierungen auf ihrem eigenen Kopf. Das können sonst nur wenige Tiere wie Menschenaffen und Delfine.' },
  { t: 'Katzen schnurren nicht nur vor Freude.', m: 'Sie schnurren auch bei Stress oder Schmerzen. Vermutlich beruhigen sie sich damit selbst.' },
  { t: 'Erdmännchen halten abwechselnd Wache.', m: 'Während die Gruppe Futter sucht, steht ein Tier aufrecht als Wachposten und warnt bei Gefahr mit Rufen.' },

  // #23 · Donnerstag, 12.11.2026
  { t: 'Manche Kiefern sind fast fünftausend Jahre alt.', m: 'Eine Langlebige Kiefer in Kalifornien namens Methuselah gehört zu den ältesten bekannten Bäumen der Welt.' },
  { t: 'Graupapageien können hunderte Wörter lernen.', m: 'Der berühmte Graupapagei Alex kannte über hundert Wörter und konnte Farben und Formen benennen.' },
  { t: 'Kühe haben einen Magen mit vier Kammern.', m: 'Pansen, Netzmagen, Blättermagen und Labmagen. So verdauen sie zähes Gras, das sie mehrmals wiederkäuen.' },
  { t: 'Manche Eintagsfliegen leben nur wenige Minuten.', m: 'Als Larven leben sie oft monatelang im Wasser. Die erwachsenen Tiere mancher Arten paaren sich dann und sterben nach Minuten.' },

  // #24 · Freitag, 13.11.2026
  { t: 'Die Freiheitsstatue war früher nicht grün.', m: 'Sie besteht aus Kupfer und glänzte anfangs rötlich braun. Die grüne Patina bildete sich erst über Jahrzehnte.' },
  { t: 'Ameisen tragen ein Vielfaches ihres Körpergewichts.', m: 'Manche Arten heben das Zehn- bis Fünfzigfache ihres eigenen Gewichts. Kleine Körper sind im Verhältnis besonders kräftig.' },
  { t: 'Delfine rufen sich gegenseitig beim Namen.', m: 'Jeder Große Tümmler hat einen eigenen Pfiff. Andere Delfine ahmen ihn nach, um genau dieses Tier anzusprechen.' },
  { t: 'Axolotl können ganze Beine nachwachsen lassen.', m: 'Diese Schwanzlurche erneuern Gliedmaßen, Teile des Herzens und sogar des Gehirns. Die Forschung hofft, davon für die Medizin zu lernen.' },

  // #25 · Samstag, 14.11.2026
  { t: 'Bei Seepferdchen werden die Männchen schwanger.', m: 'Das Weibchen legt die Eier in eine Bruttasche am Bauch des Männchens. Dort reifen sie, bis er die Jungtiere zur Welt bringt.' },
  { t: 'Der kleinste Knochen sitzt im Ohr.', m: 'Der Steigbügel ist nur rund drei Millimeter groß. Er leitet den Schall ins Innenohr weiter.' },
  { t: 'Ein Elefantenrüssel hat rund vierzigtausend Muskeln.', m: 'Damit kann ein Elefant einen Baumstamm heben oder eine einzelne Erdnuss aufsammeln.' },
  { t: 'Jupiter ist schwerer als alle anderen Planeten zusammen.', m: 'Er hat mehr als doppelt so viel Masse wie alle übrigen Planeten unseres Sonnensystems gemeinsam.' },

  // #26 · Sonntag, 15.11.2026
  { t: 'Ziegen haben rechteckige Pupillen.', m: 'Die waagrechten Pupillen geben ihnen einen weiten Rundumblick. So erkennen sie Raubtiere früh.' },
  { t: 'Haie haben keine Knochen.', m: 'Ihr Skelett besteht aus Knorpel, wie unsere Nasenspitze. Das macht sie leicht und beweglich.' },
  { t: 'Ratten lachen beim Kitzeln.', m: 'Sie geben dabei hohe Laute im Ultraschall von sich. Forschende haben sie mit Spezialmikrofonen hörbar gemacht.' },
  { t: 'Am Bodensee gibt es keine festgelegte Grenze.', m: 'Deutschland, Österreich und die Schweiz haben sich für den Obersee nie auf einen Grenzverlauf geeinigt. Sie nutzen ihn gemeinsam.' },

  // #27 · Montag, 16.11.2026
  { t: 'Der Mond entfernt sich jedes Jahr ein Stück von der Erde.', m: 'Rund 3,8 Zentimeter pro Jahr. Gemessen wird das mit Laserstrahlen und Spiegeln, die Astronauten auf dem Mond aufgestellt haben.' },
  { t: 'Kaiserpinguine können über zwanzig Minuten tauchen.', m: 'Sie erreichen dabei Tiefen von über 500 Metern. Kein anderer Vogel taucht so tief.' },
  { t: 'Manche Schildkröten atmen über ihren Po.', m: 'Die australische Fitzroy-Schildkröte nimmt unter Wasser Sauerstoff über ihre Kloake auf. So bleibt sie lange getaucht.' },
  { t: 'Blitze schlagen oft mehrmals an derselben Stelle ein.', m: 'Hohe Gebäude wie das Empire State Building werden jedes Jahr mehr als zwanzigmal getroffen.' },

  // #28 · Dienstag, 17.11.2026
  { t: 'Koalas schlafen bis zu zwanzig Stunden am Tag.', m: 'Eukalyptusblätter liefern wenig Energie und sind schwer verdaulich. Deshalb ruhen Koalas fast den ganzen Tag.' },
  { t: 'Es gibt mehr mögliche Schachpartien als Atome im Universum.', m: 'Schätzungen gehen von mindestens zehn hoch 120 möglichen Partien aus, aber nur von rund zehn hoch 80 Atomen.' },
  { t: 'Die Magenschleimhaut erneuert sich alle paar Tage.', m: 'Magensäure ist so aggressiv, dass die Zellen der Schleimhaut ständig ersetzt werden müssen. Sonst würde der Magen sich selbst angreifen.' },
  { t: 'Hunde sehen die Welt vor allem in Blau und Gelb.', m: 'Sie haben nur zwei Arten von Farbzapfen. Rot und Grün können sie kaum unterscheiden.' },

  // #29 · Mittwoch, 18.11.2026
  { t: 'Ein Regenbogen ist eigentlich ein ganzer Kreis.', m: 'Vom Boden aus sehen wir nur den oberen Teil. Aus einem Flugzeug kann man manchmal den vollen Kreis sehen.' },
  { t: 'In einem Löffel Erde leben mehr Lebewesen als Menschen auf der Welt.', m: 'Ein Teelöffel gesunder Boden enthält Milliarden Bakterien, Pilze und andere winzige Organismen.' },
  { t: 'Bärtierchen haben einen Ausflug ins Weltall überlebt.', m: '2007 flogen die winzigen Tiere auf einem Satelliten mit und überstanden Vakuum und kosmische Strahlung. Einige vermehrten sich danach sogar.' },
  { t: 'Ketchup wurde früher als Medizin verkauft.', m: 'In den 1830er-Jahren gab es in den USA Tomatenpillen gegen Verdauungsbeschwerden.' },

  // #30 · Donnerstag, 19.11.2026
  { t: 'Gurken bestehen fast nur aus Wasser.', m: 'Rund 95 Prozent einer Gurke sind Wasser. Damit gehört sie zu den wasserreichsten Gemüsen.' },
  { t: 'Clownfische können ihr Geschlecht wechseln.', m: 'Alle schlüpfen als Männchen. Stirbt das Weibchen einer Gruppe, wird das stärkste Männchen zum Weibchen.' },
  { t: 'Ein Herz schlägt täglich etwa hunderttausend Mal.', m: 'Über ein ganzes Leben kommen so mehr als zwei Milliarden Herzschläge zusammen.' },
  { t: 'Ein Jahr auf dem Merkur dauert nur achtundachtzig Tage.', m: 'Merkur ist der Planet, der der Sonne am nächsten ist. Darum umrundet er sie besonders schnell.' },

  // #31 · Freitag, 20.11.2026
  { t: 'Hunde haben viel mehr Riechzellen als Menschen.', m: 'Rund 300 Millionen gegenüber etwa sechs Millionen beim Menschen. Deshalb können Hunde sogar manche Krankheiten erschnüffeln.' },
  { t: 'Cashewkerne wachsen an einem Apfel.', m: 'Unten am sogenannten Cashewapfel hängt eine Nuss in einer harten Schale. Darin steckt der Cashewkern.' },
  { t: 'Die Mona Lisa hat keine Augenbrauen.', m: 'Auf dem berühmten Gemälde sind weder Brauen noch Wimpern zu sehen. Vielleicht sind sie im Lauf der Jahrhunderte verblasst.' },
  { t: 'Flusspferde können nicht schwimmen.', m: 'Sie sind zu schwer, um zu schwimmen. Stattdessen laufen und hüpfen sie über den Grund von Flüssen und Seen.' },

  // #32 · Samstag, 21.11.2026
  { t: 'Ein Igel trägt tausende Stacheln.', m: 'Ein ausgewachsener Igel hat etwa fünf- bis siebentausend Stacheln. Es sind umgewandelte Haare.' },
  { t: 'Kamele speichern in ihren Höckern Fett.', m: 'Kein Wasser, wie oft gedacht. Das Fett dient als Energievorrat für lange Wege durch die Wüste.' },
  { t: 'Ananas brauchen bis zu zwei Jahre zum Reifen.', m: 'Jede Pflanze trägt dabei meist nur eine einzige Frucht.' },
  { t: 'Katzen verschlafen etwa zwei Drittel ihres Lebens.', m: 'Zwölf bis sechzehn Stunden Schlaf am Tag sind für Katzen normal. So sparen sie Energie für die Jagd.' },

  // #33 · Sonntag, 22.11.2026
  { t: 'Kartoffeln wuchsen als erstes Gemüse im Weltall.', m: '1995 zogen Forschende an Bord des Spaceshuttles Columbia erstmals Kartoffelpflanzen im All.' },
  { t: 'Die Antarktis ist die größte Wüste der Welt.', m: 'Eine Wüste ist ein Gebiet mit sehr wenig Niederschlag. In weiten Teilen der Antarktis fällt kaum Schnee.' },
  { t: 'Wir blinzeln etwa fünfzehnmal pro Minute.', m: 'Das sind über zehntausend Mal am Tag. Jedes Blinzeln verteilt Tränenflüssigkeit und schützt das Auge.' },
  { t: 'Das Wort Roboter stammt aus dem Tschechischen.', m: 'Es tauchte 1920 in einem Theaterstück von Karel Čapek auf. Robota bedeutet so viel wie Zwangsarbeit.' },

  // #34 · Montag, 23.11.2026
  { t: 'Der Eiffelturm sollte nur zwanzig Jahre stehen.', m: 'Er wurde 1889 für die Weltausstellung gebaut. Weil er sich als Funkturm bewährte, durfte er bleiben.' },
  { t: 'Buckelwale singen lange Lieder.', m: 'Die Männchen singen Lieder, die bis zu einer halben Stunde dauern und oft stundenlang wiederholt werden. Die Melodien ändern sich mit der Zeit.' },
  { t: 'Napoleon war gar nicht besonders klein.', m: 'Mit rund 1,69 Metern war er für seine Zeit durchschnittlich groß. Der Irrtum entstand auch durch unterschiedliche Maßeinheiten.' },
  { t: 'Frösche trinken über ihre Haut.', m: 'Statt mit dem Maul nehmen sie Wasser über eine besonders durchlässige Hautstelle am Bauch auf.' },

  // #35 · Dienstag, 24.11.2026
  { t: 'Der Strichcode wurde vom Morsealphabet inspiriert.', m: 'Erfinder Norman Woodland zog Morsezeichen im Sand in die Länge. So entstanden dicke und dünne Striche.' },
  { t: 'Giraffen schlafen oft nur wenige Minuten am Stück.', m: 'In freier Wildbahn kommen sie nur auf wenige Stunden Schlaf am Tag, verteilt auf viele kurze Nickerchen.' },
  { t: 'Hühner sind Nachfahren der Dinosaurier.', m: 'Vögel stammen von kleinen, gefiederten Raubdinosauriern ab. Biologisch gesehen sind sie sogar selbst Dinosaurier.' },
  { t: 'Der tiefste Punkt im Meer liegt fast elf Kilometer tief.', m: 'Das Challengertief im Marianengraben. Der Mount Everest würde darin komplett verschwinden.' },

  // #36 · Mittwoch, 25.11.2026
  { t: 'Spechte klopfen bis zu zwanzigmal pro Sekunde.', m: 'Ihr kleines, fest sitzendes Gehirn verkraftet die vielen Schläge. So hämmern sie tausende Male am Tag.' },
  { t: 'Paprika hat mehr Vitamin C als eine Zitrone.', m: 'Rote Paprika enthält etwa doppelt so viel Vitamin C wie Zitronensaft.' },
  { t: 'Kleopatra lebte näher an der Mondlandung als am Bau der Pyramiden.', m: 'Die große Pyramide von Gizeh entstand um 2560 vor Christus, Kleopatra lebte um 30 vor Christus. Die Mondlandung 1969 liegt näher an ihrer Zeit.' },
  { t: 'Quallen haben weder Herz noch Gehirn.', m: 'Ein Netz aus Nervenzellen steuert ihre Bewegungen. Quallen gibt es schon seit über einer halben Milliarde Jahren.' },

  // #37 · Donnerstag, 26.11.2026
  { t: 'Lachse finden zum Fluss ihrer Geburt zurück.', m: 'Nach Jahren im Meer schwimmen sie oft tausende Kilometer zurück, vermutlich mit Hilfe ihres Geruchssinns und des Erdmagnetfelds.' },
  { t: 'Bananen sind ganz leicht radioaktiv.', m: 'Sie enthalten Kalium, und ein winziger Teil davon ist radioaktiv. Gefährlich ist das nicht.' },
  { t: 'Uranus rollt auf der Seite um die Sonne.', m: 'Seine Achse ist um fast 98 Grad gekippt. Vermutlich hat ihn vor langer Zeit ein riesiger Zusammenstoß umgeworfen.' },
  { t: 'Wikinger trugen keine Hörner an ihren Helmen.', m: 'Das Bild stammt aus Opern und Gemälden des neunzehnten Jahrhunderts. Echte Wikingerhelme waren schlicht.' },

  // #38 · Freitag, 27.11.2026
  { t: 'Wanderfalken sind die schnellsten Tiere der Welt.', m: 'Im Sturzflug erreichen sie über 300 Kilometer pro Stunde. Kein anderes Tier ist so schnell.' },
  { t: 'Schokolade war früher ein Getränk.', m: 'Maya und Azteken tranken Kakao bitter und gewürzt. Feste Schokolade gibt es erst seit dem neunzehnten Jahrhundert.' },
  { t: 'Orcas gehören zu den Delfinen.', m: 'Schwertwale sind die größten Mitglieder der Delfinfamilie. Männchen werden bis zu neun Meter lang.' },
  { t: 'Auf dem Mond wiegt man nur ein Sechstel so viel.', m: 'Die Schwerkraft dort ist etwa sechsmal schwächer als auf der Erde. 60 Kilogramm fühlen sich an wie zehn.' },

  // #39 · Samstag, 28.11.2026
  { t: 'Schlangen riechen mit ihrer Zunge.', m: 'Die gespaltene Zunge sammelt Duftteilchen und bringt sie zu einem Sinnesorgan im Gaumen.' },
  { t: 'Der Pazifik ist größer als alle Landflächen zusammen.', m: 'Er bedeckt rund ein Drittel der Erdoberfläche. Alle Kontinente würden gemeinsam hineinpassen.' },
  { t: 'Babys haben mehr Knochen als Erwachsene.', m: 'Neugeborene haben rund 300 Knochen. Viele wachsen später zusammen, bis es bei Erwachsenen 206 sind.' },
  { t: 'Mozart schrieb seine erste Sinfonie mit acht Jahren.', m: 'Das war 1764 in London. Komponiert hat er schon ab etwa fünf Jahren.' },

  // #40 · Sonntag, 29.11.2026
  { t: 'Pferde können im Stehen dösen.', m: 'Ein Sperrmechanismus in den Beinen hält sie ohne Muskelkraft aufrecht. Für den Tiefschlaf legen sie sich aber hin.' },
  { t: 'Licht könnte die Erde in einer Sekunde siebenmal umrunden.', m: 'Mit fast 300.000 Kilometern pro Sekunde ist Licht das Schnellste im Universum.' },
  { t: 'Europäische Aale laichen in der Sargassosee.', m: 'Dafür schwimmen sie über 5.000 Kilometer quer durch den Atlantik. Beim Laichen beobachtet hat sie noch niemand.' },
  { t: 'Das erste Foto der Welt ist rund zweihundert Jahre alt.', m: 'Joseph Nicéphore Niépce machte es um 1826 aus seinem Fenster. Die Belichtung dauerte viele Stunden.' },

  // #41 · Montag, 30.11.2026
  { t: 'Junge Sonnenblumen drehen sich mit der Sonne.', m: 'Tagsüber folgen ihre Köpfe der Sonne von Ost nach West und drehen sich nachts zurück. Ausgewachsene Blüten bleiben nach Osten gerichtet.' },
  { t: 'Gänsehaut stammt aus unserer Zeit mit Fell.', m: 'Bei Tieren stellen sich dabei die Haare auf. Das wärmt oder lässt sie größer wirken. Bei uns ist nur der Reflex geblieben.' },
  { t: 'Ein Floh springt über hundertmal so weit wie er lang ist.', m: 'Ein Floh ist nur wenige Millimeter groß, springt aber bis zu 30 Zentimeter weit. Ein elastisches Eiweiß im Körper wirkt dabei wie eine Feder.' },
  { t: 'Die Brille wurde in Italien erfunden.', m: 'Um 1290 tauchten in Norditalien die ersten Lesebrillen auf.' },

  // ↓ Neue Fakten hier anhängen

];
