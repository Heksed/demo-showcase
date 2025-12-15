Alla uusi logiikka, jossa:

ennen 2.9.2024 oleva aika lasketaan viikkoTOE-säännöillä

2.9.2024 alkaen oleva aika lasketaan EUROTOE-säännöillä

viikkoTOE-kertymä muunnetaan aina EUROTOE-yksiköiksi

lopuksi näytetään vain yksi kertymä: “EUROTOE-kertymä” (joka sisältää myös muunnoksen viikkopuolelta)

1. Perusperiaate

Rajapäivä: 2.9.2024 (mukana)

Laskenta:

Aika ennen rajapäivää → lasketaan viikkoTOE:nä

Aika rajapäivästä eteenpäin → lasketaan EUROTOE:nä

ViikkoTOE-tulos ei ole lopputulos, vaan se muunnetaan EUROTOE-yksiköiksi konfiguroitavan säännön mukaan.

Käyttäjälle näkyy vain:

“EUROTOE-kertymä yhteensä”

2. Vaihe 1 – Jaksojen luokittelu ja mahdollinen jako (hybridi)

Syöte: tulon/työskentelyn jaksot (alkupäivä, loppupäivä, ansiot, mahdolliset tunnit).

Jokaiselle jaksolle:

Jos loppupäivä < 2.9.2024
→ koko jakso kuuluu viikkoTOE-ajalle

Jos alkupäivä ≥ 2.9.2024
→ koko jakso kuuluu EUROTOE-ajalle

Jos alkupäivä < 2.9.2024 JA loppupäivä ≥ 2.9.2024
→ jakso on hybridi ja se jaetaan kahteen alajaksoon:

viikkoTOE-osa: alkupäivä … 1.9.2024

EUROTOE-osa: 2.9.2024 … loppupäivä

2.1 Hybridin sisäinen jako

Hybridijaksossa:

Laske:

kaikki päivät jaksolla

viikkoTOE-päivät (alkupäivä … 1.9.2024)

EUROTOE-päivät (2.9.2024 … loppupäivä)

Jaa ansiot suhteessa päiviin:

viikkoTOE-ansiot = kokonaisansiot × (viikkoTOE-päivät / kaikki päivät)

EUROTOE-ansiot = kokonaisansiot – viikkoTOE-ansiot

Jos tunnit on tiedossa, jaa ne samalla suhteella:

viikkoTOE-tunnit, EUROTOE-tunnit

Tuloksena sinulla on kaksi listaa:

“viikkoTOE-jaksot” (ennen 2.9.2024, sisältää myös hybridien viikko-osat)

“EUROTOE-jaksot” (2.9.2024 alkaen, sisältää myös hybridien euro-osat)

3. Vaihe 2 – ViikkoTOE-laskenta (ennen 2.9.2024)

Tavoite: laskea montako työssäoloehtoviikkoa kertyy.

Ota kaikki viikkoTOE-jaksot.

Jaksota aika kalenteriviikoiksi (tai teidän määritelmän mukaisiksi viikoiksi).

Jokaiselle viikolle:

kerää viikon kaikki tunnit kaikista jaksoista, jotka osuvat viikolle

laske viikon tunnit yhteen:

viikon_tunnit

vertaa konfiguroitavaan tuntirajaan:

viikkoTOE_tuntiraja (esim. 18 h, mutta arvo tulee konfiguraatiosta)

jos viikon_tunnit ≥ viikkoTOE_tuntiraja → 1 viikkoTOE-yksikkö

jos tunnit puuttuvat → merkitään puutteelliseksi, ei keksitä lukuja

ViikkoTOE-laskennan tulos:

viikkoTOE_yksiköt = niiden viikkojen lukumäärä, joissa tuntiraja täyttyi

TÄRKEÄÄ: Tässä vaiheessa viikkoTOE on vielä “omassa yksikössään” (viikkoa tms.), ei vielä EUROTOE-muodossa.

4. Vaihe 3 – EUROTOE-laskenta (2.9.2024 alkaen)

Tavoite: laskea EUROTOE-yksiköt suoraan europerusteisesti.

Ota kaikki EUROTOE-jaksot.

Päätä EUROTOE-yksikön aikarakenne (teidän sääntöjen mukaan), esim.:

kuukausi perusteena

tai viikko, jos näin on määritelty

Ryhmittele jaksot valitun aikayksikön mukaan:

esim. kaikki 09/2024 jaksot → syyskuu 2024 yksikkö

Kullekin yksikölle:

laske yksikön_ansiot = summa kaikista ansioista siltä ajalta

vertaile euromääräiseen rajaan:

EUROTOE_raja (konfiguraatiosta)

jos yksikön_ansiot ≥ EUROTOE_raja → 1 EUROTOE-yksikkö

EUROTOE-laskennan tulos:

EUROTOE_yksiköt_suora = niiden yksiköiden lukumäärä, joissa euromääräinen raja täyttyi

5. Vaihe 4 – ViikkoTOE → EUROTOE -muunto

Nyt tehdään se lisäys, jonka halusit:

ViikkoTOE-kertymää ei näytetä erikseen, vaan se muunnetaan aina EUROTOE-muotoon.

Tarvitset tähän konfiguroitavan muuntosäännön, esim.:

“Kuinka monta viikkoTOE-yksikköä vastaa yhtä EUROTOE-yksikköä?”

esim. muunto_kerroin = 4 viikkoTOE-yksikköä = 1 EUROTOE-yksikkö

mutta tarkka suhde tulee lainsäädännöstä / ohjeista, ei kovakoodata logiikkaan

5.1 Logiikka

ViikkoTOE-laskennan tulos: viikkoTOE_yksiköt

Konfiguroitu muunto:

muunto_kerroin = kuinka monesta viikkoTOE-yksiköstä muodostuu 1 EUROTOE-yksikkö

Laske muunnettu EUROTOE-osuus:

Yksinkertainen esimerkki:

viikkoTOE_euroToeYksiköt = viikkoTOE_yksiköt / muunto_kerroin

Mahdollisesti pitää päättää, pyöristetäänkö:

alaspäin (vain täydet yksiköt lasketaan)

vai käytetäänkö desimaaleja

Lopputuloksena saat:

EUROTOE_yksiköt_viikosta = viikkoTOE-kertymän EUROTOE-vastine

6. Vaihe 5 – Lopullinen EUROTOE-kertymä (näkyvä tulos)

Nyt kaikki on samassa yksikössä:

EUROTOE_yksiköt_viikosta (muunnettu viikkoTOE → EUROTOE)

EUROTOE_yksiköt_suora (suoraan europerusteisesta laskennasta)

6.1 Yhdistäminen

Lopullinen, käyttäjälle näytettävä arvo:

EUROTOE_kertymä_yhteensä = EUROTOE_yksiköt_viikosta + EUROTOE_yksiköt_suora

UI:ssa:

ei näytetä viikkoTOE-viikkojen lukumäärää

ei näytetä erikseen “viikkoTOE kertymä” + “EUROTOE kertymä”

näytetään vain:

“Työssäoloehto kertynyt (EUROTOE)” = EUROTOE_kertymä_yhteensä

Jos halutaan selitteitä kehittäjille/debugiin, voi sisäisesti tallentaa:

viikkoTOE_yksiköt (raaka)

muunto_kerroin

EuroTouks_euroToeYksiköt_viikosta

EuroToe_yksiköt_suora

mutta nämä eivät näy loppukäyttäjälle.