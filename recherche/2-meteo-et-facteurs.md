# Sources de données pour les facteurs influents (météo, calendrier, activité)

Recherche documentaire du 25 novembre 2026. Aucune API n'a été appelée, aucune inscription faite, aucun jeu de données téléchargé : tout vient de la lecture des pages de documentation.

**Conventions de lecture**

- « CORS documenté » : la documentation de la source dit en toutes lettres que l'appel depuis un navigateur est prévu.
- « CORS non documenté » : la documentation n'en dit rien. Il faut tester les en-têtes de réponse avant de s'appuyer dessus.
- « non vérifié » : je n'ai pas pu lire la page qui l'établirait ; l'information vient d'un résultat de recherche, d'une source tierce ou de ma mémoire, et c'est précisé.

## L'essentiel

1. **Une seule source couvre presque tout le besoin météo depuis un navigateur : Open-Meteo** (historique depuis 1940, prévision à 16 jours, prévision saisonnière à 7 mois, projections à 2050 ; sans clé, CORS annoncé dans le README du projet). **Mais son offre gratuite est réservée à l'usage non commercial.** Pour un outil de revue énergétique utilisé dans un cadre professionnel, il faut soit un abonnement payant (clé alors visible dans la page), soit une autre source.
2. **Les sources publiques françaises sont sous Licence Ouverte 2.0 (usage commercial permis) mais ne sont pas faites pour le navigateur** : fichiers CSV compressés par département (Météo-France sur data.gouv.fr) ou API à jeton d'une heure (portail API Météo-France). Elles conviennent à un import de fichier par l'utilisateur ou à un serveur.
3. **Les degrés-jours déjà calculés et gratuits sont trop grossiers** pour un site (SDES : annuel, départemental, seuils 17 et 15 °C ; Eurostat : mensuel, NUTS 3, mise à jour annuelle). Le plus simple et le plus juste est de **calculer les degrés-jours dans la page** à partir des températures journalières, avec la base et la méthode choisies par l'utilisateur.
4. **À 3–12 mois, aucune prévision météo ne donne la rigueur d'un hiver sur l'Europe.** La bonne entrée est une **distribution historique** (hiver doux, médian, froid tirés de 20–30 années au point du site), pas une prévision saisonnière.
5. **Calendrier et activité sont faciles** : jours fériés calculables sans réseau ; vacances scolaires en fichier de l'Éducation nationale ; indices de production d'Eurostat appelables depuis le navigateur (CORS documenté).

---

## 1. Météo observée (températures journalières, degrés-jours)

| Source | Ce qu'elle fournit | Accès depuis le navigateur | Licence | Limites | Points faibles |
|---|---|---|---|---|---|
| **Open-Meteo, Historical Weather API** — https://open-meteo.com/en/docs/historical-weather-api (point d'accès `archive-api.open-meteo.com/v1/archive`) | Réanalyses par point de grille, monde entier : ERA5 depuis 1940 (0,25°, env. 25 km), ERA5-Land depuis 1950 (0,1°, env. 11 km), IFS 9 km depuis 2017. Pas horaire ; agrégats journaliers (température min, max, moyenne). Délai annoncé : 5 jours pour ERA5. | **Oui.** Sans clé pour l'usage non commercial. CORS documenté dans le README du projet (« No API key required, CORS supported »), pas dans les pages de documentation. JSON (CSV et XLSX possibles). | Données en CC BY 4.0, mention « Weather data by Open-Meteo.com » avec lien. **API gratuite réservée à l'usage non commercial.** | Gratuit : 600 appels/min, 5 000/h, 10 000/jour, 300 000/mois. Une requête de plus de 2 semaines ou de plus de 10 variables compte pour plusieurs appels. | Ce sont des réanalyses, pas la mesure d'une station : écarts possibles en relief, en ville, sur le littoral. Usage commercial : abonnement ; l'historique n'est pas inclus dans l'offre Standard, seulement Professional et Enterprise (prix non affichés sur la page). |
| **Open-Meteo, Historical Forecast API** — https://open-meteo.com/en/docs/historical-forecast-api | Archive des prévisions à haute résolution recollées (dont AROME 1,5 km), « autour de 2022 » selon les modèles. | Comme ci-dessus. | Idem. | Idem. | La page dit elle-même : pas adapté aux longues séries (changements de version des modèles). Utile seulement pour les 2–3 dernières années. |
| **Météo-France, données climatologiques de base quotidiennes** — https://www.data.gouv.fr/datasets/donnees-climatologiques-de-base-quotidiennes | Mesures des stations (métropole et outre-mer) « depuis leur ouverture », contrôlées. Un fichier par département et par période (avant 1949, 1950–2024, 2025–2026), groupe « RR-T-Vent » pour les températures. Mise à jour quotidienne pour les deux dernières années. | **Téléchargement de fichier** (`csv.gz`, de quelques centaines de Ko à env. 10 Mo par département). CORS non documenté sur l'hébergement des fichiers. Sans clé. | Licence Ouverte 2.0 (usage commercial permis, mention de la source). | Pas de quota documenté sur les fichiers. | Fichier entier d'un département pour une seule station ; noms de colonnes à lire dans le descriptif ; il faut choisir la station. Les discussions du jeu de données signalent des retards de mise à jour (juin et fin octobre 2026) et des valeurs TN/TX manquantes. |
| **API tabulaire data.gouv.fr (bêta)** — https://www.data.gouv.fr/dataservices/api-tabulaire-data-gouv-fr-beta (`tabular-api.data.gouv.fr/api/`) | Interroge en JSON une ressource tabulaire de data.gouv.fr avec filtres par colonne (station, date) et pagination. | Accès ouvert, sans clé. CORS non documenté. | Celle du jeu interrogé. | 100 appels/s ; fichiers `csv.gz` jusqu'à 100 Mo. | Bêta. **Non vérifié** que les fichiers Météo-France y sont bien indexés. Pagination par 20 lignes par défaut. |
| **Portail API Météo-France, « API Données climatologiques »** — https://portail-api.meteofrance.fr | Données climatologiques d'une station, en CSV, par commande. | **Non adapté au navigateur** : compte obligatoire (« avec compte » sur data.gouv.fr). Jeton limité à 1 heure d'après des clients tiers (non vérifié sur le portail). CORS non documenté. | Données publiques Météo-France gratuites et réutilisables depuis le 1er janvier 2024 ; licence exacte de l'API non vérifiée. | Quotas non vérifiés (page du portail illisible). | Demande un serveur pour renouveler le jeton et cacher les identifiants. |
| **NASA POWER** — https://power.larc.nasa.gov/docs/services/api/temporal/daily/ (`/api/temporal/daily/point`) | Monde entier, par point. Météo depuis le 01/01/1981 jusqu'au quasi temps réel, délai 2–3 jours. Température à 2 m moyenne, min, max ; degrés-jours déjà calculés (paramètres `HDD18_3`, `CDD18_3`, base 18,3 °C — vus dans un service NASA tiers, non vérifiés dans le dictionnaire de paramètres). Endpoints mensuel et climatologie. | Sans authentification (« All endpoints are publicly accessible with no authentication »). JSON, CSV, NetCDF. **CORS non documenté.** | CC BY 4.0 d'après le fichier `llms.txt` du site : usage commercial permis. | 20 paramètres par requête ; pas de quota chiffré, mais blocage possible en cas d'appels répétés au même point ; code 429 prévu. | Maille grossière (env. 0,5° × 0,625°, non vérifié sur la page de méthode). Base 18,3 °C (65 °F), pas 18 °C. Réponses lentes annoncées (jusqu'à une minute pour certains services). |
| **Copernicus, ERA5** — https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels | La réanalyse d'origine : 0,25°, horaire, 1940 à aujourd'hui, délai d'environ 5 jours. | **Non.** Compte, jeton personnel, acceptation des conditions de chaque jeu, client Python ; format GRIB. | CC BY. | Non chiffrées sur la page. | Réservé à un serveur. Open-Meteo et NASA POWER en sont des façades plus simples. |
| **Degree Days.net** — https://www.degreedays.net/ et https://www.degreedays.net/api/ | Degrés-jours de chauffage et de refroidissement **à n'importe quelle base**, calculés à partir des relevés infra-journaliers des stations (méthode d'intégration), monde entier ; journalier, hebdomadaire, mensuel, moyennes ; régression. | Site gratuit : téléchargement manuel de CSV. API : JSON ou XML, exemple de JavaScript côté navigateur fourni, mais clés d'accès à signer et le site déconseille de les mettre dans une page publique. CORS non documenté. | Conditions de réutilisation non affichées (renvoi vers un contact). | API payante : de 9 $/mois (1 lieu) à 49 $ (100 unités/h), 195 $ et plus pour l'horaire et la régression. Pas d'offre gratuite d'API hors compte d'essai limité à une zone de test. | Payant ; clés à protéger, donc serveur. Reste la référence quand on veut des degrés-jours de station fiables sans les calculer. |
| **SDES, degrés-jours unifiés** — https://www.statistiques.developpement-durable.gouv.fr/indice-de-rigueur-degres-jours-unifies-aux-niveaux-national-regional-et-departemental | DJU de chauffage **annuels**, 1990–2025, France métropolitaine, niveaux national, régional, départemental (moyenne des communes pondérée par la population). Seuils **17 °C et 15 °C**. DJU mensuels de chauffage et de refroidissement au niveau national seulement. | Fichiers XLSX à télécharger. | Non indiquée sur la page. | Mise à jour annuelle (mensuelle pour le national). | Trop grossier pour un site (département, année). Seuils différents de la base 18. La méthode a changé en 2024 ; les séries de l'ancienne méthode ne sont plus publiées. |
| **Eurostat, degrés-jours de chauffage et de refroidissement (`nrg_chdd`)** — https://ec.europa.eu/eurostat/cache/metadata/en/nrg_chdd_esms.htm | Degrés-jours mensuels et annuels par région NUTS 3, depuis janvier 1975, source JRC (Agri4Cast). | **Oui** par l'API Statistics d'Eurostat (CORS documenté, sans clé, JSON-stat). Codes de tables `nrg_chdd_m` et `nrg_chddr2_m` non vérifiés. | Réutilisation libre, commerciale comprise, avec mention de la source (CC BY 4.0). | Mise à jour **une fois par an**. | Convention propre : chauffage = 18 − T si T ≤ 15 °C ; refroidissement = T − 21 si T ≥ 24 °C. Pas de données récentes en cours d'année. Bon pour des normales régionales, pas pour le suivi. |
| **Cegibat (GRDF), calcul des DJU** — https://cegibat.grdf.fr/simulateur/calcul-dju | Simulateur en ligne : DJU chauffage ou climatisation par station (plus de 500, données Météo-France mises à jour chaque mois), seuil au choix, méthode « Météo » ou « Professionnels de l'énergie ». | Outil interactif, pas d'API ni d'export mentionné. | Non indiquée. | — | Utile pour **vérifier à la main** un calcul fait dans la page, pas comme source automatique. |
| **COSTIC, service DJU** — https://www.costic.com | DJU de référence de la profession, base 18 °C, par décade, une centaine de stations. | Abonnement payant, fichiers Excel. | Conditions générales de vente. | — | Payant, non automatisable. Plaquette non lue (PDF illisible par l'outil). |
| **ODRÉ, température quotidienne régionale** — https://odre.opendatasoft.com/explore/dataset/temperature-quotidienne-regionale/information/ | Températures min, max, moyenne quotidiennes par **région administrative**, depuis le 1er janvier 2016, mise à jour mensuelle. | API Opendatasoft Explore v2.1 ; CORS annoncé dans la documentation de l'ancienne version v1 de la plateforme, non vérifié pour la v2.1 ; quotas anonymes par portail non vérifiés. | Non précisée sur la page (renvoi aux conditions d'utilisation). | Mise à jour mensuelle. | Maille régionale, trop large pour un site ; dépannage seulement. |
| **Autres, pour mémoire** | Meteostat (https://dev.meteostat.net) : stations mondiales, CC BY 4.0, usage commercial permis, fichiers CSV en masse et API JSON (modalités de l'API non vérifiées, page introuvable). NOAA NCEI (https://www.ncei.noaa.gov/support/access-data-service-api-user-documentation) : `daily-summaries`, CSV ou JSON, sans mention de clé, CORS non documenté. Infoclimat (https://www.infoclimat.fr/opendata/) : compte et clé, 7 jours consécutifs par requête, usage commercial restreint. Visual Crossing (https://www.visualcrossing.com/weather-data-editions/) : offre gratuite avec usage commercial, 30 000 enregistrements/mois, degrés-jours réservés aux offres payantes. | | | | |

## 2. Météo prévue

| Source | Ce qu'elle fournit | Accès depuis le navigateur | Licence | Limites | Points faibles |
|---|---|---|---|---|---|
| **Open-Meteo, Forecast API** — https://open-meteo.com/en/docs (`api.open-meteo.com/v1/forecast`) | Prévision jusqu'à **16 jours** (7 par défaut), horaire et agrégats journaliers, monde entier ; `past_days` jusqu'à 92 jours pour recoller avec l'observé. Sur la France : AROME 1,5 km puis ARPEGE (4 jours), puis modèles mondiaux. | Oui, sans clé (usage non commercial), CORS annoncé par le projet. JSON. | CC BY 4.0 ; gratuit non commercial. | Quotas ci-dessus. | Au-delà de 7–10 jours, valeur déterministe peu fiable (voir encadré). |
| **Open-Meteo, Ensemble API** — https://open-meteo.com/en/docs/ensemble-api | Prévisions d'ensemble : ECMWF IFS 51 membres à 15 jours, GFS 31 membres jusqu'à 35 jours, etc. Donne une fourchette, pas un seul chiffre. | Idem. | Idem. | Non incluse dans l'offre payante Standard. | Volume de données plus lourd. |
| **Open-Meteo, Seasonal Forecast API** — https://open-meteo.com/en/docs/seasonal-forecast-api (`seasonal-api.open-meteo.com/v1/seasonal`) | ECMWF SEAS5 : jusqu'à **7 mois**, 51 membres, grille 36 km, mise à jour mensuelle (le 5). ECMWF EC46 : 46 jours, mise à jour quotidienne. Agrégats journaliers, hebdomadaires, mensuels ; anomalies par rapport au climat du modèle ; probabilités de dépassement. | Idem. | Idem. | Membres individuels conservés un mois seulement. | La page le dit : **sans correction de biais**, à lire comme prévision de zone, pas de lieu. Ne dépasse pas 7 mois. |
| **Copernicus C3S, prévisions saisonnières multi-systèmes** — https://cds.climate.copernicus.eu/datasets/seasonal-monthly-single-levels | Statistiques mensuelles de plusieurs centres (dont ECMWF et Météo-France), grille 1° × 1°, rétro-prévisions 1993–2016, prévisions depuis 2017, publication le 6 (ECMWF) et le 10 du mois. | **Non.** Compte, jeton, GRIB. | CC BY (licence complémentaire pour les contributions non européennes). | — | Serveur indispensable. Échéance maximale non vérifiée sur la page. |
| **Portail API Météo-France : AROME, ARPEGE, ensembles** — https://www.data.gouv.fr/organizations/meteo-france/dataservices | Modèles de Météo-France en points de grille. | Non : compte, jeton, formats de grille. | Données publiques Météo-France. | Quotas non vérifiés. | Les mêmes modèles sont servis plus simplement par Open-Meteo. |
| **Météo-France, bulletin « tendances à 3 mois »** — https://meteofrance.fr (PDF mensuel) | Scénario le plus probable (plus chaud, conforme, plus froid que la normale) à l'échelle de l'Europe pour le trimestre à venir. | Document à lire, pas une donnée. | — | — | Qualitatif. Sert à choisir un scénario à la main, pas à alimenter un calcul. Bulletins non ouverts pendant cette recherche. |
| **ECMWF, données ouvertes** — https://www.ecmwf.int/en/forecasts/datasets/open-data | IFS et AIFS à moyenne échéance, 0,25° (0,1° depuis le 20 octobre 2026), GRIB2 ; 12 dernières prévisions seulement. | Non (fichiers GRIB2). | CC BY 4.0, usage commercial permis. | 500 à 2 000 connexions simultanées. | Pas de saisonnier en accès ouvert (seule la température de mer est listée, « pas encore disponible »). |
| **MET Norway** — https://docs.api.met.no/doc/WebClients.html | Prévision mondiale à environ 9 jours. | Leur documentation recommande un **proxy** ; l'appel direct depuis le navigateur n'est pas pleinement pris en charge. | Non vérifiée. | Risque de bridage au-delà de 20 requêtes/s cumulées. | Pas d'avantage sur Open-Meteo pour ce besoin. |

## 3. Normales climatiques, distributions historiques, projections

| Source | Ce qu'elle fournit | Accès depuis le navigateur | Licence | Limites | Points faibles |
|---|---|---|---|---|---|
| **Distribution calculée sur l'historique Open-Meteo (ERA5)** — même API que la météo observée | Avec 20 à 30 années de températures journalières au point du site, on calcule dans la page, mois par mois, les degrés-jours médians et les quantiles (par exemple 10 %, 50 %, 90 %) : ce sont les scénarios doux, normal, froid. | Oui (une requête de 30 ans de température journalière ; elle compte pour de nombreux appels dans le quota). | CC BY 4.0, gratuit non commercial. | Quota journalier à surveiller. | Voir licence. La normale 1991–2020 est plus froide que le climat actuel : préférer les 10–15 dernières années ou corriger la tendance. |
| **NASA POWER, endpoint climatologie et séries mensuelles** — https://power.larc.nasa.gov/docs/services/api/ | Moyennes climatologiques et séries mensuelles depuis 1981 par point. | Sans authentification ; CORS non documenté. | CC BY 4.0. | — | Maille grossière ; période de référence de la climatologie non vérifiée. |
| **Météo-France, fiches climatologiques des stations** — fichiers `FICHECLIM_<station>.pdf` sur data.gouv.fr | Normales 1991–2020 et records par station. | **PDF** : lecture humaine. | Licence Ouverte 2.0. | — | Pas exploitable par programme. Je n'ai pas trouvé de fichier unique des normales de toutes les stations (non vérifié qu'il n'existe pas). |
| **Météo-France, données mensuelles et SIM** — https://www.data.gouv.fr/datasets/donnees-climatologiques-de-base-mensuelles et https://www.data.gouv.fr/datasets/donnees-changement-climatique-sim-quotidienne | Mensuelles par station depuis l'ouverture (par département). SIM : grille Safran de 0,072° (env. 8 km), quotidienne, un fichier par an. | Fichiers `csv.gz`. Mensuelles : taille raisonnable. SIM : **env. 490 Mo par an**, hors de portée d'un navigateur. | Licence Ouverte 2.0. | — | SIM réservé à un serveur. |
| **Eurostat `nrg_chdd`** — voir section 1 | Degrés-jours mensuels par NUTS 3 depuis 1975 : normales régionales toutes faites. | Oui (CORS documenté). | CC BY 4.0. | Annuelle. | Convention de calcul propre à Eurostat. |
| **Open-Meteo, Climate API** — https://open-meteo.com/en/docs/climate-api | Projections journalières 1950–2050, sept modèles CMIP6 haute résolution ramenés à 10 km, corrigés du biais ; scénario proche de RCP 8.5. | Oui. | CMIP6 en CC BY 4.0 ; gratuit non commercial ; non inclus dans l'offre Standard. | — | Un seul scénario d'émissions ; s'arrête en 2050 ; la page recommande de croiser plusieurs modèles. Inutile pour un horizon de 3–12 mois, utile pour un « et si +1 °C ». |
| **DRIAS (Météo-France), projections de référence pour la France (TRACC)** — https://www.drias-climat.fr | Projections régionalisées et indicateurs, dont degrés-jours de chauffage et de refroidissement. | **Non** : compte à créer pour valider les conditions, NetCDF ou CSV par simulation. | Conditions propres au portail (non lues). | — | Informations tirées de résultats de recherche, site non ouvert. Pour un serveur ou un import manuel. |

## 4. Calendrier

| Source | Ce qu'elle fournit | Accès depuis le navigateur | Licence | Limites | Points faibles |
|---|---|---|---|---|---|
| **API Jours fériés de l'État** — https://calendrier.api.gouv.fr/jours-feries/ (spécification : `/jours-feries/openapi.yml`) | `/{zone}.json` (20 ans en arrière, 5 ans en avant) et `/{zone}/{annee}.json`. 13 zones : `metropole`, `alsace-moselle`, `guadeloupe`, `guyane`, `la-reunion`, `martinique`, `mayotte`, `nouvelle-caledonie`, `polynesie-francaise`, `saint-barthelemy`, `saint-martin`, `saint-pierre-et-miquelon`, `wallis-et-futuna`. Réponse : objet JSON date → nom. | Accès ouvert, sans clé. CORS non documenté. | Licence Ouverte 2.0 (jeu de données) ; code MIT. | « Limite d'appels non documentée », disponibilité non documentée. | Pas les fêtes locales ou professionnelles. Pas de ponts. |
| **Jeu de données « Jours fériés en France »** — https://www.data.gouv.fr/datasets/jours-feries-en-france/ | Les mêmes données en fichiers CSV, JSON, ICS à « URL stables » (hébergés sur etalab.github.io), régénérés chaque jour. | Fichiers statiques ; CORS non documenté. | Licence Ouverte 2.0. | — | — |
| **Calcul direct dans la page** | Les 11 jours fériés français se déduisent de dates fixes et de la date de Pâques (lundi de Pâques, Ascension, lundi de Pentecôte) ; deux jours de plus en Alsace-Moselle. | Aucun appel réseau. | — | — | À valider une fois contre l'API de l'État. C'est l'option la plus robuste pour un fichier HTML autonome. |
| **Calendrier scolaire (Éducation nationale)** — https://www.data.gouv.fr/datasets/le-calendrier-scolaire | Vacances par zone A, B, C, Corse et outre-mer ; fichiers **ICS** par zone, mis à jour le 1er octobre 2026. Source d'origine : data.education.gouv.fr (plateforme Opendatasoft, qui offre en principe une API JSON). | Fichiers ICS à télécharger. L'API JSON de data.education.gouv.fr n'a pas pu être lue : identifiant du jeu, années couvertes et CORS non vérifiés. | Licence Ouverte 2.0. | — | L'ICS demande un petit analyseur. Les calendriers ne sont arrêtés que deux à trois ans à l'avance. |
| **OpenHolidays API** — https://www.openholidaysapi.org/en/ | Jours fériés et vacances scolaires de 37 pays, dont la France depuis 2020 ; JSON ou iCal. | Pas de clé dans les exemples ; CORS non documenté. | Non indiquée. | 3 ans au plus par requête. | Projet d'une société privée, licence des données absente de la page. |
| **Nager.Date** — https://nagerholidays.com/Api (ancienne adresse date.nager.at) | Jours fériés de plus de 200 pays : `/api/v4/Holidays/{pays}/{année}`. Un endpoint de longs week-ends (`/api/v3/LongWeekend/...`) existe d'après des sources tierces (non vérifié sur la page officielle ; la v3 est annoncée maintenue jusqu'au 31/01/2027). | **CORS documenté** (« Browser ready CORS Enabled »), sans limite d'appels annoncée, sans mention de clé. JSON. | Code MIT ; conditions du service non lues. | — | Changement de domaine récent : stabilité à surveiller. Utile surtout hors de France. |
| **Ponts** | Aucune source officielle. | — | — | — | À calculer : un jour férié un mardi ou un jeudi fait du lundi ou du vendredi un pont probable. La pratique dépend du site : à laisser modifiable par l'utilisateur. |

## 5. Activité (substitut à la production du site)

| Source | Ce qu'elle fournit | Accès depuis le navigateur | Licence | Limites | Points faibles |
|---|---|---|---|---|---|
| **Eurostat, API Statistics** — https://ec.europa.eu/eurostat/web/user-guides/data-browser/api-data-access/api-introduction | Toutes les tables Eurostat, dont la production industrielle mensuelle par branche (`sts_inpr_m`, par pays et code NACE). Adresse : `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/{table}?format=JSON&geo=FR&...`, filtres par dimension, `sinceTimePeriod`. | **Oui : CORS documenté** pour l'API Statistics, gratuite, sans inscription mentionnée. JSON-stat 2.0. | Réutilisation libre, commerciale comprise, mention de la source (CC BY 4.0). | Grosses extractions traitées en différé (code 413) ; bases rafraîchies à 11 h et 23 h. | JSON-stat à décoder. Délai de parution de l'indice non vérifié (page de métadonnées introuvable). |
| **INSEE, service web SDMX de la BDM** — https://www.insee.fr/fr/information/2862759 (`https://bdm.insee.fr/series/sdmx/data/SERIES_BDM/{idbank}`) | Indices et séries chronologiques de l'INSEE, dont l'indice de la production industrielle par code NAF (regroupement `IPI-2010` cité en exemple) ; paramètres `startPeriod`, `lastNObservations`. | Gratuit, sans authentification mentionnée pour l'accès direct. **XML SDMX 2.1** (format de sortie non précisé sur la page). CORS non documenté. | Licence de l'INSEE non lue (page introuvable) ; les données INSEE sont en principe sous Licence Ouverte (non vérifié). | 400 séries par requête ; pas de quota chiffré. | XML plus lourd à traiter que du JSON ; identifiants de séries à chercher à la main. |
| **INSEE, API Melodi** — https://www.data.gouv.fr/dataservices/api-melodi (`https://api.insee.fr/melodi/`) | Jeux de données du catalogue INSEE, filtrables. | Accès ouvert sans identification. CORS non documenté. | Licence Ouverte 2.0 (mention générale du site). | **Sources contradictoires** : 20 interrogations/s selon data.gouv.fr, 30/min selon une page INSEE vue en résultat de recherche. | Non vérifié que les indices conjoncturels mensuels y figurent. |
| **INSEE, indice de la production industrielle** — https://www.insee.fr/fr/metadonnees/source/indicateur/p1646/documentation-methodologique | Indice mensuel par branche, publié au plus tard 40 jours après la fin du mois (manuel INSEE Méthodes n° 133 de 2019, vu en résultat de recherche ; calendrier récent cohérent : septembre 2026 publié le 5 novembre 2026). | Via BDM ci-dessus. | — | Révisions régulières. | Un mois et demi de retard : n'éclaire pas l'avenir. |
| **DBnomics** — https://docs.db.nomics.world/web-api/ (`https://api.db.nomics.world/v22/`) | Agrégateur : mêmes séries INSEE, Eurostat et autres dans un JSON uniforme. | Sans authentification d'après la FAQ ; CORS non documenté. | Celle du producteur d'origine. | Pas de quota chiffré ; cache recommandé. | Intermédiaire supplémentaire. |

**Réserve de fond.** Un indice national de branche suit mal un site : la production d'une usine dépend de ses commandes, de ses arrêts, de son mix. L'indice sert à dégrossir quand on n'a rien d'autre, ou à situer le site par rapport à sa branche. Pour la prévision, la bonne entrée est le **plan de production ou le budget du site**, saisi en scénarios par l'utilisateur.

---

## Encadré — Calcul des degrés-jours

**Formule de base (méthode « météo », simplifiée).** Pour chaque jour, avec la température moyenne T = (Tmin + Tmax) / 2 et un seuil S :

- chauffage : DJ = max(0, S − T) ;
- refroidissement : DJ = max(0, T − S).

On additionne sur le mois ou la période.

**Méthode « professionnels de l'énergie » (COSTIC).** Identique quand le seuil est au-dessus de Tmax ou au-dessous de Tmin. Quand le seuil tombe entre Tmin et Tmax, une formule pondérée évite de compter zéro un jour où il a quand même fallu chauffer le matin. Formule de chauffage telle que je la connais, **non relue sur un document COSTIC** (PDF illisible) : DJ = (S − Tmin) × (0,08 + 0,42 × (S − Tmin) / (Tmax − Tmin)).

**Méthode par intégration.** Somme des écarts au seuil sur les relevés horaires ; c'est la plus juste (Degree Days.net l'utilise), et elle est possible avec les données horaires d'Open-Meteo.

**Bases usuelles**

| Convention | Chauffage | Refroidissement |
|---|---|---|
| DJU français (COSTIC, Cegibat) | base 18 °C | base 18 °C (seuil au choix) |
| SDES | seuils 17 °C et 15 °C | — |
| Eurostat | 18 − T, compté seulement si T ≤ 15 °C | T − 21, compté seulement si T ≥ 24 °C |
| NASA POWER, usage américain | 18,3 °C (65 °F) | 18,3 °C |

La saison de chauffe conventionnelle française va du 1er octobre au 20 mai (232 jours).

**Pièges**

- **Ne jamais mélanger deux conventions** dans une même régression : des DJU base 18, des DJU SDES base 17 et des degrés-jours Eurostat ne sont pas comparables.
- **La base 18 n'est pas forcément la bonne pour le site.** La meilleure base est celle qui rend la régression la plus nette (souvent 15–16 °C pour un bâtiment tertiaire isolé, plus bas pour un atelier à forts apports internes). Avec les températures journalières dans la page, on peut la chercher ; avec des degrés-jours achetés tout faits, non.
- **Les jours proches du seuil** : la méthode simplifiée sous-estime nettement en mi-saison.
- **Moyenne des extrêmes ou moyenne des 24 heures** : les deux « températures moyennes » diffèrent ; il faut garder la même tout du long.
- **Station ou point de grille** : une réanalyse à 11–25 km lisse le relief, la ville et le littoral. Rester sur la même source pour l'historique et pour la prévision, sinon l'écart de source passe pour un écart de consommation.
- **Refroidissement** : les degrés-jours l'expliquent mal (apports solaires et internes dominent).
- **Découpage du temps** : heure UTC ou locale, mois de facturation qui ne sont pas des mois civils.

## Encadré — Que valent les prévisions météo selon l'horizon

| Horizon | Ce qu'on peut en attendre | Usage raisonnable ici |
|---|---|---|
| **1 à 7 jours** | Température journalière utilisable. | Prévision de consommation de la semaine, alerte de dérive. |
| **8 à 15 jours** | Une tendance et une fourchette (prévisions d'ensemble), plus une valeur ferme. | Afficher une plage, pas un point. |
| **3 à 6 semaines** | Au mieux une anomalie hebdomadaire probable (plus doux ou plus froid que la normale), souvent sans signal. | Au plus, pencher le premier mois du scénario. |
| **Une saison (1 à 7 mois)** | Un déplacement léger des probabilités, pas une prévision. | Ne pas s'en servir comme entrée chiffrée. |
| **Au-delà de 7 mois** | Rien : aucune source ouverte ne va plus loin. | Climatologie seule. |

Les trois premières lignes donnent des ordres de grandeur couramment admis, que je n'ai pas pu relire sur une page source pendant cette recherche (la fiche de fiabilité de l'ECMWF était introuvable).

Pour la saison, l'ECMWF l'écrit lui-même (https://www.ecmwf.int/node/28203) : l'Europe est une région où la qualité des prévisions saisonnières est « relativement faible », parmi « les moins prévisibles du monde » en hiver ; les probabilités annoncées « ne sont pas toujours fiables » ; les cartes d'anomalie moyenne « ne sont pas une prévision de ce qui va arriver ». Exemple donné : pour l'hiver 2022-2023, 40 à 60 % des membres plaçaient la température dans le tiers chaud, contre 33 % attendus par hasard — ce qui laisse 40 à 60 % des membres ailleurs. Météo-France présente de même ses tendances à trois mois comme des scénarios probables à l'échelle de l'Europe, pas comme le temps attendu en France (vu en résultat de recherche).

**Ce que cela implique pour une prévision de consommation à 3–12 mois**

- **La météo de l'horizon n'est pas prévisible ; elle se scénarise.** L'outil doit afficher une fourchette (hiver doux, médian, froid) tirée de l'historique du lieu, et non un chiffre unique donnant une impression de précision.
- **L'incertitude météo se chiffre simplement** : pente du modèle × écart de degrés-jours entre les quantiles 10 % et 90 % du mois. C'est une information utile en soi pour la revue énergétique.
- **Prendre un climat de référence récent** (10 à 15 dernières années) : la normale 1991–2020 surestime les besoins de chauffage actuels.
- **La prévision météo réelle ne sert que pour les deux premières semaines**, où elle remplace avantageusement la normale.
- **La prévision saisonnière peut rester optionnelle** : au mieux, elle déplace légèrement le poids des trois scénarios pour les 1 à 3 premiers mois. L'afficher comme information, sans la brancher sur le calcul par défaut.
- **Sur 3–12 mois, l'incertitude sur la production et l'occupation pèse souvent plus que celle sur la météo** pour un site industriel : c'est le rôle du simulateur « et si ».

---

## Recommandation

### Outil dans le navigateur, sans serveur

Principe : **le moins d'appels réseau possible, et toujours une entrée manuelle de secours**, car un fichier HTML ouvert en local dépend entièrement du CORS des autres.

1. **Météo observée, normales et prévision courte : Open-Meteo**, une seule source, donc historique et prévision cohérents entre eux.
   - Historique : température journalière (min, max, moyenne) au point du site depuis 20 à 30 ans, demandée une fois puis gardée dans le navigateur ; ensuite seulement les jours manquants.
   - Prévision : 16 jours, avec `past_days` pour combler les 5 jours de retard de la réanalyse.
   - **Condition à régler avant tout : la licence.** Gratuit seulement pour un usage non commercial. Pour un usage professionnel : abonnement (au moins Professional pour avoir l'historique), avec une clé qui sera lisible dans la page — acceptable pour un fichier diffusé à quelques personnes, pas pour une page publique.
2. **Si l'usage est commercial et qu'on ne veut pas d'abonnement : NASA POWER** (CC BY 4.0, sans authentification) comme source automatique, sous réserve d'un test de CORS et en acceptant une maille plus grossière ; **et, dans tous les cas, un import de fichier CSV** : fichier Météo-France du département (Licence Ouverte, vraie station) ou export de Degree Days.net.
3. **Degrés-jours : calculés dans la page**, base et méthode au choix de l'utilisateur, avec recherche de la base qui ajuste le mieux la régression. Ne pas importer de degrés-jours tout faits, sauf par fichier quand le site a déjà sa série de référence (COSTIC).
4. **Scénarios à 3–12 mois : quantiles mensuels des degrés-jours** calculés sur l'historique déjà chargé (doux, médian, froid), période de référence réglable. Prévision saisonnière en option, hors calcul par défaut.
5. **Calendrier : calculé dans la page** pour les jours fériés (zone métropole ou Alsace-Moselle), ponts déduits et modifiables ; vacances scolaires **embarquées dans le fichier** à partir du calendrier officiel, à rafraîchir une fois par an. L'API de l'État peut servir de contrôle.
6. **Activité : saisie par l'utilisateur en priorité** (plan de production, occupation). En substitut, **Eurostat API Statistics** (`sts_inpr_m`, France, code NACE de la branche) : c'est la seule source d'activité dont le CORS est documenté.

À tester avant de coder, parce que la documentation ne tranche pas : les en-têtes CORS réels d'Open-Meteo (annoncés), de NASA POWER, de calendrier.api.gouv.fr, de bdm.insee.fr et de l'API tabulaire de data.gouv.fr.

### Si l'outil avait un serveur

Un petit service planifié (une fois par jour) qui prépare un seul fichier JSON par site, que la page lit :

- **Météo observée : la station Météo-France la plus proche** (fichiers quotidiens par département ou API Données climatologiques avec jeton), sous Licence Ouverte — la vraie mesure, la source que les auditeurs français attendent, sans question d'usage commercial. Réanalyse ERA5 en complément pour combler les trous.
- **Degrés-jours de référence** : calculés côté serveur selon la méthode COSTIC, ou achetés à Degree Days.net (clés protégées côté serveur) si l'on veut une série tierce opposable.
- **Prévision** : Open-Meteo sous abonnement avec clé cachée, ou les modèles Météo-France par le portail API ; ensembles pour la fourchette.
- **Saisonnier** : multi-systèmes C3S par l'API Copernicus (jeton, GRIB), ramené à trois probabilités par mois.
- **Projections** : DRIAS (trajectoire de référence française) pour des « et si » climatiques.
- **Activité** : séries INSEE (BDM, XML) et Eurostat, converties et mises en cache.
- Bénéfices : clés à l'abri, plus de dépendance au CORS, historique figé et traçable (utile pour un audit ISO 50001), une seule requête légère côté page.

---

## Pages que je n'ai pas pu lire

| Page | Ce qui s'est passé | Conséquence |
|---|---|---|
| https://portail-api.meteofrance.fr/web/fr/faq | Page rendue par script, contenu vide | Quotas, durée du jeton, licence et CORS du portail Météo-France non vérifiés |
| https://meteo.data.gouv.fr/ | Contenu vide | Catalogue lu par les fiches data.gouv.fr à la place |
| https://www.statistiques.developpement-durable.gouv.fr/media/204/download?inline (note de méthode DJU du SDES) | PDF renvoyé en binaire, illisible par l'outil | Formule exacte et saison de chauffe du SDES non vérifiées |
| https://www.costic.com/sites/default/files/upload/produit/plaquette_dju_2019-2020.pdf | PDF binaire, illisible | Formule COSTIC donnée de mémoire ; prix et nombre de stations non vérifiés |
| https://calendrier.api.gouv.fr/jours-feries/ | Page ReDoc vide | Remplacée par la lecture de `openapi.yml` |
| https://data.education.gouv.fr/explore/dataset/fr-en-calendrier-scolaire/ (onglets information et API) | Renvoie la page d'accueil du catalogue | Identifiant du jeu, années couvertes, API JSON et CORS non vérifiés |
| https://help.opendatasoft.com/apis/ods-explore-v2/ et `explore_v2.1.html` | Contenu tronqué | Quotas anonymes et CORS de l'API Opendatasoft v2.1 non vérifiés |
| https://portail-api.insee.fr/ | Message d'erreur du portail | Quotas et modalités des API INSEE non vérifiés |
| https://www.insee.fr/fr/information/2868055 et https://www.insee.fr/fr/information/2381863 | Erreur 404 | Licence de réutilisation INSEE non lue |
| https://power.larc.nasa.gov/docs/methodology/meteorology/ , `.../meteorology/degree-days/` , `.../methodology/data/sources/` | Erreur 404 | Maille, sources et formule des degrés-jours de NASA POWER non vérifiées |
| https://meteofrance.com/comprendre-la-meteo/prevision/les-previsions-saisonnieres | Erreur 404 | Position de Météo-France sur la fiabilité saisonnière connue par résultat de recherche seulement |
| https://www.ecmwf.int/en/about/media-centre/focus/2025/fact-sheet-reliability-ecmwf-forecasts | Erreur 404 | Horizons de fiabilité à court terme non sourcés |
| https://dev.meteostat.net/api/ | Erreur 404 | Modalités de l'API JSON Meteostat non vérifiées |
| https://opendata.enedis.fr/datasets/donnees-de-temperature-et-de-pseudo-rayonnement/information/ | Erreur 404 après redirection | Source écartée du rapport |
| https://ec.europa.eu/eurostat/cache/metadata/en/sts_inpr_esms.htm | Erreur 404 | Délai de parution de l'indice Eurostat non vérifié |
| https://ec.europa.eu/eurostat/databrowser/view/nrg_chdd_m/default/table | Contenu vide | Codes exacts des tables de degrés-jours Eurostat non vérifiés |
| https://www.drias-climat.fr | Non ouvert (résultats de recherche seulement) | Conditions d'utilisation DRIAS non lues |

Remarque : en tentant de lire les deux PDF ci-dessus, l'outil de lecture en a enregistré une copie locale dans son dossier de résultats ; ce sont des notices, pas des données, et elles n'ont pas pu être ouvertes.
